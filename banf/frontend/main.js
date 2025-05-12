

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";
import { TBanf       }   from "./banf.js";
import { TBanfHead   }   from "./banfHead.js";
import { TFDateTime  }   from "./tfWebApp/utils.js";    
import { TFEdit } from "./tfWebApp/tfObjects.js";

var caption1  = '';
var caption2  = '';


var menuContainerTop    = null;
var menuContainerBottom = null;
var dashBoardTop        = null;
var dashBoardBottom     = null;
var userSelection       = null;

var selectedBanf        = null;
var selectedBanfHead    = null;
var selectedUser        = '';



export function main(capt1)
{
  caption1 = capt1;
  caption2 = '';
  
  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'Berechtigungen' , action:function(){sysadmin.adminGrants()} } );
  globals.sysMenu.push( {caption:'Info' , action:function(){app.sysInfo()} } );
  globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
  globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  // Die Anmeldung ist ein Alptraum...
  // Es wird zunächst versucht, den angemeldeten System-User zu ermitteln
  // wird ein Benutzer gefunden, soll dieser sofort starten, ohne sich erneut anmelden zu müssen. 
  // Damit die Session und Grant :ogik funktioniert, muss der UserName auch lokal hinterlegt sein
  // Dieser hat jedoch kein Passwort und soll sich auf normalem Wege nicht anmelden können

  // Falls aber EXPLIZIT ein Login-Dialog gewünscht ist, um z.B. den AdminUser zu aktivieren,
  // dann muss in der URL hinter dem "/" /?admin=true angehängt werden
  if (window.location.search.includes('admin=true') || window.location.hash.includes('#admin')) 
  {
     app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() });
     return;
  }

  // Zuerst anfragen, ob User in NT-Domäne ist und wir seinen Namen verwenden können
  // über /ntlm werden die Daten des Users abgerufen .....
  // und in globals.userName gespeichert
  var usrName  = '';
  var response = utils.webRequest( globals.getServer() + '/ntlm' );
  if(!response.error) usrName = response.result.username; 

  // Wenn Username gesetzt, dann nahtlos fortsetzen ohne Login-Dialog
  if (usrName) 
  { debugger;
    // ntlm-Anmeldung am Server um Session zu erhalten...
    var url      = globals.getServer()+'/ntlmLogin/'+usrName;
    var response = utils.webRequest( url );
    if(!response.error)
      if(!response.result.error)
       {
         globals.startSession( response.result.session ,
                               usrName ,
                               response.result.userID ,
                               response.result.grants , 
                               response.result.user.admin
                            );
    }                  
    caption2 = 'Willkommen ' + usrName;
    
    run();
    return;
  }

  // andernfalls erfolgt ein Login-Dialog  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() });

}  




export function run()
{ 
    var ws = app.startWebApp(caption1,caption2).activeWorkspace;

    var l  = dialogs.setLayout( ws.handle , {gridCount:27,head:2} )
  
    menuContainerTop                 = l.head;

    menuContainerTop.backgroundColor = 'gray';
    menuContainerTop.buildGridLayout_templateColumns('14em 1em 14em 1em 14em 14em 21em 2em 1fr');
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

    if(globals.hasAccess('banfAdmin'))
    {  
      var response = utils.webApiRequest('LSBANFUSER' , {} );
      response.result.unshift("alle Benutzer");
      userSelection = new TFEdit( menuContainerTop ,  7 , 1 , 1 , 1 , {caption:"Benutzer" , labelPosition:"top" , lookUp:true , items:response.result} );
      userSelection.callBack_onChange = function( v ) {  };

      var btn41 = dialogs.addButton( menuContainerTop , "" , 8 , 1 , 1 , 1 , {glyph:"check"}  );
      btn41.height ="2em";
      btn41.marginTop = "1em";
      btn41.callBack_onClick = function() {
                                            selectedUser = userSelection.value || ""; 
                                            if(selectedUser.toUpperCase() == 'ALLE BENUTZER') { selectedUser = "" }
                                            updateViewHead();
                                         }  
      }

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
    menuContainerBottom.buildGridLayout_templateColumns('4em 0.4em 4em 0.4em 4em 1fr 4em 0.4em');
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

  var btn3 = dialogs.addButton( menuContainerBottom , "" , 7 , 1 , 1 , 1 , {caption:"Export" , glyph:"hand-holding"}   )
      btn3.callBack_onClick = function() { exportBanf() };
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
{
  dashBoardTop.innerHTML = ""; // clear the dashboard
  var param = {};
  
  // falls normaler User, dann nur meine eigenen BANFs
  if (userSelection==null) param.OWNER = globals.session.userName;
  else if(selectedUser) param.OWNER = selectedUser;
      
  var response = utils.webApiRequest('LSBANFHEAD' ,param );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( dashBoardTop , response.result , ['ID','OWNER'] , [] );
  grid.onRowClick=function( selectedRow , itemIndex , jsonData ) { selectBanfHead(jsonData) };
  grid.onRowDblClick=function( selectedRow , itemIndex , jsonData ) { editBanfHead(jsonData) };
}


function exportBanf()
{
    dialogs.showMessage('Export-Funktion ist noch nicht implementiert! Erst wenn die Feld-Reihenfolge definiert ist, werden die Daten entsprechend in der Zwischenablage aufbereitet.');
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
                 OWNER                : globals.session.userName
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
                   OWNER                : globals.session.userName
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
