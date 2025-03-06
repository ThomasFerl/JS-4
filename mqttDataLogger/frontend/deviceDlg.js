

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




const __anlagenSchluessel = 
    [
        { TH: "Wärmeversorgungsanlagen (Heizung)" },
        { TC: "Automatisierungstechnische Anlagen (z.B. ISP's)" },
        { TD: "Datentechnische Anlagen (DDC, PMC, HIMA)" },
        { TE: "Elektrotechnische Anlagen" },
        { TF: "Fernmelde-, Informations- und Medienanlagen" },
        { TG: "Brennstoffversorgungsanlagen" },
        { TJ: "Förderanlagen (Aufzug)" },
        { TK: "Kältetechnische Anlagen" },
        { TL: "Raumlufttechnische Anlagen (Lüftung)" },
        { TM: "Medien- und Betriebsstoffversorgungsanlagen" },
        { TN: "Nutzungsspezifische Anlagen" },
        { TP: "Feuerlöschanlagen" },
        { TQ: "Küchentechnische Anlagen" },
        { TR: "Raumregelung" },
        { TS: "Wasserversorgungsanlagen (Sanitär)" },
        { TT: "Abwasseranlagen (Abwasser)" },
        { TU: "Entsorgungsanlagen (z.B. Müllpressen)" },
        { TY: "sonstige Anlagen" }
    ];
      
    
    function getItem(jsnArray , ndx)
    {
      var r={short:"",long:""};
        if(ndx >jsnArray.length) return r;

       var h= jsnArray[ndx];
       for(var key in h) r={short:key,long:h[key]}
       return r;
    }


    function findIndex( jsnArray , short) 
    {
      for(var i=0; i<jsnArray.length; i++) 
        if(getItem(jsnArray,i).short==short) return i;
      
      return -1;
    }


    function getStrList( jsnArray )
    {
        var r=[];
        for(var i=0; i<jsnArray.length; i++) r.push(getItem(jsnArray,i).long)
        return r;
    }    
    





export class TdeviceDlg 
{
  constructor( device ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newDevice  = false;
      this.callBack_onDialogComplete = null;
      this.callBack_onDialogAbort    = null;

      var chnDlg = null;

      if(device != null) this.device = device;
      else {
             this.newDevice = true;
             var response   = utils.webApiRequest('schema' , {tableName:"devices"} );
             if (response.error) 
             {
                dialogs.showMessage("");
                this.error      = false;
                this.errMsg     = response.errMsg;
                return;
             }
             this.device = {};
             for(var i=0; i<response.result.length; i++) this.device[response.result[i].fieldName] = response.result[i].defaultValue || "";
      }

      var availeableTopics = [];

      if(this.newDevice)
      {  
        var r = utils.webApiRequest('availeableTopics' , {} );
        for(var i=0; i<r.result.length; i++) availeableTopics.push(r.result[i].descr)
      }      
      
      var cpt = this.newDevice ? "neues Gerät hinzufügen" : "Gerät bearbeiten";
          
      this.dlgWnd = dialogs.createWindow( null , cpt , "50%" , "87%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("2em,1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,1,1,1);
          head.buildGridLayout_templateRows("1fr");
          head.buildGridLayout_templateColumns("1fr 10em");
          dialogs.addLabel(head,"",1,1,1,1,"Bitte die Parameter der Mess-Station eingeben !")
      var chanBtn = dialogs.addButton(head,'',2,1,1,1,'Kanäle...') ;  
          chanBtn.backgroundColor = "gray";   
          chanBtn.callBack_onClick = ()=>{
                                           if(this.device != null) chnDlg = new TdeviceChanelsDlg(this.device)
                                           else dialogs.showMessage('Es muss zuerst das Gerät definiert werden !'); 
                                        }

      var body = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,2,1,1); 


      this.form   = new TForm( body, 
                               this.device , 
                               {BEZEICHNUNG:"Bezeichnung",
                                TYP:"Geräte-Typ",
                                SERIENNUMMER:"Serien-Nr.",
                                IP:"IP-Adresse",
                                STANDORT:"Standort",
                                AnlagenSchluessel:"Anlagen-Schlüssel",
                                BEMERKUNGEN:"Bemerkungen" } ,   // Labels
                               {} ,                             // Appendix
                               ["ID","MAC","Pix1",
                                 "Pix2","Pix3","EMF","GPS"] ,  // Exclude
                               {} ,                             // InpType
                               '' );

      this.form.setInputType("TYP"                , "select" , {items:["","Tixi","Wago","Neuberger","EMess","sonstiges"]} );
      this.form.setInputType("TOPIC"              , "select" , {items:availeableTopics} );
      this.form.setInputType("AnlagenSchluessel"  , "select" , {items:getStrList(__anlagenSchluessel)} );
     
      this.form.render(true);
      
      // ItemIndex der Combobox auf aktuellen Wert setzen...
      this.form.getControlByName("AnlagenSchluessel").editControl.itemIndex = findIndex( __anlagenSchluessel , this.device.AnlagenSchluessel )
       



      this.form.callBack_onOKBtn  = this.saveDevice.bind(this);
      this.form.callBack_onESCBtn = function () {this.dlgWnd.destroy() ; if(this.callBack_onDialogAbort!=null) this.callBack_onDialogAbort() }.bind(this);
  }




  saveDevice( deviceData )
  {
    /* daten kommen in der Form: [{"field":"ID","value":""},
                                  {"field":"BEZEICHNUNG","value":""},
                                  {"field":"TYP","value":"Tixi"}, .... {}]

       Daten in this.device speichern ...                           
    */
    for(var i=0; i<deviceData.length; i++)
    if(this.device.hasOwnProperty(deviceData[i].field)) this.device[deviceData[i].field] = deviceData[i].value;
    this.dlgWnd.destroy();

    // Combobox auslesen und via ItemIndex auf Anlagenschlüssel zugreifen: 
    // Ziel: Übersetzung von Beschreibung zu short-Name des Schlüssels...
    var ndx = this.form.getControlByName("AnlagenSchluessel").editControl.itemIndex;
    if (ndx>=0) this.device.AnlagenSchluessel = getItem(__anlagenSchluessel , ndx).short;

    if(this.newDevice) var response = utils.webApiRequest("NEWDEVICE",{fields:this.device})
    else               var response = utils.webApiRequest("UPDATEDEVICE",{fields:this.device,idField:"ID",idValue:this.device.ID})     

    console.log(JSON.stringify(response));

    if(response.err) 
    {
        dialogs.showMessage("Fehler beim Speichern des Gerätes. Fehlermeldung: " + response.errMsg);
        this.error = true;
        this.errMsg = response.errMsg;
        return;
    }                                                                             
    
    if(this.newDevice) this.device.ID = response.result.lastInsertRowid;

    if(this.callBack_onDialogComplete!=null) this.callBack_onDialogComplete( this.device )
  }

  
}  