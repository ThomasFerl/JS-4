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
    this.dataSheet            = null;
    this.mqttDistributor      = mqttDistributor;
  
    var l                     = dialogs.setLayout( this.wnd.hWnd , {gridCount:35,left:14} )
        this.treeContainer    = l.left;
        this.dashBoard        = l.dashBoard;
        this.dashBoard.shadow = 0;

        this.dashBoard.buildGridLayout_templateRows('1fr 1fr 1fr');
        this.dashBoard.buildGridLayout_templateColumns('1fr');

        this.payloadContainer = dialogs.addPanel( this.dashBoard , 'cssContainerPanel' , 1,1,1,1, {} );

        this.MQTTContainer    = dialogs.addPanel( this.dashBoard , 'cssContainerPanel' , 1,2,1,1, {} );
        this.MQTTContainer.buildGridLayout_templateColumns('10em 1fr');
        this.MQTTContainer.buildGridLayout_templateRows('1fr');

        this.archiveContainer = dialogs.addPanel( this.dashBoard , 'cssContainerPanel' , 1,3,1,1, {} );

        
        this.treeContainer.padding = '0em';
        this.treeContainer.borderRadius = 0;
        this.treeContainer.backgroundColor = 'rgb(247, 247, 250)'; 
        this.treeContainer.shadow = 0;
        this.treeContainer.buildGridLayout_templateRows('2em 1fr');
        this.treeContainer.buildGridLayout_templateColumns('1fr');
        
        // Caption des TreeViews...
    var helpContainer = dialogs.addPanel( this.treeContainer , 'cssContainerPanel' , 1,1,1,1, {} );
        helpContainer.margin = 0;
        helpContainer.padding = 0;
        helpContainer.overflow = 'hidden';
        helpContainer.buildGridLayout_templateRows('1fr');
        helpContainer.buildGridLayout_templateColumns('1fr 2em 2em 1px');

        this.treeViewCaption = dialogs.addLabel(helpContainer , '', 1,1,1,1, 'MQTT-Topics' );
        this.treeViewCaption.marginLeft = '0em'
        this.treeViewCaption.backgroundColor = 'rgb(77, 77, 77)';
        this.treeViewCaption.fontSize = '1em';
        this.treeViewCaption.fontWeight = 'bold';
        this.treeViewCaption.color = 'white';
        this.treeViewCaption.textAlign = 'left';
        this.treeViewCaption.setTextIndent('0.7em');

        var btn = new TFButton( helpContainer , 2,1,1,1, {caption:'.'} );
            btn.backgroundColor = 'gray';
            btn.margin = '4px';
            btn.height = '1.5em';
            btn.callBack_onClick = ()=> { this.treeView.toggleCollapse() }


        var btn = new TFButton( helpContainer , 3,1,1,1, {caption:'...'} );
            btn.backgroundColor = 'gray';
            btn.margin = '4px';
            btn.height = '1.5em';
            btn.callBack_onClick = ()=> { this.buildTreeView() }    

        this.treeContainer = dialogs.addPanel( this.treeContainer , 'cssContainerPanel' , 1,2,1,1, {} );
        this.buildTreeView();
}          


buildTreeView()
{
   if(this.treeView!=null) {this.treeView.destroy(); this.treeContainer.innerHTML = '';} 

   var topics = mqttArchive.lsTopics( start_ab_Ebene ); 
       console.log(topics.result);

       if (topics.error) this.treeContainer.innerHTML = 'Fehler beim Abruf der Topics';
       else {
             this.treeView = dialogs.createTreeView( this.treeContainer , topics.result , {} ); 
             // dafür sorgen, dass nur mit nodeID behaftete Nodes farbig hervorgehoben werden...
             this.treeView.forEachNode( null, (node) => {  
                                                         if(node.content.ID_topic) 
                                                         {
                                                           node.backgroundColor='rgba(0, 255, 0, 0.01)'; 
                                                           node.backgroundColor='rgba(0, 255, 0, 0.07)'
                                                         }});

             this.treeView.callBack_onClick = (node) => {if(node.content.ID_topic) 
                                                            {
                                                               this.showLastPayloads( node.content.ID_topic )
                                                               this.showMQTTValue( node.content.ID_topic , node.content.topic );
                                                               this.showMQTchart( node.content.ID_topic , node.content.topic );
                                                               this.showArchive( node.content.ID_topic , node.content.topic );
                                                            };
                                                        }   
       } 
}


showLastPayloads( ID_topic , topic)
{ 
    this.payloadContainer.innerHTML = '';
   
    this.payloadContainer.buildGridLayout_templateColumns('1fr');   
    this.payloadContainer.buildGridLayout_templateRows('2em 1fr');  

    var payloadTableCaption = dialogs.addLabel( this.payloadContainer , '' , 1,1,1,1 , '' );
        payloadTableCaption.backgroundColor = 'rgb(12, 5, 70)';
        payloadTableCaption.color = 'white';
        payloadTableCaption.fontSize = '1em';
        payloadTableCaption.fontWeight = 'bold';
        payloadTableCaption.margin = '0';

    var payloadTable        = dialogs.addPanel( this.payloadContainer , 'cssContainerPanel' , 1,2,1,1, {} );
        payloadTable.margin = '0';

    var response = mqttArchive.lastpayload( ID_topic );
    if(response.error)
    {
        payloadTable.innerHTML = 'Fehler beim Abruf der Payloads';
        return;
    } 
    
    var dt = new TFDateTime(response.result.timestamp);  
    
    payloadTableCaption.caption = 'letzter Datenempfang: ' + dt.formatDateTime('dd.mm.yyyy hh:mn:ss');
    this.dataSheet = dialogs.createTable( payloadTable , response.result.fields ,  ['timestamp'] , {} );
    
}


showMQTTValue( ID_topic , topic  )
{
    this.MQTTValuePanel = new TFMQTTPanel( this.MQTTContainer  , 1,1,1,1, {
        distributor            : this.mqttDistributor , 
        topic                  : topic,
        backgroundColor        : 'white',
        captionBackgroundColor : 'gray',
        valueColor             : 'green',
        fontSize               : '1em',
        value                  : 'value',
        caption                : 'name',
        appendix               : 'unit'
        } );
}



showMQTchart( ID_topic , topic )
{
   new TFMQTTChart( this.MQTTContainer , 2,1,'100%','100%', {
                                                  distributor            : this.mqttDistributor, 
                                                  topic                  : topic,
                                                  captionBackgroundColor : 'gray',
                                                  value                  : 'value',
                                                  caption                : 'name'
                                                })
}



showArchive( ID_topic , topic )    
{
    this.archiveContainer.innerHTML = '';

    var response = mqttArchive.getValues( ID_topic , null , null , 'avg' );
    if(response.error)
    {
        this.archiveContainer.innerHTML = 'Fehler beim Abruf der Archive';
        return;
    } 

    var chartData = [];
    for(var i=0; i<response.result.length; i++) chartData.push({x:response.result[i].xlsTimestamp, y:response.result[i].value_avg });

    this.arcChart = new TFChart( this.archiveContainer, 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'Spline'} );
    this.arcSeries = this.arcChart.addSeries( topic , 'green' );                                         
    this.arcChart.addPoint(this.arcSeries , chartData);
    
}








}