import * as globals      from "./globals.js";
import * as utils        from "./utils.js";
import * as dialogs      from "./tfDialogs.js";
import * as grid         from "./tfgrid.js";
import { Screen }        from "./tfObjects.js";
import { tfWebApp }      from "./tfWebApp.js";
import { createWindow }  from "./tfDialogs.js";
import { THTMLTable }    from "./tfgrid.js";


class TFdataFieldDef
{
 constructor( aFieldName , aFieldType , aCaption  )
 {
    this.fieldName                = aFieldName;
    this.column                   = -1;
    this.visible                  = true;
    
    if(aCaption) this.caption     = aCaption
    else         this.caption     = aFieldName;

    if(aFieldType) this.fieldType = aFieldType
    else           this.fieldType = "Text";
    
    this.td                       = null;
 }
}


export class TFdataSet
{
    constructor( sqlStatement , etc )
    {
      if(etc)this.etc = etc;
      else   this.etc = false
      this.sql        = "";
      this.table      = "";
      this.primaryKey = "";
      if(etc)this.dbName = 'ETC';
      else   this.dbName = '';
      this.error      = false;
      this.errMsg     = "";
      this.dataFields = [];
      this.records    = [];
      this.record     = null;
      this.position   = -1;
      this.grid       = null;
      this.pragma     = [];
      this.captions   = {};

      this.onSelected   = null;
      this.onAddRecord  = null
      this.onEditRecord = null;
      this.onDelRecord  = null;

      this.onRefreshDataset = null;

      
      if(!sqlStatement)
      {
        this.error = true;
        this.errMsg = 'fehledes SQL-Statement bzw Tabelle';
        console.log("TFdataSet.constructor( "+this.dbName+" , "+sqlStatement+") -> "+this.errMsg);
        return;
      }

      if(sqlStatement.toUpperCase().indexOf("SELECT")<0)
      {
         // es fehlt das SELECT, so dass auf eine Tabelle geschlossen wird...
         console.log("TFdataSet.constructor( "+this.dbName+" , "+sqlStatement+") ->  es fehlt das SELECT, so dass auf eine Tabelle geschlossen wird ");
         
         var r = utils.webApiRequest("existTable" , JSON.stringify( { etc:this.etc , tableName:sqlStatement }  ) );
         if (r.error) 
         {
          this.error  = true;
          this.errMsg = "ungültiges Statement / Tabellenname !"
          console.log("TFdataSet.constructor( "+this.dbName+" , "+sqlStatement+") -> "+this.errMsg);
          return;
         }  
         this.table = sqlStatement;
         this.sql   = 'Select * From '+this.table;
      }
      else 
          {
            this.sql   = sqlStatement;
            var ast    = utils.webApiRequest("AST" , JSON.stringify( {sql:sqlStatement} ) );
            this.table = ast.result[0];
          }  

      var p       = { etc:this.etc , sql:this.sql } 
      var r       = utils.webApiRequest("Structure" , JSON.stringify( p ) );
      
      if(r.error) {
                    this.error  = true;
                    this.errMsg = r.errMsg;
                    console.log("TFdataSet.constructor( "+this.dbName+" , "+sqlStatement+") -> "+this.errMsg);
                    return;
                  }  

      this.pragma = r.result;
       
       for (var i=0; i<this.pragma.length; i++)
       {
        if(this.pragma[i].pk == 1) this.primaryKey = this.pragma[i].name;
        this.dataFields.push( new TFdataFieldDef ( this.pragma[i].name , this.pragma[i].typ ) )    
       }  
       
       console.log('Felder : ' + JSON.stringify(this.dataFields) );
    }
    

    fieldByName( fieldName , inRow )
    {
      var row = this.position;
      if(inRow>=0) row = inRow;

      if(row>=this.records.length) row=this.records.length-1;
      
      var r = this.records[row];
      console.log("fieldbyName -> record:"+JSON.stringify(r));

      if( fieldName in r) { this.record = r[fieldName]; return this.record }
      else                return null;      
    }


    fieldDefByName( fieldName , inRow )   /// Feld - Definition !!!
    {
      for(var i=0; i<this.dataFields.length; i++) if (this.dataFields[i].fieldName.toUpperCase()==fieldName.toUpperCase()) return this.dataFields[i];
      return null;  
    }


    findNdx( field , value )
    {
      for(var i=0; i<this.records.length; i++)
      if ( this.records[i][field]==value) return i;
      return -1;
    }


    find( field , value )
    {
      var ndx = this.findNdx(field , value) 
      if (ndx>=0) { this.record=this.records[ndx]; return this.record; }
      else        return null;
    }


    pushRecord(record)
    {
      // dafür sorgen, dass Felder in richtiger Reihenfolge auftreten...
      var r={};
      for(var i=0; i<this.dataFields.length; i++) 
      {
        var fn = this.dataFields[i].fieldName;
        if(fn in record ) r[fn] = record[fn];
        else              r[fn] = "";
      }
      
      this.records.push( r );

      return r;
    }



    hideFields( hiddenFields )
    { // z.B ['username','firstname','ID']
      for(var i=0; i<this.dataFields.length; i++) 
      {
        var f=this.dataFields[i];
        f.visible = !utils.containing(f.fieldName , hiddenFields );
      }  

    } 

    setCaptions( captions ) 
    {// z.B {username:'Benutzername',firstname:'Vorname',lastname:'Nachname',jobfunction:'Tätigkeit'}
      this.captions = captions;
      for (var key in this.captions )
      {
        var f=this.fieldDefByName( key );
        if(f) f.caption = this.captions[key]
      }
    }     

    open( filter , orderBy , limit )
    {
      var response = utils.webApiRequest('fetchRecords', JSON.stringify({etc:this.etc , sql:this.sql}) );
      if (response.error) 
      {
        this.error  = true;
        this.errMsg = response.errMsg;
        console.log("TFdataSet.constructor( "+this.dbName+" , "+this.sql+") -> "+this.errMsg);
        return false;
      }  

      this.records  = response.result;
      
      // vorsichtshalber dafür sorgen, dass records und fiedDefs sich auf identische Spalten bezieht....
      this.record   = this.first();
      console.log("first:" + JSON.stringify(this.record));
      var i         = -1;
      for (var f in this.record)
      {
        i++;
        console.log(i+'. Datenfeld -> '+f);

        var fieldDef = utils.findEntryByField( this.dataFields , 'fieldName' , f );
        if (fieldDef) fieldDef.column = i;
      }  

      // ggf überflüssige fieldDefs löschen ( tatsächlich wird nach "fieldDef.column!=-1" gefiltert)
      this.dataFields = this.dataFields.filter(item => item.column != -1);


      //Kontrolle
      for(var i=0; i<this.dataFields.length;i++) console.log('->'+JSON.stringify(this.dataFields[i]))

      return true;
   }
    
    refreshDatasetRow( record )
    {
      var row = this.find( this.primaryKey , record[this.primaryKey] );

      for (var f in record)
      {
        // update im internen dataset
        if (row) 
            if(f in row ) row[f] = record[f];
           
        
        // update im Grid
        var id   = record[this.primaryKey]+'.'+ f;
        var cell = document.getElementById(id);
        if(cell) cell.innerHTML = record[f]; 
      }  

      if(this.onRefreshDataset) this.onRefreshDataset( record );
    }


    deleteDatasetRow(record) 
    {
      var row = this.findNdx( this.primaryKey , record[this.primaryKey] );
      if(row<0) return;
       
      // lösche im internen Dataset
      this.records.splice( row , 1 );

      // update im Grid
      this.grid.deleteRow( row );
    }



    addRecord()
    {
      if ( this.onAddRecord ) this.onAddRecord();  // benutzerdefinierte Funktion ....
      else
          {
            var w      = dialogs.createWindow( null , "Datensatz hinzufügen" , "74%" , "74%" , 'CENTER');
            var d      = {};
            for (var i=0; i<this.pragma.length; i++) d[this.pragma[i].name]= null;
          
              console.log("Dataset.addRecord() -> " + JSON.stringify(d));
          
               var inp = dialogs.buildInputForm(
                                                w.hWnd , d , 'NEW' , this.captions ,     // Feldnamen "übersetzen"
                                                [] ,                                     // Appendix für bestimmte Felder
                                                [this.primaryKey]                        // ausgeschlossene Felder
                                              );
            
               inp.btnAbort.callBack_onClick = ()=> { w.closeWindow(); }  
          
               inp.btnOk.callBack_onClick    = function()
                                                 { 
                                                    var inpResults = dialogs.getInputFormValues(this.inpDlg);
                                                    var record     = {};
                                                    for(var i=0; i<inpResults.length; i++) { record[inpResults[i].field] = inpResults[i].value }
                                                    
                                                    var response = utils.webApiRequest("INSERTINTOTABLE" , JSON.stringify( { etc:this.dataset.dbName.toUpperCase()=='ETC' , tableName:this.dataset.table , fields:record } ) );
                                                    if(response.error)
                                                    {
                                                      this.wnd.closeWindow();
                                                      dialogs.showMessage(response.errMsg);
                                                      return;
                                                    }
                                                    // response bringt im Erfolgsfall die ID des erzeugten Records zurück
                                                    record[this.dataset.primaryKey] = response.result.lastInsertRowid;
                                                    console.log("updated record -> "+JSON.stringify(record));
                                                    this.wnd.closeWindow();
                                                    this.dataset.pushRecord(record);
                                                    this.dataset.grid.insertRow( null , this.dataset.records.length-1 , record );
                                                 }.bind( {wnd:w , inpDlg:inp.form , dataset:this} )                 
            
      }
      
    }

    
    editRecord( rec )
    {
      if (rec) var record = rec;
      else     var record = this.record;

      if ( this.onEditRecord ) this.onEditRecord( record ) ;   // benutzerdefinierte Funktion ....
      else
          {
            var w      = dialogs.createWindow( null , "Datensatz bearbeiten" , "74%" , "74%" , 'CENTER');
            var inp    = dialogs.buildInputForm(
                                                w.hWnd , record , this.primaryKey , this.captions ,     // Feldnamen "übersetzen"
                                                [] ,                                                    // Appendix für bestimmte FelderSortierung


                                                [this.primaryKey]                                       // ausgeschlossene Felder
                                              );

               console.log(' editRecord( rec ) inputForm -> ' + inp.form.objName)                                
            
               inp.btnAbort.callBack_onClick = ()=> { w.closeWindow(); }  
          
               inp.btnOk.callBack_onClick    = function()
                                               { 
                                                    var inpResults = dialogs.getInputFormValues(this.inpDlg);
                                                    // Ergebnis der Eingabe in record zurück speichern....
                                                    for(var i=0; i<inpResults.length; i++) { this.record[inpResults[i].field] = inpResults[i].value }
                                                    console.log('prepared for updateRecord -> '+JSON.stringify(this.record));
                                                    utils.webApiRequest("UPDATETABLE" , JSON.stringify( { etc:this.dataset.dbName.toUpperCase()=='ETC' , 
                                                                                                          tableName:this.dataset.table , 
                                                                                                          ID_field:this.dataset.primaryKey , 
                                                                                                          ID_value:this.record[this.dataset.primaryKey] , 
                                                                                                          fields:record } ) );
                                                    
                                                    this.wnd.closeWindow(); 
                                                    this.dataset.refreshDatasetRow( this.record )  
                                               }.bind( {wnd:w , inpDlg:inp.form , record:record , dataset:this} )                 
            
      }
    }  

      



     delRecord( record )
    {
       dialogs.ask("Soll dieser Datensatz wirklich gelöscht werden ?" , utils.printJSON(record,['ID','passwd']) , function callIfYes(record) 
                                                                                                                  {
                                                                                                                   var response = utils.webApiRequest('drop' , JSON.stringify( { etc:this.dataset.dbName.toUpperCase()=='ETC' , 
                                                                                                                                                                                 tableName:this.dataset.table , 
                                                                                                                                                                                 ID_field:this.dataset.primaryKey , 
                                                                                                                                                                                 ID_value:this.record[this.dataset.primaryKey]} ) );
                                                                                                                  if (response.error) {dialogs.showMessage(response.errMsg) ; return }
                                                                                                                  this.dataset.deleteDatasetRow( this.record );
                                                                                                                  
                                                                                                                  }.bind({dataset:this , record:record})                                                                                                                  

       );   
    }




   render( aParent )
   {
    utils.buildGridLayout_templateColumns( aParent , '1fr');
    utils.buildGridLayout_templateRows   ( aParent , '4.5em 1fr');
  
    var menu    = dialogs.addPanel( aParent ,"",1,1,1,1);
    utils.buildGridLayout_templateColumns( menu , '100px 100px 100px 1fr 100px');
    utils.buildGridLayout_templateRows   ( menu , '1fr');
  
    var btnAddd  = dialogs.addButton(menu,"",1,1,1,1,"hinzufügen");
        btnAddd.callBack_onClick = function() { this.addRecord() }.bind(this);
  
    var btnEdit  = dialogs.addButton(menu,"",2,1,1,1,"bearbeiten");
        btnEdit.callBack_onClick = function() { this.editRecord(this.selectedRecord() , this.position ) }.bind(this);                                       
  
    var btnDel   = dialogs.addButton(menu,"cssAbortBtn01",3,1,1,1,"löschen");
        btnDel.callBack_onClick  = function() { this.delRecord( this.selectedRecord() ) }.bind(this);                            

    var gridPanel = dialogs.addPanel( aParent ,"cssContainerPanel",1,2,1,1);    

    this.grid = new THTMLTable(); 
    this.grid.assignFromDataset( this ); 
    this.grid.build( gridPanel );
    this.grid.onRowClick = function(row , itemIndex )
                           { 
                            this.position = itemIndex; 
                            if(this.onSelected) this.onSelected( this.selectedRecord() )
                           }.bind(this);
  }  
   

    first()  
    {
      this.position = 0;
      if(this.records.length>0) return this.records[this.position];
      else return null;
    }

    last()  
    {
      if(this.records.length>0)
      {
        this.position = records.length-1;
        return this.records[this.position];
      }else return null;  
    }

    next()
    {
      if(this.records.length>0)
      {
        if(this.position<( records.length-1)) this.position++;
        return this.records[this.position];
      }
      else return null;  
    }

    pred()
    {
      if(this.records.length>0)
      {
        if(this.position>0) this.position--;
        return this.records[this.position];
      }
      else return null;  
    }

    selectedRecord()
    {
      if (this.position>=0) return this.records[this.position];
      else return null;
    }
      

    
}








