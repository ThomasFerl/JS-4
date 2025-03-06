const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');

class TFMediaCollektor
{
  constructor (  _db , _etc ) 
  {
    this.db       = _this.db; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
    this.etc      = _etc; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
    
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
 var CMD = cmd.toUpperCase().trim();
 
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


___createThumb(mediaFile, destPath, time, size , callback )
{
   
    var ext = path.extname(mediaFile).toLowerCase();
    
    //ist mediafile ein Bild ?
    if((ext=='.png') || (ext=='.jpg') || (ext=='.jpeg') || (ext=='.gif') || (ext=='.bmp') || (ext=='.tiff') || (ext=='.tif') || (ext=='.webp'))
       return createImageThumb(mediaFile, destPath, size , size , callback );
  
    //ist mediafile ein Video ?
    if((ext=='.mp4') || (ext=='.flv') || (ext=='.m3u8') || (ext=='.ts') || (ext=='.mov') || (ext=='.avi') || (ext=='.wmv'))
       return createMovieThumb(mediaFile, destPath, time, size , callback );    
    
    return {error:true, errMsg:"unknown file type", result:{}}
}

___createImageThumb(imagePath, destPath, width , height , callback )
{
  const cmd = `gm convert "${imagePath}" -resize ${width}x${height} "${destPath}"`
                
  return utils.exec( cmd , callback );
}


___createMovieThumb(path, destPath, time, size , callback )
{ 
  console.log("createThumb( destPath:"+destPath+" , size:" + size+")");
   
    if (!time)     time     = '147';  
    if (!size)     size     = sizeOfThumbs;  
    if (!destPath) destPath = thumbPath+'unnamendThumb.png';
                                 
    if(size=='origin') var cmd = 'ffmpeg -v error -ss '+time+' -i "'+path+'" '+destPath;
    else               var cmd = 'ffmpeg -v error -ss '+time+' -i "'+path+'"  -vframes: 1 -filter:v scale="'+size+'"  '+destPath;

    console.log('createThumb ===> ' + cmd);

    return utils.exec( cmd , callback );
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

async ___loadImage ( param , fs , path , res)
{
  var img  = param.img;

  var mime =
     {
      gif: 'image/gif',
      jpg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
     };

  var type      = mime[path.extname(img).slice(1)] || 'text/plain';

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
 

async ___movieCapture( dB , param , fs , path , res )
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

   var response = dbUtils.fetchRecord_from_Query(dB , "Select Capture from clip where ID="+ ID );
   
   console.log("movieCapture SQL-Response: " + JSON.stringify(response));

   if(response.err) 
   { 
     res.set('Content-Type', 'text/plain');
     res.send(response.errMsg); 
     return;
   }
   
   img          = imgPath + response.result.CAPTURE; 
   
   console.log('try to load: ' + img);

   var type      = mime[path.extname(img).slice(1)] || 'text/plain';

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


async ___movieThumbs( dB , param , fs , path , res )
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


async ___playMovie( dB , param , fs , path , res , req )
{
  var ID      = param.ID;
  var mime =
     {
      mp4:  'video/mp4',
      flv:  'video/x-flv',
      m3u8: 'application/x-mpegURL',
      ts:   'video/MP2T',
      mov:  'video/quicktime',
      avi:  'video/x-msvideo',
      wmv:  'video/x-ms-wmv',
     };

     if (!ID) 
     { 
        res.set('Content-Type', 'text/plain');
        res.send("missing ID"); 
        return;
     }


  var response = dbUtils.fetchRecord_from_Query(dB , "Select DIR , FILENAME from clip where ID="+ ID  );
  console.log("playMovie SQL-Response: " + JSON.stringify(response));
   
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
  
  if(pathReplace)
  {
    var movie   = response.result.DIR.replace( pathReplace ,'');
        movie   = path.normalize(movie + path.sep) + response.result.FILENAME;
  }      

  if( !fs.existsSync(movie) )
  {
    console.log( 'file('+movie+') not found' );
    res.set('Content-Type', 'text/plain');
    res.send( JSON.stringify({error:true,errMsg: 'file('+movie+') not found' ,result:''}));
    return;
  }

  console.log( 'load: ' + movie );

  var type      = mime[path.extname(movie).slice(1).toLowerCase()] || 'text/plain';

 console.log( 'load: ' + movie );
 console.log( 'typ : ' + type );

 try{
 const stat      = fs.statSync(movie);
 const fileSize  = stat.size
 const range     = req.headers.range

 if (range)
 {
    const parts     = range.replace(/bytes=/, "").split("-")
    const start     = parseInt(parts[0], 10)
    const end       = parts[1] ? parseInt(parts[1], 10) : fileSize-1
    const chunksize = (end-start)+1
    const file      = fs.createReadStream( movie , {start, end} )
    const head      =
    {
      'Content-Range' : `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges' : 'bytes',
      'Content-Length': chunksize,
      'Content-Type'  : 'video/mp4',
    }

    res.writeHead(206, head);
    file.pipe(res);
  }
  else
    {
       const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(movie).pipe(res)
  }
} catch {} 

}


async ___loadMovie( param ,fs , path , res , req )
{
  var movie   = param.fileName;
  
  console.log( 'playMovie('+movie+')' );

  var mime =
     {
      mp4:  'video/mp4',
      flv:  'video/x-flv',
      m3u8: 'application/x-mpegURL',
      ts:   'video/MP2T',
      mov:  'video/quicktime',
      avi:  'video/x-msvideo',
      wmv:  'video/x-ms-wmv',
      m4v:  'video/x-m4v',
      webm: 'video/webm',
      mpg:  'application/x-mpegURL',
      mpeg: 'application/x-mpegURL',
      weba: 'audio/webm', 
      ogm:  'video/ogg',
      ogv:  'video/ogg',
      ogg:  'video/ogg',

     };

  if( !fs.existsSync(movie) )
  { 
     res.set('Content-Type', 'text/plain');
     res.send("missing fileName"); 
     return;
  }

  console.log( 'try to load "' + movie +'"');

 var type      = mime[path.extname(movie).slice(1).toLowerCase()] || 'text/plain';

 console.log( 'typ : ' + type );

 try
 {
  const stat      = fs.statSync(movie);
  const fileSize  = stat.size
  const range     = req.headers.range

  if (range)
  {
    const parts     = range.replace(/bytes=/, "").split("-")
    const start     = parseInt(parts[0], 10)
    const end       = parts[1] ? parseInt(parts[1], 10) : fileSize-1
    const chunksize = (end-start)+1
    const file      = fs.createReadStream( movie , {start, end} )
    const head      =
    {
      'Content-Range' : `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges' : 'bytes',
      'Content-Length': chunksize,
      'Content-Type'  : 'video/mp4',
    }

    res.writeHead(206, head);
    file.pipe(res);
  }
  else
    {
       const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(movie).pipe(res)
  }
} catch(err) { console.log(err.message) }

}

async ___isRegistered( dB , param , fs , path  )
{
  var movie     = ''
  var clipID    = param.movieID;
  var result    = {registered:false,  clip:{} , thumbs:[], actors:[] , tags:[], movieID:''};

  if(!clipID)
  {
   var movie     = param.Movie;
       movie     = path.resolve(path.normalize(movie));
   var movieFile = path.parse(movie).base;  
   var movieDir  = path.parse(movie).dir;  
  
   var vinfo = videoInfo(movie) ;
  
  if(vinfo.error) return {error:true, errMsg:vinfo.errMsg, result:result }

         console.log('name     :' + movieFile );
         console.log('path     :' + movieDir );
         console.log('size     :' + vinfo.result.format.size );
         console.log('duration :' + vinfo.result.format.duration);
         console.log('search for clip in database ...');
  
  var response = dbUtils.fetchValue_from_Query( dB , "Select ID from clip where FileName='"+movieFile+"' AND FileSize="+vinfo.result.format.size+" AND PlayTime="+vinfo.result.format.duration );
  console.log("response from dB: " + JSON.stringify( response ));
  
  if(response.error) return {error:true, errMsg:response.errMsg , result:result }

   clipID  = response.result;
  }  
  
   if(!clipID ) return {error:false, errMsg:"file not registered yet." , result:result }
   
  result.registered = true;

  response          = dbUtils.fetchRecord_from_Query ( dB ,'select * from clip where ID='+clipID );
  if(!response.error) result.clip   = response.result;

  response          = dbUtils.fetchRecords_from_Query( dB , 'select * from movieThumbs where ID_Movie='+clipID+' Order by ndx' );
  if(!response.error) result.thumbs = response.result;

  response      = dbUtils.fetchRecords_from_Query( dB , 'select * from actor where ID in (select ID_Actor from clip_actor where ID_Clip='+clipID+') order by Name');
  if(!response.error) result.actors = response.result;

  response      = dbUtils.fetchRecords_from_Query( dB , 'select * from tags where ID in (select ID_Tag from Clip_Tags where ID_Clip='+clipID+') order by Name');
  if(!response.error) result.tags = response.result;


  
  result.movieID = clipID;
  
  return {error:false, errMsg:"OK" , result:result }
}

async ___registerMovie( dB , param , fs , path , res )
{
  console.log('registerMovie with param: '+JSON.stringify(param));

  var movie     = param.Movie;
      movie     = path.resolve(path.normalize(movie));
  var movieFile = path.parse(movie).base;  
  var movieDir  = path.parse(movie).dir;  
  var movieID   = ''; 
  
  // die letzte Verzeichnis-Ebene sollte der Actor-Name sein 
  // /mnt/movieBase/Tom Cruise/MissionImpossible.mp4
  var dirs       = movie.split('/');
  var n          = dirs.length;
  var actorName  = '';
  if (n>2) actorName = dirs[n-2];
  else     actorName = dirs[n-1];

  console.log('registerMovie()');
  console.log('movie:' + movie );
  console.log('name :' + movieFile);
  console.log('actor:' + actorName);

      
  console.log('get videoInfo...');
  var vinfo = videoInfo(movie) ;
  
  if(vinfo.error) return {error:true, errMsg:vinfo.errMsg, result:{} } 

  console.log('name     :' + movieFile );
  console.log('size     :' + vinfo.result.format.size );
  console.log('duration :' + vinfo.result.format.duration);
  
  // es wird in der Datenbank nachgesehen, ob es diesen Eintrag schon gibt.
  // da der Pfad variabel sein kann z.B. durch verschieden Mount-Points 
  // ist die Abfrage über  den Pfad sehr unsicher.
  // Andererseits ist die Abfrage NUR über den Dateinamen ebenfalls unsicher, da Dateinamen in verschiedenen Ordern
  // identisch sein können, ohne dass es sich um identische Clips handelt.
  // Daher wird eine Kombination aus fileName+Size+Duration gebildet'movieThumbs' , {ID_Movie:

  console.log('search for clip in database ...');

  var response = dbUtils.fetchValue_from_Query( dB , "Select ID from clip where FileName='"+movieFile+"' AND FileSize="+vinfo.result.format.size+" AND PlayTime="+vinfo.result.format.duration );
  if(response.error) { return response; } 

  movieID  = response.result;
  
  if(!movieID)
  {
         console.log('Clip nicht in Datenbank gefunden -> Datensatz wird neu angelegt...'); 
         response = dbUtils.insertIntoTable(dB,'clip', {
                                              DIR:movieDir,
                                              FILENAME:movieFile,
                                              NAME:path.parse(movie).name,
                                              DIMENSION:'1920x1080',
                                              FILESIZE:vinfo.result.format.size,
                                              PLAYTIME:vinfo.result.format.duration,
                                              QUALITY:0,
                                              CAPTURE:'',
                                              SOURCE:'',
                                              KATEGORIE:'',
                                            } );

         if(response.error) return response;

         movieID = response.result.lastInsertRowid;
        // Falls Datensatz angelegt werden konnte, Thums und Poster erzeugen ...
        if (movieID!="")
        {
          console.log('Datensatz in "clip" angelegt ID='+movieID);
        // Actor ermitteln oder anlegen...
          var actor = findActor( dB , actorName);
          if(actor) dbUtils.insertIntoTable(dB,'clip_actor', {ID_actor:actor , ID_Clip:movieID} );
                    
          // Poster in originalgrösse
          var fn = posterPath+'poster_'+movieID+'.png';
          createThumb( movie , 
                       fn , 
                       Math.floor(vinfo.result.format.duration*0.21) , 
                       'origin' , 
                        function() {dbUtils.updateTable(this.db , 'clip', 'ID' , this.ID , {CAPTURE:this.fnCapture} )}.bind({db:dB, ID:movieID, fnCapture:fn}));  
        
          // Thumbnails erzeugen....
          var dt = vinfo.result.format.duration / numberOfThums; 
          var i  = 0;
          for( i=1 ; i<=numberOfThums ; i++ )
          {
            var timeStamp = Math.floor(i*dt);
            var fname     = thumbPath + 'thumb_'+movieID+'_'+timeStamp+'.png';
            createThumb( movie , 
                         fname , 
                         timeStamp , 
                         sizeOfThumbs, 
                         function()
                         {
                           console.log('thumbnail ['+this.ndx+'] created -> '+this.thumbName);  
                           dbUtils.insertIntoTable( this.db , 'movieThumbs' , {ID_Movie:this.ID, ndx:this.ndx, thumbName:this.thumbName, position:this.position})                           
                         }.bind({db:dB, ID:movieID, ndx:i, position:timeStamp, thumbName:fname}));
           }
        } // if movieID > 0                          
     } // if not record -> Neuanlage MovieClip
     else  
         { 
           console.log('Clip in database gefunden mit ID: ' + movieID ); 
         }
  
  return {error:false, errMsg:"OK", result:{}}
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