

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";




export class TdeviceDlg 
{
  constructor( device ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newDevice  = false;
      this.callBack_onDialogComplete = null;
      this.callBack_onDialogAbort    = null;

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
      
      var cpt = this.newDevice?"neues Gerät hinzufügen":"Gerät bearbeiten";
          
      this.dlgWnd = dialogs.createWindow( null , cpt , "50%" , "77%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("2em,1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,1,1,1);
                 dialogs.addLabel(head,"",1,1,"100%","100%","Bitte die Parameter der Mess-Station eingeben !")
      var body = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,2,1,1); 


      this.form   = new TForm( body, 
                               this.device , 
                               {BEZEICHNUNG:"Bezeichnung",
                                TYP:"Geräte-Typ",
                                SERIENNUMMER:"Serien-Nr.",
                                IP:"IP-Adresse",
                                STANDORT:"Standort",
                                BEMERKUNGEN:"Bemerkungen" } ,   // Labels
                               {} ,                             // Appendix
                               ["ID","MAC","Pix1",
                                 "Pix2","Pix3","EMF","GPS"] ,  // Exclude
                               {} ,                             // InpType
                               '' );

      this.form.setInputType("TYP"   , "select" , {items:["","Tixi","Wago","Neuberger","EMess","sonstiges"]} );
      this.form.setInputType("TOPIC" , "select" , {items:availeableTopics} );
      this.form.render(true);
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

    if(this.newDevice) var response = utils.webApiRequest("NEWDEVICE",{fields:this.device})
    else               var response = utils.webApiRequest("UPDATEDEVICE",{fields:this.device,idField:"ID"})    

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