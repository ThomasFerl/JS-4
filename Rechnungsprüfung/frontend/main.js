
import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";
import * as forms        from "./forms.js";


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

import TFPivotGrid       from "./tfWebApp/pivot.js";




var caption1           = '';
var caption2           = '';
var guiMainWnd         = null;

var lastInsertID       = 0;          // der letzte importierte Rechnungs-Datensatz
var lastSelectedNdx    = -1;         // die zuletzt ausgewählte Rechnung
var gridReportResults  = null;       // das Grid, in welchem der aktuelle Report dargestellt wird

var selectedReport     = '';         // der akuell ausgewählte Report ...
var selectedTable      = '';
var selectedBlackList  = '0';

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
await loader.while(TFLoader.wait(10000))


guiMainWnd = new TFgui( null , forms.rechnungspruefungMain);
guiMainWnd.btnNewBill.callBack_onClick   = newBill;
updateView();

} 


function updateView()
{
  guiMainWnd.gridPanel.innerHTML = '';

  // alle Archiv-Einträge lesen...
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from billArchive"})
  
  var table    = dialogs.createTable( guiMainWnd.gridPanel , response.result ,["ID"  , "ARCPATH" , "TABLENAME"	, "IMPORTED"	,	 "DESCRIPTION2"	, "DESCRIPTION3" ] , {DESCRIPTION2:"Beschreibung",ORGFILENAME:"Datei-Name"}); 
      table.onRowClick = function( selectedRow , itemIndex , rowData ) 
      {
        if(lastSelectedNdx==itemIndex) { showReports(rowData) }
        lastSelectedNdx=itemIndex;
         
      };
}
  

function newBill()
{
  lastInsertID      = 0;
  var gui  = new TFgui( null , forms.addBillDlg );
  var bill = new TFDataObject( "billArchive" );

  gui.dataBinding( bill );

   dialogs.addFileUploader( gui.dropZone , '*.*' , true , 'testUpload' , function(selectedFiles) {processUploadFiles(selectedFiles , this.dropZone , this.gui )}.bind({dropZone: gui.dropZone , gui:gui}) );

   gui.btnOk.callBack_onClick = function() {
                                            if(lastInsertID==0) {dialogs.showMessage("Bitte erst eine Excel-Datei hochladen !");return;}
                                            this.gui.update('data');
                                            this.bill.ID = lastInsertID;
                                            this.bill.update({ignoreEmptyValues:true});
                                            updateView();
                                            this.gui.close();
                                           }.bind({bill:bill, gui:gui})

   gui.btnAbort.callBack_onClick = function() {this.gui.close()}.bind({gui:gui}) 

}
    

function showReports( data )
{
  selectedBlackList  = '0';
  selectedReport     = '0';

   var gui = new TFgui( null , forms.rechnungspruefungAuswertung );
   selectedTable     = data.TABLENAME;

   //  Die Liste der möglichen Reports....
   var select        = gui.selectReport; // besseres handling
       select.addItem('Rohdaten anzeigen' , '0');

   var response      = utils.webApiRequest( 'FETCHRECORDS' , {sql:'Select ID ,  REPORTNAME from reports order by REPORTNAME'});
   if(!response.error) 
    for(var i=0; i<response.result.length; i++) select.addItem( response.result[i].REPORTNAME , response.result[i].ID );     
 
   select.callBack_onChange = function( v ) {                                               
                                              selectedReport = v;
                                              runReport( this.data , this.container ); 
                                            }.bind({data:data, container:gui.gridContainer});

  
  // Blacklist befüllen ...                                          
  var selectBlacklist = gui.selectBlacklist;
      selectBlacklist.addItem( {caption:'---' , value:0} );     
 
  response  = utils.webApiRequest( 'FETCHRECORDS' , {sql:'Select ID ,  BEZEICHNUNG from blacklist order by BEZEICHNUNG'});
  if(!response.error) 
    for(var i=0; i<response.result.length; i++) selectBlacklist.addItem( {caption:response.result[i].BEZEICHNUNG , value:response.result[i].ID} );    
 
   selectBlacklist.callBack_onChange = function( v ) {  
                                             selectedBlackList = v;                                             
                                             runReport( this.data , this.container ); 
                                            }.bind({data:data, container:gui.gridContainer});

// Button zur Verwaltung der Reports
gui.btnAddReport.callBack_onClick = function(){ editReport(this.tableName , null) }.bind({tableName:selectedTable})
gui.btnEditReport.callBack_onClick = function(){ editReport(this.tableName , selectedReport ) }.bind({tableName:selectedTable})
gui.btnDeleteReport.callBack_onClick = function(){ deleteReport( selectedReport ) }

// Button zur Verwaltung der Ausschluss-Liste
gui.btnAddBlacklist.callBack_onClick    = function (){ editBlackList(this.tableName , null) }.bind({tableName:selectedTable});
gui.btnEditBlacklist.callBack_onClick   = function (){ editBlackList(this.tableName , selectedBlackList) }.bind({tableName:selectedTable});
gui.btnDeleteBlacklist.callBack_onClick = function (){ deleteBlacklist(selectedBlackList) };

// per Default erstmal die Roh-Daten anzeigen ...
runReport(data, gui.gridContainer  );


gui.btnExcel.callBack_onClick = function(){ ___excelExport( gridReportResults ) }

}



function runReport_GROUP( data , container  )
{
  var sql             = '';
  container.innerHTML = '';
  var tn              = data.TABLENAME;
  var komma           = ' ';
  var groupFields     = null;
  var sumFields       = null;

  if((selectedReport=="") || (selectedReport=="0"))  sql  = "SELECT * FROM " + tn ; 
  else
  {
    var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+selectedReport })
    if(response.error) 
    {
      dialogs.showMessage("Fehler beim Laden des Reports: " + response.errMsg);
      return;
    }
     
    // aus en beiden Feldern "GroupFields" und "SumFields" das SQL-Statement erstellen...
    groupFields = JSON.parse(response.result.GROUPFIELDS);
    sumFields   = JSON.parse(response.result.SUMFIELDS);
    
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
  } 

  // ist excluse-Liste (blackkList) definiert ?
  if((selectedBlackList!="") && (selectedBlackList!="0"))
  { 
       var blackList = new TFDataObject('blacklist');
           blackList.load(selectedBlackList);
       var entrys    = JSON.parse(blackList.IDENTIFY); 
       // gibt es Filter ?
       var where = ' where ';
       if(entrys.length>0)
       for(var i=0; i<entrys.length; i++)
       {
         var filter = entrys[i];
         filter     = filter.replace('\"', "'");
         filter     = filter.replace('\"', "'");
         filter     = filter.replace('"', "'");

         if(i>0) where = ' and ';
       
         sql = sql + where + filter; 
       } 
  }  

  if(groupFields)
  {
      sql   = sql + ' GROUP BY ';
      komma = ' ';
       for(var i=0; i<groupFields.length;i++)
       {
         if(i>0) komma=', ';
         sql = sql + komma + groupFields[i];
       }   
       sql = sql + ' ORDER BY ANZAHL DESC';  
  } 
  

  var reportData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (reportData.error) {
           dialogs.showMessage('Das folgende SQL-Statement '+sql+' generiert den Fehler: ' + reportData.errMsg);
           return;
       }

    gridReportResults = dialogs.createTable( container , reportData.result ) ;
    gridReportResults.onRowClick = function( selectedRow , itemIndex , rowData ) 
      {
         detailView( rowData )  
      };
}



function runReport_PIVOT( data , container  )
{
  var sql             = '';
  container.innerHTML = '';
  var tn              = data.TABLENAME;
  var groupFields     = null;
  var sumFields       = null;

  var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+selectedReport })
    if(response.error) 
    {
      dialogs.showMessage("Fehler beim Laden des Reports: " + response.errMsg);
      return;
    }

    // ein SQL-Statement bauen, welches nur aus den Gruppierungsfeldern und EINEM Summenfeld - bestehend aus den Summierungsfeldern - aufgebaut ist ...

    groupFields = JSON.parse(response.result.GROUPFIELDS);
    sumFields   = JSON.parse(response.result.SUMFIELDS);
    
    sql = '';
    for(var i=0; i<groupFields.length;i++)
      if(i==0) sql = 'select ' + groupFields[i]
      else     sql = sql + ', '+ groupFields[i];  
  
     if (sumFields.length==1) sql = sql + ', ('+sumFields[0]
     else
         for(var i=0; i<sumFields.length;i++) 
            if(i==0) sql = sql+ ', ('+sumFields[i]
            else     sql = sql+ '+'  +sumFields[i] 
     
     sql = sql + ') as sum';       

    sql = sql + ' from ' + tn;
 
  // ist Filter-Liste (blackkList) definiert ?
  if((selectedBlackList!="") && (selectedBlackList!="0"))
  {
       var blackList = new TFDataObject('blacklist');
           blackList.load(selectedBlackList);
       var entrys    = JSON.parse(blackList.IDENTIFY); 
       // gibt es Filter ?
       var where = ' where ';
       if(entrys.length>0)
       for(var i=0; i<entrys.length; i++)
       {
         var filter = entrys[i];
         filter     = filter.replace('\"', "'");
         filter     = filter.replace('\"', "'");
         filter     = filter.replace('"', "'");

         if(i>0) where = ' and ';
       
         sql = sql + where + filter; 
       } 
  }  

  var reportData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (reportData.error) {
           dialogs.showMessage('Das folgende SQL-Statement '+sql+' generiert den Fehler: ' + reportData.errMsg);
           return;
       }

  var pivotTable     = utils.pivot( reportData.result , groupFields[1] ,groupFields[0] , 'sum');  
debugger;

const demo = {
  rows: [
    { id: 'cc100', label: 'KST 100 – Verwaltung' },
    { id: 'cc200', label: 'KST 200 – Vertrieb' },
    { id: 'cc300', label: 'KST 300 – Produktion' },
  ],
  cols: [
    { id: 'q1', label: 'Q1' },
    { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' },
    { id: 'q4', label: 'Q4' },
  ],
  values: {
    'cc100|q1': 12034, 'cc100|q2': 15440, 'cc100|q3': 14110, 'cc100|q4': 16880,
    'cc200|q1': 22010, 'cc200|q2': 19990, 'cc200|q3': 24500, 'cc200|q4': 23040,
    'cc300|q1': 40500, 'cc300|q2': 39800, 'cc300|q3': 42220, 'cc300|q4': 45090,
  }
};

  var grid           = new TFPivotGrid( container.DOMelement , {
                                                                  showTotals : true,
                                                                  heatmap    : true,
                                                                  density    : 'compact',
                                                                  onCellClick: ({rowId, colId}) => openDetails(rowId, colId)
                                                               });
  grid.setData(demo).render();
}




function runReport( data , container  )
{
 if((selectedReport=="") || (selectedReport=="0"))  { runReport_GROUP( data , container  ); return } 
 
 var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+selectedReport })
  if(response.error) 
    {
      dialogs.showMessage("Fehler beim Laden des Reports: " + response.errMsg);
      return;
    }

  if (response.result.KATEGORIE.toUpperCase() == 'PIVOT') runReport_PIVOT( data , container );
  else                                                    runReport_GROUP( data , container );      

}




function detailView( data )
{
  var w   = dialogs.createWindow(null,'Details', "70%" , "80%" , "CENTER")
  var gui = new TFgui( w , forms.rechnungsPruefungReportDetails);  // valueContainer & gridContainer
  
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
function editReport( tableName , ID ) 
{ 
 var gui               = new TFgui( null , forms.reportDefinition );

 var reportData        = new TFDataObject('reports' , ID );
 if(ID) reportData.load(ID);
 
  // für einen leichteren Umgang ;-)
  var editReportName    = gui.editReportName;
  var cbReportKategorie = gui.cbReportKategorie;
  var selectDatafield1  = gui.selectDatafield1;
  var selectDatafield2  = gui.selectDatafield2;
  var lbGroupFields     = gui.lbGroupFields;
  var lbSumFields       = gui.lbSumFields;

    
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
gui.btnAddToGroup.callBack_onClick = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield1 , listBox:lbGroupFields })
gui.btnAddToSum.callBack_onClick   = function() { ___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield2 , listBox:lbSumFields })

// Button zum entfernen der Listbox-Einträge ....
gui.btnDelFromGroup.callBack_onClick = function() { ___removeField(this.listBox) }.bind({listBox:lbGroupFields })
gui.btnDelFromSum.callBack_onClick   = function() { ___removeField(this.listBox) }.bind({listBox:lbSumFields })

  //OK  -> Speichern 
  gui.btnOk.callBack_onClick = function(){
                                           this.data.REPORTNAME  = gui.editReportName.value;
                                           this.data.KATEGORIE   = gui.cbReportKategorie.value || 'Gruppierung';
                                           this.data.GROUPFIELDS = JSON.stringify(gui.lbGroupFields.getItems('value'));
                                           this.data.SUMFIELDS   = JSON.stringify(gui.lbSumFields.getItems('value'));
                                           this.data.save();
                                           this.gui.close();
                                          }.bind({gui:gui , data:reportData})
                              
      
      // Abort
      gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})
}


// Button Report löschen ...
function deleteReport( ID ) 
{}


// Button Blackliste-Liste definieren - Wenn 
function editBlackList( tableName , ID)
{ 
  var blackListData = new TFDataObject('blacklist');
  
  if(ID) blackListData.load(ID)
 
  var gui   = new TFgui(null, forms.rechnungspruefungBlacklist);
      
      // hartes Umbenennen der in des im GUI definierten Labels...
      gui.TFLabel121.caption ='Filter definieren';

 //  Eingabefelder ggf. bestücken sofern im Editier-Modus
 if(blackListData.ID)
 {
   gui.editBezeichnung.value = blackListData.BEZEICHNUNG;
   try {
        var f = JSON.parse(blackListData.IDENTIFY);
        for (var i=0; i<f.length; i++) gui.listBox.addItem({caption:f[i],value:f[i]});
   } catch(e) { }; 
 }
 
      // Select--Box mit Datenfeldern
      gui.selectDatafield.setItems( ___getFieldNames(tableName) );
      // bei Veränderung soll Daten-Inhalts-Select-Box mit den Merkmalsausprägungen dieses Feldes befüllt werden
      // habe fast Pipi in den Augen bei soviel "Schönheit" ;-)
      gui.selectDatafield.callBack_onChange = function(){ this.gui.editFilter.items = ___getFieldContent(tableName,this.gui.selectDatafield.value)
                                                        }.bind({gui:gui})

      // Operationen                                                  
      gui.selectOperation.setItems([{caption:'gleich',value:'='} , {caption:'ungleich',value:'<>'} , {caption:'like',value:'like'}]);
      
      // Regel der Listbox hinzufügen
      gui.btnAdd.callBack_onClick = function(){this.gui.listBox.addItem(this.gui.selectDatafield.value + " " + this.gui.selectOperation.value + ' "' + this.gui.editFilter.value + '"' , true )}.bind({gui:gui});
    
      // Regel aus der Listbox entfernen ...
      gui.btnDelete.callBack_onClick = function(){ ___removeField(this.listBox) }.bind({ listBox:gui.listBox });

      //OK
      gui.btnOk.callBack_onClick = function(){
                                               this.blackListData.BEZEICHNUNG = this.gui.editBezeichnung.value; 
                                               this.blackListData.IDENTIFY    = JSON.stringify(this.gui.listBox.getItems('value')); 
                                               this.blackListData.save();
                                               this.gui.close();
                                             }.bind({gui:gui , blackListData:blackListData})
                              
      
      // Abort
      gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})
     
}



// Button Filter löschen ...
function deleteBlacklist( ID ) 
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



function ___excelExport( grid )
{
  if (grid==null) return;

  var xlsValues = [];
   
  utils.POSTrequest('JSN2EXCEL', { worksheetName:'Tabelle1' , data:grid.jsonData, excludeFields:[] , fieldTitles:[] } , "download_"+globals.session.userName+"_"+Date.now().toString() );
}
  
