
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import {TFgui}             from "./tfWebApp/tfGUI.js";



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


var caption1  = '';
var caption2  = '';

var chartContainer   = null;
var listBoxContainer = null;
var fktListBox       = null;
var chart            = null;


export function main(capt1)
{
  caption1 = capt1;
  caption2 = '';
  
  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)' , action:function(){app.guiBuilder()} } );
  globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() });
  
}  


function run()
{ 
   //  document.document.requestFullscreen();

    var ws = app.startWebApp(caption1,caption2).activeWorkspace;
    
    var gui = new TFgui(ws.handle , 'fktPlotter' );

    listBoxContainer = gui.listBoxContainer;
    chartContainer   = gui.chartContainer;

    gui.btnAddFunction.callBack_onClick = function(){addFunction()}
    gui.btnRun.callBack_onClick         = function(){drawFunction()}
    
    gui.btn.callBack_onClick = function() {alert(gui.dani.value)};
    updateFunctions();
}

function addFunction()
{
  var w            = dialogs.createWindow(null , "Funktionseingabe","50%","50%","CENTER");
  var g            = new TFgui(w.hWnd , 'fktInput' );
  var editFunction = g.editFunction;
      g.btnAbort.callBack_onClick = function(){this.wnd.close()}.bind({wnd:w})


      g.btnOk.callBack_onClick = function() {
                                              utils.insertIntoTable('mathFunctions',{TERM:this.editFunction.value});
                                              updateFunctions();
                                              this.wnd.close();
      }.bind({wnd:w, editFunction:editFunction})

}


function updateFunctions()
{
   if(fktListBox!=null) fktListBox = null;

  var fkt      = []; 
  var response = utils.fetchRecords('Select * from mathFunctions order by ID desc'); 
  if(!response.error)
    for(var i=0; i<response.result.length; i++) fkt.push({caption:response.result[i].TERM, value:false}) 

  fktListBox = dialogs.addListCheckbox(listBoxContainer,fkt,{});

}


function drawFunction()
{
   if(chart!=null) {chart.destroy(); chart = null;}

   var fkts = fktListBox.getSelectedItems();
   if (fkts.length==null) { dialogs.showMessage('Bitte eine Funktion auswählen !'); return }
     
    // Chart erzeugen....
    chart = new TFChart( chartContainer , 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'SPLINE_NO_POINTS'} );
     
    // alle Funktionen der CheckListBox durchlaufen
    for(var i=0; i<fkts.length; i++ )
    {
       var fkt    = fkts[i];
       var values = [];
       var series = chart.addSeries(fkt.caption ||fkt.text , utils.randomColor() );
       var expr   = math.parse(fkt.caption ||fkt.text);
       var code   = expr.compile();
   
       for(var x=-10; x<11; x=x+0.01) values.push({ x:x , y:code.evaluate({ x: x })}); 

       chart.addPoint(series , values);
    }    
  }                   
                                          



