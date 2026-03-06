

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
var numPosition         = 0;
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
      updateView();

// ggf. bei Neuanmeldung ein mail senden ....
// Da die email vorhanden sein muss, um entsprechende Workflows zu gewährleisten,
// Wird geprüft, ob der gerade angemeldete Anwender bereits eine mailAdresse besitzt
// Fall nicht, wird diese Mail generiert - selbst wenn es sich nicht wirklich um eine 
// NeuAnmeldung handelt ...

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
  numPosition = 0;
  var response = utils.webApiRequest('LSBANF' , {ID_HEAD:selectedBanfHead.ID} );
  if(response.error) {await dialogs.showMessageSync(response.errMsg);return; }
  numPosition = response.result.length;
  var grid = dialogs.createTable( gui.gridContainerBanf , response.result , ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO','ANFORDERER','ATTACHMENTS','FELD_K','FELD_P'] , [{STATE:"Status"}] );
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
             posAnz     : numPosition
           }
  var gui = new TFgui( null , forms.sendBanf , {caption:'Banf-Vorlage versenden'});

  // Steuerung der selektiven Sichtbarkeit von Controls ....
  gui.TFLabel768.hide();
  gui.selectAdress.hide();

  gui.cbModeSelection.callBack_onChange = function()
  {
    if(this.gui.cbModeSelection.checked)
    {
      this.gui.TFLabel768.show();
      this.gui.selectAdress.show();
      this.gui.TFPanel1199.hide();
      this.gui.TFLabel1592.hide();
    }
    else
        {
          this.gui.TFLabel768.hide();
          this.gui.selectAdress.hide();
          this.gui.TFPanel1199.show();
           this.gui.TFLabel1592.show();
        }  

  }.bind({gui:gui, self:this})


  var response = utils.webApiRequest('LSUSER', {forGrantObj:"banfAdmin"} );
  if (response.error) {await dialogs.showMessageSync(response.errMsg); return; }

    if (response.result.length==0)  {await dialogs.showMessageSync("Es wurde noch keinem Benutzer die Rolle 'banfAdmin' zugewiesen !" ); return; }

    for(var i=0; i<response.result.length; i++)
    {
      var u = response.result[i];
      if(u.EMAIL) gui.selectAdress.addItem( {caption:u.FIRSTNAME+' '+u.LASTNAME, value:u.EMAIL} )
    }

    if (gui.selectAdress.items.length==0)  {await dialogs.showMessageSync("Es existiert kein banfAdmin mit gültiger e-mail-Addresse !" ); return; }


  gui.btnSend.callBack_onClick = function()
  { 
    if(gui.cbModeSelection.checked)
    { 
      var num = 0;
      for(var i=0; i<this.gui.selectAdress.items.length; i++)
      {
        var usr = this.gui.selectAdress.items[i];
        if(usr.checked)
        {
         num++; 
         var mail = {
                     from        : "banfProcess@e-ms.de",
                     to          : usr.value,
                     subject     : "Eine BANF-Vorlage wurde Ihnen zugewiesen",
                     text        : "",
                     html        : HTMLTemplateElement_send( usr.caption,
                                                            this.banf.owner,
                                                            this.banf.bezeichnung,
                                                            this.gui.editHint.value,
                                                            this.banf.posAnz,
                                                            'https://emssvrservice02:4040' 
                                                          ),
                    attachments : []
                   }                                                     
          utils.webApiRequest('SENDMAIL', {mail:mail} );        
        }
      }
    } // bei dezidierter Zusendung ...
  else
      {
         var mail = {
                     from        : "banfProcess@e-ms.de",
                     to          : "banfPool@e-ms.de",
                     subject     : "Eine BANF-Vorlage wurde dem Sammel-Postfach hinzugefügt",
                     text        : "",
                     html        : HTMLTemplateElement_send4All( 
                                                             this.banf.owner,
                                                             this.banf.bezeichnung,
                                                             this.gui.editHint.value,
                                                             this.banf.posAnz,
                                                            'https://emssvrservice02:4040' 
                                                          ),
                    attachments : []
                   }                                                     
          utils.webApiRequest('SENDMAIL', {mail:mail} );        
      } // bei Versand an ein Sammelkonto

  if (num==0) {dialogs.showMessage("In diesem Modus ist die Auswahl mindestens eines Mitarbeiters erforderlich !"); return;}

  // Aktualisierung der Ansicht infolge Statuswechsel ...    
  utils.webApiRequest('UPDATETABLE', {tableName:"banfHead" , ID_field:"ID" , ID_value:selectedBanfHead.ID  , fields:{STATE:"versandt"}} );       
  updateViewHead(); 
  this.gui.close();     

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


function HTMLTemplateElement_send4All(
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

    <p>Hallo Zusammen,</p>

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
      Diese Nachricht wurde automatisch vom BANF-Vorbereitungsprozess an alle Administratoren des Systems versendet.
    </p>
  </body>
</html>
`;
 
 return html;

}