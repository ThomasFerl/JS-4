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


// hilfsfunktion:
// ermittelt zu einem Topic und dem Feldnamen des entsprechenden Payloads die ID des Payload-Feldes
function getID_payloadField(param)
{
  var fn       = (param.fieldName || 'value');
  var response = dbUtils.fetchValue_from_Query( dB , "Select ID from mqttPayloadFields Where ID_Topic="+param.ID_topic+" AND payloadFieldName='"+fn+"'" );
  response.fn  = fn;
  utils.log("getID_payloadField -> "+JSON.stringify(response));
  return response;
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


if( CMD=='LOADDEVICES' )
  {
    return dbUtils.fetchRecords_from_Query(dB,"Select * from Devices order by ID desc ");
  }


if( CMD=='LOADDEVICE' )
    {
      return dbUtils.fetchRecord_from_Query(dB,"Select * from Devices Where ID="+param.ID_Device);
    }
  



if( CMD=='NEWDEVICE' )
  {
    return dbUtils.insertIntoTable_if_not_exist(dB,"devices",param.fields,"IP") ;
  }
  

 if( CMD=='UPDATEDEVICE' )
    {
      var response = dbUtils.updateTable(dB,"devices" , param.idField , param.idValue , param.fields) ;

      if(response.error) return response;

      // sofern das Device eine Topic-Zuordnung besitzt, diese in mqttTopics aktualisieren....
      var idDevice = param.fields.ID;
      var descr    = param.fields.TOPIC;
      if(descr!="") dbUtils.runSQL(dB,"update mqttTopics set ID_Device="+idDevice+" Where descr='"+descr+"'");

      return response;

    }


    if( CMD=='LOADCHANELS' )
      {
        return dbUtils.fetchRecords_from_Query(dB,"Select * from chanels Where ID_Device="+param.ID_Device+" order by ID");
      }
    
         
    if( CMD=='NEWCHANEL' )
      {
        return dbUtils.insertIntoTable_if_not_exist(dB,"chanels",param.fields,"identifyer") ;
      }
      
    
    if( CMD=='UPDATECHANEL' )
      {
          var response = dbUtils.updateTable(dB,"chanels" , param.idField , param.idValue , param.fields) ;
       
          return response;
      }
    



    if( CMD == 'AVAILEABLETOPICS')
      {
          return dbUtils.fetchRecords_from_Query(dB,"Select distinct descr from mqttTopics Where descr not in (Select Topic from devices ) order by ID desc");
      }
    
   
    if( CMD=='LSTOPICS')    
    {
      var sql = '';
      if (param.ID_Device)   sql =  "Select * from mqttTopics Where descr in (Select Topic from devices Where ID="+param.ID_Device+") order by ID";
      else                   sql =  "Select * from mqttTopics Where not topic like '$SYS%' order by ID";

      return dbUtils.fetchRecords_from_Query( dB , sql );
    }
  

  if( CMD == 'GETPAYLOADFIELDS')
    {
      var response = dbUtils.fetchValue_from_Query(dB , "Select payload from mqttPayloads Where ID_Topic="+param.ID_Topic+" order by ID desc limit 1");
      if (response.error) return response;
      
      var jsn = {};

      try{jsn = JSON.parse(response.result)}
      catch { return  {error:true, errMsg:'mqttPayloads.paylod ist kein gültiges JSON-Format', result:response.result} }

      var r = [];
      for(var key in jsn) r.push(key)

      return {error:false, errMsg:'ok', result:r}
    }


    
  if( CMD=='MQTTLASTPAYLOAD') 
    {
      return mqttHandler.loadLastPayload( param.ID_topic ); 
    }


  if( CMD=='MQTTLASTPAYLOADS') 
    {
      return mqttHandler.loadLastPayloads( param.ID_topic , param.fieldNameValues , param.fieldNameTimestamp ); 
    }



  if( CMD=='COUNT') 
    {
       return mqttHandler.count( countParam); 
    }
    

  if( CMD=='GETVALUES' )
    {
      return mqttHandler.selectValues( param )
    }


   if( CMD=='SYNC') 
   {
      return mqttHandler.handleSyncForce(webRequest ,  webResponse);
   }
  

  if( CMD=='GETLASTVALUES' )
    {
      return mqttHandler.selectLastValues( param ); 
    }


  if( CMD=='GETRAWVALUES' )
    {
      return mqttHandler.selectRawValues( param ); 
    }



  if( CMD=='CHANELINFO' )
    {
      return mqttHandler.getChanelInfo( param.ID_Chanel ); 
    }
  }    
