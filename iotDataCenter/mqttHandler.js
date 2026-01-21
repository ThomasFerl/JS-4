const { error }            = require('console');
const globals              = require('./backendGlobals');
const dbUtils              = require('./dbUtils');
const utils                = require('./nodeUtils');

var   dB                   = null;
var   maxAgePayloadHistory = globals.maxAgePayloadHistory || 365; // in Tagen


const validTopics = ['smartmeter/strom/measure'   , 
                     'ESP32/smartmeterGAS/Imp_01' ,
                     'ESP32/smartmeterGAS/Imp_02' ,
                     'ESP32/smartmeterGAS/Imp_03' ,
                     'zigbee2mqtt/tempHum01'      ,
                     'zigbee2mqtt/tempHum02'      ,
                     'zigbee2mqtt/tempHum03'      ,
                     'zigbee2mqtt/tempHum04'      ,
                     'zigbee2mqtt/tempHum05'      ,
                     'zigbee2mqtt/tempHum06'      ,
                     'zigbee2mqtt/tempHum07'      ];



module.exports.setup = (_dB ) => { dB = _dB; }


module.exports.onMessage = (topic, payload) =>
{
   if(validTopics.includes(topic)==false) return;

   utils.log('. ');
   utils.log('-------------------mqttHandler.onMessage-----------------');
   utils.log('onMessage -> Topic: '+topic+' / Payload: '+payload);

   // 0. Prüfen, ob das Topic mit "$SYS" beginnt, da es sich dabei um interne Systemnachrichten handelt
   if (topic.startsWith('$SYS')) { return; }

   // 1. Prüfen, ob das Topic bereits in der Datenbank existiert
   
   
   utils.log('. '); 
   utils.log('-------------------mqttHandler.onMessage-----------------'); 
   utils.log('onMessage -> Topic: '+topic+' / Payload: '+payload);

    // 0. Prüfen, ob das Topic mit "$SYS" beginnt, da es sich dabei um interne Systemnachrichten handelt
    if (topic.startsWith('$SYS')) { return; }

    // 1. Prüfen, ob das Topic bereits in der Datenbank existiert
    //    Wenn nicht, dann in die Datenbank eintragen
    var ID_Topic = null;
    var response = dbUtils.fetchValue_from_Query(dB, "SELECT ID FROM mqttTopics WHERE topic = '"+topic+"'" )
    if (response.error) { console.error('Fehler beim Prüfen des Topics:' + response.errMsg); return; }

    if (response.result=='')
    {
       utils.log('Topic nicht gefunden, registriere neues Topic: '+topic);
       response = dbUtils.insertIntoTable(dB, 'mqttTopics', {topic:topic});
       if (response.error) { console.error('Fehler beim Regisstrieren des Topics:', response.errMsg); return; }
      
       ID_Topic = response.result.lastInsertRowid;
       utils.log('Topic '+topic+' wurde unter der ID:' +ID_Topic+' registriert.');    
    }
    else ID_Topic = response.result;

    utils.log('ID_Topic: '+ID_Topic);

    //safePayload
    var dtStr = '';
    try {
        var p = JSON.parse(payload.toString());
        dtStr = p.timestamp;
    } catch (err) {
        console.error("[ERROR] Ungültiges JSON-Format für Payload:", payload.toString());
        return;
    }

    utils.log('Payload.timestamp: '+dtStr);

    var dt = new utils.TFDateTime(dtStr)

    utils.log('Excel-Timestamp: '+dt.excelTimestamp + ' / DateTime: '+dt.formatDateTime());

    dbUtils.insertIntoTable(dB,'mqttPayloads',{ID_Topic:ID_Topic,payload:payload.toString(),sync:0,DT:dt.dateTime()});

}   
    

module.exports.loadLastPayload = (ID_topic) =>
{
   var response = dbUtils.fetchRecords_from_Query(dB, "Select * from mqttPayloads Where ID_Topic="+ID_topic+" order by ID desc limit 1" );
   console.log("loadLastPayload: "+JSON.stringify(response.result));
   return response;
}


module.exports.loadLastPayloads = (ID_topic , fnValue , fnTimestamp ) =>
   { 
      var result   = [];
      var response = dbUtils.fetchRecords_from_Query(dB, "Select * from mqttPayloads Where ID_Topic="+ID_topic+" order by ID " );
      if(response.error) return response;

      for(var i=0; i<response.result.length; i++)
      {
         var rec = response.result[i];
         try {var p = JSON.parse(rec.payload);}
         catch { console.log("parse Error") ; return {error:true, errMsg:"JSON-parse-Error", result:result}; }
          
         result.push({fnTimestamp:p[fnTimestamp],fnValue:p[fnValue]})

      } 

      console.log("loadLastPayloadS: "+JSON.stringify(result));
      return {error:false, errMsg:'ok', result:result};
   }



module.exports.count = async (params) =>
{  
    var resolution = params.resolution.toUppercase();
    var table      = 'Measurements';
 
    if(resolution)
    {
       if(resolution=='HOUR')   table = 'hourly_Measurements';
       if(resolution=='DAY')    table = 'daily_Measurements';
       if(resolution=='MONTH')  table = 'monthly_Measurements';
    }

    return dbUtils.fetchValue_from_Query(dB , "Select count(*) from "+table+" Where ID_chanel="+params.ID_Chanel)
}


module.exports.selectValues = async (params) =>
{
   var sql         = "";  
   var table       = 'Measurements';
   var aggregation = params.aggr || 'SUM' ;
   var dtFrom      = null;
   var dtTo        = null;
   
   if(params.resolution)
    {
       var resolution                 =  (params.resolution || "").toUpperCase(); 
       if(resolution=='HOUR')   table = 'hourly_Measurements';
       if(resolution=='DAY')    table = 'daily_Measurements';
       if(resolution=='MONTH')  table = 'monthly_Measurements';
    }

    if(params.from)
      {
         console.log("from:"+params.from);   
         dtFrom = new utils.TFDateTime(params.from);
         console.log("from:"+dtFrom.dateTime());   
      }
   
      if(params.to)
      {
         console.log("to:"+params.to);   
         dtTo = new utils.TFDateTime(params.to);
         console.log("from:"+dtTo.dateTime()); 
      }
         
      sql = "Select DT,Wert from "+table+" Where ID_chanel="+params.ID_Chanel+" ";
         if (dtFrom) sql += " AND CAST(DT as Integer) >= "+dtFrom.dateTime();
         if (dtTo)   sql += " AND CAST(DT as Integer) <= "+dtTo.dateTime();
                     sql += " Order by DT";
     
      
   return dbUtils.fetchRecords_from_Query(dB , sql ) 
}


module.exports.getChanelInfo = ( idChanel ) =>
{
  var response = dbUtils.fetchRecord_from_Query(dB , "Select * from chanels Where ID="+idChanel);
  if(response.error) return response;
  var chanel   = response.result;

  response     = dbUtils.fetchRecord_from_Query(dB , "Select * from devices Where ID="+chanel.ID_Device);
  if(response.error) return response;
  var device   = response.result;

  response     = dbUtils.fetchRecord_from_Query(dB , "Select * from Measurements Where ID_Chanel="+chanel.ID+" order by DT desc limit 1");
  if(response.error) return response;
  var lastMeasurement   = response.result;

  response     = dbUtils.fetchRecord_from_Query(dB , "Select * from hourly_Measurements Where ID_Chanel="+chanel.ID+" order by DT limit 1");
  if(response.error) return response;
  var firstMeasurement   = response.result;

   return {error:false, errMsg:'ok', result:{chanel:chanel,device:device,lastMeasurement:lastMeasurement,firstMeasurement:firstMeasurement}}

} 




module.exports.selectLastValues = async (params) =>
{
   return dbUtils.fetchRecords_from_Query(dB , "Select * from Measurements Where ID_chanel="+params.ID_Chanel+" limit "+ (params.limit || "49") ) 
}


module.exports.selectRawValues = async (params) =>
{
   console.log("selectRawValues: "+JSON.stringify(params));


   var sql = "SELECT  CAST(DT * 1440 AS INTEGER) / 1440.0 AS DT, "  //  -- 1440 Minuten pro Tag "
           + "ROUND(AVG(Wert), 1) AS Wert, "
           +  "COUNT(*) AS n "
           +  "FROM Measurements "
           +  "WHERE ID_Chanel = "+params.ID_Chanel+" "  
           +  "       AND CAST(DT AS INTEGER) = "+params.day+" "
           +  "GROUP BY CAST(DT * 1440 AS INTEGER) "
           +  "ORDER BY DT";

   console.log("SQL: "+sql);

   return dbUtils.fetchRecords_from_Query(dB , sql ) 
}




function ___synchronize( idTopic , idChanel )
{
    console.log("  Ermittle passende Payload-Fields: ");
    
    var fnValue = dbUtils.fetchValue_from_Query(dB,"Select payloadField_val from chanels Where ID="+idChanel).result || 'value'
    if(!fnValue) return;

    var fnTime  = dbUtils.fetchValue_from_Query(dB,"Select payloadField_dt  from chanels Where ID="+idChanel).result || 'timestamp'
    if(!fnTime)  return;
    
    console.log("fnVale:"+fnValue);
    console.log("fnTime:"+fnTime);  

    var measure  = [];
    var update   = [];

    console.log("Ermittle Payloads zum Topic -> "+idTopic);
    var response = dbUtils.fetchRecords_from_Query(dB , "select * from mqttPayloads where ID_Topic="+idTopic+" and sync=0 order by ID");
    console.log(response.result.length+' Datensätze gefunden...');
    
    // Daten sammeln und als EINE Transaktion ausführen....
    for(var i=0; i<response.result.length; i++)
    {
        var rec  = response.result[i];
        try {p = JSON.parse(rec.payload)}
        catch{ console.log("parse Error") ; return }

        try {
             console.log("Ermittle Values aus akt. Payload ...");
             var dt = new utils.TFDateTime(p[fnTime]);

             console.log(fnTime+'  : '+p[fnTime]+'   (' + dt.excelTimestamp+')');
             console.log(fnValue+' : '+p[fnValue]);
                           
             if(p[fnValue]!=null)
             {
               measure.push({ID_Chanel:idChanel,DT:dt.excelTimestamp  ,Wert:p[fnValue], sync:0}) 
               update.push ({ID:rec.ID, sync:1}) 
             } 
             else console.log("Payload enthält kein Feld mit dem Namen '"+fnValue+"' !"); 
          } 
         catch(err) {console.log(err.message)} 
    }   
    
    if(measure.length>0)
    response = dbUtils.insertBatchIntoTable(dB , 'Measurements' , measure );

    if(!response.error) 
        if(update.length>0) dbUtils.updateBatchInTable(dB,'mqttPayloads',update,'ID');

}


module.exports.aggregateHourly = () =>
{
  var thisHour = Math.trunc( (new utils.TFDateTime().dateTime()*24) );  

  var sql = "INSERT INTO hourly_Measurements (ID_Chanel , DT , Wert , cnt , sync) " +
            "SELECT ID_Chanel, (Round(DT*24)/24) as DT , AVG(Wert) AS Wert , count(*) as cnt , CAST( 0 as Integer) as sync " +
            "FROM Measurements " + 
            "WHERE (sync <> 1) AND ( (DT*24) < "+thisHour+" ) " +
            "GROUP BY CAST((DT*24) As INTEGER) , ID_Chanel";

  var response = dbUtils.runSQL(dB , sql );
  
  if (!response.error) dbUtils.runSQL(dB , "UPDATE Measurements SET sync = 1 WHERE sync <> 1 AND  ( (DT*24) < "+thisHour+" ) ");
}


module.exports.aggregateDaily = () =>
{
  var thisDay = Math.trunc( new utils.TFDateTime().dateTime() );
  
  var sql = "INSERT INTO daily_Measurements (ID_Chanel , DT , Wert , cnt , sync) " +
            "SELECT ID_Chanel, CAST( DT as INTEGER) as DT,  AVG(Wert) AS Wert , count(*) as cnt , CAST( 0 as Integer) as sync " +
            "FROM hourly_Measurements " + 
            "WHERE (sync <> 1) AND ( DT < "+thisDay+" ) " +
            "GROUP BY (CAST( DT as INTEGER)) , ID_Chanel";

  var response = dbUtils.runSQL(dB , sql );
  
  if (!response.error) dbUtils.runSQL(dB , "UPDATE hourly_Measurements SET sync = 1 WHERE (sync <> 1) AND ( DT < "+thisDay+" )");
}


module.exports.synchronize = () =>
{
   console.log("Synchrionisation ...");
   var t = dbUtils.fetchRecords_from_Query(dB , "Select DISTINCT ID_TOPIC from mqttPayloads Where sync <> 1 order by ID") 

   console.log("Ermittlung aller Payloads, die noch zur Synchronisation ausstehen : "+JSON.stringify(t))

   console.log("Durchlaufen aller "+t.result.length+" Datensätze...")
   

   // alle ggf. gefundenen Topics durchlaufen ...
   for(var j=0; j<t.result.length; j++)
   {
     var idTopic = t.result[j].ID_Topic;  
     console.log("Loop"+j+": ID_Topic:"+idTopic)
     
     // alle Kanäle ermitteln, die an dieses Topics gebunden sind. -> diese durchlaufen und synchronisieren ....
     var r = dbUtils.fetchRecords_from_Query(dB,"Select ID from chanels Where ID_TOPIC = "+idTopic );
     console.log("Ermittlung aller Kanäle, die an die Payloads gebunden sind und zur Synchronisation ausstehen : "+JSON.stringify(r))

     for(var i=0; i<r.result.length; i++)  
        {
           console.log("Loop"+i+": ID_Topic:"+idTopic+" ->  ID_Chanel:"+  r.result[i].ID)
           ___synchronize( idTopic , r.result[i].ID );
        }   
   }
}


module.exports.cleanUp_old_payLoads = () =>
{
    var currentTimestamp   = new utils.TFDateTime();
    var cutoffPayload      = currentTimestamp.dateTime() - (maxAgePayloadHistory / 24);
    var cutoffMeasurements = currentTimestamp.dateTime() - ((7 * maxAgePayloadHistory) / 24);

    console.log("Lösche Einträge älter als:"+currentTimestamp.dateTime()+" -> "+currentTimestamp.formatDateTime())
    
    dbUtils.runSQL(dB, "DELETE FROM mqttPayloads WHERE sync = 1 AND DT < ?", [cutoffPayload]);
    dbUtils.runSQL(dB, "DELETE FROM Measurements WHERE sync = 1 AND DT < ?", [cutoffMeasurements]);
}




module.exports.handleSyncForce = ( req , res ) =>
{
  this.synchronize();   
  this.aggregateHourly();   
  this.aggregateDaily();   
  this.cleanUp_old_payLoads(); 
  if(res) res.send({error:false,errMsg:"Synchronisation erfolgreich ausgeführt ...", result:{}});
  console.log("Synchronisation abgeschlossen ...");
}  


    
