
const dbUtils            = require('./dbUtils');
const utils              = require('./nodeUtils');

var   dB                 = null;
var  influx              = null;
var  influx_measurement  = null;

module.exports.setup = (_dB , _influx , _influx_measurement) => { dB = _dB;  influx = _influx; influx_measurement = _influx_measurement }
    
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

    utils.log('payload ist vom Typ : '+typeof strPayload);

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


        // Influx speichern
        var ID = payload.ID || 0;
        var DT = payload.timestamp || new Date().toISOString();


        var record = { id:ID_Topic, timestamp:DT, ID_payloadField: ID_payloadField, wert: payload[key] };
        influx.saveValues( influx_measurement , record);
    }
}


