import * as globals   from "./globals.js";
import * as utils     from "./utils.js";
import {TFDateTime  } from "./utils.js";


class TFieldDef
{
 constructor( aFieldName , aCaption , testValue)
 {
    this.columnWidth             = '';
    this.columnHeight            = '';
    this.fieldName               = aFieldName;
    this.caption                 = aCaption;
    this.fieldType               = "";
    this.fieldFormat             = "";

    // Vorbelegung des Feld-Types
    // Debug 
    console.log("TFieldDef: " + aFieldName + " , " + aCaption + " , " + testValue )
    
    if( (typeof testValue != 'object') && (typeof testValue != 'function') && (testValue) )
    {
      if(!isNaN(testValue)) 
      { // numerischer Inhalt:
        var num=Number(testValue);
        var int=parseInt(testValue);
        this.fieldType="float";
        this.fieldFormat="2";
        if(num==int) {this.fieldType="int";this.fieldFormat="";}
      }
      else
          { // nichtNumerischer Inhalt - ggf auf boolsche oder Datum Inhalte prüfen....
            if( (testValue.toUpperCase()=="TRUE")||(testValue.toUpperCase()=="FALSE")||(testValue.toUpperCase()=="ON")||(testValue.toUpperCase()=="OFF")   ) {this.fieldType="bool"}
            if( (testValue.length>=10) && (testValue[2]=='.') && (testValue[5]=='.') )  this.fieldType = "date";
          }
    }      
  }
}

export class THTMLTable
{
  constructor( aJsonData , excludeFields )
 {
  console.log('THTMLTable...');

   this.fields         = [];
   this.jsonData       = null;
   this.onRowClick     = null;
   this.bindDataset    = null;
   var  isDrawing      = true;
   
   if(aJsonData)
   {
     this.jsonData     = aJsonData;
     // caption basieren auf Feldnamen
     var firstDataItem = this.jsonData[0];
     for (var key in firstDataItem)
     {
       console.log('field : '+ key);
       if(excludeFields) isDrawing = (excludeFields.indexOf(key)<0)
       else              isDrawing = true;

       if(isDrawing) this.fields.push( new TFieldDef( key , key , this.jsonData[0][key]));
      }
   }else this.jsonData  = {};        
 }


 assignFromDataset( ds )
 {
  this.jsonData     = ds.records;
  this.bindDataset  = ds;

  for (var i=0 ; i<ds.dataFields.length; i++)
  {
    var d=ds.dataFields[i];
    if(d.visible)
    {
      var f = new TFieldDef( d.fieldName , d.caption , null );
          if(d.fieldType.toUpperCase()=='REAL')    {f.fieldType='float'; f.fieldFormat="2"}
          if(d.fieldType.toUpperCase()=='NUMERIC') {f.fieldType='float'; f.fieldFormat="2"}
          if(d.fieldType.toUpperCase()=='INTEGER') {f.fieldType='int'  ; f.fieldFormat="" }
          if(d.fieldType.toUpperCase()=='BOOLEAN') {f.fieldType='bool' ; f.fieldFormat="" }
          if(d.fieldType.toUpperCase()=='TEXT')    {f.fieldType='text' ; f.fieldFormat="" }
          if(d.fieldType.toUpperCase()=='DATE')    {f.fieldType='date' ; f.fieldFormat="dd.mm.yyyy" }
          if(d.fieldType.toUpperCase()=='TIME')    {f.fieldType='time' ; f.fieldFormat="hh:mm" }
          if(d.fieldType.toUpperCase()=='DATETIME'){f.fieldType='datetime' ; f.fieldFormat="dd.mm.yyyy hh:mm" }
          this.fields.push( f); 
    }      
  }
 } 


 onRowClickEvent(event)
 {
    console.log('onRowClick');  
    var selectedRow = event.currentTarget;
    var selected    = selectedRow.getAttribute("selected");

    if (event.ctrlKey) { selectedRow.classList.toggle('trSelected'); 
    {
      if  (selected=='1') selected='0'
      else selected= '1';

      selectedRow.setAttribute("selected", selected )}
    } 
    else 
       {
         // Entfernen der Markierung und des "select-Attribut" von allen anderen Zeilen
         Array.from(this.table.querySelectorAll('.trSelected')).forEach(function(row) {row.classList.remove('trSelected'); row.setAttribute("selected",false); });
        // angeklickte Zeile markieren....   
        selectedRow.classList.add('trSelected');
        selectedRow.setAttribute("selected",'1');

        if(this.onRowClick)
        {
          var itemIndex = selectedRow.getAttribute("itemIndex");
          this.onRowClick( selectedRow , itemIndex , this.jsonData[itemIndex] );  
        } 
    }
 }


getSelectedRows()
{
  var rows   = this.table.getElementsByTagName('tr'); 
  var result = [];
  console.log("getSelectedRows()"); 
  for(var i=0; i<rows.length; i++)
  {
    var row = rows[i];
    if(row.getAttribute("selected")=='1')
    {
      console.log("row "+i+" -> HTMLObj: " + JSON.stringify(this.jsonData[i-1]) + " selected: " + row.getAttribute("selected") ); 
      result.push( this.jsonData[i-1] );
    }  
    if(row.getAttribute("selected")=='1')
    {
      console.log("row "+i+" -> HTMLObj: " + JSON.stringify(this.jsonData[i-1]) + " selected: " + row.getAttribute("selected") ); 
      result.push( this.jsonData[i-1] );
    }  
  } 
   return result;
}



 fieldByName(fieldName)
 {
  for(var i=0; i<this.fields.length; i++)
  {
   if(this.fields[i].fieldName.toUpperCase()==fieldName.toUpperCase()){  return this.fields[i];  }
  }  
  return null;
 }


 insertRow( tbody , rowNo , content , marked )
 {
  if(!tbody) tbody = this.table.getElementsByTagName('tbody')[0]; // nimmt den ersten tbody in Tabelle

  if(!tbody) return;

  var row                       = tbody.insertRow();
  if(marked)   row.className    = "trMarked";
  else         row.className    = "tftr"; 
  row.style.height              = '1.77em';

  row.setAttribute("itemIndex", rowNo );
  row.setAttribute("selected" , '0' );
  for (var j=0; j<this.fields.length; j++) 
  {
    var fieldname = this.fields[j].fieldName 
    var cell      = row.insertCell();

    // Falls Grid mit einer Datenquelle (dB) verbunden ist, Tabellenzelle mit DatenInhalt verbinden über sprechende ID
    if(this.bindDataset)
    {
      var id=this.bindDataset.fieldByName( this.bindDataset.primaryKey , rowNo ) + '.' + fieldname ;
      cell.setAttribute("id", id );
    }
    cell.className    = "tftd"; 
    cell.style.height = '2em';
    if(this.fields[j].columnWidth!='') cell.style.width = this.fields[j].columnWidth;
    cell.innerHTML    = content[fieldname];
  }

  row.addEventListener("click", function(event) { this.onRowClickEvent( event , this )}.bind(this) );
  
 }


  render( aParent )
  {
    this.build( aParent );
  }   

  build( aParent )
  { 
    if(!aParent) aParent = document.body;

    this.parentNode                       = document.createElement("div");
    this.parentNode.className             = "cssHTMLTableContainerPanel";
    this.parentNode.style.width           = '100%';
    this.parentNode.style.height          = '100%';
    
    if(utils.isHTMLElement(aParent))
      {
        aParent.style.overflow = 'hidden';
        aParent.appendChild(this.parentNode);
      } 
       else 
            {
              aParent.DOMelement.style.overflow = 'hidden';
              aParent.DOMelement.appendChild(this.parentNode);
            }  
        
    this.parentNode.innerHTML             = '';
    this.parentNode.backgroundColor       = 'white'; 
    
     // Tabelle erstellen
    this.table                    = document.createElement("table");
    this.table.className          = "tftable";
    this.table.setAttribute("id", "table_"+Math.round(Math.random()*10000));
    
    // Tabellenkopf erstellen
    var thead                  = document.createElement("thead");
    var headerRow              = document.createElement("tr");
        headerRow.style.height = '2em';
    
    // Überschriften
    for(var i=0; i<this.fields.length; i++ )
    {
      var th           = document.createElement("th");
          th.className = "tfth";
          th.innerHTML = this.fields[i].caption;
          if (this.fields[i].columnWidth!='') th.style.width = this.fields[i].columnWidth;
          headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    this.table.appendChild(thead);
    
    // Tabellenkörper erstellen
    var tbody = document.createElement("tbody");
    for (var i = 0; i < this.jsonData.length; i++) this.insertRow( tbody , i , this.jsonData[i] , this.jsonData[i].dbID );
        
    this.table.appendChild(tbody);
    this.parentNode.appendChild(this.table);

  } // build .... 
  
  
  selectRow( ndx )
  {
    console.log('HTMLTable.selectRow('+ndx+')');

    const rows = this.table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) 
    {
        if (i - 1 === ndx)
        {
          rows[i].classList.add('trSelected');
          rows[i].scrollIntoView( {behavior: 'smooth', block: 'center' });
        }       
        else rows[i].classList.remove('trSelected');
    }
  }

  deleteRow( ndx )
  { 
    var param    = 'itemindex="'+ndx+'"';
    
    console.log("deleteRow("+ndx+") -> querySelector(tr["+param+"])");

    var htmlRows =  this.table.querySelector('tr['+param+']');

    console.log("htmlRows  -> " + htmlRows )

    if(htmlRows) htmlRows.remove();

  }


}  // end Class









