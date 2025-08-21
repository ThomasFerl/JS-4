
import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";


// Anwendungsspezifische Einbindungen
import { TFEdit, 
         TForm,
         TFPopUpMenu,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";
import {TFgui}           from "./tfWebApp/tfGUI.js";


var caption1    = '';
var caption2    = '';
var guiMainWnd  = null;
var waitOnStart = null;


export function main(capt1)
{
  caption1 = capt1;
  caption2 = '';
  
  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'Berechtigungen' , action:function(){sysadmin.adminGrants()} } );
  globals.sysMenu.push( {caption:'Info' , action:function(){app.sysInfo()} } );
  globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)' , action:function(){app.APItest()} } );
  globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
  globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)' , action:function(){app.guiBuilder()} } );
  globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() });
  
}  


export function run()
{ 
  var ws      = app.startWebApp(caption1,caption2).activeWorkspace;

  waitOnStart = dialogs.createWindow(ws.handle,'Rechnungsprüfung ...','25%','25%','CENTER');
  waitOnStart.hWnd.buildGridLayout_templateColumns('0.5fr 1fr 0.5fr');
  waitOnStart.hWnd.buildGridLayout_templateRows   ('1fr 1fr 1fr');
  dialogs.addLabel(waitOnStart.hWnd,'',2,2,1,1,'Anwendung wird geladen ...');

  setTimeout(()=>{
                   waitOnStart.close();
                   guiMainWnd = new TFgui( ws.handle , 'rechnungspruefungMain' );
                   guiMainWnd.btnNewBill.callBack_onClick = newBill;
                 } , 4000 )  
} 


function updateView()
{
  dialogs.createTable( guiMainWnd.gridPanel , [{Name:"Ferl",Vorname:"Thomas",gebDatum:"29.10.1966"},
                                                   {Name:"Mustermann",Vorname:"Max",gebDatum:"01.01.2000"},
                                                   {Name:"Schmidt",Vorname:"Klaus",gebDatum:"15.03.1975"}] , '' , ''); 
}
  

function newBill()
{
   var dlg           = dialogs.createWindow(null,'neue Rechnung erfassen','50%','70%','CENTER');
   var guiNewBillDlg = new TFgui( dlg.hWnd , 'addBillDlg' );
   dialogs.addFileUploader( guiNewBillDlg.dropZone , '*.*' , true , 'testUpload' , (selectedFiles) => {dialogs.showMessage(JSON.stringify(selectedFiles))}  );
   updateView();
}
    
 

