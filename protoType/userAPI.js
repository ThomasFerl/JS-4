const utils        = require('./nodeUtils');
const dbUtils      = require('./dbUtils');


var   dB           = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc          = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   



module.exports.setup = function( _dB , _etc ) 
{
  utils.log('-------------------userAPI.SETUP-----------------');
  dB  = _dB;
  etc = _etc;
  
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
 
//------------------------------------------------------------
//-------------TEST-------------------------------------------
//------------------------------------------------------------

if( CMD=='TEST') 
{
  setTimeout(()=>{console.log("TEST")},1000)
  return {error:false,errMsg:"OK",result:{html:param.testValue}}
}



}
