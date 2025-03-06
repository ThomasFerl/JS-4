

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }     from "./tfWebApp/tfObjects.js";

import { TFWindow }        from "./tfWebApp/tfWindows.js"; 
import { TFChart }         from "./tfWebApp/tfObjects.js";
import { TFDateTime }      from "./tfWebApp/utils.js";
import {TdeviceChanelsDlg} from "./deviceChanelsDlg.js";



export class TFDataViewer 
{
  constructor( device ) 
  { 
      this.device         = device;
      this.chanels        = [];
      this.selectedChanel = null;
      this.error          = false;
      this.errMsg         = ""; 
      this.mainWnd        =  dialogs.createWindow( null , "DataViewer" , "70%" , "90%" , "CENTER" );
      this.mainWnd.backgroundColor = 'rgb(214,217,221)';

      var l                    = dialogs.setLayout( this.mainWnd.hWnd , {gridCount:27,head:2,left:7} )
          this.head            = l.head;
          this.dashBoard       = l.dashBoard; 
          this.chanelContainer = l.left;
          this.chanelContainer.buildBlockLayout();

      this.dashBoard.buildGridLayout_templateColumns('1fr');
      this.dashBoard.buildGridLayout_templateRows('1fr 1fr');

      this.chartPanel = dialogs.addPanel(this.dashBoard,'cssWhitePanel',1,2,1,1);

      dialogs.addButton(this.head,'',1,1,'10em', '2em','sync').callBack_onClick = ()=>{utils.webApiRequest("SYNC",{})}

      var response = utils.webApiRequest("LOADCHANELS" , {ID_Device:this.device.ID} );
          if(response.error) dialogs.showMessage("Fehler beim Abrufen der Kanal-Liste. Fehlermeldung: " + response.errMsg);
          else this.chanels = response.result;

    this. buildChanelList();      
  }

  

  buildChanelList()
  {
    this.chanelContainer.innerHTML = '';
    
    for(var i=0; i<this.chanels.length; i++)
    {
       var c=this.chanels[i];
       var p=dialogs.addPanel(this.chanelContainer,'cssWhitePanel',1,1,'90%','5em');
       p.buildGridLayout_templateColumns('1fr');
       p.buildGridLayout_templateRows   ('1fr 1fr 1fr');
       p.chanel = c;
       p.callBack_onClick = function(){ this.self.selectChanel(this.chanel)}.bind({self:this,chanel:p.chanel});
       dialogs.addLabel(p,'',1,1,1,1,c.NAME).fontWeight = 'bold';
       dialogs.addLabel(p,'',1,2,1,1,c.BESCHREIBUNG);
       dialogs.addLabel(p,'',1,3,1,1,c.InfoPktName).color = 'gray';
    }    
  }


selectChanel( c )
{
   this.selectedChanel = c;

   this.chartPanel.innerHTML = '';

    var response = utils.webApiRequest( 'GETVALUES' , {ID_Chanel:c.ID} );

    if(response.error)
    {
        this.chartPanel.innerHTML = 'Fehler beim Abruf der Archive: ' + response.errMsg;
        return;
    } 

    var chartData = [];
    for(var i=0; i<response.result.length; i++) chartData.push({x:response.result[i].DT, y:response.result[i].Wert });

    this.arcChart = new TFChart( this.chartPanel , 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'Spline'} );
    this.arcSeries = this.arcChart.addSeries( c.NAME , 'green' );                                         
    this.arcChart.addPoint(this.arcSeries , chartData);
    
}






}


   