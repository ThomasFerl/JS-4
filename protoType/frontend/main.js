

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TFButton,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";


import {TFDistributor,
        TFMQTTChart,
        TFMQTTPanel  }   from "./tfWebApp/tfMQTT.js";


import * as mqttArchive from "./tfMQTTArchive.js";        


var head           = null;
var treeContainer  = null;
var dashBoard      = null;
var treeView       = null;

var editTopic      = null;


export function main(capt1,capt2)
{
    var ws = new TFWorkSpace('mainWS' , capt1,capt2 );
    mqttBrowser( ws.handle)
}



function mqttBrowser( parent)
{
    var wnd = new TFWindow( parent , 'MQTT-Browser', '90%','87%','center');
  
    var l             = dialogs.setLayout( wnd , {gridCount:27,left:7} )
        treeContainer = l.left;
        dashBoard     = l.dashBoard;

        treeContainer.buildGridLayout_templateRows('2em 1fr');
        treeContainer.buildGridLayout_templateColumns('1fr');
        

    var dist       = new TFDistributor( 'mqtt://10.102.13.5:4400' );     // Verbindung zum Broker herstellen

    new TFMQTTChart( dashBoard , 1,1,'90%',200, {
                                                  distributor            : dist , 
                                                  captionBackgroundColor : 'gray',
                                                  topic                  :'ems/wago/WAGO001/PT500/Temperatur/IT-Werkstatt',
                                                  value                  :'value',
                                                  caption                :'"Temperatur"'
                                                } )
    
    for(var i=0; i<40; i++)
    var temperatur = new TFMQTTPanel( dashBoard , 1,1,200,70, {
                                                               backgroundColor        : 'white',
                                                               captionBackgroundColor : 'gray',
                                                               valueColor             : 'green',
                                                               fontSize               : '1em',
                                                               distributor            : dist , 
                                                               topic                  :'ems/wago/WAGO001/PT500/Temperatur/IT-Werkstatt',
                                                               value                  :'value',
                                                               caption                :'"Temperatur"',
                                                               appendix               :'unit'
                                                               } );

    var btn          = new TFButton( treeContainer , 1,1,1,1, {caption:'update Topics'} );
        btn.heightPx = 35;
        btn.callBack_onClick = ()=>
            { 
              if(treeView!=null) {treeView.destroy(); treeContainer.innerHTML = '';} 
              var topics = mqttArchive.lsTopics();
              console.log(topics.result);
              if (topics.error) treeContainer.innerHTML = 'Fehler beim Abruf der Topics';
              else 
                  {
                    var p=dialogs.addPanel( treeContainer , 'cssContainerPanel' , 1,1,1,1, {} );
                    treeView = dialogs.createTreeView( p , topics.result , {} );
                  }  
            }
            

}    