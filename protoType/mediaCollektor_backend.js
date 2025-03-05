const utils           = require('./nodeUtils');
const dbUtils         = require('./dbUtils');
const session         = require('./session');
const clipperWebUtils = require('./clipperWebUtils');

var   dB           = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc          = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   

class TFMediaCollektor
{
  constructor (  _dB , _etc ) 
  {
   this.dB  = _dB;
   this.etc = _etc;
  
  console.log("TFMediaCollektor.working-dB : " + this.dB.constructor.name);

  if(etc) console.log("TFMediaCollektor.config-dB  : " + this.etc.constructor.name)
  else console.log("TFMediaCollektor.config-dB  :  not set")
  // doin your own stuff here for preparing things ...
 
run = function() 
// durchläuft alle Kanäle und führt für jeden Kanal ein httpRequest() auf dem jeweiligen Gerät aus, sofern das Update-Intervall erreicht ist..
{
    // doin your own stuff here for running things in loop with 1 call/sec...
}


handleCommand = async function( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{
 var CMD = cmd.toUpperCase().trim();
 console.log("handleUserCommand ("+CMD+")");
 console.log("with params: "+JSON.stringify(param) );
 
//------------------------------------------------------------
//-------------TEST-------------------------------------------
//------------------------------------------------------------

if( CMD=='TEST') 
{
   return {error:false,errMsg:"OK",result:{var1:"script",var2:"foo",var3:42}}
}
 

//---------------------------------------------------------------
//------------ACTORS---------------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORS') 
{
   return clipperWebUtils.listActors(dB , param );  //zB.: parm:{"Name":"Ev*","Vorname":"Can*"}  
}  


//---------------------------------------------------------------
//-------------ACORINFO------------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORINFO') 
{
   return clipperWebUtils.actorInfo   ( dB , param );  // param:{"ID","2522"}
}


//---------------------------------------------------------------
//-------------SAVE ACTOR----------------------------------------
//---------------------------------------------------------------
if(CMD=='SAVEACTOR') 
{
   return clipperWebUtils.saveActor   ( dB , param , fs , webResponse );  
}




//---------------------------------------------------------------
//--------------ACTORIMAGE---------------------------------------
//---------------------------------------------------------------

if(CMD=='ACTORIMAGE') 
{
   await clipperWebUtils.actorImage ( dB , param , fs , path , webResponse ); // function streamt direkt 
   return {isStream:true};
}  

    

//---------------------------------------------------------------
//---------------MOVIES------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIES') 
{
   return clipperWebUtils.listMovies  ( dB , param ); 
}  


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIECAPTURE') 
{
   await clipperWebUtils.movieCapture ( dB , param , fs , path , webResponse ); // function streamt direkt 
   return {isStream:true};
}  

     
//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIETHUMBS') 
{
    await clipperWebUtils.movieThumbs ( dB , param , fs , path , webResponse ); // function streamt direkt 
    return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='MOVIEDETAILS') 
{
    return clipperWebUtils.movieDetails ( dB , param );
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='PLAYMOVIE') 
{
    await clipperWebUtils.playMovie ( dB , param , fs , path , webResponse , webRequest ); // function streamt direkt und braucht den 
    return {isStream:true};  
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LOADIMAGE') 
{
   await clipperWebUtils.loadImage  ( param ,fs , path , webResponse ); // function streamt direkt 
   return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='LOADMOVIE') 
{
   await clipperWebUtils.loadMovie  ( param , fs , path ,  webResponse , webRequest ); // function streamt direkt 
   return {isStream:true};
}


//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='REGISTERMOVIE') 
{
   return clipperWebUtils.registerMovie  ( dB , param , fs , path , webResponse );                       
}
                                          
//---------------------------------------------------------------
//---------------------------------------------------------------
//---------------------------------------------------------------

if(CMD=='ISREGISTERED') 
{
   return clipperWebUtils.isRegistered  ( dB , param , fs , path  );
                         
}


if(CMD=='CLIPPERSCANDIR') 
{
   var dir      = param.dirName;
   var response = utils.scanDir ( fs , path , dir );
   
   if (response.error) return response;
      
   var dbResponse = dbUtils.fetchRecords_from_Query(dB , "Select ID,FILENAME from clip where DIR='"+dir+"'"  );
   if (dbResponse.error) return response;

   // Checke Files gegen dB 
   // durchlaufe alle File - Einträge aus dBresponse.result
   for(var i=0; i<response.result.length; i++) 
   {
      var f=response.result[i];
      if(f.isFile) 
      {
         console.log('prüfe :"'+f.name+'" auf Existenz in dB ...');
         var foundInDB = utils.findEntryByField( dbResponse.result , 'FILENAME' , f.name );
       if(foundInDB) { console.log("---FOUND update ID ---") ; f.ID=foundInDB.ID ; }
      else  console.log("---NOT  FOUND---");
      }
   }
   
   return response; 

                         
}



  return {error:true,errMsg:"unknown command",result:null}
}