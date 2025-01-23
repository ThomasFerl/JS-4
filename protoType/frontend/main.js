

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";

import * as mqtt from 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js';

//import {TFDistributor,
//        TFMQTTlabel  }   from "./tfWebApp/tfMQTT.js";


var objects        = [];
var head           = null;
var menu           = null;
var dashBoard      = null;

var editTopic      = null;



export function main(capt1,capt2)
{
    var ws = new TFWorkSpace('mainWS' , capt1,capt2 );

    var l          = dialogs.setLayout( ws.handle , {gridCount:27,head:2,left:7} )
        head       = l.head;
        menu       = l.left;
        dashBoard  = l.dashBoard;

        mqttClient = mqtt.connect(  'mqtt://10.102.13.5:4400' );


/*
    var dist       = new TFDistributor( 'mqtt://10.102.13.5:4400' );     // Verbindung zum Broker herstellen
    debugger;
        dist.start();

    var temperatur = new TFMQTTlabel( dashBoard , 1,1,200,70,{distributor:dist , topic:'ems/wago/WAGO001/PT500/Temperatur/IT-Werkstatt'} );
*/


 
} 