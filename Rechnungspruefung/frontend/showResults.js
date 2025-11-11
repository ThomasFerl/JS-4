import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as utils        from "./tfWebApp/utils.js";    
import { TFSreadSheet}   from "./tfWebApp/tfSpreadSheet.js";




export async function DEMO_spreadSheet()
{ 
  var wnd = dialogs.createWindow(null,'SpreadSheet', '90%' , '90%' , 'CENTER' );


  // Variante 1. statische Spreadsheet-Definition
  // ein "x" steht für eine Zelle. Eine Zahl vor dem x ist führt zum Cell-Verbund der entsprechenden Anzahl von Zellen....
  //  
 /* 
  var sd  = {
              head :   '5x . . . . . . . 5x', 
              rows : [ 'x x x x x x x x x x',
                       '2x . x x x x x x x x',
                       '3x . . x x x x x x x',
                       '4x . . . x x x x x x',
                       '5x . . . . x x x x x',
                       '6x . . . . . x x x x',
                       '7x . . . . . . x x x',
                       '8x . . . . . . . x x',
                       '9x . . . . . . . . x', 
                       '10x . . . . . . . . ' ]
            };
*/



// Variante 2. statische Spreadsheet-Definition
// es wird der Head definiert
// die Zeilen werdern n mal entsprechend der Definition innerhalb der eckigen Klammer erzeugt
/*
var sd  = {
              head :     '2x . 2x .', 
              rows :  '2*[ x x x x]'
          };

*/


// Variante 3. einfaches Layout in der Form cols x rows
// die Clusterung von Zellen erfolgt im Nachgang...
  var spr = new TFSreadSheet( wnd.hWnd , {layout:'10x10'} );

  spr.forEachCell( (c)=>{c.value=c.cellName; if(c.left==c.top)c.backgroundColor = 'rgba(0,0,0,0.1)'})
  
  spr.getCellbyName('R1C3').value = 'Produkt';     
  spr.getCellbyName('R1C4').value = 'Firma';     

 var c                 = spr.buildCluster([spr.getCellbyName('R1C1') , spr.getCellbyName('R2C2') ]);
     c.value           = '<b>Ortsbezeichnung<br>Breitbandversorgung</b>';
     c.backgroundColor = 'rgb(164, 218, 235)'; 

 for(var i=3; i<spr.rowCount+1; i++)
 { 
    c                 = spr.buildCluster([spr.getCell(1,i) , spr.getCell(2,i) ]);
    c.value           = 'Zeile ' + c.rowNr;
    c.backgroundColor = 'rgba(0,0,0,0.1)';
 }


 for(var i=2; i<spr.colCount; i++)
 { 
   var c1             = spr.getCell(i+1,1);
   var c2             = spr.getCell(i+1,2);
   var c              = spr.buildCluster([c1,c2]);
    c.value           = 'Spalte ' + c.colNr;
    c.backgroundColor = 'rgba(198, 243, 181, 1)';
 } 
}



export async function spreadSheet( content )
{ 
  var wnd   = dialogs.createWindow(null,'Auswertung Rechnung GLASCOM', '90%' , '90%' , 'CENTER' );
  var orte  = [];
  var rd    = [];
 

// Zuerst die Liste ALLER Orte und Ortsteile ermitteln....  -> (Y-Achse)
var orte = [];
var response = utils.webApiRequest('FETCHRECORDS' , {sql:"Select Distinct ORT,ORTSTEIL  From "+content+" Order by ORT,ORTSTEIL"} ); 
if (response.error) {dialogs.showMessage(response.errMsg); return }
else orte = response.result;

// Liste aller Spalten-Definition 
var response = utils.webApiRequest('FETCHRECORDS' , {sql:"Select *  From resultDefinition Order by ID"} ); 
if (response.error) {dialogs.showMessage(response.errMsg); return }
else rd = response.result;

// Spreadsheet erzeugen 
// es werden die ersten 2 Spalten und die obersten 3 Zeilen gruppiert (builCluster)
var spreadSheet                = new TFSreadSheet( wnd.hWnd , {layout:(rd.length+2)+"x"+(orte.length+3+1)} );
    spreadSheet.onCellDblClick = (cell)=>{ showCellDetails(cell) } 


var c1            = spreadSheet.getCellbyName('R1C1');
var c2            = spreadSheet.getCellbyName('R3C2');
var c             = spreadSheet.buildCluster([c1,c2]);
c.backgroundColor = 'rgba(200, 225, 248, 1)';

// Excel-Ausgabe ist kompliziert auf Grund des Zell-Verbundes
// Knopf erstmal ausblenden ....
//var excelBtn      = dialogs.addButton(c.obj,'',1,1,'7em','3em',{caption:'Excel',glyph:'table-cells'})
//    excelBtn.callBack_onClick = function(){this.spreadSheet.exportToExcel()}.bind({spreadSheet:spreadSheet})
   
var printBtn                  = dialogs.addButton(c.obj,'',1,1,'7em','3em',{caption:'Drucken',glyph:'print'})
    printBtn.callBack_onClick = function(){
                                            this.printButton.hide();
                                            utils.printContent(this.wnd.hWnd)
                                            this.printButton.show();
                                          }.bind({wnd:wnd,printButton:printBtn})


// und nun Zellenweise durch die Matrix....
// ersten beiden Spalten "mergen" und Ort/Ortsteil abbilden
for(var i=0; i<orte.length; i++)
{
  // "mergen" vorbereiten
   var c1             = spreadSheet.getCell(1,i+4);
   var c2             = spreadSheet.getCell(2,i+4);
   var c              = spreadSheet.buildCluster([c1,c2]);
   var h              = '';

   if(orte[i].ORTSTEIL != null) h = orte[i].ORT + ' / ' + orte[i].ORTSTEIL;
   else                         h = orte[i].ORT; 

   c.paddingLeft      = '1em';
   c.value            = h;
   c.backgroundColor  = 'rgba(198, 243, 181, 1)';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';

   // Zellen vorbereiten...
   // innerhalb der Zeile nun alle Spalten (=resultDefinition.length) durchlaufen und 
   for(var j=0; j<rd.length; j++) 
    {
      c= spreadSheet.getCell(j+3 , i+4); 
      if(c!=null)
      {           
        c.value   = '';
        c.dataObj = {TABLENAME:content, ORT:orte[i].ORT, ORTSTEIL:orte[i].ORTSTEIL, ORT_ORTSTEIL:h, resultDefinition:rd[j] };
      }  
    }   
}
// Kopfzeile -> zeilen "mergen" und farblich gestalten ...
for(var j=0; j<rd.length; j++)
{
   c1                 = spreadSheet.getCell(j+3,1);
   c2                 = spreadSheet.getCell(j+3,3);
   c                  = spreadSheet.buildCluster([c1,c2]);
   c.paddingLeft      = '1em';
   c.value            = rd[j].NAME;
   c.backgroundColor  = 'rgba(243, 239, 180, 1)';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';
}   


// Datenbereich: Durchlaufe für jeden Ort alle "ResultDefintionen" und prüfe, ob es für den gerade betrachteten Ort eine Definition gibt.
// Falls JA und es ist KEIN fixer Wert, dann ermittle für die gewählten Produkte die Summe aller definiereten Rechnungspositionen 
// d.h.: Eine Tabelle mit 10 Orten und 10 Spalten (resultDefinition) ergeben sich 100 sql's ... 
spreadSheet.forEachCell((cell)=>{
            if(cell.dataObj != null)
            {              
                        var cellContent          = '';
                        var produktArray         = JSON.parse(cell.dataObj.resultDefinition.PRODUKTE || '[]') || [];
                        var sqlFilter_Produkt    = produktArray.map(p => `'${p.replace(/'/g, "''")}'`) // einfache Anführungszeichen escapen
                                                                           .join(', ');

                        var rPosArray            =  JSON.parse(cell.dataObj.resultDefinition.RECHNUNGSPOS || '[]') || [];
                        var sumExpr              = rPosArray.filter(f => !f.includes('alle Rechnungspositionen')) // ausschließen
                                                            .map(f => `SUM(${f})`)                                // SQL-Ausdruck erzeugen
                                                            .join(' + ');   

                        var fixedValue           =  cell.dataObj.resultDefinition.FIXEDVALUE || '';
                        if(fixedValue=='0') fixedValue = '';

                        var ortArray             = JSON.parse(cell.dataObj.resultDefinition.ORTE || '[]') || [];
                        // ist der aktuelle Ort / Ortsteil der betrachteten Zelle in der resultDefinition enthalten ?
                        var istDieserOrtrelevant = ortArray.includes(cell.dataObj.ORT_ORTSTEIL);

                        if(istDieserOrtrelevant)
                        {
                           // existiert kein fixer Wert, muss "gerechnet" werden ...
                           if(!fixedValue)  
                           {
                             var sql = "SELECT " + sumExpr + " FROM " + content + " WHERE produkt IN ("+sqlFilter_Produkt+") AND ORT='"+cell.dataObj.ORT+"'";
                             // Falls noch ein Ortsteil existiert : Statement ergänzen ...
                             if(cell.dataObj.ORTSTEIL !=null ) sql = sql + " AND ORTSTEIL = '"+cell.dataObj.ORTSTEIL+"'"
                             var response = utils.webApiRequest('FETCHVALUE' , {sql:sql});
                             if (!response.error) cellContent = response.result;
                             else                 cellContent = '!'; 
                           }
                           else cellContent = fixedValue; 

                           cell.value = cellContent;
                           
                        }    
}});

// Formatierung mit Tausenderpunkt 
const fmt = new Intl.NumberFormat('de-DE');

// Summenzeile:
c1                 = spreadSheet.getCell(1, spreadSheet.rowCount );
c2                 = spreadSheet.getCell(2, spreadSheet.rowCount );
c                  = spreadSheet.buildCluster([c1,c2]);
   c.paddingLeft      = '1em';
   c.value            = 'Summe';
   c.backgroundColor  = wnd.hWnd.backgroundColor;
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';



for(var j=0; j<rd.length; j++)
{
   c1                 = spreadSheet.getCell( j+3 , 4 );                       // erste Zeile mit Werten (1..3 sind Überschrift)
   c2                 = spreadSheet.getCell( j+3 , spreadSheet.rowCount-1);   // letzte Zeile mit Werten 
   
   c                  = spreadSheet.getCell(j+3,spreadSheet.rowCount);        // letzte Zeile als Summe
 
   c.backgroundColor  = 'rgba(21, 173, 165, 0.28)';
   c.paddingLeft      = '1em';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';
   
   // Zu Testzwecke einfärben, um zu prüfen dass auch wirklich über den korrekten Bereich summiert wird ...
   //spreadSheet.range(c1,c2).forEach(c=>c.backgroundColor='rgba(136, 255, 0, 0.19)');

   c.value            = fmt.format( spreadSheet.summe(c1,c2) );
}   

}



function showCellDetails(cell)
// ein Fester mit SpreadSheet, um den Inhalt der angeklickten Zelle zu plausibilisieren ....
{
  if(cell.value=='')
  {
    dialogs.showMessage("Diese Konstellation aus Ort/Ortsteil - Produkt und Rechnungsposition liefert keine Treffer !");
    return;
  } 
  
  
  if(cell.dataObj.resultDefinition.FIXEDVALUE > 0)
  {
    dialogs.showMessage('Diese Menge ist das Ergebnis einer manuellen Eingabe für den Ort/Ortsteil und dem Vertragspartner !');
    return;
  }

  var wnd          = dialogs.createWindow(null,'Details für ' + cell.dataObj.ORT_ORTSTEIL, '77%' , '87%' , 'CENTER' );
  var produkte     = (JSON.parse(cell.dataObj.resultDefinition.PRODUKTE || '[]') || []).filter(f => !f.includes('alle Produkte'));
  var rechnPos     = (JSON.parse(cell.dataObj.resultDefinition.RECHNUNGSPOS || '[]') || []).filter(f => !f.includes('alle Rechnungspositionen'));
  var ort          = cell.dataObj.ORT;
  var content      = cell.dataObj.TABLENAME;
  var ortsteil     = cell.dataObj.ORTSTEIL;
  var ort_ortsteil = cell.dataObj.ORT_ORTSTEIL; 

// Spreadsheet erzeugen 
// es werden die ersten 2 Spalten und die obersten 3 Zeilen gruppiert (builCluster)
var spreadSheet   = new TFSreadSheet( wnd.hWnd , {layout:(rechnPos.length+2)+"x"+(produkte.length+3+1)} );

// per Defauld alle Zellen als invalid betrachten.
// Erst wenn im Zuge der Werte-Berechnung gültige Zahlen in die Zellen kopiert werden, wird valid true, damit die spätere Summenbildung nur die passenden Zellen verwendet
spreadSheet.forEachCell((cell)=>{cell.dataObj = {valid:false}} )

var c1            = spreadSheet.getCellbyName('R1C1');
var c2            = spreadSheet.getCellbyName('R3C2');
var c             = spreadSheet.buildCluster([c1,c2]);
c.backgroundColor = 'rgba(241, 241, 218, 1)';

// und nun Zellenweise durch die Matrix....
// ersten beiden Spalten "mergen" und Ort/Ortsteil abbilden
for(var i=0; i<produkte.length; i++)
{
  // "mergen" vorbereiten
   var c1             = spreadSheet.getCell(1,i+4);
   var c2             = spreadSheet.getCell(2,i+4);
   var c              = spreadSheet.buildCluster([c1,c2]);
   c.value            = produkte[i];
   c.paddingLeft      = '1em';
   c.backgroundColor  = 'rgba(161, 229, 238, 1)';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';

   // Zellen vorbereiten...
   // innerhalb der Zeile nun alle Spalten (=Rechnungspositionen.length) durchlaufen und 
   for(var j=0; j<rechnPos.length; j++) 
    {
      c= spreadSheet.getCell(j+3 , i+4); 
      if(c!=null)
      {           
        c.value   = '';
        c.dataObj = { ORT:ort, ORTSTEIL:ortsteil, RECHNUNGSPOS:rechnPos[j], PRODUKT:produkte[i] , valid:true};
      }  
    }   
}

// Kopfzeile -> zeilen "mergen" und farblich gestalten ...
for(var j=0; j<rechnPos.length; j++)
{
   c1                 = spreadSheet.getCell(j+3,1);
   c2                 = spreadSheet.getCell(j+3,3);
   c                  = spreadSheet.buildCluster([c1,c2]);
   c.paddingLeft      = '1em';
   c.value            = rechnPos[j]
   c.backgroundColor  = 'rgba(243, 239, 180, 1)';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';
}   


spreadSheet.forEachCell((cell)=>{
            if(cell.dataObj != null)
            {  
                var sql = "Select sum("+cell.dataObj.RECHNUNGSPOS+") from "+content+" Where PRODUKT='"+cell.dataObj.PRODUKT+"' AND Ort='"+cell.dataObj.ORT+"'";
                if(cell.dataObj.ORTSTEIL) sql = sql + " AND ORTSTEIL='"+cell.dataObj.ORTSTEIL+"'";
                var response = utils.webApiRequest('FETCHVALUE' , {sql:sql});
                if (!response.error) cell.value = response.result || '0';
                             else    cell.value = '!'; 
                             
            }
            if(cell.numValue()>0) cell.backgroundColor = 'rgba(35, 252, 234, 0.6)';    
           
});


// Summenzeile:
c1                 = spreadSheet.getCell(1, spreadSheet.rowCount );
c2                 = spreadSheet.getCell(2, spreadSheet.rowCount );
c                  = spreadSheet.buildCluster([c1,c2]);
   c.paddingLeft      = '1em';
   c.value            = 'Summe';
   c.backgroundColor  = 'rgba(0,0,0,0.14)';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';


for(var j=0; j<rechnPos.length; j++)
{
   c1                 = spreadSheet.getCell( j+3 , 4 );                       // erste Zeile mit Werten (1..3 sind Überschrift)
   c2                 = spreadSheet.getCell( j+3 , spreadSheet.rowCount-1);   // letzte Zeile mit Werten 
   
   c                  = spreadSheet.getCell(j+3,spreadSheet.rowCount);        // letzte Zeile als Summe
 
   c.backgroundColor  = 'rgba(21, 173, 165, 0.28)';
   c.paddingLeft      = '1em';
   c.fontWeight       = 'bold';
   c.justifyContent   = 'flex-start';
   
   // Zu Testzwecke einfärben, um zu prüfen dass auch wirklich über den korrekten Bereich summiert wird ...
   //spreadSheet.range(c1,c2).forEach(c=>c.backgroundColor='rgba(136, 255, 0, 0.19)');

   c.value            =  spreadSheet.summe(c1,c2);
}   

// Gesamtsumme:
var sum = 0;
spreadSheet.forEachCell((cell)=>{ if(cell.dataObj != null) 
                                     if(cell.dataObj.valid) sum = sum + cell.numValue(); });

c                  = spreadSheet.getCellbyName('R1C1');
c.paddingLeft      = '1em';
c.value            = 'Summe';
c.fontWeight       = 'bold';
c.justifyContent   = 'flex-start';
c.value = "Summe("+ort_ortsteil+") : " + sum;

}
