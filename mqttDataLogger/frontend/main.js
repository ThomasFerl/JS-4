

import { TFWorkSpace    }   from "./tfWebApp/tfObjects.js";
import { TFDistributor  }   from "./tfWebApp/tfMQTT.js";
import { TFMQTTExplorer }   from "./tfMQTTExplorer.js";


var mqttDistributor =  new TFDistributor( 'mqtt://10.102.13.99:4701' );     // Verbindung zum Broker herstellen

// ein zentraler mqtt-Listener überwacht alle eingehenden Topics und generiert ein neues Bildschirm-Objekt
// welches im Anschluss editiert wird um die Datenquelle/Liegenschaft zu bestimmen
function mqttListener()
{
    mqttDistributor.addSubscriber( '#' , (topic,payload) => 
        {
           var data = JSON.parse(payload);
           console.log('mqttListener -> '+topic+' / '+payload);
        });
}





export function main(capt1,capt2)
{
    var ws  = new TFWorkSpace('mainWS' , capt1,capt2 );
    //new TFMQTTExplorer (ws.handle , mqttDistributor , '70%','80%' );
    mqttListener();
}


