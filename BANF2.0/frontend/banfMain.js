

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";


import { TBanf       }   from "./editBanf.js";
import { TBanfHead   }   from "./banfHead.js";
import { TBanfExport }   from "./banfExport.js";
import { TFDateTime  }   from "./tfWebApp/utils.js";  

import * as forms        from "./forms.js";
import { TFgui }         from "./tfWebApp/tfGUI.js";

import * as symbols from "./tfWebApp/symbols.js";


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
    //gui.btnDeleteBanfHead.callBack_onClick = function() { delBanfHead() };
    gui.btnDeleteBanfHead.callBack_onClick = function() { dialogs.showMessage(symbols.usedSymbols.join(" ")); console.log(symbols.usedSymbols)};



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
      updateView();

// ggf. bei Neuanmeldung ein mail senden ....
// Da die email vorhanden sein muss, um entsprechende Workflows zu gewährleisten,
// Wird geprüft, ob der gerade angemeldete Anwender bereits eine mailAdresse besitzt
// Fall nicht, wird diese Mail generiert - selbst wenn es sich nicht wirklich um eine 
// NeuAnmeldung handelt ...
debugger;

var usr = utils.webApiRequest('USER',{userId:globals.session.userID}).result;
if(usr.EMAIL=='')
{
  var mailAddr = utils.webApiRequest('SYSADMINMAILADDR',{}).result;
  
  if(mailAddr)
    for(var i=0; i<mailAddr.length; i++)
    {
      var mail = {
             from        : "banfProcess@e-ms.de",
             to          :  mailAddr[i].EMAIL,
             subject     : "Bitte e-Mail für BANF-Tool-Benutzer nachpflegen",
             text        : "",
             html        : HTMLTemplateElement_newUser( usr ),
            attachments : []
             }                                                     
          utils.webApiRequest('SENDMAIL', {mail:mail} );        
    }     
  }
}      


async function updateView()
{
  gui.gridContainerBanf.innerHTML = ""; // clear the dashboard
  if(!selectedBanfHead) return;

  var response = utils.webApiRequest('LSBANF' , {ID_HEAD:selectedBanfHead.ID} );
  if(response.error) {await dialogs.showMessageSync(response.errMsg);return; }
  var grid = dialogs.createTable( gui.gridContainerBanf , response.result , ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO','ANFORDERER'] , [{STATE:"Status"}] );
  grid.onRowClick    =function( selectedRow , itemIndex , jsonData ) { selectBanf(jsonData) };
  grid.onRowDblClick =function( selectedRow , itemIndex , jsonData ) { editBanf(jsonData) };
}


async function updateViewHead()
{
  gui.gridContainerBanfHead.innerHTML = ""; // clear the dashboard
  var param = {};
  
  // falls normaler User, dann nur meine eigenen BANFs
  if (!banfAdmin) param.OWNER = globals.session.userName;
  else if(selectedUser) param.OWNER = selectedUser;
      
  var response = utils.webApiRequest('LSBANFHEAD' ,param );
  if(response.error) {await dialogs.showMessageSync(response.errMsg);return; }
  var grid = dialogs.createTable( gui.gridContainerBanfHead , response.result , ['ID','OWNER'] , [] );
  grid.onRowClick    =function( selectedRow , itemIndex , jsonData ) { selectBanfHead(jsonData) };
  grid.onRowDblClick =function( selectedRow , itemIndex , jsonData ) { editBanfHead(jsonData) };
  updateView();
}


async function exportBanf()
{ 
    if(!selectedBanfHead) {await dialogs.showMessageSync('Bitte zuerst eine BANF-Vorlage auswählen!'); return;}
    
    var b = new TBanfExport( selectedBanfHead );
    if(!b.ok) {await dialogs.showMessageSync('Fehler beim Laden der Export-Funktion!'); return;}

    // Adresse des Banf-Owners ermitteln ....
     var mailAddr =  utils.webApiRequest('FETCHVALUE', {etc:true, sql:"Select EMAIL from User Where USERNAME='"+selectedBanfHead.OWNER+"'"} ).result;

    try 
    {
       await b.exportToClipboard();
       utils.webApiRequest('UPDATETABLE', {tableName:"banfHead" , ID_field:"ID" , ID_value:selectedBanfHead.ID  , fields:{STATE:"exportiert"}} );   
       updateViewHead(); 

       if(!mailAddr) await dialogs.showMessageSync("Eine Bestätigungs-Mail kann nicht versendet werden, da dem Bentzer '"+selectedBanfHead.OWNER+"' noch keine Mail-Addresse zugewiesen wurde.");
       else{
              var mail = {
                            from        : "banfProcess@e-ms.de",
                            to          : mailAddr,
                            subject     : "Ihre BANF-Vorlage wurde an da SAP übergeben",
                            text        : "",
                            html        : HTMLTemplateElement_export(
                                                                      selectedBanfHead.OWNER ,
                                                                      globals.session.userName,
                                                                      selectedBanfHead.DATUM,
                                                                      selectedBanfHead.NAME + " (" + selectedBanfHead.BESCHREIBUNG + ")" ,
                                                                      new TFDateTime(new Date()).formatDateTime('dd.mm.yyyy hh:mn:ss')
                                                                    ),
                            attachments : []
                    }
               utils.webApiRequest('SENDMAIL'   , {mail:mail} );        
           }   
     }
     catch(err) 
     {
        console.log("Export abgebrochen:", err); 
     }
}     


async function startWorkflow()
{
  if(!selectedBanfHead) {await dialogs.showMessageSync('Bitte zuerst eine BANF-Vorlage auswählen!'); return;}

// für die spätere mail - Details zur BANF-Vorlage ermitteln...
var banf = {
             bezeichnung: selectedBanfHead.NAME + ' ('+selectedBanfHead.BESCHREIBUNG+')' , 
             owner      : selectedBanfHead.OWNER,
             posAnz     : 4
           }
  var gui = new TFgui( null , forms.sendBanf , {caption:'Banf-Vorlage versenden'});

  var response = utils.webApiRequest('LSUSER', {forGrantObj:"banfAdmin"} );
  if (response.error) {await dialogs.showMessageSync(response.errMsg); return; }
  if (response.result.length==0)  {await dialogs.showMessageSync("Es wurde noch keinem Benutzer die Rolle 'banfAdmin' zugewiesen !" ); return; }

  for(var i=0; i<response.result.length; i++)
  {
    var u = response.result[i];
    if(u.EMAIL)
    gui.selectAdress.addItem( {caption:u.FIRSTNAME+' '+u.LASTNAME, value:u.EMAIL} )
  }

  if (gui.selectAdress.items.length==0)  {await dialogs.showMessageSync("Es existiert kein banfAdmin mit gültiger e-mail-Addresse !" ); return; }


  gui.btnSend.callBack_onClick = function()
  {
    for(var i=0; i<this.gui.selectAdress.items.length; i++)
    {
      var usr = this.gui.selectAdress.items[i];
      if(usr.checked)
      {
        var mail = {
                    from        : "banfProcess@e-ms.de",
                    to          : usr.value,
                    subject     : "Eine BANF-Vorlage wurde Ihnen zugewiesen",
                    text        : "",
                    html        : HTMLTemplateElement_send(
                                                            this.banf.owner,
                                                            this.banf.bezeichnung,
                                                            this.gui.editHint.value,
                                                            this.banf.posAnz,
                                                            'https://emssvrservice02:4040' 
                                                          ),
                    attachments : []
                  }                                                     
          utils.webApiRequest('SENDMAIL', {mail:mail} );        
          
          utils.webApiRequest('UPDATETABLE', {tableName:"banfHead" , ID_field:"ID" , ID_value:selectedBanfHead.ID  , fields:{STATE:"versandt"}} );   
          updateViewHead(); 
          
          this.gui.close(); 
         }
      }
  }.bind({gui:gui ,  banf:banf})
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


async function addBanf()
{
  if(!selectedBanfHead) {await dialogs.showMessageSync('Bitte zuerst eine BANF-Vorlage erstellen/auswählen !'); return;}
 
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
                 OWNER                : globals.session.userName,
                 FELD_P               : "B",
                 FELD_K               : "X",
                 MATERIAL             : ""

               };

        var b          = new TBanf(aBanf);
            b.banfHead = selectedBanfHead;  
            b.edit( function(){ updateView() } );
}


async function editBanf()
{ 
 if(!selectedBanf) {await dialogs.showMessageSync('Bitte zuerst eine Banf-Position auswählen!'); return;}
 var b          = new TBanf( {ID:selectedBanf.ID} );
     b.banfHead = selectedBanfHead;
     b.edit( function(){ updateView() } );
} 


async function __deleteBanfPosition(banf)
{ 
  var response = utils.webApiRequest('DELETEBANF' , {ID:banf.ID} );
  if(response.error) {await dialogs.showMessageSync(response.errMsg) }
  selectedBanf = null;
  updateView();
}


async function delBanf()
{
  if(!selectedBanf) {await dialogs.showMessageSync('Bitte zuerst die zu löschende Position auswählen!'); return;}
 
  var response = await dialogs.askSync('Banf-Position löschen','Wollen Sie die Banf-Position: "'+selectedBanf.POSITIONSTEXT+'"  wirklich löschen?' );
  if(response==true) __deleteBanfPosition(selectedBanf);
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


async function editBanfHead()
{ 
 if(!selectedBanfHead) {await dialogs.showMessageSync('Bitte zuerst eine BANF auswählen!'); return;}
 
 var b = new TBanfHead( selectedBanfHead );
     b.edit( function(){ updateViewHead() } );
} 


async function delBanfHead()
{ 
  if(!selectedBanfHead) {await dialogs.showMessageSync('Bitte zuerst eine BANF auswählen!'); return;}
  
  var response = await dialogs.askSync('Banf löschen','Wollen Sie die Banf-Vorlage "'+selectedBanfHead.NAME+'"  wirklich löschen?' ); 
  if(response==true) __deleteHead(selectedBanfHead); 
}


async function __deleteHead(banfHead)
{
  var response = utils.webApiRequest('DELETEBANFHEAD' , {ID:banfHead.ID} );
  if(response.error) {await dialogs.showMessageSync(response.errMsg) }
  selectedBanfHead = null;
  updateViewHead();
}


function HTMLTemplateElement_send( empfaengerName,
                              erstellerName,
                              beschreibung,
                              hinweis, 
                              positionsAnzahl,
                              link )
{
  var html = `
  <html>
  <body style="font-family: Arial, sans-serif; font-size: 14px;">
    <h2>Neue BANF - Anforderung</h2>

    <p>Hallo ${empfaengerName},</p>

    <p>Soeben wurde eine BANF-Vorlage von <b>${erstellerName}</b> erstellt.</p>

    <p><b>Beschreibung:</b></p>

    ${beschreibung}

    <p>Diese Vorlage besitzt ${positionsAnzahl} Positionen</p>

    <p><b>Bitte beachten Sie den folgenden Hinweis:</b></p>
    <p style="font-style: italic; color: #777; font-size: 1em;">${hinweis}</p>
    <p></p>
    <p></p>

    <p>Dieser <a href=" ${link}">Link</a> führt Sie direkt zur BANF-Vorlage:</p>

    <hr>
    <p style="font-size: 12px; color: #777;">
      Diese Nachricht wurde automatisch vom BANF-Vorbereitungsprozess erzeugt.
    </p>
  </body>
</html>
`;
 
 return html;

}


function HTMLTemplateElement_export( empfaengerName,
                                     exportUser,
                                     banfDatum,
                                     banfBeschreibung,
                                     dt )
{
  var html = `
  <html>
  <body style="font-family: Arial, sans-serif; font-size: 14px;">
    <h2>BANF wurde an SAP übergeben</h2>

    <p>Hallo ${empfaengerName},</p>
    <p></p>
    <p>Soeben wurde Ihre BANF-Vorlage <b>${banfBeschreibung}</b></p>
    <p>vom ${banfDatum} von <b>${exportUser}</b> an SAP übergeben.</p>
    <p></p>
    <p><b>Export-Zeitpunkt:</b>${dt}</p>
    <p></p>
    <hr>
    <p style="font-size: 12px; color: #777;">
      Diese Nachricht wurde automatisch vom BANF-Vorbereitungsprozess erzeugt.
    </p>
  </body>
</html>
`;
 
 return html;

}


function HTMLTemplateElement_newUser( usr )
{
  var html = `
  <html>
  <body style="font-family: Arial, sans-serif; font-size: 14px;">
    <h2>Neuanmeldung an BANF - Vorbereitungs - Tool</h2>

    <p>Hallo,</p>

    <p>Soeben wurde eine Neuanmeldung von <b>${usr.USERNAME}</b> registriert.</p>
    <p>Für diesen Anwender wurde noch keine eMail-Addresse hinterlegt, so dass Mailbenachrichtigungen nicht versendet werden können.</p>
    <p></p>
    <hr>
    <p style="font-size: 12px; color: #777;">
      Diese Nachricht wurde automatisch vom BANF-Vorbereitungsprozess analle Administratoren des Systems versendet.
    </p>
  </body>
</html>
`;
 
 return html;

}