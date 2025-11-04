
import * as globals      from "./tfWebApp/globals.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";

import { TFSreadSheet}   from "./tfWebApp/tfSpreadSheet.js";


// Anwendungsspezifische Einbindungen
import { rpGlasCOM}      from "./rechnungsPruefung_GLASCOM.js";


var caption1           = '';
var caption2           = '';

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
  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() } , true);  // kein Bypass
   
}  


export async function run()
{ 
  var ws       = app.startWebApp(caption1,caption2).activeWorkspace;

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
  
    /*
    
  spr.getCellbyName('R1C1').value = 'Produkt';     
  spr.getCellbyName('R1C3').value = 'Firma';     
  spr.getCell(1,1).backgroundColor = 'green';
  spr.getCell(4,4).backgroundColor = 'green';

  spr.buildCluster([spr.getCellbyName('R2C2') , spr.getCellbyName('R3C3') ]).value = 'CLUSTER';
*/


 var c                 = spr.buildCluster([spr.getCellbyName('R1C1') , spr.getCellbyName('R2C2') ]);
     c.value           = '<b>Ortsbezeichnung<br>Breitbandversorgung</b>';
     c.backgroundColor = 'rgb(164, 218, 235)'; 

 for(var i=3; i<spr.rowCount+1; i++)
 { 
    c                 = spr.buildCluster([spr.getCell(1,i) , spr.getCell(2,i) ]);
    c.value           = 'Zeile ' + c.rowNr;
    c.backgroundColor = 'rgba(0,0,0,0.1)';
 } 
 console.clear();
 debugger;
 for(var i=1; i<spr.colCount+1; i++)
 { 
   var c1 = spr.getCell(i,1);
   console.log('c1:'+c1.cellName)

   var c2 = spr.getCell(i,2);
   console.log('c2:'+c2.cellName)



    c                 = spr.buildCluster([c1,c2]);
    c.value           = 'Spalte ' + c.colNr;
    c.backgroundColor = 'rgba(198, 243, 181, 1)';
 } 


return;



  ws.buildGridLayout("21x21")
  var btn= dialogs.addButton(ws.handle,"",1,21,2,1,{caption:"Start",glyph:"table-list"});
      btn.backgroundColor = 'gray';
      btn.callBack_onClick = function(){  new rpGlasCOM(); } ;  

  ws.handle.DOMelement.style.backgroundImage='url("'+globals.backgroundImage+'")';
  ws.handle.DOMelement.style.backgroundSize ='cover';
  
  new rpGlasCOM();
} 

