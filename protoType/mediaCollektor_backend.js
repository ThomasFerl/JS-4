const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');
const {TBatchQueue}   = require('./batchProc');
const {TBatchPocess } = require('./batchProc');
const fileType        = require('file-type');
const os              = require('os');
const sharp           = require('sharp');
const { imageHash }   = require('image-hash');
const hamming         = require('hamming-distance');

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

  
  await this.___internal___registerMedia( nextJob.param.mediaFile );

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

 console.log('mediaCollector.handleCommand -> '+cmd+' / '+JSON.stringify(param));
 
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
                                                                         NAME:param.NAME, 
                                                                         KATEGORIE:param.KATEGORIE, 
                                                                         DESCRIPTION:param.DESCRIPTION} );
  }

//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LSTMEDIASET')
{
  Select m.* , (Select ID from thumbs Where ID_FILE in (Select ID_File from mediaInSet Where ID_Media=m.ID) order by ID limit 1) as ID_thumb
from mediaSets m
}



if(CMD=='LSTHUMBS') 
   {
     var result = [];
     var orderByHash = param.orderBy=="hash" || false;

     var sql = "Select * from thumbs where ID > 0";
      if(param.ID_FILE) sql = sql + " AND ID_FILE="+param.ID_FILE;
      sql = sql + " Order by ID";
   
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


if(CMD=='REGISTERMEDIA_IN_SET') 
{
  var mediaFile  = param.mediaFile;
  var mediaSet   = param.mediaSet;

  console.log('REGISTERMEDIA_IN_SET: mediaFile / mediaSet: '+mediaFile+'/'+mediaSet);

  var response   = await this.___internal___registerMedia( mediaFile );
  
  console.log('REGISTERMEDIA_IN_SET: response: '+JSON.stringify(response));

  if (response.error) return response;

  var mediaID    = response.result.lastInsertRowid; 

  return dbUtils.insertIntoTable( this.db , 'mediaInSet' , {ID_FILE:mediaID, ID_MEDIA:mediaSet} );

}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------
         
if(CMD=='REGISTERMEDIA') 
{  
  // Register Media soll entkoppelt als "Batch" im Hintergrund laufen 
  // und nicht blockierend für den Aufrufer sein.
    
  var enviroment   = { sessionID:sessionID ,  fs:fs , path:path , req:webRequest , res:webResponse };

  // wenn param.mediaFile ein Verzeichnis ist, 
  // dann wird der Inhalt des Verzeichnisses gescannt 
  // und die Dateien in die Batch-Queue eingetragen
  if(fs.statSync(param.mediaFile).isDirectory()) 
  {  
    console.log('RegisterMedia: '+param.mediaFile+' is a directory');
    // alle Files im Directory scannen und in die Batch-Queue eintragen
    var dir        = param.mediaFile;
    var dirContent = utils.scanDir (fs , path , dir )
    if (dirContent.error) return dirContent;

    console.log('RegisterMedia: '+param.mediaFile+' contains '+dirContent.result.length+' files');

    // mediafile als DIR in DB speichern ....
    var media = {ID:0, TYPE:'DIR', DIR:dir, FILENAME:'', GUID:'', DIMENSION:'?x?', FILESIZE:dirContent.result.length, PLAYTIME:'', SOURCE:'', KATEGORIE:''};
    response = this.___internal___saveMediaInDB(media);

    // das erste mediaFile im DIR ist das repräsentierende Thumbnail des Directories
    if(response.error) {console.log("Fehler meim Speichern in DB: "+response.errMsg); return response;}

    console.log('RegisterMedia: '+param.mediaFile+' saved in DB with ID='+response.result.lastInsertRowid); 
    
    media.ID = response.result.lastInsertRowid;
    var thumbName    = 'thumb_'+media.ID+'_00.png'
    var thumbFile    = this.thumbPath+thumbName;
    var thumbSource  = {};
    var mediaFiles   = [];
    var foundSomeone = false;

    console.log('RegisterMedia: suche nach Dateien im Verzeichnis ...');

    // zuerst wird nach dem ERSTEN Bild/Movie im Verzeichnis gesucht um daraus das räpresentierende Thumbnail zu erzeugen ...
    for(var i=0; i<dirContent.result.length; i++) 
      {
         var f  = dirContent.result[i];
         var fn = path.join( dir , f.name );
         
         console.log('RegisterMedia: check file '+fn);

         var fileInfo  = utils.analyzeFile( fs , path , fn );

         console.log('RegisterMedia / fileInfo : '+JSON.stringify(fileInfo));

         if(!fileInfo.error)
         { 
           if(fileInfo.result.type.toUpperCase()=='MOVIE') 
            {
              console.log('--> MOVIE');
              if(!foundSomeone) {thumbSource.file = fn; thumbSource.type='MOVIE'} 
              foundSomeone = true;
              mediaFiles.push(fn);
            }  
              
            if(fileInfo.result.type.toUpperCase()=='IMAGE') 
            {
              console.log('--> IMAGE');
              if(!foundSomeone) {thumbSource.file = fn; thumbSource.type='IMAGE'} 
              foundSomeone = true;
              mediaFiles.push(fn);
            }  
         }
      }

    if(foundSomeone)
    {  
      console.log('RegisterMedia: found ' + mediaFiles.length + ' files');

      console.log('RegisterMedia: thumbSource: ' + JSON.stringify(thumbSource));

      if(thumbSource.type=='IMAGE')
       { 
         console.log('RegisterMedia: create Image-Thumb ...');
         var thumb = {ID_FILE:media.ID, NDX:0, THUMBFILE:thumbFile, POSITION:0};
         this.___internal___createImageThumb( thumbSource.file , thumbFile, 147, 147 , function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) ); 
       }

       if(thumbSource.type=='MOVIE')
        {  
          console.log('RegisterMedia: create Movie-Thumb ...');
          var thumb = {ID_FILE:media.ID, NDX:0, THUMBFILE:thumbFile, POSITION:0};
          this.___internal___createMovieThumb( thumbSource.file , thumbFile, this.thumbPosition , 'origin' , function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) );
        }
   } else return {error:true, errMsg:"no image or movie found in directory", result:{}}

  for(var i=0; i<mediaFiles.length; i++)
    { 
      console.log('RegisterMedia: add '+mediaFiles[i]+' to BatchQueue');
      this.batchQueue.addBatchProc( 'REGISTERMEDIA' , {mediaFile:mediaFiles[i]} , enviroment );
    }  
    return {error:false, errMsg:"OK", result:{queuLength:this.batchQueue.count()} };                       
} // Verzeichnis
else {
       // kein Verzeichnis
      this.batchQueue.addBatchProc( 'REGISTERMEDIA' , param , enviroment );
      return {error:false, errMsg:"OK", result:{queuLength:this.batchQueue.count()} };                       
     } 
} 
                                          
//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='ISREGISTERED') 
{
   return this.___internal___isMediaRegistered (param.mediaFile);
                         
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
___internal___isMediaRegistered( mediaFile  )
{
   var result    = {registered:false,  thumbs:[], persons:[] , tags:[], file:{} };
   var mediaGUID = utils.buildFileGUID( this.fs , this.path , mediaFile ).result;
   if (mediaGUID.error) return mediaGUID;
   mediaGUID = mediaGUID.result;
  
  var response  = dbUtils.fetchRecord_from_Query( this.db , "Select * from files where GUID='"+mediaGUID+"'");
  if(response.error) return response;

  if(!response.result.ID) return {error:false, errMsg:"file not registered yet." , result:{} }  

  result.registered = true;
  result.file       = response.result;

  response          = dbUtils.fetchRecords_from_Query( this.db , 'select * from thumbs where ID_FILE='+result.file.ID+' Order by ndx' );
  if(!response.error) result.thumbs = response.result;

  response      = dbUtils.fetchRecords_from_Query( this.db , 'select * from persons where ID in (select ID_PERSON from personInMedia where ID_FILE='+result.file.ID+') order by Name');
  if(!response.error) result.actors = response.result;

  response      = dbUtils.fetchRecords_from_Query( this.db , 'select * from tags where ID in (select ID_Tag from tagsInMedia  where ID_FILE='+result.file.ID+') order by Name');
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
  
 


async ___internal___registerMedia( mediaFile )
{
  console.log('=============================================');  
  console.log('___internal___registerMedia( "'+mediaFile+'")'); 
  var fileInfo  = utils.analyzeFile( this.fs , this.path , mediaFile );
  
  if(fileInfo.error) 
  { console.log('fileInfo.error: '+JSON.stringify(fileInfo)); 
    return fileInfo; 
  }
  
  console.log('fileInfo: '+JSON.stringify(fileInfo));

  var media     = {
                   ID       : 0, 
                   TYPE     : fileInfo.result.type,
                   DIR      : fileInfo.result.dir,
                   FILENAME : fileInfo.result.name,
                   GUID     : utils.buildFileGUID( this.fs , this.path , fileInfo.result ).result,
                   DIMENSION: '?x?',
                   FILESIZE : fileInfo.result.size,
                   PLAYTIME : '',
                   SOURCE   : '',
                   KATEGORIE: ''
                  }  
    
  var response   = dbUtils.fetchValue_from_Query( this.db , "Select ID from files where GUID='"+media.GUID+"'");
  if(response.error) { console.log("Fehler in dB-Abfrage nach GUID -> "+response.errMsg); return response; 
                       return response; } 
  
  media.ID = response.result;
  
   // Moviefile ?
  if (media.TYPE === 'MOVIE')
   {
      try{ media.PLAYTIME = this.___videoInfo(mediaFile).result.format.duration; }
      catch(err) { console.error('Fehler beim Ermitteln der Video-Metadaten:', err); media.PLAYTIME = 0; }  
      
       media.HASH = '.x.'; 
       // Media-File in DB speichern...
       response = this.___internal___saveMediaInDB(media);

      if(response.error) return response;
      media.ID = response.result.lastInsertRowid;
      var thumbName = 'thumb_'+media.ID+'_00.png'
      var thumbFile = this.thumbPath+thumbName;
      var thumb     = {ID_FILE:media.ID, NDX:0, THUMBFILE:thumbName, POSITION:this.thumbPosition};

      this.___internal___createMovieThumb( mediaFile , thumbFile, this.thumbPosition , 'origin' , function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) );
    
      return {error:false, errMsg:"OK", result:media}
   }
      
  // Imagefile ? 
  if(media.TYPE=='IMAGE')
   {
      media.PLAYTIME = 0;
       var imagePath = this.path.join(media.DIR, media.FILENAME);

       try { media.HASH = await createImageHash(this.path , this.fs , imagePath, 16);}
       catch (err) {media.HASH = 'errHash';}
 
        // Media-File in DB speichern...
        response = this.___internal___saveMediaInDB(media);

        if(response.error) return response;
        media.ID = response.result.lastInsertRowid;
        var thumbName = 'thumb_'+media.ID+'_00.png'
        var thumbFile = this.thumbPath+thumbName;
        var thumb     = {ID_FILE:media.ID, NDX:0, THUMBFILE:thumbName, POSITION:this.thumbPosition};
                                                                                             
        this.___internal___createImageThumb( mediaFile , thumbFile, 147, 147 , function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) ); 
                                                  
        return {error:false, errMsg:"OK", result:media}
  }  
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