

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";


import { TBanf       }   from "./editBanf.js";
import { TBanfHead   }   from "./banfHead.js";
import { TBanfExport }   from "./banfExport.js";
import { TFDateTime  }   from "./tfWebApp/utils.js";  

import * as forms        from "./forms.js";
import { TFgui }         from "./tfWebApp/tfGUI.js";

let banfAdmin           = false;

var selectedBanf        = null;
var selectedBanfHead    = null;
var selectedUser        = '';
var gui                 = {};



export function run(ws)
 { 
    banfAdmin = globals.hasAccess('banfAdmin');

    gui = new TFgui( ws.handle , forms.BanfMainWnd );
   
    gui.btnAddBanfHead.callBack_onClick    = function() { addBanfHead() };
    gui.btnEditBanfHead.callBack_onClick   = function() { editBanfHead() };
    gui.btnDeleteBanfHead.callBack_onClick = function() { delBanfHead() };

    //nur der BANF-Admin darf alle BANFs aller Benutzer sehen, normale User nur ihre eigenen BANFs
    if(!banfAdmin)
    {
         gui.selectUser.hide()
         gui.btnSelectUser.hide();
         gui.btnFreigabe.callBack_onClick       = function() { startWorkflow() };
    } else  
          {  
             gui.btnFreigabe.callBack_onClick       = function() { exportBanf() };
             var response = utils.webApiRequest('LSBANFUSER' , {} );
             gui.selectUser.addItem("alle Benutzer");
             gui.selectUser.addItems(response.result); 
             gui.selectUser.callBack_onChange   = function( v ) {  };
             gui.btnSelectUser.callBack_onClick = function() 
                                          { 
                                            selectedUser = gui.selectUser.value || ""; 
                                            if(selectedUser.toUpperCase() == 'ALLE BENUTZER') { selectedUser = "" }
                                            updateViewHead();
                                         };  
      }

      gui.btnAddBanf.callBack_onClick    = function() { addBanf() };
      gui.btnEditBanf.callBack_onClick   = function() { editBanf() };
      gui.btnDeleteBanf.callBack_onClick = function() { delBanf() };

      updateViewHead();
      updateView()
}      


function updateView()
{
  gui.gridContainerBanf.innerHTML = ""; // clear the dashboard
  if(!selectedBanfHead) return;

  var response = utils.webApiRequest('LSBANF' , {ID_HEAD:selectedBanfHead.ID} );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( gui.gridContainerBanf , response.result , ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO','ANFORDERER'] , [] );
  grid.onRowClick    =function( selectedRow , itemIndex , jsonData ) { selectBanf(jsonData) };
  grid.onRowDblClick =function( selectedRow , itemIndex , jsonData ) { editBanf(jsonData) };
}


function updateViewHead()
{
  gui.gridContainerBanfHead.innerHTML = ""; // clear the dashboard
  var param = {};
  
  // falls normaler User, dann nur meine eigenen BANFs
  if (!banfAdmin) param.OWNER = globals.session.userName;
  else if(selectedUser) param.OWNER = selectedUser;
      
  var response = utils.webApiRequest('LSBANFHEAD' ,param );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( gui.gridContainerBanfHead , response.result , ['ID','OWNER'] , [] );
  grid.onRowClick    =function( selectedRow , itemIndex , jsonData ) { selectBanfHead(jsonData) };
  grid.onRowDblClick =function( selectedRow , itemIndex , jsonData ) { editBanfHead(jsonData) };
  updateView();
}


function exportBanf()
{
    //dialogs.showMessage('Export-Funktion ist noch nicht implementiert! Erst wenn die Feld-Reihenfolge definiert ist, werden die Daten entsprechend in der Zwischenablage aufbereitet.');
    
    if(!selectedBanfHead) {dialogs.showMessage('Bitte zuerst eine BANF-Vorlage auswählen!'); return;}
    
    var b = new TBanfExport( selectedBanfHead );
    if(!b.ok) {dialogs.showMessage('Fehler beim Laden der Export-Funktion!'); return;}

    b.exportToClipboard();
}


function startWorkflow()
{
  dialogs.showMessage('workflow zum Starten des Freigabeprozesses ist noch nicht vollständig implementiert! ');
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
  maxPos = (Math.floor(maxPos/10)*10) + 10;
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
                 ANFORDERER           : globals.session.userName,
                 BEMERKUNG            : "",
                 SACHKONTO            : "",
                 AUFTRAG              : "",
                 OWNER                : globals.session.userName
               };

        var b          = new TBanf(aBanf);
            b.banfHead = selectedBanfHead;  
            b.edit( function(){ updateView() } );
}


function editBanf()
{ 
 if(!selectedBanf) {dialogs.showMessage('Bitte zuerst eine Banf-Position auswählen!'); return;}
 var b          = new TBanf( {ID:selectedBanf.ID} );
     b.banfHead = selectedBanfHead;
     b.edit( function(){ updateView() } );
} 


function __deleteBanfPosition(banf)
{ 
  var response = utils.webApiRequest('DELETEBANF' , {ID:banf.ID} );
  if(response.error) {dialogs.showMessage(response.errMsg) }
  selectedBanf = null;
  updateView();
}



function delBanf()
{
  if(!selectedBanf) {dialogs.showMessage('Bitte zuerst die zu löschende Position auswählen!'); return;}
 
  dialogs.ask('Banf-Position löschen','Wollen Sie die Banf-Position: "'+selectedBanf.POSITIONSTEXT+'"  wirklich löschen?', function yes(){__deleteBanfPosition(this)}.bind(selectedBanf) );
}



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
  selectedBanfHead = null;
  updateViewHead();
}
