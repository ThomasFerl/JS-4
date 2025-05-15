
import * as globals         from "./tfWebApp/globals.js";
import * as app             from "./tfWebApp/tfWebApp.js";

import {TFDistributor,
        TFMQTTChart,
        TFMQTTPanel  }   from "./tfWebApp/tfMQTT.js";




var mqttDistributor =  new TFDistributor( 'mqtt://10.102.13.99:4701' );     // Verbindung zum Broker herstellen
    mqttDistributor.addSubscriber("$newDevice" , ()=>{dialogs.showMessage("new device")})


var dashBoard       = null;
var caption1        = '';
var caption2        = '';

export function main(capt1)
{
    caption1 = capt1;
    run()  
}  


export function run()
{ 
    var ws = app.startWebApp(caption1,caption2).activeWorkspace;
   
    //build GUI
    dashBoard      = ws.handle;

    dashBoard.buildGridLayout("10x10");

    var tempPanel = new TFMQTTPanel( dashBoard , 1 , 1 , 4 , 1 , {
                                                                  topic       : 'ems/wago002/pt1000/ch3' ,
                                                                  value       : 'value' ,
                                                                  caption     : 'name' ,
                                                                  appendix    : 'unit' ,
                                                                  distributor : mqttDistributor
                                                                } );

var tempPanel = new TFMQTTPanel( dashBoard , 1 , 3 , 4 , 1 , {
                                                                  topic       : 'ems/wago002/pt1000/Ch2' ,
                                                                  value       : 'value' ,
                                                                  caption     : 'name' ,
                                                                  appendix    : 'unit' ,
                                                                  distributor : mqttDistributor
                                                                } );                                                                

                    


    
}    
