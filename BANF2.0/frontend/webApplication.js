

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";
import * as symbols      from "./tfWebApp/symbols.js";

import { TFLoader }      from "./tfWebApp/tfObjects.js";

import * as main         from "./main.js";  


export async function run(caption1)
{ 
  symbols.init();

  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'Berechtigungen' , action:function(){sysadmin.adminGrants()} } );
  globals.sysMenu.push( {caption:'Info' , action:function(){app.sysInfo()} } );
  globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
  globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  // Die Anmeldung ist ein Alptraum...
  // Es wird zunächst versucht, den angemeldeten System-User zu ermitteln
  // wird ein Benutzer gefunden, soll dieser sofort starten, ohne sich erneut anmelden zu müssen. 
  // Damit die Session und Grant-Logik funktioniert, muss der UserName auch lokal hinterlegt sein
  // Dieser hat jedoch kein Passwort und soll sich auf normalem Wege nicht anmelden können

  // Falls aber EXPLIZIT ein Login-Dialog gewünscht ist, um z.B. den AdminUser zu aktivieren,
  // dann muss in der URL hinter dem "/" /?admin=true angehängt werden
  if (window.location.search.includes('admin=true') || window.location.hash.includes('#admin')) 
  {
     const ok = await app.login();

     if(ok) main.main(caption1 , 'Willkommen ' + globals.session.userName);

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
                               response.result.grants , 
                               response.result.user.admin
                            );
    }                  
    
    // auf daas fertige Laden der Symbole warten ....
    await symbols.waitOnLoad();

    main.main(caption1 , 'Willkommen ' + globals.session.userName);

    return;
  }

  // andernfalls erfolgt ein Login-Dialog  
  app.login( ()=>{ main.main(caption1 , 'Willkommen ' + globals.session.userName) });

    const loader = new TFLoader({ title: "lade starte Web-Anwendung …" , note:"hab's gleich geschafft ..." });
  loader.while(TFLoader.wait(4000)).then();
}  


