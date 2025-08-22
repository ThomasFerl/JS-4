
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


var caption1     = '';
var caption2     = '';
var guiMainWnd   = null;
var waitOnStart  = null;
var lastInsertID = 0;


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
                   updateView();
                 } , 4000 )  
} 


function updateView()
{
  guiMainWnd.gridPanel.innerHTML = '';

  // alle Archiv-Einträge lesen...
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from billArchive"})
  
  dialogs.createTable( guiMainWnd.gridPanel , response.result , '' , ''); 
}
  

function newBill()
{
  lastInsertID       = 0;
   var dlg           = dialogs.createWindow(null,'neue Rechnung erfassen','50%','70%','CENTER');
   var guiNewBillDlg = new TFgui( dlg.hWnd , 'addBillDlg' );
   dialogs.addFileUploader( guiNewBillDlg.dropZone , '*.*' , true , 'testUpload' , function(selectedFiles) {processUploadFiles(selectedFiles , this.dropZone , this.dlgWnd )}.bind({dropZone: guiNewBillDlg.dropZone , dlgWnd:dlg}) );

   guiNewBillDlg.btnOk.callBack_onClick = function() {
                                                       if(lastInsertID==0) {dialogs.showMessage("Bitte erst eine Excel-Datei hochladen !");return;}
                                                       var bez = this.bezeichnung;
                                                       var id  = lastInsertID;
                                                       utils.webApiRequest('UPDATETABLE',{tableName:"billArchive",ID_field:'ID', ID_Value:id, fields:{DESCRIPTION1:bez}})
                                                       updateView();
                                                       this.dlg.close();
                                                       }.bind({bezeichnung:guiNewBillDlg.editBezeichnung.value, dlg:dlg})

}
    

function processUploadFiles( files , dropZone , dlgWnd )
{
  if(files.error) 
  {
    dialogs.showMessage('Der Upload-Prozess ist gescheitert ! ' + files.errMsg);
    dlgWnd.close();
    return;
  } 

  var response = utils.webApiRequest('processExcelFile' , {excelFile:files.result.savedPath, originalName:files.result.originalName , archiveName:files.result.savedName})

  if (response.error)
  {
     dialogs.showMessage('Fehler beim Upload: ' + response.errMsg);
     dlgWnd.close();
     return;
  }
  else lastInsertID = response.result.lastInsertRowid;

  dropZone.innerHTML = '';
  utils.drawSymbol('circle-check' , dropZone , 'green' , '100%' );
  updateView();

}
 

