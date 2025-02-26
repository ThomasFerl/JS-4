

import { TFWorkSpace    }   from "./tfWebApp/tfObjects.js";
import { TFDistributor  }   from "./tfWebApp/tfMQTT.js";
import { TFMQTTExplorer }   from "./tfMQTTExplorer.js";
import * as utils        from "./tfWebApp/utils.js";    


var mqttDistributor =  new TFDistributor( 'mqtt://10.102.13.99:4701' );     // Verbindung zum Broker herstellen


export function main(capt1,capt2)
{
    var ws  = new TFWorkSpace('mainWS' , capt1,capt2 );
    new TFMQTTExplorer (ws.handle , mqttDistributor , '70%','80%' );

    var response = utils.webApiRequest("schema",{tableName:"devices"})
    console.log(utils.JSONstringify(response.result))

}

xxx
