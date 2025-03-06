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
  

if( CMD == 'AVAILEABLETOPICS')
    {
      return dbUtils.fetchRecords_from_Query(dB,"Select descr from mqttTopics Where ID_Device=0 order by ID desc");
    }

if( CMD == 'GETPAYLOADFIELDS')
      {
        var subSQL = "(Select ID from mqttTopics Where topic='"+param.topic+"')";
        if (param.topic.indexOf('%')>-1) subSQL = "(Select ID from mqttTopics Where topic like '"+param.topic+"')"

        return dbUtils.fetchRecords_from_Query(dB,"Select ID,payloadFieldName from mqttPayloadFields Where ID_Topic in "+subSQL+" order by ID desc");
      }

if( CMD == 'GETPAYLOADFIELDNAME')
      {
        return dbUtils.fetchValue_from_Query(dB,"Select payloadFieldName from mqttPayloadFields Where ID="+param.ID_payloadField);
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
    






if( CMD=='LSTOPICS') 
  {
    var sql = '';
    if (param.ID_Device) sql =  "Select * from mqttTopics Where ID_Device="+param.ID_Device+" order by ID";
    else                 sql =  "Select * from mqttTopics Where not topic like '$SYS%' order by ID";

    var response = dbUtils.fetchRecords_from_Query( dB , sql );

    if(param.excludeDescr)
    {
      var h=[];
      for(var i=0; i<response.result.length; i++) h.push(response.result[i].topic.substring(response.result[i].descr.length))
      return {error:false, errMsg:'OK', result:h}  
    } 

    return dbUtils.fetchRecords_from_Query( dB , sql );
  }
  

  if( CMD=='LASTPAYLOAD') 
    {
      return mqttHandler.loadLastPayload( param.ID_topic ); 
    }

  if( CMD=='COUNT') 
    {
      
      var response = getID_payloadField(param);

      if(param)


      
      if(response.error) return response;
      if(response.result=='') return {error:true,errMsg:'Für dieses Topic existiert kein Feldname mit dem Namen "'+response.fn+'" !',result:{}};
      
      var ID_PayloadField     = response.result;
      var countParam          = param;
          countParam.filter   = {idPayloadField :ID_PayloadField};
          countParam.typeCast = {idPayloadField : "int"};

      return mqttHandler.count( countParam); 
    }
    
  



if( CMD=='MQTTGETVALUES' )
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


  if( CMD=='GETVALUES' )
    {
      var sql = "";  
      if(param.groupBy) sql = "Select DT,"+(param.aggr || "sum")+"(Wert) as Wert from Measurements Where ID_chanel="+param.ID_Chanel+" Group by "+param.groupBy+" Order by DT"
      else {            sql = "Select DT,Wert from Measurements Where ID_chanel="+param.ID_Chanel+" Order by DT";
                      return dbUtils.fetchValue_from_Query(dB , sql ) 
           }      
    }


   if( CMD=='SYNC') 
   {
      mqttHandler.synchronize();
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
