


import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";


import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";

import { TFMediaCollector } from "./tfMediaCollector.js";

var caption1  = '';
var caption2  = '';

export function main(capt1)
{
  caption1 = capt1;
  caption2 = '';
  
  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'Berechtigungen' , action:function(){sysadmin.adminGrants()} } );
  globals.sysMenu.push( {caption:'Info' , action:function(){app.sysInfo()} } );
  globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
  globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)' , action:function(){app.APItest()} } );
  globals.sysMenu.push( {caption:'GUI-Builder (nur in der Entwicklungsphase)' , action:function(){app.guiBuilder()} } );
  globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() } , true); //byePass während Entwicklung
  // run();
}  


export function run()
{
   var ws = app.startWebApp(caption1,caption2).activeWorkspace;
       ws.buildGridLayout("21x21")
      
   dialogs.addButton(ws.handle,"cssGrayButton",1,21,2,1,{caption:"Start MC",glyph:"solar-panel"})
          .callBack_onClick = function(){ new TFMediaCollector('100%' , '100%' , {parent:ws.handle} ) }  ;
}  