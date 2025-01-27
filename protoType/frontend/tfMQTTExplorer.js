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


const start_ab_Ebene = 3;


export class TFMQTTExplorer
{
  constructor (aParent , mqttDistributor ,  width , height ) 
  { 
    this.wnd                  = new TFWindow( aParent , 'MQTT-Browser', width , height ,'center');
    this.treeView             = null;
  
    var l                     = dialogs.setLayout( this.wnd.hWnd , {gridCount:35,left:14} )
        this.treeContainer    = l.left;
        this.dashBoard        = l.dashBoard;
        this.dashBoard.shadow = 0;

        this.treeContainer.padding = '0em';
        this.treeContainer.borderRadius = 0;
        this.treeContainer.backgroundColor = 'rgb(247, 247, 250)'; 
        this.treeContainer.shadow = 0;
        this.treeContainer.buildGridLayout_templateRows('2em 1fr');
        this.treeContainer.buildGridLayout_templateColumns('1fr');
        
    var helpContainer = dialogs.addPanel( this.treeContainer , 'cssContainerPanel' , 1,1,1,1, {} );
        helpContainer.margin = 0;
        helpContainer.padding = 0;
        helpContainer.overflow = 'hidden';
        helpContainer.buildGridLayout_templateRows('1fr');
        helpContainer.buildGridLayout_templateColumns('1fr 2em 2px');

        this.treeViewCaption = dialogs.addLabel(helpContainer , '', 1,1,1,1, 'MQTT-Topics' );
        this.treeViewCaption.marginLeft = '0em'
        this.treeViewCaption.backgroundColor = 'rgb(77, 77, 77)';
        this.treeViewCaption.fontSize = '1em';
        this.treeViewCaption.fontWeight = 'bold';
        this.treeViewCaption.color = 'white';
        this.treeViewCaption.textAlign = 'left';
        this.treeViewCaption.setTextIndent('0.7em');

        var btn = new TFButton( helpContainer , 2,1,1,1, {caption:'...'} );
            btn.backgroundColor = 'gray';
            btn.margin = '4px';
            btn.height = '1.5em';
            btn.callBack_onClick = ()=> { this.buildTreeView() }

        this.treeContainer = dialogs.addPanel( this.treeContainer , 'cssContainerPanel' , 1,2,1,1, {} );
   }          


buildTreeView()
{
   if(this.treeView!=null) {this.treeView.destroy(); this.treeContainer.innerHTML = '';} 

   var topics = mqttArchive.lsTopics( start_ab_Ebene ); debugger;
       console.log(topics.result);

       if (topics.error) this.treeContainer.innerHTML = 'Fehler beim Abruf der Topics';
       else this.treeView = dialogs.createTreeView( this.treeContainer , topics.result , {} ); 
}



}

/*
        
        new TFMQTTChart( dashBoard , 1,1,'90%',200, {
                                                  distributor            : mqttDistributor , 
                                                  topic                  : 'ems/wago/WAGO001/PT500/Temperatur/IT-Werkstatt',
                                                  captionBackgroundColor : 'gray',
                                                  value                  : 'value',
                                                  caption                : '"Temperatur"'
                                                } )
    
    for(var i=0; i<40; i++)
    var temperatur = new TFMQTTPanel( dashBoard , 1,1,200,70, {
                                                               distributor            : mqttDistributor , 
                                                               topic                  : 'ems/wago/WAGO001/PT500/Temperatur/IT-Werkstatt',
                                                               backgroundColor        : 'white',
                                                               captionBackgroundColor : 'gray',
                                                               valueColor             : 'green',
                                                               fontSize               : '1em',
                                                               value                  : 'value',
                                                               caption                : '"Temperatur"',
                                                               appendix               : 'unit'
                                                               } );

    

}    


*/
