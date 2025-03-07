const globals              = require('./backendGlobals');
const dbUtils              = require('./dbUtils');
const utils                = require('./nodeUtils');

var   dB                   = null;

module.exports.setup = (_dB ) => { dB = _dB; }


module.exports.onMessage = (topic, payload) =>
{
    utils.log('onMessage -> Topic: '+topic+' / Payload: '+payload);

    // 0. Prüfen, ob das Topic mit "$SYS" beginnt, da es sich dabei um interne Systemnachrichten handelt
    if (topic.startsWith('$SYS')) { return; }

    // die ersten drei Teile des Topics sind per Definition "Geräte-Identifikation"
    var parts=topic.split('/');
    var descr=''; 
    if (parts.length>3) descr=parts[0]+'/'+parts[1]+'/'+parts[2]

    var ID_Topic = null;
    // prüfen, ob das ankommende Topic schon existiert....
    var response = dbUtils.fetchValue_from_Query(dB, "SELECT ID FROM mqttTopics WHERE topic = '"+topic+"'" )
    if (response.error) { console.error('Fehler beim Prüfen des Topics:', response.errMsg); return; }

    if (response.result=='')
    {
       response = dbUtils.insertIntoTable(dB, 'mqttTopics', {topic:topic,descr:descr});
       if (response.error) { console.error('Fehler beim Regisstrieren des Topics:', response.errMsg); return; }
      
       ID_Topic = response.result.lastInsertRowid;
       utils.log('Topic '+topic+' wurde unter dwer ID:' +ID_Topic+' registriert.');    
    }
    else ID_Topic = response.result;

    //safePayload
    dbUtils.insertIntoTable(dB,'mqttPayloads',{ID_Topic:ID_Topic,payload:payload.toString(),sync:0});

}   
    

module.exports.loadLastPayload = (ID_topic) =>
{
   return dbUtils.fetchRecords_from_Query(dB, "Select * from mqttPayloads Where ID_Topic="+ID_topic+" order by ID desc limit 1" );
}


module.exports.count = async (params) =>
{  
  return dbUtils.fetchValue_from_Query(dB , "Select count(*) from Measurements Where ID_chanel="+params.ID_Chanel)
}


module.exports.selectValues = async (params) =>
{
   var sql = "";  
   if(params.groupBy) sql = "Select DT,"+(params.aggr || "sum")+"(Wert) from Measurements Where ID_chanel="+params.ID_Chanel+" Group by "+params.groupBy+" Order by DT"
   else               sql = "Select DT,Wert from Measurements Where ID_chanel="+params.ID_Chanel+" Order by DT";
   
   return dbUtils.fetchRecords_from_Query(dB , sql ) 
}


module.exports.selectLastValues = async (params) =>
{
   return dbUtils.fetchRecords_from_Query(dB , "Select * from Measurements Where ID_chanel="+params.ID_Chanel+" limit "+ (params.limit || "49") ) 
}



function ___synchronize( idTopic , idChanel )
{
    console.log("   sychronisiere ID-TOPIC ("+idTopic+") mit Kanal ("+idChanel+")");
    
    var fnValue = dbUtils.fetchValue_from_Query(dB,"Select payloadField_val from chanels Where ID="+idChanel).result;
    if(!fnValue) return;

    var fnTime  = dbUtils.fetchValue_from_Query(dB,"Select payloadField_dt  from chanels Where ID="+idChanel).result;
    if(!fnTime)  return;
    
    console.log("fnVale:"+fnValue);
    console.log("fnTime:"+fnTime);  

    var measure  = [];
    var update   = [];

    var response = dbUtils.fetchRecords_from_Query(dB , "select * from mqttPayloads where ID_Topic="+idTopic+" and sync=0 order by ID");
    
    // Daten sammeln und als EINE Transaktion ausführen....
    for(var i=0; i<response.result.length; i++)
    {
        var rec  = response.result[i];
        try {p = JSON.parse(rec.payload)}
        catch{ console.log("parse Error") ; return }
        
        if( Object.hasOwn( p , fnValue) && Object.hasOwn( p , fnTime)) 
        {
           var dt = new utils.TFDateTime(p[fnTime]);
           
            measure.push({ID_Chanel:idChanel,DT:dt.excelTimestamp  ,Wert:p[fnValue]}) 
           update.push ({ID:rec.ID, sync:1}) 
        }   
    }

    if(measure.length>0)
    response = dbUtils.insertBatchIntoTable(dB , 'Measurements' , measure );

    if(!response.error) 
        if(update.length>0) dbUtils.updateBatchInTable(dB,'mqttPayloads',update,'ID');

}



module.exports.synchronize = () =>
{
   console.log("Synchrionisation ...");
   var t = dbUtils.fetchRecords_from_Query(dB , "Select DISTINCT ID_TOPIC from mqttPayloads Where sync <> 1 order by ID") 

   // alle ggf. gefundenen Topics durchlaufen ...
   for(var j=0; j<t.result.length; j++)
   {
     var idTopic = t.result[j].ID_Topic;  
     
     // alle Kanäle dieses Topics durchlaufen und synchronisieren ...
     var r = dbUtils.fetchRecords_from_Query(dB,"Select ID as ID from chanels Where ID_TOPIC = "+idTopic );
     for(var i=0; i<r.result.length; i++)  console.log(___synchronize( idTopic , r.result[i].ID ));
   }  
}


/*
Code um ältere Datensätze zu löschen .....
const today = new Date();
                    if (today.getHours() === 0 && today.getMinutes() === 0) 
                    { // Um Mitternacht:  lösche alles, das älter als "maxAgePayloadHistory" Tage ist 
                      console.log('Mitternacht! Lösche alte Daten aus payload-Register...');
                      // aktueller xlstimestamp:
                      var thisXLStimestamp = Math.trunc(new utils.TFDateTime().dateTime());
                      dbUtils.runSQL(dB, "DELETE FROM mqttPayloadContent WHERE ("+thisXLStimestamp+"-timestamp) > "+globals.maxAgePayloadHistory );
                    }


*/


    
