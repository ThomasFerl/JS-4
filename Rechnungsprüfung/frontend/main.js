
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
import { TFgui }         from "./tfWebApp/tfGUI.js";
import { TFDataObject }  from "./tfWebApp/tfDbObjects.js";



var caption1           = '';
var caption2           = '';
var guiMainWnd         = null;

var lastInsertID       = 0;          // der letzte importierte Rechnungs-Datensatz
var lastSelectedNdx    = -1;         // die zuletzt ausgewählte Rechnung
var gridReportResults  = null;       // das Grid, in welchem der aktuelle Report dargestellt wird
var selectedReport     = '';         // der akuell ausgewählte Report ...
var selectedTable      = '';

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


guiMainWnd = new TFgui( null , 'rechnungspruefungMain' );
guiMainWnd.btnNewBill.callBack_onClick   = newBill;
updateView();

} 


function updateView()
{
  guiMainWnd.gridPanel.innerHTML = '';

  // alle Archiv-Einträge lesen...
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from billArchive"})
  
  var table    = dialogs.createTable( guiMainWnd.gridPanel , response.result , '' , ''); 
      table.onRowClick = function( selectedRow , itemIndex , rowData ) 
      {
        if(lastSelectedNdx==itemIndex) { showReports(rowData) }
        lastSelectedNdx=itemIndex;
         
      };
}
  

function newBill()
{ 
  lastInsertID      = 0;
  var guiNewBillDlg = new TFgui( null , 'addBillDlg' );
   dialogs.addFileUploader( guiNewBillDlg.dropZone , '*.*' , true , 'testUpload' , function(selectedFiles) {processUploadFiles(selectedFiles , this.dropZone , this.gui )}.bind({dropZone: guiNewBillDlg.dropZone , gui:guiNewBillDlg}) );

   guiNewBillDlg.btnOk.callBack_onClick = function() {
                                                       if(lastInsertID==0) {dialogs.showMessage("Bitte erst eine Excel-Datei hochladen !");return;}
                                                       var bez = this.bezeichnung;
                                                       var id  = lastInsertID;
                                                       utils.webApiRequest('UPDATETABLE',{tableName:"billArchive",ID_field:'ID', ID_Value:id, fields:{DESCRIPTION1:bez}})
                                                       updateView();
                                                       this.gui.close();
                                                       }.bind({bezeichnung:guiNewBillDlg.editBezeichnung.value, gui:guiNewBillDlg})

   guiNewBillDlg.btnAbort.callBack_onClick = function() {this.gui.close()}.bind({gui:guiNewBillDlg}) 

}
    

function showReports( data )
{
   var guiNewBillDlg = new TFgui( null , 'rechnungspruefungAuswertung' );
   selectedTable     = data.TABLENAME;

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
guiNewBillDlg.btnAddReport.callBack_onClick = function(){ editReport(this.tableName ) }.bind({tableName:selectedTable})


// Button: Report bearbeiten ...
guiNewBillDlg.btnEditReport.callBack_onClick = function(){ editReport(this.tableName) }.bind({tableName:selectedTable})


// Button Report löschen ...
guiNewBillDlg.btnDeleteReport.callBack_onClick = function(){ deleteReport() }

// Button zur Verwaltung der Ausschluss-Liste
guiNewBillDlg.btnBlacklist.callBack_onClick    = function (){ blackList(this.tableName) }.bind({tableName:selectedTable});


// per Default erstmal die Roh-Daten anzeigen ...
runReport(data, guiNewBillDlg.gridContainer , 'RAW' );


guiNewBillDlg.btnExcel.callBack_onClick = function(){ ___excelExport( gridReportResults ) }

}


function runReport( data , container , mode )
// Build SQL-Statement
{
  var sql             = '';
  container.innerHTML = '';
  var tn              = data.TABLENAME;
  var komma           = ' ';
  selectedReport      = mode;

  if(!isNaN(mode))  // Wenn NUMERISCH dann als ID des Reports interpretieren ....
  {
    var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+mode })
    if(response.error) 
    {
      dialogs.showMessage(response.errMsg);
      return;
    }
     
    // aus en beiden Feldern "GroupFields" und "SumFields" das SQL-Statement erstellen...
    var groupFields = JSON.parse(response.result.GROUPFIELDS);
    var sumFields   = JSON.parse(response.result.SUMFIELDS);
    
    sql = 'select count(*) as ANZAHL';
    for(var i=0; i<groupFields.length;i++) sql = sql + ', ' + groupFields[i]
  
     if(groupFields.length==0) komma = ' ';
     else                      komma = ', ';

     for(var i=0; i<sumFields.length;i++)
      {
        if(i>0) komma=', ';
         sql = sql + komma + "SUM( CAST( REPLACE("+sumFields[i]+", '''', '') as REAL)) as " + sumFields[i]
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
    
  sql = sql + ' ORDER BY ANZAHL DESC';  


  } 
  else sql  = "SELECT * FROM " + tn;


  var reportData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (reportData.error) {
           dialogs.showMessage('Fehler beim Laden der Berichte: ' + reportData.errMsg);
           return;
       }

    gridReportResults = dialogs.createTable( container , reportData.result ) ;
    gridReportResults.onRowClick = function( selectedRow , itemIndex , rowData ) 
      {
         detailView( rowData )  
      };
}




function detailView( data )
{
  var w   = dialogs.createWindow(null,'Details', "100%" , "100%" , "CENTER")
  var gui = new TFgui( w , 'rechnungsPruefungReportDetails' , {autoSizeWindow:true} );  // valueContainer & gridContainer
  
  gui.valueContainer.buildFlexBoxLayout();
  gui.valueContainer.overflow        = 'auto';
  gui.valueContainer.flexDirection   = 'column';      /* Elemente von oben nach unten anordnen */
  gui.valueContainer.justifyContent  = 'flex-start'; /* Startpunkt ist oben */
  

  for (var key in data)
  {
    var p = dialogs.addPanel(gui.valueContainer,'cssContainerPanel',1,1,'99%','2em');
        p.backgroundColor = 'white';
        p.margin = '0.49em';
        p.buildGridLayout_templateColumns('1fr 2fr');
        p.buildGridLayout_templateRows('1fr'); 
        dialogs.addLabel(p,'',1,1,1,1,key,{fontWeight:'bold'}).textAlign = 'left';
        dialogs.addLabel(p,'',2,1,1,1,data[key] ).textAlign = 'left';
   }  
   
   // nun ein sql-Statement erstellen, welches die Einzelfälle der Gruppe listet.
   // dazu wird die Tabelle durchsucht nach: select * from Tabelle Where groupField[1]=auspraegung[1] AND groupField[2]=auspraegung[2] ...

   // um zu erfahren, welches für diesen Report die gruppierungsfelder sind, diesen nochmals laden:
   var reportData        = null;  // ist <>null, wenn ein existierender Report bearbeitet werden soll....
   if(selectedReport!='') 
   {
      var response = utils.webApiRequest('fetchRecord',{sql:"Select * from reports Where ID="+selectedReport});
      if(!response.error) reportData = response.result;
    }

    var sql = "select * from " + selectedTable;

    // durchlaufe gruppierungsfelder 
    var grpFields = JSON.parse(reportData.GROUPFIELDS);
    var help      = " where ";
    for(var i=0; i<grpFields.length; i++) 
    {
       if (i>0) help = " and ";
       sql = sql + help + grpFields[i] +  "='" + data[grpFields[i]]+"'" ;
    }  

    var detailData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (detailData.error) {
           dialogs.showMessage('Fehler beim Laden der Details: ' + detailData.errMsg);
           return;
       }

    dialogs.createTable( gui.gridContainer , detailData.result ,['ID','AUSWERTUNG_ZUM'] ) ;

    gui.btnExcel.callBack_onClick = function()
                                    {
                                      utils.POSTrequest('JSN2EXCEL', { worksheetName:'Tabelle1' , data:this.data, excludeFields:[] , fieldTitles:[] } , "download_"+globals.session.userName+"_"+Date.now().toString() );
                                    }.bind({data:detailData.result})
                                    
   
  
}



function processUploadFiles( files , dropZone , gui )
{
  if(files.error) 
  {
    dialogs.showMessage('Der Upload-Prozess ist gescheitert ! ' + files.errMsg);
    gui.close();
    return;
  } 

  var response = utils.webApiRequest('processExcelFile' , {excelFile:files.result.savedPath, originalName:files.result.originalName , archiveName:files.result.savedName})

  if (response.error)
  {
     dialogs.showMessage('Fehler beim Upload: ' + response.errMsg);
     gui.close();
     return;
  }
  else lastInsertID = response.result.lastInsertRowid;

  dropZone.innerHTML = '';
  utils.drawSymbol('circle-check' , dropZone , 'green' , '100%' );
  updateView();

}
 

// Button: Report bearbeiten ...  ist ID == null -> neuEingabe
function editReport( tableName  ) 
{ 
 var guiDefineReport   = new TFgui( null , 'reportDefinition' );

 var reportData        = null;  // ist <>null, wenn ein existierender Report bearbeitet werden soll....
 if(selectedReport!='') 
 {
   var response = utils.webApiRequest('fetchRecord',{sql:"Select * from reports Where ID="+selectedReport});
   if(!response.error) reportData = response.result;
 }

  // für einen leichteren Umgang ;-)
  var editReportName    = guiDefineReport.editReportName;
  var cbReportKategorie = guiDefineReport.cbReportKategorie;
  var selectDatafield1  = guiDefineReport.selectDatafield1;
  var selectDatafield2  = guiDefineReport.selectDatafield2;
  var lbGroupFields     = guiDefineReport.lbGroupFields;
  var lbSumFields       = guiDefineReport.lbSumFields;
  var btnAbort          = guiDefineReport.btnAbort;
  var btnOk             = guiDefineReport.btnOk;
 
    
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

 //  Eingabefelder ggf. bestücken sofern im Editier-Modus
 if(reportData)
 {
    editReportName.value    = reportData.REPORTNAME; 
    cbReportKategorie.value = reportData.KATEGORIE;  

  try {
       var f = JSON.parse(reportData.GROUPFIELDS);
       for (var i=0; i<f.length; i++) lbGroupFields.addItem({caption:f[i],value:f[i]});

           f = JSON.parse(reportData.SUMFIELDS);
       for (var i=0; i<f.length; i++) lbSumFields.addItem({caption:f[i],value:f[i]});
     
   } catch(e) { }; 
 }
 
// Button zum Listboxen bestücken....
guiDefineReport.btnAddToGroup.callBack_onClick = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield1 , listBox:lbGroupFields })
guiDefineReport.btnAddToSum.callBack_onClick   = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield2 , listBox:lbSumFields })

// Button zum entfernen der Listbox-Einträge ....
guiDefineReport.btnDelFromGroup.callBack_onClick = function() { ___removeField(this.listBox) }.bind({listBox:lbGroupFields })
guiDefineReport.btnDelFromSum.callBack_onClick   = function() { ___removeField(this.listBox) }.bind({listBox:lbSumFields })

// Button zum Abbruch ...
btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:guiDefineReport});

// button zum Speichern ...
btnOk.callBack_onClick = function(){ ___saveReport( this.gui)}.bind({gui:guiDefineReport})

}


// Button Report löschen ...
function deleteReport() 
{}


// Button Ausschluss-Liste definieren ....
function blackList( tableName )
{
  var gui   = new TFgui(null,'rechnungspruefungBlacklist');
      gui.selectDatafield.setItems( ___getFieldNames(tableName) );
      gui.selectDatafield.callBack_onChange = function(){ this.gui.editFilter.items = ___getFieldContent(tableName,this.gui.selectDatafield.value)
                                                        }.bind({gui:gui})
      gui.selectOperation.setItems([{caption:'gleich',value:'='} , {caption:'ungleich',value:'<>'} , {caption:'like',value:'like'}]);
      gui.btnAdd.callBack_onClick = function(){this.gui.listBox.addItem(this.gui.selectDatafield.value + this.gui.selectOperation.value + this.gui.editFilter.value , true )}.bind({gui:gui});


  var bList = new TFDataObject('blacklist');

}





// Hilfsfunktionen

function ___getFieldNames(tableName)
{
  var result   = [];
  var response = utils.webApiRequest('STRUCTURE' , {tableName:tableName})

  if (response.error) return result;

  for (var i=0; i<response.result.length; i++) result.push(response.result[i].name)

  return result;  
}  


function ___getFieldContent(tableName,fieldName)
{
  var result   = [];
  var response = utils.webApiRequest('FETCHRecords' , {sql:"Select distinct "+fieldName+" from " + tableName + " Order by " + fieldName})

  if (response.error) return result;

  for (var i=0; i<response.result.length; i++) result.push(response.result[i][fieldName])

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


function  ___saveReport( gui)
{ 
  var record = {};
      record.REPORTNAME  = gui.editReportName.value;
      record.KATEGORIE   = gui.cbReportKategorie.value;
      record.GROUPFIELDS = JSON.stringify(gui.lbGroupFields.getItems('value'));
      record.SUMFIELDS   = JSON.stringify(gui.lbSumFields.getItems('value'));

      if (isNaN(selectedReport)) utils.insertIntoTable('reports',record)
      else                       utils.updateTable    ('reports' , 'ID' , selectedReport , record );  

   gui.close(); 
}


function ___excelExport( grid )
{
  if (grid==null) return;

  var xlsValues = [];
   
  utils.POSTrequest('JSN2EXCEL', { worksheetName:'Tabelle1' , data:grid.jsonData, excludeFields:[] , fieldTitles:[] } , "download_"+globals.session.userName+"_"+Date.now().toString() );
}
  
