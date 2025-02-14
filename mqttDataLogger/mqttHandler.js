
const dbUtils              = require('./dbUtils');
const utils                = require('./nodeUtils');

var   dB                   = null;
var  influx                = null;


module.exports.setup = (_dB , _influx ) => { dB = _dB;  influx = _influx }



module.exports.onMessage = (topic, payload) =>
{
    utils.log('onMessage -> Topic: '+topic+' / Payload: '+payload);

    // 0. Prüfen, ob das Topic mit "$SYS" beginnt, da es sich dabei um interne Systemnachrichten handelt
    if (topic.startsWith('$SYS')) { return; }

    var ID_Topic = null;

    console.log('Datenbank (dB) -> '+dB);
    
    // prüfen, ob das ankommende Topic schon existiert....
    var response = dbUtils.fetchValue_from_Query(dB, "SELECT ID FROM mqttTopics WHERE topic = '"+topic+"'" )
    if (response.error) { console.error('Fehler beim Prüfen des Topics:', response.errMsg); return; }

    if (response.result=='')
    {
       response = dbUtils.insertIntoTable(dB, 'mqttTopics', {topic:topic});
       if (response.error) { console.error('Fehler beim Regisstrieren des Topics:', response.errMsg); return; }
       else {
             console.log('Insert-response -> '+JSON.stringify(response));
             ID_Topic = response.result.lastInsertRowid;
             utils.log('Topic '+topic+' wurde unter dwer ID:' +ID_Topic+' registriert.');    
            }
            
    } else ID_Topic = response.result;

    safePayload( ID_Topic , payload.toString());    
}   
    

function safePayload(ID_Topic, strPayload)
{
    utils.log('safePayload -> ID_Topic: '+ID_Topic+' / payload: '+strPayload);

    var payload = {};

    // ist Payload ein String ?
    if (typeof strPayload == 'string')    
    {
        try {
            utils.log('Payload wurde als String erkannt und wird geparrtst:');
            payload = JSON.parse(strPayload);
            utils.log(payload);
        }
        catch (e) {
            console.error('Fehler beim Parsen des Payloads:', e);
            return;
        }
    }

    // ist Payload ein Objekt ?
    else if (typeof strPayload == 'object') { payload = strPayload; }

    var influxRecord = {value:payload.value || 0.0 };
    var xlsTimestamp = new utils.TFDateTime( payload.timestamp || new Date() ).dateTime();
    
    // durchlaufe alle Felder des Payloads und speichere sie in der Tabelle mqttPayloadFields
    for (var key in payload) 
    {
        var response = dbUtils.fetchValue_from_Query(dB, "SELECT ID FROM mqttPayloadFields WHERE ID_Topic ="+ID_Topic+" AND payloadFieldName='"+key+"'" );
        if (response.error) { console.error('Fehler beim Prüfen des Feldes:', response.errMsg); return; }
        
        var ID_payloadField = null;

        if (response.result == '') 
        {
            response = dbUtils.insertIntoTable(dB, 'mqttPayloadFields', { ID_Topic: ID_Topic, payloadFieldName: key });
            if (response.error) { console.error('Fehler beim Registrieren des Feldes:', response.errMsg); return; }
            else
                { 
                    ID_payloadField = response.result.lastInsertRowid;
                    utils.log('Feld ' + key + ' wurde mit der ID: '+ID_payloadField+' registriert.');
                }    
        } else ID_payloadField = response.result;

        // das Value-Field als WERT betrachtet - der Rest wird als Tags interpretiert
        if(key=='value') { influxRecord.idPayloadField = ID_payloadField }
        else { influxRecord[key] = payload[key]; }

         // temporärer Payload-Puffer zwecks Analyse und Konfiguration
         // die Lebensdauer eines Datensatzes beträgt per default 31 Tage ist aber konfigurierbar "maxAgePayloadHistory"
         dbUtils.insertIntoTable(dB, 'mqttPayloadContent', { ID_PayloadField: ID_payloadField, timestamp:xlsTimestamp, content: payload[key] });
    } 
    
    //falls kein Zeitstempel im payload existiert, dann nimm den aktuellen Zeitstempel des Brokers
    influxRecord.timestamp = payload.timestamp || new utils.TFDateTime().unixDateTime();
    
    // Influx speichern
    influx.saveValues(  influxRecord);
}


module.exports.loadLastPayload = (ID_topic) =>
{
   var response = dbUtils.fetchRecords_from_Query(dB, "Select * from mqttPayloadContent Where ID_PayloadField in (Select ID From mqttPayloadFields Where ID_Topic="+ID_topic+") order by timestamp desc limit 21" );

   if(response.error) return response;
   if(response.result.length==0) return {error:true, errMsg:'Not payloads for ID_Topic:"'+ID_topic+'" yet', result:{}};

   var payload = {timestamp:response.result[0].timestamp, fields:[]};
   var ts      = Math.round(payload.timestamp*10000);
   for(var i=0; i<response.result.length; i++)  
   {
     if( (Math.round(response.result[i].timestamp*1000) - ts) < 10)
     {
       var field = { fieldName: dbUtils.fetchValue_from_Query(dB, "select payloadFieldName From  mqttPayloadFields Where ID_Topic="+ID_topic+" AND ID="+response.result[i].ID_PayloadField).result,
                     content  : response.result[i].content 
                   };
            
        payload.fields.push(field); 
     }  
   } 

    return {error:false, errMsg:'ok', result:payload};
}


module.exports.count = async (params) =>
{    
 try {
        const response = await influx.count(params); 
        return response
    } catch (error) {
        return { error: true, errMsg: error.message, result: {} };
    }
};


module.exports.selectValues = async (params) =>
{
    try {
        const response = await influx.selectValues(params); 
        return response
    } catch (error) {
        return { error: true, errMsg: error.message, result: {} };
    }

}


module.exports.selectLastValues = async (params) =>
    {
        try {
            const response = await influx.selectLastValues(params); 
            return response
        } catch (error) {
            return { error: true, errMsg: error.message, result: {} };
        }
    
    }
    
