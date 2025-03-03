

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import {TChanelDlg}      from "./chanelDlg.js";


export class TdeviceChanelsDlg 
{
  constructor( device ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newDevice  = false;
      this.dashboard  = null;
      this.chanelGrid = null;
      this.callBack_onDialogComplete = null;
      
      this.device         = device;
      this.selectedChanel = null;

      this.dlgWnd = dialogs.createWindow( null , "Kanäle je Gerät" , "50%" , "77%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("10em 3.4em 1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,1,1,1);
          head.backgroundColor = "white"

      var btnPanel = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,2,1,1);
          btnPanel.backgroundColor = "gray"

      this.dashboard = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,3,1,1); 
    


      btnPanel.buildGridLayout_templateColumns("10em 1em 10em 1em 10em")
      btnPanel.buildGridLayout_templateRows("1fr");
      var btn_AddChanel              = dialogs.addButton( btnPanel , "" , 1 , 1 , 1 , 1 , "neuer Kanal"  );
      btn_AddChanel.heightPx         = 35;
      btn_AddChanel.callBack_onClick = function() { 
                                                    var dlg = new TChanelDlg();
                                                        dlg.callBack_onDialogComplete = (chanel)=>{ this.chanels.unshift(chanel); this.updateChanelGrid(); }
                                                 }.bind(this)

      var btn_EditChanel              = dialogs.addButton( btnPanel , "" , 3 , 1 , 1 , 1 , "Kanal bearbeiten"  );
      btn_EditChanel.heightPx         = 35;
      btn_EditChanel.callBack_onClick = function() {
                                                     if(this.selectedChanel==null){ dialogs.showMessage("Bitte zuerst einen Kanal auswählen !"); return; }
                                                     var dlg = new TChanelDlg(this.selectedChanel);
                                                         dlg.callBack_onDialogComplete = (chanel)=>{ this.updateChanelGrid(); }
                                                   }.bind(this)


       var btn_DeleteChanel               = dialogs.addButton( btnPanel , "cssAbortBtn01" , 5 , 1 , 1 , 1 , "Kanal löschen"  );
       btn_DeleteChanel.heightPx          = 35;
       btn_DeleteChanel.callBack_onClick  = function() { 
                                                      // if(selectedDevice==null){ dialogs.showMessage("Bitte zuerst einen Datensatz auswählen !"); return; }
                                                      // new TFMQTTExplorer (ws.handle , mqttDistributor , '70%','80%' );                                            
                                                     }.bind(this) 
    this.loadChanels();
    this.updateChanelGrid();
  }



loadChanels()
{
   var response = utils.webApiRequest("LOADCHANELS" , {ID_Device:this.device.ID} );

   if(response.error) 
    {
        dialogs.showMessage("Fehler beim Abrufen der Kanal-Liste. Fehlermeldung: " + response.errMsg);
        return;
    } 

    this.chanels        = response.result;
    this.selectedChanel = null;
}



updateChanelGrid( )
{
   this.dashboard.innerHTML = "";
   this.chanelGrid = dialogs.createTable( this.dashboard , this.chanels , 
                                                          ["ID","ID_Device"]  // exclude
                                                        , {BESCHREIBUNG:"Beschreibung",
                                                           TYP:"Kanal-Typ"
                                                          } // translation
                                   );

    this.chanelGrid.onRowClick = ( selectedRow , itemIndex , chanelRecord )=>{this.selectedChanel = this.chanels[itemIndex] }                               
    
}


}  