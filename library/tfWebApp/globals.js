const useHTTPS                = true;

export var debug              = true;
export var webApp             = {activeWorkspace:null};
export var Screen             = null;   // wird von der App gesetzt


export var backgroundImage    = './tfWebApp/res/background.jpg';   
export var loginEndpoint      = '/userLoginx/'; 

export var sysMenu            = [];

export var session            = { ID:0 , userName:"", userID:0, grants:[] , admin:false }; 

export var isCTRLpressed      = false;
export var isSHIFTpressed     = false;
export var isALTpressed       = false;

export const isMediaCollector = true;

export const movieFileExtensions = [
  'mp4', 'flv', 'm3u8', 'ts', 'mov', 'avi', 
  'wmv', 'm4v', 'webm', 'weba', 'ogm', 'ogv', 'ogg'
];

export const imageFileExtensions = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 
  'tiff', 'tif', 'svg', 'ico', 'heic', 'heif', 'avif'
];




var __Server                  = window.location.hostname;
var __Port                    = window.location.port;

var __debugTimeStamp          = Date.now()

console.log("Server: "+ __Server);
console.log("Port  : "+ __Port);

export function setServer( s )
{ __Server   = s;
  URL_static = 
  console.log("set Server : "+ __Server);
}

export function getServer()   
{ 
   if (useHTTPS) {console.log("use HTTPS Server"); return 'https://' + __Server + ':' + __Port; }
   else          {console.log("use HTTP Server");  return 'http://' + __Server + ':' + __Port; } 
}

export function getWebSocketServerURL(port)   
{ 
   return 'ws://' + __Server + ':' + port;  
}


export function getUploadURL()   
{ 
  return getServer()+'/upload'; 
}


export function URL_webAppRequest()     {return getServer()+'/x?x='}
export function URL_webAppPOSTrequest() {return getServer()+'/xpost'}
export function URL_static() {return  ' '+getServer()+'/'}

export function setScreen( s ) 
{ 
  Screen = s ; 
  if(backgroundImage) Screen.setBackgroundImage(backgroundImage);
}  


export function setBackgroundImage( img ) 
{ 
  backgroundImage = img;
  if(Screen) Screen.setBackgroundImage(backgroundImage);
}

export function initWebApp( w ) { webApp = w}

export function startSession( sessionID , userName , userID , grants , admin )  
{ 
  session.ID        = sessionID; 
  session.userName  = userName;
  session.userID    = userID;
  session.grants    = grants;
  session.admin     = admin ||  hasAccess('admin') ||  hasAccess('sysadmin') ||  hasAccess('root') 

  if(   
    (userName.toLocaleUpperCase()=='ROOT')
 || (userName.toLocaleUpperCase()=='ADMIN')
 || (userName.toLocaleUpperCase()=='SYSADMIN')
 || (userName.toLocaleUpperCase()=='ADMINISTRATOR')
 || (userName.toLocaleUpperCase()=='SYSDBA')
    ) session.admin = true; 

    console.log("Start Session: " + JSON.stringify(session));

}



export function hasAccess(grandName)
{
  for(var i=0; i<session.grants.length; i++)
    {
       var grant = session.grants[i];
         if(grant.name==grandName) return grant.access;
    }
    return false;
}



export function setSysMenu( s ) { sysMenu = s}



export const KeyboardManager = 
{
  keysDown: new Set(),

  init: function () {
    document.addEventListener('keydown', (e) => {
      this.keysDown.add(e.key);
    });

    document.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.key);
    });
  },

  isKeyPressed: function (key) {
    return this.keysDown.has(key);
  },

  showKeys: function () {
    console.log("Pressed keys: " + Array.from(this.keysDown).join(", "));
  }
};

// Direkt initialisieren, damit’s läuft, sobald geladen:
KeyboardManager.init();
/*
Anwendungs-Beispiele:
if (KeyboardManager.isKeyPressed("Control")) {
  console.log("Control wird gedrückt gehalten.");
}

Oder als Shortcut-Checker z. B. in einem onKeyDown-Callback:

this.callBack_onKeyDown = function (e) {
  if (e.key === "s" && KeyboardManager.isKeyPressed("Control")) {
    e.preventDefault();
    saveStuff();
  }
};

ACHTE auf preventDefault(), wenn die Tastatur-Interaktion nicht weitergegeben werden soll.






*/





export function print_elapsedTime( msg )   
{ 
  var ts = Date.now();
  var et = ts - __debugTimeStamp;
  var st = "Elapsed Time";
  if( msg != undefined ) st = st + "@" + msg;
  st = st + ": ";
  
  console.log(st + et + " ms");
  
  __debugTimeStamp = ts;

  return et;
}





