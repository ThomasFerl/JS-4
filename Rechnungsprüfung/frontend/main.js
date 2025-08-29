
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
         TFWorkSpace,
         TFLoader }      from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";
import {TFgui}           from "./tfWebApp/tfGUI.js";


var caption1     = '';
var caption2     = '';
var guiMainWnd   = null;
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


export async function run()
{ 
  var ws       = app.startWebApp(caption1,caption2).activeWorkspace;
  const loader = new TFLoader({ title: "lade Daten …" , note:"hab's gleich geschafft ..." });

// Splashscreen 5s anzeigen
await loader.while(TFLoader.wait(1000))


guiMainWnd = new TFgui( ws.handle , 'rechnungspruefungMain' );
guiMainWnd.btnNewBill.callBack_onClick = newBill;
updateView();

} 


function updateView()
{
  guiMainWnd.gridPanel.innerHTML = '';

  // alle Archiv-Einträge lesen...
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from billArchive"})
  
  var table    = dialogs.createTable( guiMainWnd.gridPanel , response.result , '' , ''); 
      table.onRowDblClick = function( selectedRow , itemIndex , rowData ) {
          // Handle double-click on table row
          // dialogs.showMessage("Row double-clicked: " + JSON.stringify(rowData));
          showReports(rowData)
      };
}
  

function newBill()
{
  lastInsertID       = 0;
   var dlg           = dialogs.createWindow(null,caption1,'50%','70%','CENTER');
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

   guiNewBillDlg.btnAbort.callBack_onClick = function() {this.close()}.bind(dlg) 

}
    

function showReports( data )
{
   var dlg           = dialogs.createWindow(null,caption1,'100%','100%','CENTER');
   var guiNewBillDlg = new TFgui( dlg.hWnd , 'rechnungspruefungAuswertung' );
   var tableName     = data.TABLENAME;

   //  Die Liste der möglichen Reports....
   var select        = guiNewBillDlg.selectReport; // besseres handling
       select.addItem('Rohdaten anzeigen' , 'RAW');

   var response      = utils.webApiRequest( 'FETCHRECORDS' , {sql:'Select ID ,  REPORTNAME from reports order by REPORTNAME'});
   if(!response.error) 
    for(var i=0; i<response.result.length; i++) select.addItem( response.result[i].REPORTNAME , response.result[i].ID );     
 
   select.callBack_onChange = function( v ) {                                               
                                             runReport( this.data , this.container , v ); 

                                            }.bind({data:data, container:guiNewBillDlg.gridContainer});


// Button: neuen Report erzeugen ...
guiNewBillDlg.btnAddReport.callBack_onClick = function(){ editReport(tableName ) }


// Button: Report bearbeiten ...
guiNewBillDlg.btnEditReport.callBack_onClick = function(){ editReport(tableName) }


// Button Report löschen ...
guiNewBillDlg.btnDeleteReport.callBack_onClick = function(){ deleteReport() }


// per Default erstmal die Roh-Daten anzeigen ...
runReport(data, guiNewBillDlg.gridContainer , 'RAW' );
}


function runReport( data , container , mode )
{
  var sql             = '';
  container.innerHTML = '';
  var tn              = data.TABLENAME;
  var komma           = ' ';

  if(!isNaN(mode))  // Wenn NUMERISCH dann als ID des Reports interpretieren ....
  {
    var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+mode })
    if(response.error) 
    {
      dialogs.showMessage(response.errMsg);
      return;
    }
     
    var groupFields = JSON.parse(response.result.GROUPFIELDS);
    var sumFields   = JSON.parse(response.result.SUMFIELDS);
    
    sql = 'select count(*) as ANZAHL';
    for(var i=0; i<groupFields.length;i++) sql = sql + ', ' + groupFields[i]
  
     if(groupFields.length==0) komma = ' ';
     else                      komma = ', ';

     for(var i=0; i<sumFields.length;i++)
      {
        if(i>0) komma=', ';
         sql = sql + komma + 'SUM(' + sumFields[i]+') as ' + sumFields[i]
      }
      
    sql = sql + ' from ' + tn;
    
    if(groupFields.length>0)
    {
      sql   = sql + ' GROUP BY ';
      komma = ' ';
       for(var i=0; i<groupFields.length;i++)
       {
         if(i>0) komma=', ';
         sql = sql + komma + groupFields[i];
       }   
    }  


  } 
  else sql  = "SELECT * FROM " + tn;


  var reportData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (reportData.error) {
           dialogs.showMessage('Fehler beim Laden der Berichte: ' + reportData.errMsg);
           return;
       }

    dialogs.createTable( container , reportData.result ) ;

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
 

// Button: Report bearbeiten ...  ist ID == null -> neuEingabe
function editReport( tableName , ID ) 
{
  var dlg               = dialogs.createWindow(null,caption1,'50%','70%','CENTER');
  var guiDefineReport   = new TFgui( dlg.hWnd , 'reportDefinition' );

  // für einen leichteren Umgang ;-)
  var cbReportKategorie = guiDefineReport.cbReportKategorie;
  var selectDatafield1  = guiDefineReport.selectDatafield1;
  var selectDatafield2  = guiDefineReport.selectDatafield2;
  var lbGroupFields     = guiDefineReport.lbGroupFields;
  var lbSumFields       = guiDefineReport.lbSumFields;
  var btnAbort          = guiDefineReport.btnAbort;
  var btnOk             = guiDefineReport.btnOk;
 
  // kleiner Trick - bindet die ID ans GUI, so dass später beim 'save' entschieden werden kann ob INSERT oder UPDATE .... 
  if(ID) guiDefineReport.___ID = ID;
  
  // Combobox mit Kategirien befüllen...
  var response      = utils.webApiRequest( 'FETCHRECORDS' , {sql:"Select Distinct KATEGORIE from reports Order by KATEGORIE"} );
  if(!response.error)
    {
      var items = [];
      for(var i=0; i<response.result.length;i++) items.push(response.result[i].KATEGORIE)
      cbReportKategorie.items = items;
    }

 // datafield-Selection mit Datenfeldern der akt. Tabelle beestücken ...
 var dataFields = ___getFieldNames(tableName)

 selectDatafield1.setItems( dataFields );
 selectDatafield2.setItems( dataFields );

// Button zum Listboxen bestücken....
guiDefineReport.btnAddToGroup.callBack_onClick = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield1 , listBox:lbGroupFields })
guiDefineReport.btnAddToSum.callBack_onClick   = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield2 , listBox:lbSumFields })

// Button zum entfernen der Listbox-Einträge ....
guiDefineReport.btnDelFromGroup.callBack_onClick = function() { ___removeField(this.listBox) }.bind({listBox:lbGroupFields })
guiDefineReport.btnDelFromSum.callBack_onClick   = function() { ___removeField(this.listBox) }.bind({listBox:lbSumFields })

// Button zum Abbruch ...
btnAbort.callBack_onClick = function(){this.close()}.bind(dlg);

// button zum Speichern ...
btnOk.callBack_onClick = function(){ ___saveReport(this.dlgWnd , this.gui)}.bind({dlgWnd:dlg, gui:guiDefineReport})

}


// Button Report löschen ...
function deleteReport() 
{}




// Hilfsfunktionen

function ___getFieldNames(tableName)
{
  var result   = [];
  var response = utils.webApiRequest('STRUCTURE' , {tableName:tableName})

  if (response.error) return result;

  for (var i=0; i<response.result.length; i++) result.push(response.result[i].name)

  return result;  
}  


function  ___addField( value , listBox )
{
  listBox.addItem( {value:value, caption:value} , true );
}


function ___removeField( listBox ) 
{
   var selectedItems = listBox.selectedItems;
   for(var i=0; i<selectedItems.length; i++) listBox.removeItem( selectedItems[i] );
}


function  ___saveReport( dlgWnd , gui)
{ 
  var record = {};
      record.REPORTNAME  = gui.editReportName.value;
      record.KATEGORIE   = gui.cbReportKategorie.value;
      record.GROUPFIELDS = JSON.stringify(gui.lbGroupFields.getItems('value'));
      record.SUMFIELDS   = JSON.stringify(gui.lbSumFields.getItems('value'));

      if (gui.___ID == '') utils.insertIntoTable('reports',record)
      else                 utils.updateTable('report' , 'ID' , gui.___ID , record );  

   dlgWnd.close(); 
}
