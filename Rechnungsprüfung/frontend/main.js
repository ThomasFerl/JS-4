
import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";


// Anwendungsspezifische Einbindungen
import { TFEdit, 
         TForm,
         TFPopUpMenu,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";
import {TFgui}           from "./tfWebApp/tfGUI.js";


var caption1   = '';
var caption2   = '';
var guiMainWnd = null;


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


export function run()
{ 
  var ws     = app.startWebApp(caption1,caption2).activeWorkspace;

  guiMainWnd = new TFgui( ws.handle , 'rechnungspruefungMain' );

} 


function updateView()
{
  dialogs.createTable( guiMainWnd.gridContainer , [{Name:"Ferl",Vorname:"Thomas",gebDatum:"29.10.1966"},
                                                   {Name:"Mustermann",Vorname:"Max",gebDatum:"01.01.2000"},
                                                   {Name:"Schmidt",Vorname:"Klaus",gebDatum:"15.03.1975"}] , '' , ''); 
}
  
    
 

