
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
   var response = dbUtils.fetchRecords_from_Query(dB, "Select * from mqttPayloadContent Where ID_PayloadField in (Select ID From mqttPayloadFields Where ID_Topic="+4+") order by timestamp desc limit 21" );

   if(response.error) return response;

   var payload = {timestamp:response.result[0].timestamp, fields:[]};
   var ts      = Math.round(payload.timestamp*10000);
   for(var i=0; i<response.result.length; i++)  
   {
     if( (Math.round(response.result[i].timestamp*10000) - ts) < 100)
     {
       var field = { fieldName: dbUtils.fetchValue_from_Query(dB, "select payloadFieldName From  mqttPayloadFields Where ID_Topic="+ID_topic+" AND ID="+response.result[i].ID_PayloadField).result,
                     content  : response.result[i].content 
                   };
            
        payload.fields.push(field); 
     }  
   } 

    return {error:false, errMsg:'ok', result:payload};
}


module.exports.count = async function (params) 
{
    var rangeClause = `|> range(start: -inf) |> limit(n: 250000)`;

    if (params.hasOwnProperty('range')) 
      {
        // Ist params.range vom Typ String?
        if (typeof params.range === 'string') rangeClause = `|> range(${params.range})`;
        
        // Ist params.range vom Typ Object?
        if (typeof params.range === 'object') 
        {
            // Prüfe und konvertiere Datumswerte
            const validStart = influx.___validateAndFormatDate(params.range.start);
            const validStop  = influx.___validateAndFormatDate(params.range.stop);
            rangeClause = `|> range(start: ${validStart}, stop: ${validStop})`;
        }
    }

    // Durchlaufe alle Filter und füge sie der Query hinzu
    var filterClause = '';
    if (params.hasOwnProperty('filters')) 
       {
         Object.entries(params.filters).forEach(([key, value]) => {
            if (typeof value === "string") {
                filterClause += ` |> filter(fn: (r) => r.${key} == "${value}")`;
            } else {
                filterClause += ` |> filter(fn: (r) => r.${key} == "${value}")`;
            }
        });
    }

    var query = `from(bucket: "${influx.bucket}")`
              + rangeClause
              + filterClause
              + ' |> group()'
              + ' |> count()';

    utils.log("------------------------------");
    utils.log("Ausgeführte Query:" + query); // ⚠️ FIXED: fluxQuery → query
    utils.log("------------------------------");

    try {
        const result = await influx.___influxQuery(query); // ⚠️ FIXED: fluxQuery → query
        return { error: false, errMsg: "OK", result: result };
    } catch (error) {
        return { error: true, errMsg: error.message, result: {} };
    }
};






module.exports.getValues = (ID_topic, from, to, aggr) =>
{
   // Imflux-Abfrage vorbereiten
    var filters = {ID_Topic: ID_topic};
    var aggregate = aggr || 'mean';
    var groupBy = '1h';

}



