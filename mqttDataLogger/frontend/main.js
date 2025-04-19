

import { TFWorkSpace    }   from "./tfWebApp/tfObjects.js";
import { TFDistributor  }   from "./tfWebApp/tfMQTT.js";
import { TFMQTTExplorer }   from "./tfMQTTExplorer.js";
import * as utils           from "./tfWebApp/utils.js";    
import * as dialogs         from "./tfWebApp/tfDialogs.js";    
import {TdeviceDlg      }   from "./deviceDlg.js";
import {TFDataViewer    }   from "./dataViewer.js";


var mqttDistributor =  new TFDistributor( 'mqtt://10.102.13.99:4701' );     // Verbindung zum Broker herstellen

mqttDistributor.addSubscriber("$newDevice" , ()=>{dialogs.showMessage("new device")})


var head            = null;
var dashBoard       = null;
var deviceGrid      = null;
var devices         = [];
var selectedDevice  = null;

export function main(capt1,capt2)
{
    var ws  = new TFWorkSpace('mainWS' , capt1,capt2 );
   
    //build GUI
    var l          = dialogs.setLayout( ws.handle , {gridCount:27,head:2} )
    head           = l.head;
    dashBoard      = l.dashBoard; 

    head.buildGridLayout_templateColumns('10em 1em 10em 1em 10em 1em 10em 1fr 10em');
    head.buildGridLayout_templateRows   ('1fr 1fr');

    var btn_AddDevice              = dialogs.addButton( head , "" , 1 , 2 , 1 , 1 , "neues Gerät"  );
    btn_AddDevice.heightPx         = 35;
    btn_AddDevice.callBack_onClick = function() { 
                                                  var dlg = new TdeviceDlg();
                                                      dlg.callBack_onDialogComplete = (device)=>{ devices.unshift(device); updateDeviceGrid(); }
                                                 }

    var btn_EditDevice              = dialogs.addButton( head , "" , 3 , 2 , 1 , 1 , "Gerät bearbeiten"  );
    btn_EditDevice.heightPx         = 35;
    btn_EditDevice.callBack_onClick = function() { 
                                                   if(selectedDevice==null){ dialogs.showMessage("Bitte zuerst einen Datensatz auswählen !"); return; }
                                                      var dlg = new TdeviceDlg(selectedDevice);
                                                          dlg.callBack_onDialogComplete = (device)=>{ updateDeviceGrid(); }
                                                 }


     var btn_exploreDevice              = dialogs.addButton( head , "" , 5 , 2 , 1 , 1 , "Explorer"  );
     btn_exploreDevice.heightPx         = 35;
     btn_exploreDevice.callBack_onClick = function() { 
                                                       if(selectedDevice==null){ dialogs.showMessage("Bitte zuerst einen Datensatz auswählen !"); return; }
                                                       new TFMQTTExplorer (ws.handle , mqttDistributor , '70%','80%' );                                            
                                                     }  


    var btn_sync                        = dialogs.addButton( head , "" , 9 , 2 , 1 , 1 , "synchronisieren"  );
    btn_sync.heightPx                   = 35;
    btn_sync.backgroundColor            = "gray";
    btn_sync.callBack_onClick           = function() { 
                                                      utils.webApiRequest('SYNC',{})                               
                                                     }                                                   

    loadDevices();
    updateDeviceGrid();
}



function loadDevices()
{
   var response = utils.webApiRequest("LOADDEVICES" , {} );

   if(response.error) 
    {
        dialogs.showMessage("Fehler beim Abrufen der Geräteliste. Fehlermeldung: " + response.errMsg);
        return;
    } 

    devices        = response.result;
    selectedDevice = null;
}



function updateDeviceGrid( )
{
   dashBoard.innerHTML = "";
   deviceGrid = dialogs.createTable( dashBoard , devices , 
                                                          ["ID","MAC","Pix1","Pix2","Pix3","EMF","GPS"]  // exclude
                                                        , {BEZEICHNUNG:"Bezeichnung",
                                                           TYP:"Geräte-Typ",
                                                           SERIENNUMMER:"Serien-Nr.",
                                                           IP:"IP-Adresse",
                                                           STANDORT:"Standort",
                                                           BEMERKUNGEN:"Bemerkungen" } // translation
                                   );

    deviceGrid.onRowClick    = ( selectedRow , itemIndex , deviceRecord )=>{ selectedDevice = devices[itemIndex] }   
    deviceGrid.onRowDblClick = ( selectedRow , itemIndex , deviceRecord )=>{ new TFDataViewer(devices[itemIndex] ) }                               
    
}



// https://www.google.com/maps/@51.8857346,11.6943251,13z/data=!3m1!1e3?entry=ttu