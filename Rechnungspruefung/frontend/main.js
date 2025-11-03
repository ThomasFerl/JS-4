
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

  var wnd = dialogs.createWindow(null,'SpreadSheet', '50%' , '50%' , 'CENTER' );


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
var sd  = {
              head :   '5x . . . . . . . 5x', 
              rows :  '100*[4x . . . x x x x x x]'
            };





  var spr = new TFSreadSheet( wnd.hWnd , sd );
  var c = null;
  for(var row=0; row<spr.rowCount; row++)
      for(var col=0; col<spr.colCount; col++)
         { 
           c=spr.getCell(col,row);
           if(c != null){
              c.value = c.cellName;   
              if(row==col) c.backgroundColor = 'rgba(0,0,0,0.1)';
           }  
         }  
  
    c = spr.getCellbyName('R2C1');
  if(c) c.value = 'Thomas Ferl';     
  

return;



  ws.buildGridLayout("21x21")
  var btn= dialogs.addButton(ws.handle,"",1,21,2,1,{caption:"Start",glyph:"table-list"});
      btn.backgroundColor = 'gray';
      btn.callBack_onClick = function(){  new rpGlasCOM(); } ;  

  ws.handle.DOMelement.style.backgroundImage='url("'+globals.backgroundImage+'")';
  ws.handle.DOMelement.style.backgroundSize ='cover';
  
  new rpGlasCOM();
} 

