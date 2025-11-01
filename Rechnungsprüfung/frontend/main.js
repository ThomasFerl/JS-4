
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
  var sd  = {
              head :   'x x x x x x x x x x', 
              rows : [ 'x x x x x x x x x x',
                       'x x x x x x x x x x',
                       'x x x x x x x x x x',
                       'x x x x x x x x x x',
                       'x x x x x x x x x x']
            };

  var spr = new TFSreadSheet( wnd.hWnd , sd );
  var c = null;
  for(var row=1; row<spr.rowCount; row++)
      for(var col=1; col<spr.colCount; col++)  c=spr.cells[col][row]   //spr.cells[col][row].value = col+'/'+row;   
  


return;



  ws.buildGridLayout("21x21")
  var btn= dialogs.addButton(ws.handle,"",1,21,2,1,{caption:"Start",glyph:"table-list"});
      btn.backgroundColor = 'gray';
      btn.callBack_onClick = function(){  new rpGlasCOM(); } ;  

  ws.handle.DOMelement.style.backgroundImage='url("'+globals.backgroundImage+'")';
  ws.handle.DOMelement.style.backgroundSize ='cover';
  
  new rpGlasCOM();
} 

