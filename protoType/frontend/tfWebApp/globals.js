const useHTTPS                = false;

export var debug              = false;
export var webApp             = {activeWorkspace:null};


export var backgroundImage    = null;   // wen null dann delault lt. stylesheet
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

export function setScreen( s ) { Screen = s}

export function setBackgroundImage( img ) { backgroundImage = img}

export function initWebApp( w ) { webApp = w}

export function startSession( sessionID , userName , userID , grants , admin )  
{ 
  session.ID        = sessionID; 
  session.userName  = userName;
  session.userID    = userID;
  session.grants    = grants;
  session.admin     = admin;

  if(   
    (userName.toLocaleUpperCase()=='ROOT')
 || (userName.toLocaleUpperCase()=='ADMIN')
 || (userName.toLocaleUpperCase()=='SYSADMIN')
 || (userName.toLocaleUpperCase()=='ADMINISTRATOR')
    ) session.admin = true; 

    console.log("Start Session: " + JSON.stringify(session));

}

export function setSysMenu( s ) { sysMenu = s}


document.addEventListener("keydown", function (event) 
{
  console.log("keyDown -> " + event.key);
  
  let isCTRLpressed  = event.ctrlKey;
  let isSHIFTpressed = event.shiftKey;
  let isALTpressed   = event.altKey;

  console.log("CTRL:", isCTRLpressed, "SHIFT:", isSHIFTpressed, "ALT:", isALTpressed);
});

document.addEventListener('keyup', function(event) 
{
  console.log("keyUp -> " + event.key );
  if(event.ctrlKey)    isCTRLpressed  = false;
  if(event.shiftKey)   isSHIFTpressed = false;
  if(event.altKey)     isALTpressed   = false;
});


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





