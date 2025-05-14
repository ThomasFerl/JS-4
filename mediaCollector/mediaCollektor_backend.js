const globals         = require('./backendGlobals');
const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');
const {TBatchQueue}   = require('./batchProc');
const {TBatchPocess } = require('./batchProc');
const fileType        = require('file-type');
const os              = require('os');
const sharp           = require('sharp');
const { imageHash }   = require('image-hash');
const hamming         = require('hamming-distance');  // Ähnlichkeit von Bildern ...


const videoExtensions = [
   'mp4', 'm4v', 'mov', 'avi', 'wmv', 'flv',
   'f4v', 'mkv', 'webm', 'ts', 'mpeg', 'mpg',
   '3gp', 'ogv'
 ];
 
 const imageExtensions = [
   'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg'
 ];
 
 const hashableExtensions = [
   'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'
 ];
 

//-------------------------------------------------------------
//--------- USING "sharp / imageHash / hamming"----------------
//-------------------------------------------------------------

async function createThumbnail(inputPath, outputPath, width = 200) 
{
 try {
     await sharp(inputPath)
       .resize({ width })
       .toFile(outputPath);
      console.log(`✅ Thumbnail gespeichert: ${outputPath}`);
      return outputPath;
   } catch (err) {
     console.error(`❌ Fehler beim Erstellen des Thumbnails:`, err);
     return null;
   }
 }


/**
 * Erzeugt einen perceptual Hash eines Bildes.
 * imagePath - Pfad zur Bilddatei
 * size - Hash-Größe (Standard: 16 = 16x16 Bits)
 * Promise<string> - Perceptual Hash als Hex-String
 */

async function createImageHash(path , fs , imagePath, size = 16) 
 {
  try {
    const buffer = fs.readFileSync(imagePath);

    const detected = await fileType.fromBuffer(buffer);
    const realExt = detected?.ext || 'unknown';

    if (!hashableExtensions.includes(realExt.toLowerCase())) {
      throw new Error(`Nicht hashbares Format: ${realExt}`);
    }

    const tempFile = path.join(os.tmpdir(), `__imgHash_${Date.now()}.png`);
    await sharp(buffer).toFile(tempFile); // kann crashen bei kaputtem Bild

    const hash = await new Promise((resolve, reject) => {
      imageHash(tempFile, size, true, (err, hash) => {
        fs.unlink(tempFile, () => {}); // Aufräumen
        if (err) {
          reject(new Error(`Hashing fehlgeschlagen (${realExt}): ${err.message}`));
        } else {
          resolve(hash);
        }
      });
    });

    return hash;
  } catch (err) {
    // 🔥 Hier landen alle Fehler, auch scharfe image-hash oder sharp crashes
    return Promise.reject(new Error(`createImageHash() ERROR bei Datei ${imagePath} → ${err.message}`));
  }
}
  

 function sortBySimilarity(fileList) 
 {
   var remaining  = [];
   var noHash     = [];

   // image-files besitzen einen HASH
   for (let i = 0; i < fileList.length; i++)
    {
     var f = fileList[i]; 
     if(f.file)
      if(f.file.hasOwnProperty("HASH"))
      { 
       console.log('--------------------------------------');
       console.log('f.file : '+ JSON.stringify(f.file));
       if (f.file.HASH.length > 21) remaining.push(f);
      }
     else noHash.push(f);
    }
   
   if (remaining.length === 0) return fileList;

   const sorted = [];
   // Starte mit erstem beliebigen Bild
   const start = remaining.shift();
   sorted.push(start);
 
   while (remaining.length > 0) 
   {
     const last = sorted[sorted.length - 1];
 
     // Ähnlichstes Bild finden
     let bestMatchIndex = 0;
     let bestDist = Infinity;
 
     for (let i = 0; i < remaining.length; i++) 
      {
       const dist = hamming(
         Buffer.from(last.file.HASH, 'hex'),
         Buffer.from(remaining[i].file.HASH, 'hex')
       );
       if (dist < bestDist) {
         bestDist = dist;
         bestMatchIndex = i;
       }
     }
 
     // Das beste hinzufügen & aus verbleibenden entfernen
     sorted.push(remaining.splice(bestMatchIndex, 1)[0]);
   }
   
   // die "NICHT-Bilder" wieder anhängen
   for(let i=0; i<noHash.length; i++) sorted.push(noHash[i]);  

    return sorted;
 }
 




//-------------------------------------------------------------
//-------------------------------------------------------------
//-------------------------------------------------------------




class TFMediaCollektor
{
  constructor (  _db , _etc ) 
  {
    this.db            = _db;  // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
    this.etc           = _etc; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
    this.path          = {};
    this.fs            = {};
    this.posterPath    = "/home/tferl/GIT/JS-4/protoType/mediaCache/poster/";
    this.thumbPath     = "/home/tferl/GIT/JS-4/protoType/mediaCache/thumbs/";
    this.portraitPath  = "/home/tferl/GIT/JS-4/protoType/mediaCache/persons/";

    this.numberOfThums = 20;
    this.thumbPosition = 7;  // nach 7 Sekunden wird Movie-Thumb erzeugt
    this.sizeOfThumbs  = '270:-1';

    this.batchQueue    = new TBatchQueue( this.handleBatchCommand.bind(this) );
    this.batchQueue.start();

    console.log("TFMediaCollektor.working-this.db : " + this.db.constructor.name);

    if(this.etc) console.log("TFMediaCollektor.config-this.db  : " + this.etc.constructor.name)
    else console.log("TFMediaCollektor.config-this.db  :  not set");
}   

async handleBatchCommand( nextJob , enviroment )
// Diese Funktion wird NIEMALS direkt aufgerufen, sondern nur von der Steuerlogik der BatchQueue
// Diese Funktion wid dem Konstruktor der BatchQueue übergeben und wird von der BatchQueue aufgerufen
{
  // Kontext wieder herstellen, da der Scope des Handlers nicht im Kontext eines Webrequests steht
  console.log('handleBatchCommand -> '+JSON.stringify(nextJob));
  this.cmd         = nextJob.cmd;
  this.param       = nextJob.param; 
  this.sessionID   = enviroment.sessionID;
  this.path        = enviroment.path;
  this.fs          = enviroment.fs; 
  // VORSICHT VOR DOPPELTEN RESPONSES !!!
  this.webRequest  = enviroment.req;
  this.webResponse = enviroment.res;
  
  if(nextJob.cmd=='REGISTERMEDIA')        await this.___internal___registerMedia       ( this.param.mediaFile );
  if(nextJob.cmd=='REGISTERMEDIA_IN_SET') await this.___internal___registerMedia_in_set( this.param.mediaFile , this.param.mediaSet , this.param.position );
                                                     

}


async handleCommand( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{
 this.cmd         = cmd;
 this.param       = param; 
 this.sessionID   = sessionID;
 this.path        = path;
 this.fs          = fs; 
 this.webRequest  = webRequest;
 this.webResponse = webResponse;   
 
 var CMD          = cmd.toUpperCase().trim();

 if(CMD=="GETJOBLIST") return this.batchQueue.lsBatchProc();



 
//---------------------------------------------------------------
//------------persons---------------------------------------------
//---------------------------------------------------------------

if(CMD=='LSPERSON')
   {
     return this.___internal___listPersons( param.filter || "" );
   } 

//---------------------------------------------------------------
//-------------LOAD PERSON---------------------------------------
//---------------------------------------------------------------

if(CMD=='PERSON') 
{
   var     id = param.ID;
   if(!id) id = param.ID_PERSON;
   return dbUtils.fetchRecord_from_Query( this.db , "Select * from persons where ID="+ id );
}

if(CMD=='PORTRAITURL')
{
  var portrait = ''
  if(param.ID_PERSON) portrait = dbUtils.fetchValue_from_Query( this.db , "Select PORTRAIT from persons where ID="+ param.ID_PERSON ).result;
  if(param.portrait)  portrait = param.portrait;

  portrait  = this.path.join( this.portraitPath , portrait );
        
  return {error:false, errMsg:"OK", result:portrait };
    
}


//---------------------------------------------------------------
//-------------SAVE PERSON---------------------------------------
//---------------------------------------------------------------
if(CMD=='SAVEPERSON') 
{   
   console.log('run SAVEPERSON stringify(param) => '+ JSON.stringify(param));
   console.log('param.person : '+ param.person);
   
   if(!param.person)     return {error:true, errMsg:'person-data not found in params !', result:{} };
  
   if (!param.person.ID) return dbUtils.insertIntoTable( this.db , 'persons' , param.person )
   else                  return dbUtils.updateTable(this.db,'persons','ID', param.person.ID , param.person); 
}



//---------------------------------------------------------------
//---------------LIST FILES--------------------------------------
//---------------------------------------------------------------

if(CMD=='LSFILES') 
{
   return this.___internal___listFiles  ( param.filter ); 
}  


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='FILE') 
{
 var     id = param.ID;
 if(!id) id = param.ID_FILE;  
 return dbUtils.fetchRecord_from_Query( this.db ,  "Select * from files where ID="+id );
}

if(CMD=='PORTRAITFROMFILE') 
  {
    console.log('run PORTRAITFROMFILE stringify(param) => '+ JSON.stringify(param));
    var id_file  = param.ID_FILE;
   var response = dbUtils.fetchRecord_from_Query( this.db ,  "Select * from files where ID="+id_file );
    if(response.error) return response;
  // kopiere das Bild in den Portrait-Ordner ...
    var fn = path.join(response.result.DIR , response.result.FILENAME);
    //kopiere das Bild in den Portrait-Ordner
    var portraitName = param.fnPortrait || response.result.FILENAME
    var portrait = path.join(this.portraitPath , portraitName);
    var portraitDir = this.path.dirname(portrait);
    if (!this.fs.existsSync(portraitDir))
    {
      console.log('copyFile: portraitDir ('+portraitDir+') not found - create this ...');
      this.fs.mkdirSync(portraitDir, { recursive: true });
    } 
    this.fs.copyFileSync(fn, portrait); 

    return({error:false, errMsg:"OK", result:portraitName});

  }


if(CMD=='CREATEMEDIASET') 
{
    return dbUtils.insertIntoTable_if_not_exist( this.db , 'mediaSets', {TYPE:param.TYPE, 
                                                                         ID_THUMB:param.ID_THUMB || 0,
                                                                         NAME:param.NAME, 
                                                                         KATEGORIE:param.KATEGORIE, 
                                                                         DESCRIPTION:param.DESCRIPTION} );
  }

if(CMD=='DELMEDIASET') 
  {
    var mediaSet = param.mediaSet || 0;
    if(!mediaSet) return {error:true, errMsg:'mediaSet not found in params !', result:{} };

    // if mediaSet ein array ?
    if(!Array.isArray(mediaSet)) mediaSet = [mediaSet];

    for(var i=0; i<mediaSet.length; i++)
    {  
     console.log('delMediaSet: delete mediaSet mit ID '+mediaSet[i]); 
     // Lösche alle Einträge in der Tabelle mediaInSet
     dbUtils.runSQL( this.db , 'update mediaInSet set ID_MEDIA=0 where ID_MEDIA='+mediaSet[i] );
     // Lösche den Eintrag in der Tabelle mediaSets
     dbUtils.runSQL( this.db , 'Delete from mediaSets where ID='+mediaSet[i] );
    } 

    return {error:false, errMsg:'OK', result:mediaSet.length+' mediaSet(s) gelöscht' };


  }

  if(CMD=='DELMEDIAFILE_FROM_SET') 
    {
      var ID_FILE      = param.ID_FILE;
      var ID_MEDIASET  = param.ID_MEDIASET || 0;

      // if ID_FILE ein array ?
      if(!Array.isArray(ID_FILE)) ID_FILE = [ID_FILE];
  
      for(var i=0; i<ID_FILE.length; i++)
      {  
       console.log('delete mediaFile mit ID '+ID_FILE[i]); 
       // Lösche alle Einträge in der Tabelle mediaInSet
       
       if(ID_MEDIASET>0) dbUtils.runSQL( this.db , 'Update mediaInSet set ID_MEDIA=0 where ID_MEDIA='+ID_MEDIASET+' and ID_FILE='+ID_FILE[i] );
       else              dbUtils.runSQL( this.db , 'Delete From mediaInSet where ID_MEDIA=0 and ID_FILE='+ID_FILE[i] );
      } 

      dbUtils.runSQL( this.db , 'Delete From files where ID not in (Select distinct ID_FILE from mediaInSet)');
      var thumbFiles = dbUtils.fetchRecords_from_Query( this.db , "Select THUMBFILE from thumbs where ID_FILE not in (Select distinct ID from files)" ).result;
      dbUtils.runSQL( this.db , 'Delete From thumbs where ID_FILE not in (Select distinct ID from files)');
  
      if(thumbFiles)
        if(thumbFiles.length>0)
        for (var i=0; i<thumbFiles.length; i++) 
        { 
        try {
              var filePath = this.path.join(this.thumbPath, thumbFiles[i].THUMBFILE);
              this.fs.unlinkSync(filePath);
              console.log(`✅ Gelöscht: ${filePath}`);
        } catch (err) {
          console.error(`❌ Fehler beim Löschen von ${filePath}: ${err.message}`);
        }
      } 
      return {error:false, errMsg:'OK', result:thumbFiles.length+' mediaFiles(s) gelöscht' };
  
}
  


if(CMD=='UPDATEMEDIASET') 
{
        return dbUtils.updateTable( this.db , 'mediaSets', 'ID' , param.ID ,  {TYPE:param.TYPE, 
                                                                               ID_THUMB:param.ID_THUMB || 0,
                                                                               NAME:param.NAME, 
                                                                               KATEGORIE:param.KATEGORIE, 
                                                                               DESCRIPTION:param.DESCRIPTION} );
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LSMEDIASET')
{
 console.log('LSMEDIASET -> param:' + JSON.stringify(param)); 

 var sql = "Select * from mediaSets order by ID";

  var response =  dbUtils.fetchRecords_from_Query( this.db , sql );

  if(response.error) return response;
  
  var mediaSets = [];
  
  for(var i=0; i<response.result.length; i++)
    {
      var m = response.result[i];
      console.log('LSMEDIASET :'+i+'.loop:' + JSON.stringify(m)); 
      if(m.ID_THUMB!="0") 
        {
           var thumb          = dbUtils.fetchRecord_from_Query( this.db , "Select * from thumbs where ID="+m.ID_THUMB ).result;
               thumb.fullPath = this.path.join( this.thumbPath , thumb.THUMBFILE );
             m.thumb          = thumb;
        } 
        else m.thumb          = {ID:0, ID_FILE:'', NDX:-1, THUMBFILE:'file-image' , fullPath:globals.symbolPath('file-image').result}; 
        mediaSets.push(m);
    }

    console.log('result:' + JSON.stringify(mediaSets));  
  return{error:false, errMsg:"OK", result:mediaSets };    
}



if(CMD=='LSTHUMBS') 
   {
     var result = [];
     var mediaSet = param.mediaSet || 0;
     var orderByHash = param.orderBy=="hash" || false;
     
     var sql = "Select t.*,m.POSITION from thumbs t, mediaInset m where t.ID_FILE = m.ID_FILE ";
         sql = sql + " AND m.ID_MEDIA="+mediaSet+" order By m.POSITION"
   
      console.log('SQL: ' + sql);

      var response = dbUtils.fetchRecords_from_Query( this.db , sql );

      if (response.error)  return response;
     
      var thumbs = response.result;
      for(var i=0; i<thumbs.length; i++)
       {
         var thumb = thumbs[i]; 
         var file  = dbUtils.fetchRecord_from_Query( this.db , "Select * from files where ID="+thumbs[i].ID_FILE ).result;
         thumb.fullPath = this.path.join( this.thumbPath , thumb.THUMBFILE );
         result.push({thumb:thumb , file:file});
       }

      if(orderByHash) result = sortBySimilarity(result); 

      return {error:false, errMsg:"OK", result:result}
   }
   

//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='THUMB') 
{
    var     idThumb      = param.ID;
    if(!idThumb) idThumb = param.ID_THUMB;  
    
    var r = dbUtils.fetchRecord_from_Query( this.db , "Select * from thumbs where (ID="+idThumb+")" );
    if(r.error) return r;
    
    var thumb = r.result;
    // zusätzlich zum Thumb wird das zugehörige File abgerufen
    var file = dbUtils.fetchRecord_from_Query( this.db , "Select * from files where ID="+thumb.ID_FILE ).result;
    
    thumb.fullPath = this.path.join( this.thumbPath , thumb.THUMBFILE );
    
    return {error:false, errMsg:"OK", result:{ thumb:thumb, file:file } };

}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='CONTENTURL') 
{
  var     id = param.ID;
  if(!id) id = param.ID_FILE;  
  return this.___internal___contentURL( id ); 
}


if(CMD=='MOVEMEDIA_IN_SET') 
{
  console.log('MOVEMEDIA_IN_SET -> param:' + JSON.stringify(param));

  var mediaFiles  = param.mediaFiles;
  var destination = param.destination;
  var source      = param.source;
  var p           = 0;
  
  console.log(JSON.stringify(mediaFiles));

  // maximale Position ggf vorhandener Files im Sets ermitteln, so dass deren Positionen nicht überschrieben werden
  var response = dbUtils.fetchValue_from_Query( this.db , "Select max(POSITION) from mediaInSet where ID_MEDIA="+destination );
  if(response.error) return response;
  if(response.result) p = response.result;

  for(var i=0; i<mediaFiles.length; i++)
  { 
    p++;
    if(source) // Move from source to destination Set 
    dbUtils.runSQL( this.db , 'update mediaInSet set ID_MEDIA='+destination+', position='+p+' where ID_MEDIA='+source+' and ID_FILE='+mediaFiles[i].ID ); 
    else          // Copy to destination Set
    dbUtils.insertIntoTable( this.db , 'mediaInSet' , {ID_MEDIA:destination , ID_FILE:mediaFiles[i].ID , POSITION:p} );
  }

  return {error:false, errMsg:"OK", result:{} };
  
}  

if(CMD=='MEDIA_POSITION') 
  {
    console.log('MEDIA_POSITION -> param:' + JSON.stringify(param));
    var ID_MEDIASET = param.ID_MEDIASET;
    var ID_FILE     = param.ID_FILE;
    // zuerst die ORIGINAL-POSITION des zu bewegenden Files ermitteln
    var orgPOSITION = dbUtils.fetchValue_from_Query( this.db , "Select POSITION from mediaInSet where ID_MEDIA="+ID_MEDIASET+" and ID_FILE="+ID_FILE ).result;
    
    var newPOSITION = param.POSITION;
    var maxPOSITION = dbUtils.fetchValue_from_Query( this.db , "Select max(POSITION) from mediaInSet where ID_MEDIA="+ID_MEDIASET ).result || 0;
    
    if((newPOSITION<0) || (newPOSITION>maxPOSITION)) newPOSITION = maxPOSITION;

    // Verschiebung von kleiner Position nach größerer Position -> RECHTS
    // wenn "newPOSITION" größer als maxPOSITION ist, dann müssen die Positionen der nachfolgenden Files um 1 verringert werden
    if(newPOSITION>orgPOSITION)
    {
      dbUtils.runSQL( this.db , 'update mediaInSet set POSITION=POSITION-1 where ID_MEDIA='+ID_MEDIASET+' and POSITION>='+orgPOSITION+' and POSITION<'+newPOSITION );
    }
    // Verschiebung von größerer Position nach kleinerer Position -> LINKS
    if(newPOSITION<orgPOSITION)
    {
      dbUtils.runSQL( this.db , 'update mediaInSet set POSITION=POSITION-1 where ID_MEDIA='+ID_MEDIASET+' and POSITION>'+orgPOSITION+' and POSITION<='+newPOSITION );
    }  

    // nun "endlich" erhält "ID_FILE" seine neue Position...
    dbUtils.runSQL( this.db , 'update mediaInSet set POSITION='+newPOSITION+' where ID_MEDIA='+ID_MEDIASET+' and ID_FILE='+ID_FILE );

    return {error:false, errMsg:"OK", result:{} };
    
  } 

if(CMD=='REGISTERMEDIA_IN_SET') 
{
  var mediaFiles  = param.mediaFiles;
  var mediaSet    = param.mediaSet;

console.log(JSON.stringify(mediaFiles));


  // Register Media soll entkoppelt als "Batch" im Hintergrund laufen 
  // und nicht blockierend für den Aufrufer sein.
  var enviroment   = { sessionID:sessionID ,  fs:fs , path:path , req:webRequest , res:webResponse };

  // frontendCall:
  //.webApiRequest('REGISTERMEDIA_IN_SET' , {mediaFiles:f , mediaSet:setID} , 'POST');
   
  console.log('REGISTERMEDIA_IN_SET: mediaSet: '+mediaSet+' with ' + mediaFiles.length + ' files');

  for(var i=0; i<mediaFiles.length; i++)
  { 
      console.log('RegisterMedia: add '+mediaFiles[i]+' to BatchQueue');
      this.batchQueue.addBatchProc( 'REGISTERMEDIA_IN_SET' , {mediaFile:mediaFiles[i] , mediaSet:mediaSet , position:i+1} , enviroment );
  }  
    
    return {error:false, errMsg:"OK", result:{queuLength:this.batchQueue.count()} };  
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------
         
if(CMD=='REGISTERMEDIA') 
{  
  // Register Media soll entkoppelt als "Batch" im Hintergrund laufen 
  // und nicht blockierend für den Aufrufer sein.
    
  var enviroment   = { sessionID:sessionID ,  fs:fs , path:path , req:webRequest , res:webResponse };
  var files        = [];

  // ist param.mediaFile ein Array ?
  if(Array.isArray(param.mediaFile)) files = param.mediaFile;
  else files.push(param.mediaFile);

  for(var i=0; i<files.length; i++)
    { 
      console.log('RegisterMedia: add '+files[i]+' to BatchQueue');
      this.batchQueue.addBatchProc( 'REGISTERMEDIA' , {mediaFile:files[i]} , enviroment );
    }  
    return {error:false, errMsg:"OK", result:{queuLength:this.batchQueue.count()} };                       
} 

//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='ISREGISTERED') 
{
   return this.___internal___isMediaRegistered (param.mediaFile , true);
                         
}




if(CMD=='MEDIASCANDIR') 
{
   var dir      = param.dirName;
   var response = utils.scanDir ( this.fs , this.path , dir );
   
   if (response.error) return response;
      
   var dbResponse = dbUtils.fetchRecords_from_Query(this.db , "Select ID,FILENAME from files where DIR='"+dir+"'"  );
   if (dbResponse.error) return response;

   // Checke Files gegen this.db 
   // durchlaufe alle File - Einträge aus this.dbresponse.result
   for(var i=0; i<response.result.length; i++) 
   {
      var f=response.result[i];
      if(f.isFile) 
      {
         console.log('prüfe :"'+f.name+'" auf Existenz in this.db ...');
         var foundInDB = utils.findEntryByField( dbResponse.result , 'FILENAME' , f.name );
       if(foundInDB) { console.log("---FOUND update ID ---") ; f.ID=foundInDB.ID ; }
      else  console.log("---NOT  FOUND---");
      }
   }
   
   return response; 
                        
}
 
return null;

}

//----------------------------------------------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------
//---------- UTILTIES für movieCollektor -------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------

// Utility-Funktionen für den internen Gebrauch....
___videoInfo ( aPath )
{
  var cmd      ='ffprobe -v error -print_format json -hide_banner -show_format -show_streams -i "'+aPath+'"';
  var res      = utils.execSync( cmd );

 if(res.error) return res;
  
  try {var j= JSON.parse(res.result);}
  catch(err) {return {error:true, errMsg:"invalid return fron execSync(ffprobe ...) ", result:{} } }  
  
  return {error:false, errMsg:"OK", result:j}

}
___createThumb(mediaFile, thumbFile , time, size , callback )
{
   
    var ext = this.path.extname(mediaFile).toLowerCase();
        ext = ext.subString(1);
    
    //ist mediafile ein Bild ?
    if(imageExtensions.includes(ext)) return this.___internal___ceateImageThumb(mediaFile, thumbFile , size , size , callback );
    
    //ist mediafile ein Video ?
    if(videoExtensions.includes(ext)) return this.___internal___createMovieThumb(mediaFile, thumbFile , time, size , callback );    
    
    return {error:true, errMsg:"unknown file type", result:{}}
}
___internal___createImageThumb(imagePath, thumbFile, width, height, callback) 
{  
   // Prüfe, ob der Zielpfad existiert
   var thumbDir = this.path.dirname(thumbFile);
   if (!this.fs.existsSync(thumbDir))
   {
     console.log('createThumb: thumbDir ('+thumbDir+') not found - create this ...');
     this.fs.mkdirSync(thumbDir, { recursive: true });
   }
   
   createThumbnail(imagePath, thumbFile, width)
     .then(result => { callback(null, result); })// Erfolg → err auf null setzen
     .catch(err   => { callback(err); }); // Fehler → err gesetzt
 }
___internal___createMovieThumb(moviePath, thumbFile , time, size , callback )
{ 
  console.log("createThumb("+moviePath+" -> "+thumbFile);
   
    if (!time)     time     = this.thumbPosition; 
    if (!size)     size     = this.sizeOfThumbs;  
                                
    if(size=='origin') var cmd = 'ffmpeg -v error -ss '+time+' -i "'+moviePath+'" '+thumbFile;
    else               var cmd = 'ffmpeg -v error -ss '+time+' -i "'+moviePath+'"  -vframes: 1 -filter:v scale="'+size+'"  '+thumbFile;

    console.log('createThumb ===> ' + cmd);

    // Prüfe, ob der Zielpfad existiert
    var thumbDir = this.path.dirname(thumbFile);
    if (!this.fs.existsSync(thumbDir))
    {
      console.log('createThumb: thumbDir ('+thumbDir+') not found - create this ...');
      this.fs.mkdirSync(thumbDir, { recursive: true });
    }

    return utils.exec( cmd , callback );
 }
___internal___saveMediaInDB   ( media )
{
   if(media.ID) return dbUtils.updateTable    (this.db,'files','ID', media.ID , media);
   else        return  dbUtils.insertIntoTable(this.db,'files' , media );
}
___internal___saveThumbInDB   ( thumb ) 
{
   console.log("___internal___saveThumbInDB:" + JSON.stringify(thumb));
  return  dbUtils.insertIntoTable(this.db,'thumbs', {
                                                       ID_FILE   : thumb.ID_FILE,
                                                       NDX       : thumb.NDX,
                                                       THUMBFILE : thumb.THUMBFILE,
                                                       POSITION  : thumb.POSITION,
                                                    } );
}
___internal___listFiles ( filter)
{
  if(!filter) filter = {};

  if (filter.ID_FILE) return dbUtils.fetchRecord_from_Query(this.db , "Select * from files where ID="+ filter.ID_FILE );
 
 var SQL = "Select * from files where ID > 0";
 if (filter.ID_PERSON) SQL = SQL + " AND  ( ID in (Select ID_FILE from personsInMedia Where ID_PERSON="+filter.ID_PERSON+") ";
 if (filter.ID_TAG)    SQL = SQL + " AND  ( ID in (Select ID_FILE from tagsInMedia    Where ID_Tag="+filter.ID_TAG+") ";  
 if (filter.DIR)       
 {
    while(filter.DIR.indexOf('*')>=0) { filter.DIR=filter.DIR.replace('*','%'); }
    if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( DIR = '"+filter.DIR+"') ";
    else                         SQL = SQL + " AND  ( DIR like '"+filter.DIR+"') ";
 }

 if (filter.DIR)       
   {
      while(filter.DIR.indexOf('*')>=0) { filter.DIR=filter.DIR.replace('*','%'); }
      if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( DIR = '"+filter.DIR+"') ";
      else                         SQL = SQL + " AND  ( DIR like '"+filter.DIR+"') ";
   }

 if (filter.FILENAME)       
   {
      while(filter.FILENAME.indexOf('*')>=0) { filter.FILENAME=filter.FILENAME.replace('*','%'); }
      if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( FILENAME = '"+filter.FILENAME+"') ";
      else                         SQL = SQL + " AND  ( FILENAME like '"+filter.FILENAME+"') ";
   }

if (filter.SOURCE)       
   {
     while(filter.SOURCE.indexOf('*')>=0) { filter.SOURCE=filter.SOURCE.replace('*',''); }
     if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( SOURCE = '"+filter.SOURCE+"') ";
     else                         SQL = SQL + " AND  ( SOURCE like '"+filter.SOURCE+"') ";
   }

if (filter.KATEGORIE)       
   {
     while(filter.KATEGORIE.indexOf('*')>=0) { filter.KATEGORIE=filter.KATEGORIE.replace('*','%'); }
     if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( KATEGORIE = '"+filter.KATEGORIE+"') ";
     else                         SQL = SQL + " AND  ( KATEGORIE like '"+filter.KATEGORIE+"') ";
   }   

if (filter.DESCRIPTION)       
   {
     while(filter.DESCRIPTION.indexOf('*')>=0) { filter.DESCRIPTION=filter.DESCRIPTION.replace('*','%'); }
     if (filter.indexOf('%') < 0) SQL = SQL + " AND  ( DESCRIPTION = '"+filter.DESCRIPTION+"') ";
     else                         SQL = SQL + " AND  ( DESCRIPTION like '"+filter.DESCRIPTION+"') ";
   }   

 if (filter.FILESIZE) SQL = SQL + " AND  ( FILESIZE"+filter.FILESIZE+" )";     
 if (filter.PLAYTIME) SQL = SQL + " AND  ( PLAYTIME"+filter.PLAYTIME+" )";   
 if (filter.QUALITY)  SQL = SQL + " AND  ( QUALITY" +filter.QUALITY+" )";   
 if (filter.RATING)   SQL = SQL + " AND  ( RATING"  +filter.RATING+" )";   
   
 
 return dbUtils.fetchRecords_from_Query(this.db , SQL );

}
___internal___contentURL( ID , TYPE )
{
  var response = dbUtils.fetchRecord_from_Query(this.db , "Select * from files where ID="+ ID  );
  if(response.err) return response;

  var f = response.result;
  
  if(!f.ID==ID) return {error:true,errMsg:'ID not found !',result:''}

 var fn = this.path.join( f.DIR , f.FILENAME );
 console.log('try to load "' + fn +'"');

 if( this.fs.existsSync(fn) ) return {error:false,errMsg:'OK',result:fn} 
 else                         return {error:true,errMsg: 'file('+fn+') not found' ,result:''}
  
}
___internal___isMediaRegistered( mediaFile , load_if_exists )
{
   var result    = {registered:false,  thumbs:[], persons:[] , tags:[], file:{} };
   var mediaGUID = utils.buildFileGUID( this.fs , this.path , mediaFile ).result;
   if (mediaGUID.error) return mediaGUID;
   mediaGUID = mediaGUID.result;
  
   // existiert die GUID in der DB ?
  var response  = dbUtils.fetchRecord_from_Query( this.db , "Select * from files where GUID='"+mediaGUID+"'");
  if(response.error) return {error:false, errMsg:"file not registered yet." , result:{registered:false} }  

  if(!response.result.ID) return {error:false, errMsg:"file not registered yet." , result:{registered:false} }  

  if(!load_if_exists) return {error:false, errMsg:"file already registered." , result:{registered:true, media:response.result} }

  result.registered = true;
  result.media      = response.result;

  response          = dbUtils.fetchRecords_from_Query( this.db , 'select * from thumbs where ID_FILE='+result.media.ID+' Order by ndx' );
  if(!response.error) result.thumbs = response.result;

  response      = dbUtils.fetchRecords_from_Query( this.db , 'select * from persons where ID in (select ID_PERSON from personInMedia where ID_FILE='+result.media.ID+') order by Name');
  if(!response.error) result.actors = response.result;

  response      = dbUtils.fetchRecords_from_Query( this.db , 'select * from tags where ID in (select ID_Tag from tagsInMedia  where ID_FILE='+result.media.ID+') order by Name');
  if(!response.error) result.tags = response.result;
   
  return {error:false, errMsg:"OK" , result:result }
}

___internal___listPersons ( filter )
   {
    var SQL = "Select * From persons Where (ID>0) ";  // ID > 0 ist nur dazu gedacht, um Folgefilter mit "AND" hinzuzufügen
    var op  = '';

    if ( filter.find )  // sucht über alle Namensfelder
    {
     SQL = SQL + " AND  (( Name like '%"+filter.find+"%' ) or " +
                        "(Vorname like '%"+filter.find+"%' ) or " + 
                        "(Alias1 like '%"+filter.find+"%' ) or " +
                        "(Alias2 like '%"+filter.find+"%' ) or " +
                        "(Alias3 like '%"+filter.find+"%' ))";
    }
  
    if (filter.NAME)
    {
      while(filter.NAME.indexOf('*')>=0) { filter.NAME=filter.NAME.replace('*','%'); }
  
       if (filter.NAME.indexOf('%') < 0) {op='=';    }
       else                              {op='like'; }
  
      SQL = SQL + " AND  ( Name "+op+" '"+filter.NAME+"' )" ;
    }
  

    if (filter.VORNAME)
      {
        while(filter.VORNAME.indexOf('*')>=0) { filter.VORNAME=filter.VORNAME.replace('*','%'); }
    
         if (filter.VORNAME.indexOf('%') < 0) {op='=';    }
         else                                 {op='like'; }
    
        SQL = SQL + " AND  ( VORNAME "+op+" '"+filter.VORNAME+"' )" ;
      }
  
  
   var alias = filter.ALIAS || filter.ALIAS1 || filter.ALIAS2 || filter.ALIAS3;
   if (alias)
   {
      
       while(alias.indexOf('*')>=0) { alias=alias.replace('*','%'); }
  
       if (alias.indexOf('%') < 0) {op='=';    }
       else                        {op='like'; }
     
       SQL = SQL + " AND  ( ( Alias1  "+op+" '"+alias+"' ) or (Alias2 "+op+" '"+alias+"' ) or (Alias3 "+op+" '"+alias+"' ) )"
    }
  
  
   if (filter.RANKING)
    {
      SQL = SQL + " AND  ( Ranking "+filter.RANKING+" )"
    }
  
    
    if (filter.HERKUNFT)
    {
       while(filter.HERKUNFT.indexOf('*')>=0) { filter.HERKUNFT=filter.HERKUNFT.replace('*','%'); }
  
       if (filter.HERKUNFT.indexOf('%') < 0) {op='=';    }
       else                                  {op='like'; }
  
       SQL = SQL + " AND  ( Herkunft "+op+" '"+filter.HERKUNFT+"' )"
    }
  
    if(filter.ORDERBY) SQL = SQL + " Order by " + filter.ORDERBY;
    else               SQL = SQL + " Order by Name";

    return dbUtils.fetchRecords_from_Query( this.db , SQL );
   }
  
 
// Version von GPT überarbeitet
async ___internal___registerMedia(mediaFile) 
{
  console.log('=============================================');
  console.log('___internal___registerMedia("' + mediaFile + '")');

  const fileInfo = utils.analyzeFile(this.fs, this.path, mediaFile);
  if (fileInfo.error) return fileInfo;
  
  // Prüfen, ob Datei schon registriert ist
  let registeredCheck = this.___internal___isMediaRegistered(mediaFile , false );
  if (registeredCheck.error) return registeredCheck;

  // Wenn registriert → direkt Rückgabe
  if (registeredCheck.result.registered) {
    console.log('Datei bereits registriert mit ID:', registeredCheck.result.media.ID);
    return { error: false, errMsg: "Bereits registriert", result: registeredCheck.result.media };
  }

  // Neues Media-Objekt anlegen
  let media = {
    ID: 0,
    TYPE: fileInfo.result.type,
    DIR: fileInfo.result.dir,
    FILENAME: fileInfo.result.name,
    GUID: utils.buildFileGUID(this.fs, this.path, fileInfo.result).result,
    DIMENSION: '?x?',
    FILESIZE: fileInfo.result.size,
    PLAYTIME: '',
    SOURCE: '',
    KATEGORIE: ''
  };

  if (media.TYPE === 'MOVIE') {
    try {
      media.PLAYTIME = this.___videoInfo(mediaFile).result.format.duration;
    } catch (err) {
      console.warn('Fehler beim Ermitteln der Video-Metadaten:', err);
      media.PLAYTIME = 0;
    }
    media.HASH = '.x.';

  } else if (media.TYPE === 'IMAGE') {
    try {
      const imagePath = this.path.join(media.DIR, media.FILENAME);
      media.HASH = await createImageHash(this.path, this.fs, imagePath, 16);
    } catch (err) {
      media.HASH = 'errHash';
    }
    media.PLAYTIME = 0;
  } else {
    return { error: true, errMsg: "Unbekannter Medientyp: " + media.TYPE };
  }

  // Datei in DB speichern (INSERT oder UPDATE)
  const response = this.___internal___saveMediaInDB(media);
  if (response.error) return response;
  media.ID = response.result.lastInsertRowid;

  // Vorschaubild erzeugen
  const thumbName = 'thumb_' + media.ID + '_00.png';
  const thumbFile = this.thumbPath + thumbName;
  const thumb = { ID_FILE: media.ID, NDX: 0, THUMBFILE: thumbName, POSITION: this.thumbPosition };

  if (media.TYPE === 'MOVIE') {
    this.___internal___createMovieThumb(mediaFile, thumbFile, this.thumbPosition, 'origin',
      () => this.___internal___saveThumbInDB(thumb));
  } else if (media.TYPE === 'IMAGE') {
    this.___internal___createImageThumb(mediaFile, thumbFile, 147, 147,
      () => this.___internal___saveThumbInDB(thumb));
  }

  return { error: false, errMsg: "OK", result: media };
}


async ___internal___registerMedia_in_set( mediaFile , mediaSet , position ) 
{
  var response   = await this.___internal___registerMedia( mediaFile );
  
  if (response.error) return response;

  var mediaID    = response.result.ID; 

  if(!mediaID) return {error:true, errMsg:"no mediaID found", result:{}};

  return dbUtils.insertIntoTable( this.db , 'mediaInSet' , {ID_FILE:mediaID, ID_MEDIA:mediaSet, POSITION:position} );
}


//----------------------------------------------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------
//---------- UTILTIES für movieCollektor -------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------
}
module.exports = {TFMediaCollektor};