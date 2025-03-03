

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




export class TChaneDlg 
{
  constructor( chanel ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newChanel  = false;
      this.callBack_onDialogComplete = null;
      this.callBack_onDialogAbort    = null;

      if(chanel != null) this.chanel = chanel
      else {
             this.newChanel = true;
             var response   = utils.webApiRequest('schema' , {tableName:"chanels"} );
             if (response.error) 
             {
                dialogs.showMessage(response.errMsg);
                this.error      = true;
                this.errMsg     = response.errMsg;
                return;
             }
             this.chanel = {};
             for(var i=0; i<response.result.length; i++) this.device[response.result[i].fieldName] = response.result[i].defaultValue || "";
      }

      var availeableTopics = [];

      if(this.newDevice)
      {  
        var r = utils.webApiRequest('availeableTopics' , {} );
        for(var i=0; i<r.result.length; i++) availeableTopics.push(r.result[i].descr)
      }      
      
      var cpt = this.newChanel ? "neuen Kanal hinzufügen" : "Kanal bearbeiten";
          
      this.dlgWnd = dialogs.createWindow( null , cpt , "50%" , "77%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("2em,1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,1,1,1);
          head.buildGridLayout_templateRows("1fr");
          head.buildGridLayout_templateColumns("1fr");  // falls noch ein Button platziert werden muss
          dialogs.addLabel(head,"",1,1,1,1,"Bitte die Parameter des Kanals bearbeiten !")
      
      var body = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,2,1,1); 

      this.form   = new TForm( body, 
                                this.device , 
                               {} ,   // Labels
                               {} ,                             // Appendix
                               ["ID","MAC","Pix1",
                                 "Pix2","Pix3","EMF","GPS"] ,  // Exclude
                               {} ,                             // InpType
                               '' );

      this.form.render(true);
     
  }




  saveDevice( deviceData )
  {
  
  }

  
}  