const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');

class TFMediaCollektor
{
  constructor (  _db , _etc ) 
  {
    this.db            = _db;  // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
    this.etc           = _etc; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
    this.path          = {};
    this.fs            = {};
    this.posterPath    = "./mediaCache/poster/";
    this.thumbPath     = "./mediaCache/thumbs/";
    this.numberOfThums = 20;
    this.thumbPosition = 47;  // nach 47 Sekunden wird Movie-Thumb erzeugt
    this.sizeOfThumbs  = '270:-1';


    console.log("TFMediaCollektor.working-this.db : " + this.db.constructor.name);

    if(this.etc) console.log("TFMediaCollektor.config-this.db  : " + this.etc.constructor.name)
    else console.log("TFMediaCollektor.config-this.db  :  not set");
}   

async handleCommand( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{
 this.path  = path;
 this.fs    = fs;  
 var CMD    = cmd.toUpperCase().trim();
 
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


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------


if(CMD=='LSTHUMBS') 
   {
    var sql = "Select * from thumbs where ID > 0";
      if(param.ID_FILE) sql = sql + " AND ID_FILE="+param.ID_FILE;
      return dbUtils.fetchRecords_from_Query( this.db , sql );
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
    var f = dbUtils.fetchRecord_from_Query( this.db , "Select * from files where ID="+thumb.ID_FILE );
    var t = this.path.join( this.thumbPath , thumb.THUMBFILE );
    
    return {error:false, errMsg:"OK", result:{thumb:r.result, file:f.result, thumbPath:t} };

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


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------
         
if(CMD=='REGISTERMEDIA') 
{  
  return this.___internal___registerMedia ( param.mediaFile );                       
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
    
    //ist mediafile ein Bild ?
    if((ext=='.png') || (ext=='.jpg') || (ext=='.jpeg') || (ext=='.gif') || (ext=='.bmp') || (ext=='.tiff') || (ext=='.tif') || (ext=='.webp'))
       return this.___internal___ceateImageThumb(mediaFile, thumbFile , size , size , callback );
  
    //ist mediafile ein Video ?
    if((ext=='.mp4') || (ext=='.flv') || (ext=='.m3u8') || (ext=='.ts') || (ext=='.mov') || (ext=='.avi') || (ext=='.wmv'))
       return this.___internal___createMovieThumb(mediaFile, thumbFile , time, size , callback );    
    
    return {error:true, errMsg:"unknown file type", result:{}}
}

___internal___createImageThumb(imagePath, thumbFile , width , height , callback )
{
   console.log("createThumb("+imagePath+" -> "+thumbFile);
   
   const cmd = `gm convert "${imagePath}" -resize ${width}x${height} "${thumbFile}"`
                
  return utils.exec( cmd , callback );
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
   var mediaGUID = utils.buildFileGUID( this.fs , this.path , mediaFile );
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
  
 


___internal___registerMedia( mediaFile )
{
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
                   GUID     : utils.buildFileGUID( this.fs , this.path , fileInfo ),
                   DIMENSION: '1920x1080',
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
  try{ 
   if (media.TYPE === 'MOVIE')
      media.PLAYTIME = this.___videoInfo(mediaFile).result.format.duration;
} catch(err) { console.log('error in videoInfo: '+err.message); media.PLAYTIME = 0; }

  if(media.TYPE=='IMAGE')
   {
    console.log("Image-processing not implemented yet");
   } 
   
   // Media-File in DB speichern...
   response = this.___internal___saveMediaInDB(media)
     
   if(response.error) return response;
   media.ID = response.result.lastInsertRowid;
   var thumbName = 'thumb_'+media.ID+'_00.png'
   var thumbFile = this.thumbPath+thumbName;
   var thumb     = {ID_FILE:media.ID, NDX:0, THUMBFILE:thumbName, POSITION:this.thumbPosition};

   if (media.TYPE=='MOVIE') this.___internal___createMovieThumb( mediaFile , thumbFile, this.thumbPosition , 'origin' , function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) );
   if (media.TYPE=='IMAGE') this.___internal___createImageThumb( mediaFile , thumbFile, 147, 147 ,                      function(){this.self.___internal___saveThumbInDB(this.thumb)}.bind({self:this,thumb:thumb}) ); 
   
  return {error:false, errMsg:"OK", result:media}
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