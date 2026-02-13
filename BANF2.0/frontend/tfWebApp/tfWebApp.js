import * as globals     from "./globals.js";
import * as utils       from "./utils.js";
import * as dialogs     from "./tfDialogs.js";
import * as sysadmin     from "./tfSysAdmin.js";
import * as symbols      from "./symbols.js";

import { TFScreen }     from "./tfObjects.js";
import { TFWorkSpace }  from "./tfObjects.js";
import { TFLoader }     from "./tfObjects.js";

import { TFWindow   }   from "./tfWindows.js";
import { TFGuiBuilder } from "./tfGuiBuilder.js";

// Einstiegspunkt in die spez. WebApp -> Eine Verzeichnis-Ebene höher 
import * as main        from "./../main.js";  


export async function run(caption1)
{ 
  symbols.init();

  // Die Anmeldung ist ein Alptraum...
  // Es wird zunächst versucht, den angemeldeten System-User zu ermitteln
  // wird ein Benutzer gefunden, soll dieser sofort starten, ohne sich erneut anmelden zu müssen. 
  // Damit die Session und Grant-Logik funktioniert, muss der UserName auch lokal hinterlegt sein
  // Dieser hat jedoch kein Passwort und soll sich auf normalem Wege nicht anmelden können

  // Falls aber EXPLIZIT ein Login-Dialog gewünscht ist, um z.B. den AdminUser zu aktivieren,
  // dann muss in der URL hinter dem "/" /?admin=true angehängt werden
  if (window.location.search.includes('admin=true') || window.location.hash.includes('#admin')) 
  {
     const loginResult = await login();

     if(loginResult.ok) 
     {
        globals.startSession( loginResult.session , loginResult.user , loginResult.userID , loginResult.grants );

        if(globals.session.admin)
        {
           globals.sysMenu.push( {caption:'Benutzer'                                         , action:function(){sysadmin.adminUser()} } );
           globals.sysMenu.push( {caption:'Berechtigungen'                                   , action:function(){sysadmin.adminGrants()} } );
           globals.sysMenu.push( {caption:'Info'                                             , action:function(){sysInfo()} } );
           globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)'          , action:function(){APItest()} } );
           globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
           globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)'       , action:function(){guiBuilder()} } );
           globals.sysMenu.push( {caption:'Abbrechen'                                        , action:function(){} } );
        }
        
         // auf daas fertige Laden der Symbole warten ....
         const loader = new TFLoader({ title: "lade starte Web-Anwendung …" , note:"hab's gleich geschafft ..." });
         loader.while( symbols.waitOnLoad() ).then( ()=> {main.main(caption1 , 'Willkommen ' + globals.session.userName )} );
     } 
      
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
  { 
    // ntlm-Anmeldung am Server um Session zu erhalten...
    var url      = globals.getServer()+'/ntlmLogin/'+usrName;
    var response = utils.webRequest( url );
    if(!response.error)
      if(!response.result.error)
       {
         globals.startSession( response.result.session ,
                               usrName ,
                               response.result.userID ,
                               response.result.grants 
                             );

        if(globals.session.admin)
        {
           globals.sysMenu.push( {caption:'Benutzer'                                         , action:function(){sysadmin.adminUser()} } );
           globals.sysMenu.push( {caption:'Berechtigungen'                                   , action:function(){sysadmin.adminGrants()} } );
           globals.sysMenu.push( {caption:'Info'                                             , action:function(){sysInfo()} } );
           globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)'          , action:function(){APItest()} } );
           globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
           globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)'       , action:function(){guiBuilder()} } );
           globals.sysMenu.push( {caption:'Abbrechen'                                        , action:function(){} } );
        }

       }                  

       // auf daas fertige Laden der Symbole warten ....
      const loader = new TFLoader({ title: "lade starte Web-Anwendung …" , note:"hab's gleich geschafft ..." });
      loader.while( symbols.waitOnLoad() ).then(()=> {main.main(caption1 , 'Willkommen ' + globals.session.userName )});

    return;
  }

  // andernfalls erfolgt ein Login-Dialog  
  const loginResult = await login();

     if(loginResult.ok) 
     {
        globals.startSession( loginResult.session , loginResult.userName , loginResult.user , loginResult.grants , loginResult.admin );

        if(globals.session.admin)
        {
           globals.sysMenu.push( {caption:'Benutzer'                                         , action:function(){sysadmin.adminUser()} } );
           globals.sysMenu.push( {caption:'Berechtigungen'                                   , action:function(){sysadmin.adminGrants()} } );
           globals.sysMenu.push( {caption:'Info'                                             , action:function(){sysInfo()} } );
           globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)'          , action:function(){APItest()} } );
           globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
           globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)'       , action:function(){guiBuilder()} } );
           globals.sysMenu.push( {caption:'Abbrechen'                                        , action:function(){} } );
        }

       // auf daas fertige Laden der Symbole warten ....
       const loader = new TFLoader({ title: "lade starte Web-Anwendung …" , note:"hab's gleich geschafft ..." });
       loader.while( symbols.waitOnLoad() ).then();

       main.main(caption1 , 'Willkommen ' + globals.session.userName);
     } 
  
}  


export function login() { return new Promise((resolve, reject) => 
 {
  if (globals.Screen==null) globals.setScreen( new TFScreen() ) ;

  globals.Screen.body.style.display         = 'flex';
  globals.Screen.body.style.alignItems      = 'center';
  globals.Screen.body.style.justifyContent  = 'center';
  
   var loginDlg                  = document.createElement("DIV");
   loginDlg.className            = "cssPanel";
   loginDlg.style.height         = "17em";
   loginDlg.style.width          = "35em";
   loginDlg.style.backgroundColor= "rgba(0,0,0,0.4)";
   globals.Screen.body.appendChild( loginDlg );
   utils.buildGridLayout_templateColumns(loginDlg , "33% 1fr" , {stretch:true});
   utils.buildGridLayout_templateRows   (loginDlg , "3em 2em 2em 2em 2em 2em 1fr" , {stretch:true});

   var decoration                   =  document.createElement("DIV");
   decoration.style.className       = 'cssPanel';
   decoration.style.marginBottom    = '0.5em';
   decoration.style.gridColumnStart = 1;
   decoration.style.gridColumnEnd   = 2;
   decoration.style.gridRowStart    = 2;
   decoration.style.gridRowEnd      = 8;
   decoration.style.backgroundImage = "url('./tfWebApp/res/auth.png')";
   decoration.style.backgroundColor = "rgba(0,0,0,0.4)";
   decoration.style.backgroundSize  = "cover";

   loginDlg.appendChild( decoration );

   var btns                   =  document.createElement("DIV");
   btns.style.className       = 'cssPanel';
   btns.style.margin          = '0.5em';
   btns.style.gridColumnStart = 2;
   btns.style.gridColumnEnd   = 3;
   btns.style.gridRowStart    = 6;
   btns.style.gridRowEnd      = 8;
   btns.style.backgroundColor = "rgba(0,0,0,0.4)";
   loginDlg.appendChild( btns );
   utils.buildGridLayout_templateColumns(btns , "1em 1fr 1fr 1em" );
   utils.buildGridLayout_templateRows   (btns , "1fr 3em 1fr" );

   var header                   =  document.createElement("DIV");
   header.style.className       = 'cssPanel';
   header.style.marginBottom    = '4px';
   header.style.gridColumnStart = 1;
   header.style.gridColumnEnd   = 3;
   header.style.gridRowStart    = 1;
   header.style.gridRowEnd      = 2;
   header.style.display         = 'flex';
   header.style.alignItems      = 'center';
   header.style.justifyContent  = 'center';
   header.style.backgroundColor = "rgba(0,0,0,0.4)";
   loginDlg.appendChild( header ); 
   header.innerHTML = '<H1 style="color:lightgray; font-size:1.7em; font-style: italic" >Anmeldung</H1>';
   

   var inpUsr = dialogs.addInput(loginDlg ,2 , 3 , 14 , "Benutzer" , "" , "");
       inpUsr.editCaption.color     = 'lightgray';
       inpUsr.editCaption.fontStyle = 'italic';
       inpUsr.marginLeft = '1em';
       inpUsr.marginTop  = 0;

   var inpPwd = dialogs.addInput(loginDlg ,2 , 5 , 14 , "Passwort" , "" , "" , {type:"password"});
       inpPwd.editCaption.color     = 'lightgray';
       inpPwd.editCaption.fontStyle = 'italic';
       inpPwd.marginLeft = '1em';
       inpPwd.marginTop = 0;


   var b = dialogs.addButton( btns , ""  , 2 , 2 , 1 , 1 ,"Anmeldung" );
       b.callBack_onClick = function() 
                            {
                              var usr = this.usr.text;
                              var pwd = this.pwd.text;
                              if (!usr) return;
                              if (!pwd) pwd='empty';
                              var url = globals.getServer()+globals.loginEndpoint+usr+"/"+pwd;
                              var response = utils.webRequest( url );

                              if(!response.error)
                                if(!response.result.error)
                                {
                                  var result = { ok      : true,
                                                 session : response.result.session ,
                                                 user    : usr ,
                                                 userID  : response.result.userID ,
                                                 grants  : response.result.grants 
                                               };

                                  document.body.innerHTML = '';                      

                                  resolve( result );      
                                }                            
                                else
                                 {
                                    alert(response.result.errMsg);
                                    return;
                                 }

                            }.bind({usr:inpUsr,pwd:inpPwd})

   var b = dialogs.addButton( btns , "cssAbortBtn01"  , 3 , 2 , 1 , 1 ,"Abbrechen" );
       b.callBack_onClick = function() 
                            {
                              alert("Anmeldung wurde abgebrochen - Neustart mit F5");
                            }                  

                          
})}


export function startWebApp(caption1,caption2)
{
   return new TFWebApp(caption1,caption2)
}


export function logout()
{
   var response = utils.webApiRequest( 'USERLOGOUT' , JSON.stringify({noParam:0}) );
   document.body.innerHTML = 'Applikation beendet  - Neustart mit F5 ';
}

 
export function sysInfo() 
{
  var wnd=dialogs.createWindow( null , "SystemInfo" , "70%" , "70%" , "CENTER" );
  var w  = wnd.hWnd;
     
  w.buildGridLayout_templateColumns( "1fr");
  w.buildGridLayout_templateRows   ( "1px 5em 0.1em 1fr 0.1em 3.7em 0.4em");

  var c=dialogs.addPanel(w,"",1,2,1,1);
      c.margin    = '7px';
      c.innerHTML = "<H2>Benutzername : " + globals.session.userName + "( id:"+globals.session.userID+" )    Session: " + globals.session.ID +"</H2>";

  var h=dialogs.addPanel(w,"",1,4,1,1);
      h.buildGridLayout_templateColumns( "1fr 1fr");
      h.buildGridLayout_templateRows   ( "1fr");
     
  var d=dialogs.addPanel(h,"cssContainerPanel",1,1,1,1);    
      d.margin = '7px';
      d.buildBlockLayout();
  var p = dialogs.addPanel(d , "cssBlackPanel" , 1 , 1 , "99%" , "2em" );
      p.overflow = 'hidden';
      dialogs.addLabel(p,"cssBoldLabel",1,1,"100%","100%","Zugriffsrechte ...").color = 'white';

      for(var i=0; i<globals.session.grants.length;i++)
      {
        var g = globals.session.grants[i]
        var b = '[zugriff erlaubt]';
        if (!g.access) b='[Zugriff verboten]';
        
        var r = dialogs.addPanel(d,"cssWhitePanel",1,1,"99%","3em");
            r.margin = '2px';   
            r.buildGridLayout_templateColumns("3em 1fr 10em" );
            r.buildGridLayout_templateRows   ("1fr" );

        var l=dialogs.addLabel(r,"cssLabel",1,1,1,1,g.ID);
            l.color = 'gray';
             
            l=dialogs.addLabel(r,"cssBoldLabel",2,1,1,1,g.caption || g.name);
            l.textAlign = 'left';

            l = dialogs.addLabel(r,"cssLabel",3,1,1,1,b);
                if(g.access) l.color = 'green';
                else         l.color = 'red';
      }  

  
      var s=dialogs.addPanel(h,"cssContainerPanel",2,1,1,1);    
      s.margin = '7px';
      s.buildGridLayout_templateColumns('1fr');
      s.buildGridLayout_templateRows('2em 1fr ' );
      var p = dialogs.addPanel(s , "cssBlackPanel" , 1 , 1 ,1 , 1 );
      dialogs.addLabel(p,"cssBoldLabel",1,1,"100%","100%","Session-Variablen ...").color = 'white';

      var sh=dialogs.addPanel(s,"cssWhitePanel",1,2,1,1);    
          sh.overflow = 'auto';
      var response = utils.webApiRequest( 'GETVARS' , '');
      sh.innerHTML = utils.printJSON(response.result  );
        
  var sb = dialogs.addPanel(w,"cssContainerPanel",1,6,1,1);
      sb.buildGridLayout_templateColumns( "1fr 7em 1fr" );
      sb.buildGridLayout_templateRows( "1fr" );

  var b=dialogs.addButton(sb,"",2,1,1,1,"OK");
      b.callBack_onClick = function(){this.wnd.close()}.bind({wnd:wnd})
} 


export function getVar( varName , defaultValue)
{
  var response = utils.webApiRequest( 'GETUSERVAR' , JSON.stringify({varName:varName, defaultValue:defaultValue}) );
  if(response.error) return defaultValue;
  return response.result;
}


export function setVar( varName , value)
{
  var response = utils.webApiRequest( 'SETUSERVAR' , JSON.stringify({varName:varName, value:value}) );
  if(response.error) return defaultValue;
  return response.result;
}


export function guiBuilder()
{
  new TFGuiBuilder();
}

export function help(url) 
{
  /*
  var w=dialogs.createWindow( null , "Hilfe" , "80%" , "80%" , "CENTER" );
  
  var r=utils.loadContent( url );
  if (r.error) 
  {
    dialogs.showMessage(r.errMsg);
    return;
  }
  w.HTML( r.body )
  */

  window.open(url, '_blank');

  //var hlpWnd   = window.open( ''  , '' , 'width="75%", height="90%" , fullscreen=yes , resizable=yes , status=no , menubar=no , location=no , scrollbars=true , toolbar=no ');
  //    hlpWnd.document.url = url;
}


export function APItest( endPoints )
{
  var w = new TFWindow( null , 'API-Test' , '70%' , '30%' , 'CENTER' );
  var cmds = ['LSGRANTS' , 'GETUSERGRANTS' , 'GETVAR' , 'GETVARS' , 'USERLOGOUT' , 'CREATETABLE' , 'FETCHVALUE' , 'FETCHRECORD' , 'FETCHRECORDS',
              'INSERTINTOTABLE' , 'UPDATETABLE' , 'DROP' , 'EXISTTABLE' , 'STRUCTURE' , 'AST' , 'LSUSER' , 'ADDUSER' ,  'EDITUSER' , 'ADDGRANT' , 'IDGRANT' , 
              'RESETUSERGRANTS' , 'ADDUSERGRANT' , 'SETUSERGRANTS' , 'GETUSERGRANTS' , 'SETVAR' , 'DELVAR' , 'JSN2EXCEL' ];
              
  var cbItems = [];
  for(var i=0; i<cmds.length; i++) cbItems.push(cmds[i]); 

  if(endPoints)
    for(var i=0; i<endPoints.length; i++) cbItems.push(endPoints[i]);


  w.buildGridLayout_templateColumns('1fr');
  w.buildGridLayout_templateRows('1fr 1fr 1fr 1fr');
  var c = dialogs.addInput ( w.hWnd ,          1 , 1 , 70 , 'Command', '' , 'TEST'          , {lookUp:true, items:cbItems} );
  var p = dialogs.addInput ( w.hWnd ,          1 , 2 , 70 , 'params' , '' , '{param:value}' , {} );
  var l = dialogs.addLabel ( w.hWnd , '' ,     1 , 3 , '100%' , '2em' , 'Parameter in der Form "param1=value1;param2=value2..." angeben !' );
  var b = dialogs.addButton( w.hWnd , '' ,     1 , 4 , '10em' , '2em' , 'OK' );
     b.margin = '1em';
     b.callBack_onClick = function(){ 
                                      var param = utils.parseToJSON(this.p.value);
                                      console.log("param =>"+JSON.stringify(param));
                                      var response = utils.webApiRequest(this.c.value , param);
                                      console.log(response);
                                      dialogs.showMessage( JSON.stringify(response) );
                                    }.bind({c:c,p:p});
    
 }



export class TFWebApp
{
  constructor(caption1,caption2)
  {
    if(caption1) this.caption1 = caption1;
    else         this.caption1 = "";
 
    if(caption2) this.caption2 = caption2;
    else         this.caption2 = "";

    this.isTFObject      = true;

    // initiale Arbeitsfläche
    this.workSpaces      = [];
    this.newWorkSpace("main" , caption1 , caption2 );
   
    this.body  = globals.Screen.body;
   
   this.windows         = [];
   this.zIndex          =  0;
   this.clientWidth     =  globals.Screen.width;
   this.clientHeight    =  globals.Screen.height;
   this.active          =  true;

   this.keyHandler      = null;

   
   window.addEventListener('focus'  , function() { utils.log('Focus') ; this.active = true; }.bind(this) );
   window.addEventListener('blur'   , function() { utils.log('Blur')  ; this.active = false; }.bind(this) );
   
   this.keepAlive = setInterval( function() {if(this.active) utils.webApiRequest('keepAlive' , '' )}.bind( this ) , 60000 );
 
  }
  

  newWorkSpace( ID , caption1 , caption2 )
  {
    if (ID) var wsID  = ID;
    else    var wsID  = "IDworkSpace_"+this.workSpaces.length+1;
    
    var ws = new TFWorkSpace( wsID , caption1 , caption2 );
    this.workSpaces.push(ws);

    if(!this.activeWorkspace) this.activeWorkspace = ws; 
    
    return ws;                          
  }

  
  selectWorkSpace(ID)
  {
    utils.log("selectWorkspace("+ID+")  aus einer Liste von ["+this.workSpaces.length+"] workspaces ...");
    var ws    = null;
    for(var i=0; i<this.workSpaces.length;i++)
    {
      ws = this.workSpaces[i];
      utils.log("selectWorkspace.compare with "+ws.container.id);
      if(ws.container.id==ID) {utils.log("found"); ws.select();  return ws;  }
    }

    utils.log("not found");
    return null;
  }


  isWorkspaceSelected(ID)
  {
    return this.activeWorkspace.container==ID;
  }

   
}
