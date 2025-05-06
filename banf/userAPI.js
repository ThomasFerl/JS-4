const globals             = require('./backendGlobals.js');
const utils               = require('./nodeUtils.js');
const dbUtils             = require('./dbUtils.js');
const { TFDateTime }      = require('./nodeUtils.js');



var   dB           = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc          = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
var   media        = {};


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
  return {error:false,errMsg:"OK",result:42}
}

if( CMD=='LSBANF') 
  {
    var sql = "SELECT * FROM banf ";
    if (param.OWNER) sql += " WHERE OWNER = '" + param.OWNER + "'";
    sql += " ORDER BY ID DESC";
    return dbUtils,dbUtils.fetchRecords_from_Query(dB,sql);
  }


  if( CMD=='LOOKUPLIST')
    {
      var sql = "SELECT * FROM " + param.tableName + " Order by ID"
      var response = dbUtils.fetchRecords_from_Query(dB,sql);
      if (response.error) return response;
      var lookUp = [];
      for (var i = 0; i < response.result.length; i++) 
      {
        var rec = response.result[i];
        lookUp.push({value:rec.ID,caption:rec.v});
      }
      return {error:false,errMsg:"OK",result:lookUp};
      
    }


}
