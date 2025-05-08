

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import { TFScreen    }   from "./tfWebApp/tfObjects.js";
import { TFWorkSpace }   from "./tfWebApp/tfObjects.js";
import { TBanf       }   from "./banf.js";
import { TBanfHead   }   from "./banfHead.js";
import { TFDateTime  }   from "./tfWebApp/utils.js";    

var caption1  = '';
var caption2  = '';
var mainSpace = {};

var menuContainerTop    = null;
var menuContainerBottom = null;
var dashBoardTop        = null;
var dashBoardBottom     = null;

var selectedBanf        = null;
var selectedBanfHead    = null;



export function main(capt1,capt2)
{
  caption1 = capt1;
  caption2 = capt2;
  
  app.login( run );
  //run();
}  




export function run()
{
   
    var ws = new TFWorkSpace('mainWS' , caption1,caption2 );

    var l  = dialogs.setLayout( ws.handle , {gridCount:27,head:2} )
  
    menuContainerTop                 = l.head;

    menuContainerTop.backgroundColor = 'gray';
    menuContainerTop.buildGridLayout_templateColumns('14em 1em 14em 1em 14em 1fr');
    menuContainerTop.buildGridLayout_templateRows('1fr');

    var btn11 = dialogs.addButton( menuContainerTop , "" , 1 , 1 , 1 , 1 , {caption:"neue Banf vorbereiten",glyph:"circle-plus"}  )
    btn11.callBack_onClick = function() { addBanfHead() };
    btn11.heightPx = 40;
    btn11.marginTop   = 4;

    var btn21 = dialogs.addButton( menuContainerTop , "" , 3 , 1 , 1 , 1 , {caption:"Banf bearbeiten",glyph:"pencil"}  )
    btn21.callBack_onClick = function() { editBanfHead() };
    btn21.heightPx = 40;
    btn21.margin   = 4;

    var btn31 = dialogs.addButton( menuContainerTop , "cssAbortBtn01" , 5 , 1 , 1 , 1 , {caption:"Banf löschen",glyph:"circle-minus"}  )
    btn31.callBack_onClick = function() { delBanfHead() };
    btn31.heightPx = 40;
    btn31.margin   = 4;
    



    // Dashboad horizontal aufteilen: 1/3 für Kopf-Datensätze und 2/3 für Banf-Datensätze
    var h1          = l.dashBoard;
    h1.buildGridLayout_templateColumns('1fr');
    h1.buildGridLayout_templateRows('1fr 1fr 1fr');
    dashBoardTop    = dialogs.addPanel( h1 , "cssContainerPanel" , 1 , 1 , 1 , 1 );
    
    // das untere Panel benötigt noch einen Menü-Container von 4em
    var h2 = dialogs.addPanel( h1 , "cssContainerPanel" , 1 , 2 , 1 , 2 );
    h2.buildGridLayout_templateColumns('1fr');
    h2.buildGridLayout_templateRows('4em 1fr'); 
    menuContainerBottom = dialogs.addPanel( h2 , "cssContainerPanel" , 1 , 1 , 1 , 1 );
    menuContainerBottom.backgroundColor = 'gray';
    menuContainerBottom.buildGridLayout_templateColumns('4em 0.4em 4em 0.4em 4em 1fr');
    menuContainerBottom.buildGridLayout_templateRows('1fr');

    dashBoardBottom    = dialogs.addPanel( h2 , "" , 1 , 2 , 1 , 1 );
   
  var btn1 = dialogs.addButton( menuContainerBottom , "" , 1 , 1 , 1 , 1 , {glyph:"plus"}  )
      btn1.callBack_onClick = function() { addBanf() };
      btn1.heightPx = 44;
      btn1.widthPx  = 47;
      

  var btn2 = dialogs.addButton( menuContainerBottom , "" , 3 , 1 , 1 , 1 , {glyph:"pen-to-square"} )
      btn2.callBack_onClick = function() { editBanf() };
      btn2.heightPx = 44;
      btn2.widthPx  = 47;
    

  var btn3 = dialogs.addButton( menuContainerBottom , "cssAbortBtn01" , 5 , 1 , 1 , 1 , {glyph:"minus"}   )
      btn3.callBack_onClick = function() { delBanf() };
      btn3.heightPx = 44;
      btn3.widthPx  = 47;
     

      updateViewHead();
      updateView()
}      


function updateView()
{
  dashBoardBottom.innerHTML = ""; // clear the dashboard
  if(!selectedBanfHead) return;

  var response = utils.webApiRequest('LSBANF' , {ID_HEAD:selectedBanfHead.ID} );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( dashBoardBottom , response.result , ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO','ANFORDERER'] , [] );
  grid.onRowClick=function( selectedRow , itemIndex , jsonData ) { selectBanf(jsonData) };
  grid.onRowDblClick=function( selectedRow , itemIndex , jsonData ) { editBanf(jsonData) };
}

function updateViewHead()
{ debugger;
  dashBoardTop.innerHTML = ""; // clear the dashboard
  var response = utils.webApiRequest('LSBANFHEAD' , {} );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( dashBoardTop , response.result , ['ID','OWNER'] , [] );
  grid.onRowClick=function( selectedRow , itemIndex , jsonData ) { selectBanfHead(jsonData) };
  grid.onRowDblClick=function( selectedRow , itemIndex , jsonData ) { editBanfHead(jsonData) };
}


function selectBanfHead(p)
{ 
  selectedBanfHead = p;
  updateView()
}

function selectBanf(p)
{ 
  selectedBanf = p;
}

function addBanf()
{
  if(!selectedBanfHead) {dialogs.showMessage('Bitte zuerst eine BANF-Vorlage erstellen/auswählen !'); return;}
 
  var maxPos = utils.webApiRequest('MAXPOS' , {ID_HEAD:selectedBanfHead.ID} ).result;
  
  try { maxPos = parseInt(maxPos); } catch(e) { maxPos = 0; }
  if(isNaN(maxPos)) { maxPos = 0; }
  maxPos = maxPos + 10;
  var maxPosText = maxPos.toString();
  
  var   aBanf = { 
                 ID	                  : 0,
                 ID_HEAD              : selectedBanfHead.ID,
                 POSITIONSTEXT        : maxPosText,
                 MENGE                : 1,
                 MENGENEINHEIT        : '',
                 PREIS                :  0,
                 WARENGRUPPE          : '',
                 LIEFERDATUM          : new TFDateTime().incDay(7).formatDateTime('yyyy-mm-dd'),
                 LIEFERANT            : "",
                 WERK                 : "EMS",
                 EINKAEUFERGRUPPE     : "183",
                 EINKAUFSORGANISATION : "",
                 ANFORDERER           : globals.userName,
                 BEMERKUNG            : "",
                 SACHKONTO            : "",
                 AUFTRAG              : "",
                 OWNER                : "",
               };

        var b = new TBanf(aBanf);
        b.edit( function(){ updateView() } );
}

function editBanf()
{ 
 if(!selectedBanf) {dialogs.showMessage('Bitte zuerst eine BANF auswählen!'); return;}
 
 var b = new TBanf( selectedBanf );
     b.edit( function(){ updateView() } );
} 

function delBanf()
{}



function addBanfHead()
{ 
    var   aBanfHead = { 
                   ID	                  : 0,
                   NAME                 : '',
                   BESCHREIBUNG         : '',
                   DATUM                : new TFDateTime().formatDateTime('yyyy-mm-dd'),
                   OWNER                : "",
                 };
  
          var b = new TBanfHead(aBanfHead);
          b.edit( function(){ updateViewHead() } );
  
}

function editBanfHead()
{ 
 if(!selectedBanfHead) {dialogs.showMessage('Bitte zuerst eine BANF auswählen!'); return;}
 
 var b = new TBanfHead( selectedBanfHead );
     b.edit( function(){ updateViewHead() } );
} 

function delBanfHead()
{ 
  if(!selectedBanfHead) {dialogs.showMessage('Bitte zuerst eine BANF auswählen!'); return;}
  
  dialogs.ask('Banf löschen','Wollen Sie die Banf-Vorlage "'+selectedBanfHead.NAME+'"  wirklich löschen?', function yes(){__deleteHead(this)}.bind(selectedBanfHead) ); 
}

function __deleteHead(banfHead)
{
  var response = utils.webApiRequest('DELETEBANFHEAD' , {ID:banfHead.ID} );
  if(response.error) {dialogs.showMessage(response.errMsg) }
  updateViewHead();
}
