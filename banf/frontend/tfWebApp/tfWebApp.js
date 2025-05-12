import * as globals     from "./globals.js";
import * as utils       from "./utils.js";
import * as dialogs     from "./tfDialogs.js";
import { TFScreen }     from "./tfObjects.js";
import { TFWorkSpace }  from "./tfObjects.js";



export function login( callBackIfOK , bypass ) 
{// vorsichtshalber ...
  if (globals.Screen==null) globals.setScreen( new TFScreen() ) ;

  if(bypass && callBackIfOK ) {callBackIfOK(); return}
 
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
       inpUsr.caption.color     = 'lightgray';
       inpUsr.caption.fontStyle = 'italic';
       inpUsr.marginLeft = '1em';
       inpUsr.marginTop  = 0;

   var inpPwd = dialogs.addInput(loginDlg ,2 , 5 , 14 , "Passwort" , "" , "" , {type:"password"});
       inpPwd.caption.color     = 'lightgray';
       inpPwd.caption.fontStyle = 'italic';
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
                                     globals.startSession( response.result.session ,
                                                           usr ,
                                                           response.result.userID ,
                                                           response.result.grants , 
                                                           response.result.user.admin
                                                            );
                                 }                            
                                 else
                                 {
                                    alert(response.result.errMsg);
                                    globals.Screen.HTML=""; 
                                    return;
                                 }
                              
                              // blank screen
                              globals.Screen.HTML="<F5> Restart ..."; 
                              callBackIfOK();  

                            }.bind({usr:inpUsr,pwd:inpPwd})

   var b = dialogs.addButton( btns , "cssAbortBtn01"  , 3 , 2 , 1 , 1 ,"Abbrechen" );
       b.callBack_onClick = function() 
                            {
                              alert("Anmeldung wurde abgebrochen - Neustart mit <F5>");
                            }                  

                          
}


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
  var w=dialogs.createWindow( null , "SystemInfo" , "70%" , "70%" , "CENTER" ).hWnd;
     
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
      b.callBack_onClick = function(){this.wnd.closeWindow()}.bind({wnd:w})
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

   
   window.addEventListener('focus', function() { utils.log('Focus') ; this.active = true; }.bind(this) );
   window.addEventListener('blur' , function() { utils.log('Blur')  ; this.active = false; }.bind(this) );

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
