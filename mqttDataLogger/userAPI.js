const utils          = require('./nodeUtils.js');
const dbUtils        = require('./dbUtils.js');
const mqttHandler    = require('./mqttHandler.js');
const { TFDateTime } = require('./nodeUtils.js');


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



if( CMD=='LSTOPICS') 
  {
    return dbUtils.fetchRecords_from_Query( dB , "Select * from mqttTopics Where not topic like '$SYS%' order by ID" );
  }
  

  if( CMD=='LASTPAYLOAD') 
    {
      return mqttHandler.loadLastPayload( param.ID_topic ); 
    }

  if( CMD=='COUNT') 
    {
      var fn       = (param.fieldName || 'value');
      var response = dbUtils.fetchValue_from_Query( dB , "Select ID from mqttPayloadFields Where ID_Topic="+param.ID_topic+" AND payloadFieldName='"+fn+"'" );
      
      if(response.error) return response;
      if(response.result=='') return {error:true,errMsg:'Für dieses Topic existiert kein Feldname mit dem Namen "'+fn+'" !',result:{}};

      var countParam = {filters:{idPayloadField :response.result}};



      return mqttHandler.count( countParam); 
    }
    
  



if( CMD=='GETVALUES' )
  {
     var ID_topic = param.ID_topic || '0';
     var from     = new TFDateTime(param.from || '01.01.2000').dateTime();
     var to       = new TFDateTime(param.to   || '31.12.3000').dateTime();
     var field    = 'value_' + (param.aggr  || 'avg');
     return dbUtils.fetchRecords_from_Query( dB , "Select ID,name,exceltime as xlsTimestamp , day , month, year , hour , cnt , "+field+"  from archiv_hour  Where ID_topic="+ID_topic+" AND exceltime>="+from+" AND exceltime<="+to+" order by xlsTimestamp" );
  }





}
