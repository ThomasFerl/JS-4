
import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";
import * as forms        from "./forms.js";
import * as pivot        from "./tfWebApp/pivot.js"


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



export class rpGlasCOM
{
   #guiMainWnd         = null;

   #lastInsertID       = 0;          // der letzte importierte Rechnungs-Datensatz
   #lastSelectedNdx    = -1;         // die zuletzt ausgewählte Rechnung
   #lastInsertedClipbrd= {};         // das letzte vom Clipboard eingefügte Objekt  
   #gridReportResults  = null;       // das Grid, in welchem der aktuelle Report dargestellt wird

   // ausgewählte Items
   #selectedReport     = '';         // der akuell ausgewählte Report ...
   #selectedTable      = '';
   #selectedBlackList  = '0';
   #selectedBill       = null;

   // Select-/Comboboxen
   #cbReport           = null;
   #cbFilter           = null;

   // Container für Grids
   #billContainer      = null;
   #reportContainer    = null;


constructor()
{
   var gui                            = new TFgui( null , forms.rechnungspruefungMain);
   this.#billContainer                = gui.gridPanel;
   gui.btnNewBill.callBack_onClick    = function() {this.addNewBill()}.bind(this);
   gui.btnDeleteBill.callBack_onClick = ()=>{dialogs.showMessage('Diese Funktion ist aktuell noch nicht implementiert !');};
   gui.btnEnd.callBack_onClick        = function(){this.close()}.bind(gui);

   this.updateView(); 
}


updateView()
{
  this.#billContainer.innerHTML = '';

  // alle Archiv-Einträge lesen...
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from billArchive"})
  
  var table    = dialogs.createTable( this.#billContainer , response.result ,["ID"  , "ARCPATH" , "TABLENAME"	, "IMPORTED"	,	 "DESCRIPTION2"	, "DESCRIPTION3" ] , {DESCRIPTION2:"Beschreibung",ORGFILENAME:"Datei-Name"}); 
      table.onRowClick = function( selectedRow , itemIndex , rowData ) 
      {
        if(this.#lastSelectedNdx==itemIndex) { this.#selectedBill = rowData; this.showReports() }
        this.#lastSelectedNdx=itemIndex;
         
      }.bind(this);
}
  

addNewBill()
{ 
  this.#lastInsertID   = 0;

  var gui  = new TFgui( null , forms.addBillDlg );
  var bill = new TFDataObject( "billArchive" );

  gui.dataBinding( bill );

   dialogs.addFileUploader( gui.dropZone , '*.*' , true , 'testUpload' , function(selectedFiles) {
                                                                                                   this.self.processUploadFiles(selectedFiles , this.dropZone , this.gui );
                                                                                                   this.self.#lastInsertedClipbrd = null;
                                                                                                 }.bind({dropZone: gui.dropZone , gui:gui, self:this}) );

   // Formular wurde mit OK bestätigt...
   gui.btnOk.callBack_onClick = function() {
                                            if(this.self.#lastInsertID) // File via drag & drop in Dropzone verschooben ....
                                            {  
                                              this.gui.update('data');
                                              this.bill.ID = this.self.#lastInsertID;
                                              this.bill.update({ignoreEmptyValues:true});
                                              this.self.updateView();
                                              this.gui.close();
                                              return;
                                            }

                                            if(this.self.#lastInsertedClipbrd!={})  // Daten via Clipboard in Dropzone kopiert....
                                            { // das eine Datenfeld wird gleich an Process-CSV-Data übeergeben. Das erspart gui.update() und bill.save()
                                              utils.webApiRequest('PROCESSCSVDATA',{data:this.self.#lastInsertedClipbrd,description:this.gui.editBezeichnung.value},'POST')
                                              this.self.updateView();
                                              this.gui.close();
                                              return;
                                            }
                                            // OK gedrückt ohne zuvor Daten abgelegt zu haben ...
                                            dialogs.showMessage("Bitte erst eine Excel-Datei hochladen oder per Zwischenablage einfügen !");

                                           }.bind({bill:bill, gui:gui, self:this})

   // Formular - Abbruch...                                        
   gui.btnAbort.callBack_onClick = function() {this.gui.close()}.bind({gui:gui}) 

   // Daten aus Zwischenablage holen ...
   gui.TFButton132.callBack_onClick = function() {  gui.dropZone.innerHTML = '';
                                                    utils.read_CSV_fromClipboard().then( function(data){ if(data){ 
                                                                                                          dialogs.createTable(gui.dropZone,data);
                                                                                                          this.#lastInsertedClipbrd = data;
                                                                                                          this.#lastInsertID        = '';
                                                                                                          }
                                                                                                       }.bind(this) );  
                                                                                                 
                                                                                            
                                                    
                                                 }.bind(this)
}


loadAvailableReports()
{  // Befüllung der ComboBox zur Auswahl der verfügbaren Berichte
  this.#cbReport.setItems();
  this.#cbReport.addItem('Rohdaten anzeigen' , '0');

   var response  = utils.webApiRequest( 'FETCHRECORDS' , {sql:'Select ID ,  REPORTNAME from reports order by REPORTNAME'});

   if(!response.error) 
   for(var i=0; i<response.result.length; i++) this.#cbReport.addItem( response.result[i].REPORTNAME , response.result[i].ID );     
 
   this.#cbReport.callBack_onChange = function( v ) 
                                                  {                                               
                                                    this.#selectedReport = v;
                                                    this.runReport(); 
                                                  }.bind(this);

}


loadAvailableFilter()
{  // Befüllung der ComboBox zur Auswahl der verfügbaren Blcklist / Filter
   // die Bezeichnung Blacklist wird in der Kommunikation mit dem Anwender kommuniziert - tatsächlich sind es einfache SQL-Filter in Form von WHERE-Klauseln 
  this.#cbFilter.setItems();
  this.#cbFilter.addItem( {caption:'---' , value:0} );     

  var response  = utils.webApiRequest( 'FETCHRECORDS' , {sql:'Select ID ,  BEZEICHNUNG from blacklist order by BEZEICHNUNG'});
  if(!response.error) 
    for(var i=0; i<response.result.length; i++) this.#cbFilter.addItem( {caption:response.result[i].BEZEICHNUNG , value:response.result[i].ID} );    
 
 
   this.#cbFilter.callBack_onChange = function( v ) 
                                                  {                                               
                                                    this.#selectedBlackList = v;
                                                    this.runReport(); 
                                                  }.bind(this);
}


showReports()
{ 
   var gui           = new TFgui( null , forms.rechnungspruefungAuswertung );

    // besseres handling -> global verfügbar machen ...
   this.#reportContainer   = gui.gridContainer;
   this.#cbReport          = gui.selectReport;
   this.#cbFilter          = gui.selectBlacklist;
   this.#selectedTable     = this.#selectedBill.TABLENAME;
   this.#selectedBlackList = '0';
   this.#selectedReport    = '0';

   //  Die Liste der möglichen Reports....
   this.loadAvailableReports();
  
  // Blacklist befüllen ...                                          
  this.loadAvailableFilter();
  
// Button zur Verwaltung der Reports
gui.btnAddReport.callBack_onClick    = function(){ this.editReport(this.#selectedTable , null) }.bind(this);
gui.btnEditReport.callBack_onClick   = function(){ this.editReport(this.#selectedTable , this.#selectedReport ) }.bind(this);
gui.btnDeleteReport.callBack_onClick = function(){ this.deleteReport( this.#selectedReport ) }.bind(this);

// Button zur Verwaltung der Ausschluss-Liste
gui.btnAddBlacklist.callBack_onClick    = function (){ this.editBlackList(this.#selectedTable , null) }.bind(this);
gui.btnEditBlacklist.callBack_onClick   = function (){ this.editBlackList(this.#selectedTable , this.#selectedBlackList) }.bind(this);
gui.btnDeleteBlacklist.callBack_onClick = function (){ this.deleteBlacklist(this.#selectedBlackList) }.bind(this);

// per Default erstmal die Roh-Daten anzeigen ...
this.runReport();

gui.btnExcel.callBack_onClick = function(){ utils.printContent(this.#reportContainer); /*___excelExport( gridReportResults ) */}.bind(this)

}



___runReport_GROUP( container  )
{ 
  container.innerHTML             = '';
  
  var sql                         = '';
  var komma                       = ' ';
  var groupFields                 = null;
  var sumFields                   = null;

  if((this.#selectedReport=="") || (this.#selectedReport=="0"))  sql  = "SELECT * FROM " + this.#selectedTable ; 
  else
  {
    var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+this.#selectedReport })
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
      
    sql = sql + ' from ' + this.#selectedTable;
  } 

  // ist excluse-Liste (blackkList) definiert ?
  if((this.#selectedBlackList!="") && (this.#selectedBlackList!="0"))
  { 
       var blackList = new TFDataObject('blacklist');
           blackList.load(this.#selectedBlackList);
       
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

    var gridReportResults = dialogs.createTable( container , reportData.result ) ;
        gridReportResults.onRowClick = function( selectedRow , itemIndex , rowData ) 
                                                                                {
                                                                                   this.detailView( rowData )  
                                                                                }.bind(this);
}



___runReport_PIVOT( container  )
{
  container.innerHTML             = '';
  
  var sql                         = '';
  var komma                       = ' ';
  var groupFields                 = null;
  var sumFields                   = null;

  var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+this.#selectedReport })
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

    sql = sql + ' from ' + this.#selectedTable;
 
  // ist Filter-Liste (blackkList) definiert ?
  if((this.#selectedBlackList!="") && (this.#selectedBlackList!="0"))
  {
       var blackList = new TFDataObject('blacklist');
           blackList.load(this.#selectedBlackList);
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

  var pivotTable  = pivot.calcPivotData( reportData.result , groupFields[1] ,groupFields[0] , 'sum');  
  
  // Übergabe an TFPivotGrid
  container.overflow = 'auto';
  pivot.renderPivotData(container.DOMelement , pivotTable , /*callback bei Mausklick*/ function(x,xValue,y,yValue){ 
                                                                                                                    this.showPivotDetails(x,xValue,y,yValue);
                                                                                                                   }.bind(this) ); 
}


runReport()
{
 // falls kein Report gewählt -> default:Listenausgabe    
 if((this.#selectedReport=="") || (this.#selectedReport=="0"))  { this.___runReport_GROUP( this.#reportContainer  ); return } 
 
 // Falls ein Bericht ausgewählt wurde, diesen abrufen...
 var response = utils.webApiRequest('FETCHRECORD',{sql:'Select * from reports Where ID='+this.#selectedReport })
  if(response.error) 
    {
      dialogs.showMessage("Fehler beim Laden des Reports: " + response.errMsg);
      return;
    }
  
  // In Abhängigkeit von der Art des Berichts entweder normales Grid oder Pivot-Grid  
  if (response.result.KATEGORIE.toUpperCase() == 'PIVOT') this.___runReport_PIVOT( this.#reportContainer );
  else                                                    this.___runReport_GROUP( this.#reportContainer );      

}



detailView( data )
{ // Bei Mausklick in Gruppe, werden die einzelnen Datensätze dieser Gruppe gelistet ...
  var w    = dialogs.createWindow(null,'Details', "70%" , "80%" , "CENTER")
  var gui  = new TFgui( w , forms.rechnungsPruefungReportDetails);  // valueContainer & gridContainer
  
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
   var reportData = null;  // ist <>null, wenn ein existierender Report bearbeitet werden soll....
   if(this.#selectedReport!='') 
   {
      var response = utils.webApiRequest('fetchRecord',{sql:"Select * from reports Where ID="+this.#selectedReport});
      if(!response.error) reportData = response.result;
    }

    var sql = "select * from " + this.#selectedTable;

    // durchlaufe gruppierungsfelder
    if(reportData)
    {     
      var grpFields = JSON.parse(reportData.GROUPFIELDS);
      var help      = " where ";
      for(var i=0; i<grpFields.length; i++) 
      {
        if (i>0) help = " and ";
         sql = sql + help + grpFields[i] +  "='" + data[grpFields[i]]+"'" ;
      }
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



processUploadFiles( files , dropZone , gui )
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
  else this.#lastInsertID = response.result.lastInsertRowid;

  dropZone.innerHTML = '';
  utils.drawSymbol('circle-check' , dropZone , 'green' , '100%' );
  this.updateView();
}
 

// Button: Report bearbeiten ...  ist ID == null -> neuEingabe
editReport( tableName , ID ) 
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
 var dataFields = this.___getFieldNames(tableName)

 selectDatafield1.setItems( dataFields );
 selectDatafield2.setItems( dataFields );

 //  Eingabefelder ggf. bestücken sofern im Editier-Modus
 if(reportData)
 {
    editReportName.value    = reportData.REPORTNAME; 
    cbReportKategorie.value = reportData.KATEGORIE;  
  
  if( reportData.GROUPFIELDS != "" )  
  try{
       var f = JSON.parse(reportData.GROUPFIELDS);
       for (var i=0; i<f.length; i++) lbGroupFields.addItem({caption:f[i],value:f[i]});
       } catch(e){}

  if(reportData.SUMFIELDS != "")     
  try{
           f = JSON.parse(reportData.SUMFIELDS);
       for (var i=0; i<f.length; i++) lbSumFields.addItem({caption:f[i],value:f[i]});
       } catch(e){}
 }
 
// Button zum Listboxen bestücken....
gui.btnAddToGroup.callBack_onClick = function() { this.self.___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield1 , listBox:lbGroupFields, self:this })
gui.btnAddToSum.callBack_onClick   = function() { this.self.___addField(this.fieldName.value , this.listBox) }.bind({fieldName:selectDatafield2 , listBox:lbSumFields , self:this })

// Button zum entfernen der Listbox-Einträge ....
gui.btnDelFromGroup.callBack_onClick = function() { this.self.___removeField(this.listBox) }.bind({listBox:lbGroupFields , self:this })
gui.btnDelFromSum.callBack_onClick   = function() { this.self.___removeField(this.listBox) }.bind({listBox:lbSumFields , self:this})

  //OK  -> Speichern 
  gui.btnOk.callBack_onClick = function(){
                                           this.data.REPORTNAME  = gui.editReportName.value;
                                           this.data.KATEGORIE   = gui.cbReportKategorie.value || 'Gruppierung';
                                           this.data.GROUPFIELDS = JSON.stringify(gui.lbGroupFields.getItems('value'));
                                           this.data.SUMFIELDS   = JSON.stringify(gui.lbSumFields.getItems('value'));
                                           this.data.save();
                                           this.gui.close();
                                           this.self.loadAvailableReports()
                                          }.bind({gui:gui , data:reportData , self:this})
                              
      
      // Abort
      gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})
}



// Button Blackliste-Liste definieren - Wenn 
editBlackList( tableName , ID)
{ 
  var blackListData = new TFDataObject('blacklist');
  
  if(ID) blackListData.load(ID)
 
  var gui   = new TFgui(null, forms.rechnungspruefungBlacklist);
      
      // hartes Umbenennen des im GUI definierten Labels...
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
      gui.selectDatafield.setItems( this.___getFieldNames(tableName) );
      // bei Veränderung soll Daten-Inhalts-Select-Box mit den Merkmalsausprägungen dieses Feldes befüllt werden
      // habe fast Pipi in den Augen bei soviel "Schönheit" ;-)
      gui.selectDatafield.callBack_onChange = function(){ this.gui.editFilter.items = this.self.___getFieldContent(tableName,this.gui.selectDatafield.value)
                                                        }.bind({gui:gui , self:this})

      // Operationen                                                  
      gui.selectOperation.setItems([{caption:'gleich',value:'='} , {caption:'ungleich',value:'<>'} , {caption:'like',value:'like'}]);
      
      // Regel der Listbox hinzufügen
      gui.btnAdd.callBack_onClick = function(){this.gui.listBox.addItem(this.gui.selectDatafield.value + " " + this.gui.selectOperation.value + ' "' + this.gui.editFilter.value + '"' , true )}.bind({gui:gui});
    
      // Regel aus der Listbox entfernen ...
      gui.btnDelete.callBack_onClick = function(){ this.self.___removeField(this.listBox) }.bind({ listBox:gui.listBox , self:this });

      //OK
      gui.btnOk.callBack_onClick = function(){
                                               this.blackListData.BEZEICHNUNG = this.gui.editBezeichnung.value; 
                                               this.blackListData.IDENTIFY    = JSON.stringify(this.gui.listBox.getItems('value')); 
                                               this.blackListData.save();
                                               this.gui.close();
                                               this.self.loadAvailableFilter();
                                             }.bind({gui:gui , blackListData:blackListData, self:this})
                              
      
      // Abort
      gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})
     
}



// Button Filter/Blacklist löschen ...
deleteBlacklist( ID ) 
{
  if(ID=="0") {dialogs.showMessage("Bitte zuerst den zu löschenden Filter auswählen !"); return;}
  dialogs.ask("nachgefragt","Soll der ausgewählte Filer gelöscht werden ?",function(){utils.webApiRequest("DROP",{tableName:'blacklist' , ID_field:'ID' ,ID_value:ID});
                                                                                     this.loadAvailableFilter();
                                                                                    }.bind(this));
}


// Button Report löschen ...
deleteReport( ID ) 
{
  if(ID=="0") {dialogs.showMessage("Bitte zuerst den zu löschenden Bericht auswählen !"); return;}
  dialogs.ask("nachgefragt","Soll die ausgewählte Auswertung gelöscht werden ?",function(){utils.webApiRequest("DROP",{tableName:'reports' , ID_field:'ID' ,ID_value:ID});
                                                                                     this.loadAvailableReports();
                                                                                    }.bind(this));
}



showPivotDetails(fieldName1,value1,fieldName2,value2)
{
    var w   = dialogs.createWindow(null,'Details', "70%" , "80%" , "CENTER")
  
    var sql = "select * from " + this.#selectedTable + " Where "+fieldName1+"='"+value1+"' AND " + fieldName2 + "='"+value2+"'"

    var detailData = utils.webApiRequest('fetchRecords', { sql:sql });
     
    if (detailData.error) {
           dialogs.showMessage('Fehler beim Laden der Details: ' + detailData.errMsg);
           return;
       }

    if( detailData.result.length == 0) {dialogs.showMessage('Für diese Konstellation aus '+fieldName1+'('+value1+')  und '+fieldName2+'('+value2+') gibt es keine Fälle !'); w.close(); return;}   

    dialogs.createTable( w.hWnd , detailData.result ,['ID','AUSWERTUNG_ZUM'] ) ;
}


// Hilfsfunktionen

___getFieldNames(tableName)
{
  var result   = [];
  var response = utils.webApiRequest('STRUCTURE' , {tableName:tableName})

  if (response.error) return result;

  for (var i=0; i<response.result.length; i++) result.push(response.result[i].name)

  return result;  
}  


___getFieldContent(tableName,fieldName)
{
  var result   = [];
  var response = utils.webApiRequest('FETCHRecords' , {sql:"Select distinct "+fieldName+" from " + tableName + " Order by " + fieldName})

  if (response.error) return result;

  for (var i=0; i<response.result.length; i++) result.push(response.result[i][fieldName])

  return result;  
}  


___addField( value , listBox )
{
  listBox.addItem( {value:value, caption:value} , true );
}


___removeField( listBox ) 
{
   var selectedItems = listBox.selectedItems;
   for(var i=0; i<selectedItems.length; i++) listBox.removeItem( selectedItems[i] );
}



___excelExport( grid )
{
  if (grid==null) return;

  var xlsValues = [];
   
  utils.POSTrequest('JSN2EXCEL', { worksheetName:'Tabelle1' , data:grid.jsonData, excludeFields:[] , fieldTitles:[] } , "download_"+globals.session.userName+"_"+Date.now().toString() );
}
  
}