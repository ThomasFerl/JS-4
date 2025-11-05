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
  var sd = {layout:'10x10'}

  var spr = new TFSreadSheet( wnd.hWnd , sd );

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
  var wnd = dialogs.createWindow(null,'Auswertung Rechnung GLASCOM', '90%' , '90%' , 'CENTER' );

// Zuerst die Liste ALLER Orte und Ortsteile ermitteln....
var orte = [];
var response = utils.webApiRequest('FETCHRECORDS' , {sql:"Select Distinct ORT,ORTSTEIL  From "+content+" Order by ORT,ORTSTEIL"} ); 
if (response.error) {dialogs.showMessage(response.errMsg); return }
for (var i=0; i<response.result.length; i++)
    {
      var h='';
      if(response.result[i].ORTSTEIL != 'null') h = response.result[i].ORT + ' / ' + response.result[i].ORTSTEIL;
      else h = response.result[i].ORT;
      orte.push({ort:response.result[i].ORT,ortsteil:response.result[i].ORTSTEIL,caption:h})  
    } 

var spreadSheet = new TFSreadSheet( wnd.hWnd , {layout:"21x"+(orte.length+2)} );

for(var i=0; i<orte.length; i++)
{
   var c1             = spreadSheet.getCell(1,i+3);
   var c2             = spreadSheet.getCell(3,i+3);
   var c              = spreadSheet.buildCluster([c1,c2]);
    c.paddingLeft     = '1em';
    c.value           = orte[i].caption;
    c.backgroundColor = 'rgba(198, 243, 181, 1)';
    c.fontWeight      = 'bold';
    c.justifyContent  = 'flex-start';
}    








}

