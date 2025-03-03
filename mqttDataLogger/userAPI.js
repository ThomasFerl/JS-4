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

  if( CMD == 'AVAILEABLETOPICS')
    {
      return dbUtils.fetchRecords_from_Query(dB,"Select descr from mqttTopics Where ID_Device=0 order by ID desc");
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
        return dbUtils.fetchRecords_from_Query(dB,"Select * from chanels Where ID_Device="+param.ID_Device+" order by ID desc ");
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
      var response = getID_payloadField(param);
      
      if(response.error) return response;
      if(response.result=='') return {error:true,errMsg:'Für dieses Topic existiert kein Feldname mit dem Namen "'+response.fn+'" !',result:{}};
      
      var ID_PayloadField     = response.result;
      var countParam          = param;
          countParam.filter   = {idPayloadField :ID_PayloadField};
          countParam.typeCast = {idPayloadField : "int"};

      return mqttHandler.count( countParam); 
    }
    
  



if( CMD=='GETVALUES' )
  {
    var response = getID_payloadField(param);
      
    if(response.error) return response;
    if(response.result=='') return {error:true,errMsg:'Für dieses Topic existiert kein Feldname mit dem Namen "'+response.fn+'" !',result:{}};
    
    var ID_PayloadField      = response.result;
    var selectParam          = param;
        selectParam.filter   = {idPayloadField :ID_PayloadField};
        selectParam.typeCast = {idPayloadField : "int"};

    return mqttHandler.selectValues( selectParam ); 
  }


  if( CMD=='GETLASTVALUES' )
    {
      var response = getID_payloadField(param);
        
      if(response.error) return response;
      if(response.result=='') return {error:true,errMsg:'Für dieses Topic existiert kein Feldname mit dem Namen "'+response.fn+'" !',result:{}};
      
      var ID_PayloadField      = response.result;
      var selectParam          = param;
          selectParam.filter   = {idPayloadField :ID_PayloadField};
          selectParam.typeCast = {idPayloadField : "int"};
  
      return mqttHandler.selectLastValues( selectParam ); 
    }




}
