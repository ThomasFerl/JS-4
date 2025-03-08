const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');

class TFMediaCollektor
{
  constructor (  _db , _etc ) 
  {
    this.db       = _this.db; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
    this.etc      = _etc; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
    this.path     = {};
    this.fs       = {};
    posterPath    = "./mediaCache/poster/";
    thumbPath     = "./mediaCache/thumbs/";
    numberOfThums = 20;
    sizeOfThumbs  = '270:-1';

    console.log("TFMediaCollektor.working-this.db : " + this.this.db.constructor.name);

    if(this.etc) console.log("TFMediaCollektor.config-this.db  : " + this.etc.constructor.name)
    else console.log("TFMediaCollektor.config-this.db  :  not set");
}   

async handleCommand( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{
 this.path  = path;
 this.fs    = fs;  
 var CMD    = cmd.toUpperCase().trim();
 
//---------------------------------------------------------------
//------------ACTORS---------------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORS') 
{
   return this.___listActors(this.db , param );  //zB.: parm:{"Name":"Ev*","Vorname":"Can*"}  
}  


//---------------------------------------------------------------
//-------------ACORINFO------------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORINFO') 
{
   return this.___actorInfo   ( this.db , param );  // param:{"ID","2522"}
}


//---------------------------------------------------------------
//-------------SAVE ACTOR----------------------------------------
//---------------------------------------------------------------
if(CMD=='SAVEACTOR') 
{
   return this.___saveActor   ( this.db , param , fs , webResponse );  
}




//---------------------------------------------------------------
//--------------ACTORIMAGE---------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORIMAGE') 
{
   await this.___actorImage ( this.db , param , fs , path , webResponse ); // ___ streamt direkt 
   return {isStream:true};
}  

    

//---------------------------------------------------------------
//---------------MOVIES------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIES') 
{
   return this.___listMovies  ( this.db , param ); 
}  


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIECAPTURE') 
{
   await this.___movieCapture ( this.db , param , fs , path , webResponse ); // ___ streamt direkt 
   return {isStream:true};
}  

     
//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIETHUMBS') 
{
    await this.___movieThumbs ( this.db , param , fs , path , webResponse ); // ___ streamt direkt 
    return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIEDETAILS') 
{
    return this.___movieDetails ( this.db , param );
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='PLAYMOVIE') 
{
    await this.___playMovie ( this.db , param , fs , path , webResponse , webRequest ); // ___ streamt direkt und braucht den 
    return {isStream:true};  
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LOADIMAGE') 
{
   await this.___loadImage  ( param ,fs , path , webResponse ); // ___ streamt direkt 
   return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LOADMOVIE') 
{
   await this.___loadMovie  ( param , fs , path ,  webResponse , webRequest ); // ___ streamt direkt 
   return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='REGISTERMOVIE') 
{
   return this.___registerMovie  ( this.db , param , fs , path , webResponse );                       
}
                                          
//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='ISREGISTERED') 
{
   return this.___isRegistered  ( this.db , param , fs , path  );
                         
}






if(CMD=='CLIPPERSCANDIR') 
{
   var dir      = param.dirName;
   var response = utils.scanDir ( fs , path , dir );
   
   if (response.error) return response;
      
   var dbResponse = dbUtils.fetchRecords_from_Query(this.db , "Select ID,FILENAME from clip where DIR='"+dir+"'"  );
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
  const cmd = `gm convert "${imagePath}" -resize ${width}x${height} "${thumbFile}"`
                
  return utils.exec( cmd , callback );
}
___internal___createMovieThumb(moviePath, thumbFile , time, size , callback )
{ 
  console.log("createThumb( destPath:"+this.thumbPath+" , size:" + size+")");
   
    if (!time)     time     = '147';  
    if (!size)     size     = this.sizeOfThumbs;  
                                
    if(size=='origin') var cmd = 'ffmpeg -v error -ss '+time+' -i "'+moviePath+'" '+thumbFile;
    else               var cmd = 'ffmpeg -v error -ss '+time+' -i "'+moviePath+'"  -vframes: 1 -filter:v scale="'+size+'"  '+thumbFile;

    console.log('createThumb ===> ' + cmd);

    return utils.exec( cmd , callback );
 }

 ___internal___saveMediaInDB   ( media )
{
   return  dbUtils.insertIntoTable(this.db,'files', {
                                                       TYPE     : media.TYPE,
                                                       DIR      : media.DIR,
                                                       FILENAME : media.FILENAME,
                                                       GUID     : media.GUID,
                                                       DIMENSION: media.DIMENSION,
                                                       FILESIZE : media.FILESIZE,
                                                       PLAYTIME : media.PLAYTIME,
                                                       SOURCE   : media.SOURCE,
                                                       KATEGORIE: media.KATEGORIE
                                                      } );
}


 ___findActor(db , actorName)
{
   var firstNameLastName = actorName.split(' ');
   var firstName = firstNameLastName[0];
   var lastName  = '';
   var response  = '';
   var sql       = [];
   if(firstNameLastName.length>1) 
   {
    lastName=firstNameLastName[1];
    sql.push("Select ID from actor where Name='"+lastName+"' and Vorname='"+firstName+"'");
   }
   
   // Such-Batch ...
   sql.push("Select ID from actor where Name like '%"+firstName+"%'");
   sql.push("Select ID from actor where Alias1 like %"+actorName+"%'");
   sql.push("Select ID from actor where Alias2 like '%"+actorName+"%'");
   sql.push("Select ID from actor where Alias3 like '%"+actorName+"%'");

   for(var i=0; i<sql.length; i++)
   {
     response = dbUtils.fetchValue_from_Query(db , sql[i] );
     if(!response.error)
        if(response.result) return response.result;
   }

   // Acrtor wird in keiner Abfrage-Variante gefunden -> Neuanlage.....
   response = dbUtils.insertIntoTable(db , 'actor' , {Vorname:firstName, Name:lastName });

  if(!response.error) return response.result.lastInsertRowid;
}   

 
 async ___listActors( dB , param )
 {
  var SQL = "Select ID,Name,Vorname,Ranking From Actor Where (ID>0) ";  // ID > 0 ist nur dazu gedacht, um Folgefilter mit "AND" hinzuzufügen
  var filter = '';

  console.log("___ listActors(" + JSON.stringify(param)+")");

  console.log("___ listActors -> "  + param.Name );

  filter = param.filterAll; 
  if (filter)
  {
     while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

     if (filter.indexOf('%') < 0) {op='=';    }
     else                         {op='like'; }

     if ( filter != '') { SQL = SQL + " AND  (( Name "+op+" '"+filter+"' ) or (Vorname "+op+" '"+filter+"' ) or (Alias1 "+op+" '"+filter+"' ) or (Alias2 "+op+" '"+filter+"' ) or (Alias3 "+op+" '"+filter+"' ))"}
  }


  filter = param.Name; 
  console.log("filter : " + filter);
  if (filter)
  {
    console.log("filter Name: " + filter);
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

     if (filter.indexOf('%') < 0) {op='=';    }
     else                         {op='like'; }

     if ( filter != '') { SQL = SQL + " AND  ( Name "+op+" '"+filter+"' )" ; } 
  }


  filter = param.Vorname;
  if (filter)
  {
    console.log("filter Vorname: " + filter);
     while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

     if (filter.indexOf('%') < 0) {op='=';   }
     else                         {op='like' }

     if ( filter != '') { SQL = SQL + " AND  ( Vorname "+op+" '"+filter+"' )"}
  }


  filter = param.Alias;
  if (filter)
  {
     while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

     if (filter.indexOf('%') < 0) {op='=';    }
     else                         {op='like'; }

     if ( filter != '') { SQL = SQL + " AND  ( (Alias1 "+op+" '"+filter+"' ) or (Alias2 "+op+" '"+filter+"' ) or (Alias3 "+op+" '"+filter+"' ) )"}
  }


  filter = param.RankingLT;
  if (filter)
  {
     if ( filter != '') { SQL = SQL + " AND  ( Ranking <= "+filter+" )"}
  }


  filter = param.RankingGT;
  if (filter)
  {
     if ( filter != '') { SQL = SQL + " AND  ( Ranking >= "+filter+" )"}
  }


  filter = param.RankingEQ;
  if (filter)
  {
     if ( filter != '') { SQL = SQL + " AND  ( Ranking = "+filter+" )"}
  }


  filter = param.Herkunft;
  if (filter)
  {
     while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

     if (filter.indexOf('%') < 0) {op='=';    }
     else                         {op='like'; }

     if ( filter != '') { SQL = SQL + " AND  ( Herkunft "+op+" '"+filter+"' )"}
  }

  
  sortOrder = param.sortOrder;
  if (sortOrder)
  {
     if ( sortOrder != '') { SQL = SQL + " Order by " + sortOrder}
  }

  return dbUtils.fetchRecords_from_Query( dB , SQL );
 }

 async ___actorInfo( dB , param )
 {
   var ID  = param.ID;
   return dbUtils.fetchRecord_from_Query( dB , "Select * from actor where ID="+ ID );
 }


 async ___saveActor( dB , param , fs )
 {
   var response = {};
   
   if(!param.fields) return {error:true, errMsg:'tablefields not found in params !', result:{} };
   
   var actorID  = param.fields['ID'];

   if (!actorID) {
                  response = dbUtils.insertIntoTable( dB , 'Actor' , param.fields )
                  if (response.error) return response;
                  actorID  = response.result.lastInsertRowid;
                 }  
   else {
          response = dbUtils.updateTable(dB,'Actor','ID', actorID , param.fields); 
          if (response.error) return response;
        }  
  
  // wurde Image mitgeliefert ?
  if(param.image)
  {
    console.log('Image wurde mitgegeben  -> '+param.image);
    var nn = 'actor_'+actorID+'.png';
    var fn = imgPath + nn;
    console.log('Image ins Archiv verschiebe -> '+fn);
        
    utils.moveFile( fs , param.image , fn );

    dbUtils.updateTable(dB,'Actor','ID',actorID,{CAPTURE:nn})
    
    return {error:false, errMsg:'OK', result:{}}
  }

  return response;
 }            
  
 async ___actorImage( dB , param , fs , path , res )
 {
   var img     = '';
   var ID      = param.ID;
   var mime =
      {
       gif: 'image/gif',
       jpg: 'image/jpeg',
       png: 'image/png',
       svg: 'image/svg+xml',
      };

      if (!ID) 
      { 
         res.set('Content-Type', 'text/plain');
         res.send("missing ID"); 
         return;
      }

   var response = dbUtils.fetchRecord_from_Query( dB , "Select Capture from actor where ID="+ ID );

   if(response.error)
   {
    res.send(JSON.stringify(response)); 
    return;
   }


   if(!response.result.CAPTURE) 
   {
    res.send(JSON.stringify({error:true, errMsg:"no picture for this actor" , result:{}})); 
    return;
   }

   if(response.result.CAPTURE == '') 
   {
    res.send(JSON.stringify({error:true, errMsg:"no picture for this actor" , result:{}})); 
    return;
   }

   img          = response.result.CAPTURE;
   img          = imgPath+img;

   if(!fs.existsSync(img))  
   {
    res.send(JSON.stringify({error:true, errMsg:"file ("+img+") does not exist !" , result:{}})); 
    return;
   }

  console.log('load: ' + img);

  var type      = mime[path.extname(img).slice(1)] || 'text/plain';
   
  try
  {
    var stream    = fs.createReadStream(img);
        res.set('Content-Type', type );
        stream.pipe(res);
  }      
  catch(err)
            {
              res.set('Content-Type', 'text/plain');
              res.send(err);
            };
}

async ___listMovies ( dB , param )
{
 var SQL     = "Select ID, NAME , QUALITY from clip where ID > 0";
 var filter  = '';
 
 filter = param.actorID;
 if (filter)
 {
    if ( filter != '') { SQL = SQL + " AND  ( ID in (Select ID_Clip from clip_actor Where ID_Actor="+filter+") )"}
 }


 filter = param.dir;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';   }
    else                         {op='like' }

    if ( filter != '') { SQL = SQL + " AND  ( DIR "+op+" '"+filter+"' )"}
 }


 filter = param.filename;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';    }
    else                         {op='like'; }

    if ( filter != '') { SQL = SQL + " AND  ( FILENAME "+op+" '"+filter+"' )"}
 }


 filter = param.name;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';    }
    else                         {op='like'; }

    if ( filter != '') { SQL = SQL + " AND  ( NAME "+op+" '"+filter+"' )"}
 }


 filter = param.Ranking;
 if (filter)
 {
    if ((filter.indexOf('>') >= 0) || ((filter.indexOf('<') >= 0)) || ((filter.indexOf('=') >= 0)) ) {op=' ';   }
    else                                                                                             {op='=';   }

    if ( filter != '') { SQL = SQL + " AND  ( QUALITY "+op+" "+filter+" )"}
 }



 filter = param.source;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';    }
    else                         {op='like'; }

    if ( filter != '') { SQL = SQL + " AND  ( SOURCE "+op+" '"+filter+"' )"}
 }


 filter = param.kategorie;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';    }
    else                         {op='like'; }

    if ( filter != '') { SQL = SQL + " AND  ( KATEGORIE "+op+" '"+filter+"' )"}
 }


 filter = param.tag;
 if (filter)
 {
    while(filter.indexOf('*')>=0) { filter=filter.replace('*','%'); }

    if (filter.indexOf('%') < 0) {op='=';    }
    else                         {op='like'; }

    if ( filter != '') { SQL = SQL + " AND  ( ID in (Select ID_Clip from Clip_Tags Where ID_Tag in ( Select ID from Tags Where Name "+op+"  '"+filter+"') ) ) "}
 }

 return dbUtils.fetchRecords_from_Query(dB , SQL );

}

async ___movieDetails( dB , param )
{
   var ID  = param.ID;
   return dbUtils.fetchRecord_from_Query( dB ,  "Select * from clip where ID="+ID );
}
 

async ___loadThumbsFromDB( dB , param , fs , path , res )
{
  var img     = '';
  var ID      = param.ID;

  var mime =
     {
      gif: 'image/gif',
      jpg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
     };

     if (!ID) 
     { 
        res.set('Content-Type', 'text/plain');
        res.send("missing ID"); 
        return;
     }

  var response = dbUtils.fetchRecord_from_Query(dB , "Select THUMBS from clip where ID="+ ID  );

  console.log("movieThumbs SQL-Response: " + JSON.stringify(response));
   
  if(response.err) 
  { 
    res.set('Content-Type', 'text/plain');
    res.send(response.errMsg); 
    return;
  }
  
  img          = imgPath + response.result.THUMBS; 
  console.log('try to load: ' + img);
 
  var type      = mime[path.extname(img).slice(1)] || 'text/plain';
   
  try
  {
    var stream    = fs.createReadStream(img);
        res.set('Content-Type', type );
        stream.pipe(res);
  }      
  catch(err)
            {
              res.set('Content-Type', 'text/plain');
              res.send(err);
            };
}


async ___showMediaFromDB( dB , param , fs , path , res , req )
{
  var ID      = param.ID;
  var fn      = '';
 
  var response = dbUtils.fetchRecord_from_Query(dB , "Select * from files where ID="+ ID  );
  if(response.err) 
  { 
    res.set('Content-Type', 'text/plain');
    res.send(response); 
    return;
  }
  
  if(!response.result.FILENAME)
  {
    console.log( 'ID not found' );
    res.set('Content-Type', 'text/plain');
    res.send( JSON.stringify({error:true,errMsg:'ID not found !',result:''}));
  }
  
 fn = path.join( res.result.DIR , res.result.FILENAME );
 console.log('try to load "' + fn +'"');


  if( !fs.existsSync(fn) )
  {
    console.log( 'file('+fn+') not found' );
    res.set('Content-Type', 'text/plain');
    res.send( JSON.stringify({error:true,errMsg: 'file('+movie+') not found' ,result:''}));
    return;
  }

  if(res.result.TYPE.toUpperCase == 'VIDEO') return utils.getMovieFile( fs , path , fn  , req , res  );
  if(res.result.TYPE.toUpperCase == 'IMAGE') return utils.getImageFile( fs , path , img , req , res  );
  
  console.log( 'unkown fileType' );
  res.set('Content-Type', 'text/plain');
  res.send( JSON.stringify({error:true,errMsg:'unkown fileType !',result:''}));

}


async ___isMediaRegistered( dB , param , fs , path  )
{
   var result    = {registered:false,  thumbs:[], actors:[] , tags:[], file:{} };
   var mediaGUID = utils.buildFileGUID( fs , param.filePath );
  
  var response  = dbUtils.fetchRecord_from_Query( dB , "Select * from files where GUID='"+mediaGUID+"'");
  console.log("response from dB: " + JSON.stringify( response ));
  
  if(response.error) return response;

  if(!response.result.ID) return {error:false, errMsg:"file not registered yet." , result:{} }  

  result.registered = true;
  result.file       = response.result;

  response          = dbUtils.fetchRecords_from_Query( dB , 'select * from thumbs where ID_FILE='+result.file.ID+' Order by ndx' );
  if(!response.error) result.thumbs = response.result;

  response      = dbUtils.fetchRecords_from_Query( dB , 'select * from actor where ID in (select ID_Actor from fileActor where ID_FILE='+result.file.ID+') order by Name');
  if(!response.error) result.actors = response.result;

  response      = dbUtils.fetchRecords_from_Query( dB , 'select * from tags where ID in (select ID_Tag from fileTags where ID_FILE='+result.file.ID+') order by Name');
  if(!response.error) result.tags = response.result;
   
  return {error:false, errMsg:"OK" , result:result }
}



async ___registerMedia( param )
{
  var mediaFile = param.filePath;
  var fileInfo  = utils.analyzeFile( this.fs , this.path , mediaFile );
  if(fileInfo.error) return fileInfo;

  var media     = {
                   ID       : 0, 
                   TYPE     : fileInfo.type,
                   DIR      : fileInfo.path,
                   FILENAME : fileInfo.name,
                   GUID     : utils.buildFileGUID( this.fs ,fileInfo.name ),
                   DIMENSION: '1920x1080',
                   FILESIZE : '',
                   PLAYTIME : '',
                   SOURCE   : '',
                   KATEGORIE: ''
                  }  
    
  var response   = dbUtils.fetchValue_from_Query( dB , "Select ID from files where GUID='"+media.fileGUID+"'");
  if(response.error) { return response; } 
  
  media.ID = response.result;

   // Moviefile ?
  if(media.TYPE=='MOVIE')
  {
     var vinfo = videoInfo(param.filePath) ;
     media.FILESIZE = vinfo.result.format.size;
     media.PLAYTIME = vinfo.result.format.duration;
  }   
  
  if(media.TYPE=='IMAGE')
   {
      var imgInfo = {};
      media.PLAYTIME = 4;
   } 

   response = this.___internal___saveMediaInDB(media)
     
   if(response.error) return response;
   media.ID = response.result.lastInsertRowid;

   var thumbFile = this.thumbPath+'thumb_'+media.ID+'_'+media.GUID+'.png';

   if (media.TYPE=='MOVIE') this.___internal___createMovieThumb( mediaFile , thumbFile, 147, 'origin' , null );
   if (media.TYPE=='IMAGE') this.___internal___createImageThumb( mediaFile , thumbFile, 147, 'origin' , null);  
   
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