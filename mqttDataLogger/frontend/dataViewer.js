

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

      this.chartPanel = dialogs.addPanel(this.dashBoard,'cssContainerPanel',1,2,1,1);
      
      var helpPanel   = dialogs.addPanel(this.dashBoard,'cssContainerPanel',1,1,1,1);
      helpPanel.buildGridLayout_templateColumns('1fr 1fr');
      helpPanel.buildGridLayout_templateRows   ('1fr');
      
      this.infoPanel       = dialogs.addPanel(helpPanel,'cssContainerPanel',1,1,1,1);

      var helpPanel2       = dialogs.addPanel(helpPanel,'cssContainerPanel',2,1,1,1);
      helpPanel2.buildGridLayout_templateColumns('1fr');
      helpPanel2.buildGridLayout_templateRows('7em 1fr');
      
      this.hourChartPanel  = dialogs.addPanel(helpPanel2,'cssContainerPanel',1,2,1,1);
      this.lastValuesPanel = dialogs.addPanel(helpPanel2,'',1,1,1,1);
      this.lastValuesPanel.buildGridLayout_templateColumns('1fr');
      this.lastValuesPanel.buildGridLayout_templateRows   ('2em 1fr 1fr');
      this.lastValuesPanel.backgroundColor = 'rgb(212, 248, 248)';
      this.lastValuesPanel.hide();
      //dialogs.addCombobox(this.head,'',1,1,'10em', '2em','sync').callBack_onClick = ()=>{utils.webApiRequest("SYNC",{})}

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
       c.panel  = p;
       p.callBack_onClick = function(){ this.self.selectChanel(this.chanel)}.bind({self:this,chanel:p.chanel});
       dialogs.addLabel(p,'',1,1,1,1,c.NAME).fontWeight = 'bold';
       dialogs.addLabel(p,'',1,2,1,1,c.BESCHREIBUNG);
       dialogs.addLabel(p,'',1,3,1,1,c.InfoPktName).color = 'gray';
    }    
  }


selectChanel( c )
{ debugger;
  // alle Listeneinträge auf weiss setzen
  for(var i=0; i<this.chanels.length; i++) this.chanels[i].panel.backgroundColor = 'white';
     
  // das ausgewählte Element hervorheben
   this.selectedChanel     = c;
   c.panel.backgroundColor = 'rgb(160, 202, 236)';

    // die Chart-Panel leeren
   this.chartPanel.innerHTML = '';

   // info-Panel leeren
    this.infoPanel.innerHTML = '';

    // Detail-Chart-Panel leeren
    this.hourChartPanel.innerHTML  = '';
    this.lastValuesPanel.innerHTML = '';
    this.lastValuesPanel.show();

    // Informationen abrufen... 
    var response = utils.webApiRequest( 'CHANELINFO' , {ID_Chanel:c.ID} );
    if(response.error) 
    {
        this.infoPanel.innerHTML = 'Fehler beim Abruf der Kanal-Informationen: ' + response.errMsg;
        return;
    }

    var infoData = [];
    infoData.push({Bezeichnung:response.result.device.BEZEICHNUNG});
    infoData.push({Typ:response.result.device.TYP});
    infoData.push({Standort:response.result.device.STANDORT});
    infoData.push({Bemerkungen:response.result.device.BEMERKUNGEN});
    infoData.push({PLZ:response.result.device.PLZ});
    infoData.push({Ort:response.result.device.Ort}); 
    infoData.push({Strasse:response.result.device.Strasse + ' ' +response.result.device.HNr});
    infoData.push({MQTTtopic:response.result.device.TOPIC+response.result.chanel.TOPIC});
    infoData.push({SerienNummer:response.result.device.SERIENNUMMER});
    infoData.push({IP_Adresse:response.result.device.IP});
    infoData.push({Messlinie:response.result.chanel.NAME});
    infoData.push({LinienTyp:response.result.chanel.TYP});
    infoData.push({Beschreibung:response.result.chanel.BESCHREIBUNG});
    infoData.push({Infopunkt:response.result.chanel.InfoPktName});

    dialogs.valueList( this.infoPanel , '' , infoData , [] , [] );
    //chanel:chanel,device:device,lastMeasurement:lastMeasurement,firstMeasurement:firstMeasurement}}

    var caption                 = dialogs.addPanel(this.lastValuesPanel,'cssContainerPanel',1,1,1,1);
        caption.marginTop       = 0;
        caption.backgroundColor = 'rgb(3, 4, 61)';
        dialogs.addLabel(caption             ,'',1,1,"100%",'100%','letzter Messwert').color = 'white';
        dialogs.addLabel(this.lastValuesPanel,'',1,2,1,1,response.result.lastMeasurement.Wert + ' ' + response.result.chanel.UNIT ).fontWeight = 'bold';    
    var dt = new TFDateTime(response.result.lastMeasurement.DT);    
        dialogs.addLabel(this.lastValuesPanel,'',1,3,1,1,dt.formatDateTime('dd.mm.yyyy hh:mn')).fontSize='0.75em';


    var response = utils.webApiRequest( 'GETVALUES' , {ID_Chanel:c.ID, resolution:'DAY'} );

    if(response.error)
    {
        this.chartPanel.innerHTML = 'Fehler beim Abruf der Archive: ' + response.errMsg;
        return;
    } 

    var chartData = [];
    for(var i=0; i<response.result.length; i++)
    {
        var dt = new TFDateTime(response.result[i].DT);
        chartData.push({x:dt.formatDateTime('dd.mm.yyyy'), y:response.result[i].Wert });
    }    

    this.arcChart = new TFChart( this.chartPanel , 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'bar'} );
    this.arcSeries = this.arcChart.addSeries( c.NAME , 'rgba(54, 162, 235, 0.2)' );                                         
    this.arcChart.addPoint(this.arcSeries , chartData);
    this.arcChart.onChartClick = function (param){this.updateHourChart(param.selectedLabel)}.bind(this);

    this.updateHourChart( c.ID , response.result[0].DT);
}


updateHourChart(day)
{
  this.hourChartPanel.innerHTML = '';
  
    var dtExcelFormat = new TFDateTime(day).dateTime();
      
    var response = utils.webApiRequest( 'GETVALUES' , {ID_Chanel:this.selectedChanel.ID , resolution:'HOUR' , from:dtExcelFormat , to:dtExcelFormat } );

    if(response.error)
    {
        this.hourChartPanel.innerHTML = 'Fehler beim Abruf der Archive: ' + response.errMsg;
        return;
    } 

    var chartData = [];
    for(var i=0; i<response.result.length; i++)
    {
        var dt = new TFDateTime(response.result[i].DT);
        chartData.push({x:dt.formatDateTime('hh:mn'), y:response.result[i].Wert });
    }    

    this.hourChart = new TFChart( this.hourChartPanel , 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'line'} );
    this.hourSeries = this.hourChart.addSeries( this.selectedChanel.NAME , 'rgba(227, 21, 21, 0.27)' );                                         
    this.hourChart.addPoint(this.hourSeries , chartData);
}




}


   