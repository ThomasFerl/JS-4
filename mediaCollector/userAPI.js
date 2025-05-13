const globals             = require('./backendGlobals.js');
const utils               = require('./nodeUtils.js');
const dbUtils             = require('./dbUtils.js');
const { TFDateTime }      = require('./nodeUtils.js');
const { TFMediaCollektor} = require('./mediaCollektor_backend.js');


var   dB           = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc          = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
var   media        = {};


module.exports.setup = function( _dB , _etc ) 
{
  utils.log('-------------------userAPI.SETUP-----------------');
  dB  = _dB;
  etc = _etc;

  if(globals.isMediaCollector)
    {console.log("MediaCollector wird initialisiert...");
     media = new TFMediaCollektor( dB , etc );
    }else console.log("MediaCollector wird NICHT initialisiert..."); 
  
  utils.log("userAPI.working-dB : " + dB.constructor.name);

  if(etc) utils.log("userAPI.config-dB  : " + etc.constructor.name)
  else utils.log("userAPI.config-dB  :  not set")
  // doin your own stuff here for preparing things ...
 
}


module.exports.run = function() 
// wird alle 60 Sekunden aufgerufen und prüft, ob etwas in der BATCH-Verarbeitung ansteht....
{
  
}

module.exports.handleCommand = async function( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{

 var CMD = cmd.toUpperCase().trim();
 utils.log("handleUserCommand ("+CMD+")");
 utils.log("with params: "+JSON.stringify(param) );
 

 //-----------------------------------------------------------
//-------------MEDIA Collektor--------------------------------
//------------------------------------------------------------

 if(globals.isMediaCollector)
  { console.log("MediaCollector.handleCommand("+cmd+")");
    var r =  media.handleCommand( sessionID , cmd , param , webRequest ,  webResponse , fs , path );
    if(r!=null) return r;
  }   


//------------------------------------------------------------
//-------------TEST-------------------------------------------
//------------------------------------------------------------

if( CMD=='TEST') 
{
  setTimeout(()=>{console.log("TEST")},1000)
  return {error:false,errMsg:"OK",result:42}
}





}
