const useHTTPS          = false;
const port              = '4040';

const http        = require('http');
const https       = require('https');

const express     = require('express');
const ntlm        = require('express-ntlm');
const multer      = require('multer');
const bodyParser  = require('body-parser');

const Database    = require('better-sqlite3');
const fs          = require('fs-extra');
const path        = require('path');
const globals     = require('./backendGlobals');
const utils       = require('./nodeUtils');
const webAPI      = require('./nodeAPI');
const userAPI     = require('./userAPI');
const session     = require('./session');
const dbTables    = require('./dbTables');

const sslOptions  = {
    key : fs.readFileSync('./SSL/privateKex.pem'  , 'utf8' ),     // Pfad zum privaten Schlüssel
    cert: fs.readFileSync('./SSL/certificate.pem' , 'utf8' )    // Pfad zum Zertifikat
   };

const dBetc       = './etc.db';
const etc         = new Database( dBetc  , { verbose: utils.log } );
      utils.log("etc-dB: "+etc.constructor.name);

const dBName      = './workingBase.db';
const dB          = new Database( dBName  , { verbose: utils.log ,  readonly: false } );
      utils.log("working-dB: "+dB.constructor.name);


// Datenstruktur lt. dBTables erzeugen ....
dbTables.buildTables( dB );

// Datenstruktur auf ggf. vorhandene Änderungen prüfen ....
// dbTables.checkdbTableStructure();


const webApp       = express();

globals.staticPath = path.join (__dirname, 'frontend' );
utils.log("static Path: " + globals.staticPath );

// NTLM-Middleware aktivieren



uploadPath  = path.join (__dirname, 'tmpUploads' );

 // existiet der Pfad tmpUploads ?
if(!fs.existsSync(uploadPath))
{
  fs.mkdirSync(uploadPath , { recursive: true });
  utils.log( uploadPath + " created");
}

 // Konfiguriere Multer, für fileUpload
const storage = multer.diskStorage({
  destination: function (req, file, cb ) { cb(null, uploadPath ); }, // Zielverzeichnis für uploads 
  
  // Hier kannst du den Dateinamen dynamisch basierend auf den Formulardaten anpassen
  filename   : function (req, file, cb) { const fileName = req.body.fileName || '~'+utils.generateRandomString(49); 
                                          cb(null, fileName );
                                        }
                                   });
                                   
const upload = multer({ storage: storage });



function handleError(errMessage)
{
  return JSON.stringify( {error:true, errMsg:errMessage, result:{} });
}


function handleDebug( req , res )
{
  res.send("script Fuu");
}


//---------------------------------------------------------------------------------------------------------------------
//
//   GET / POST
//
//---------------------------------------------------------------------------------------------------------------------
async function handleRequest( req , res )
{
 utils.log("handleRequest -> " + req.method);

 try{ 
  if(req.method === 'GET')  var strRequest = decodeURIComponent(req.query.x);
  if(req.method === 'POST') var strRequest = req.body;
  } catch(err) { utils.log("decodeURIComponent-Error: "+err.message); res.send( handleError("decodeURIComponent-Error: " + err.message )); return }

if(strRequest) 
{
  try {
       if(utils.isJSON(strRequest)) {utils.log("request is alredy JSON ");        var jsnRequest = strRequest; }
       else                         {utils.log("request is will parse as JSON "); var jsnRequest = JSON.parse( strRequest ); }
      } catch(err) { res.send( handleError("JSON.parse-Error: " + err.message )); return }
 
  utils.log('REQUEST: '+JSON.stringify(jsnRequest));

  jsnParam = {};

  try {
        if(utils.isJSON(jsnRequest.param))  {utils.log("params are alredy JSON ");  jsnParam = jsnRequest.param; }
        else                                {utils.log("params are parse as JSON "); if(jsnRequest.param) jsnParam = JSON.parse( jsnRequest.param ); }
       } catch(err) { res.send( handleError("JSON.PARAM-parse-Error: " + err.message )); return }
   
       // während des Entwickelns und Debuggens ist die SessioID sehr lästig 
      if(!globals.ignoreSession || jsnRequest.cmd.toUpperCase().trim()!='MIGRATE')
      { 
        if(!session.validSession( jsnRequest.session )) { res.send( handleError("invalid Session / Session timout")); return }
      }

  //-------------------------------------------------------------------------------------------------------

    var response  = await webAPI.handleCommand( jsnRequest.session , jsnRequest.cmd , jsnParam , req ,  res , fs , path );
  
  //-------------------------------------------------------------------------------------------------------

  // fallBack falls eine Procedure nicht bis zum RETURN kam und hier ggf ein NULL zurück kommt  ...
  if(response==null) response = {error:false, errMsg:'OK' , result:{} }


  if(response.hasOwnProperty('isStream'))
  {
     if(response.isStream) utils.log('response is a STREAM ...')
  }else
   {
    try
       {
        response = JSON.stringify(response);
       }
       catch{}

    utils.log('return from webAPI-Handler : ' + response );
  
    res.send(  response );
  }
 }
}


function userLogin( req , res )
{
  utils.log("session.userLogin")

  var strRequest = req.query.x;

  utils.log( "-> "+strRequest )

  if(strRequest) 
   {
    try
       {
         strRequest = decodeURIComponent(strRequest);
       }
       catch(err) { res.send( handleError("decodeURIComponent-Error: " + err.message )); return }
    try
       {
        var jsnRequest = JSON.parse( strRequest );
       }
       catch(err) {res.send( handleError("JSON.parse-Error: " + err.message )); return }
  
    try   
       {
        var jsnParam = JSON.parse( jsnRequest.param );  // nestet-JSON wird nicht rekursiv geparst ...
       }      
       catch { jsnParam = jsnRequest.param }

    var userName  = jsnParam.username;
    var remoteIP  = req.connection.remoteAddress;
    var passwd    = jsnParam.passwd;

    var h         = JSON.stringify(session.userLogin(etc , remoteIP , userName , passwd ));
    utils.log("return from login: " + h)
    res.send( h );
  }  
}


function userLoginx( req , res )
{
  var userName  = req.params.username;
  var remoteIP  = req.connection.remoteAddress;
  var passwd    = req.params.passwd;

  var h         = JSON.stringify(session.userLogin(etc , remoteIP , userName , passwd ));
    utils.log("return from login: " + h)
    res.send( h );
}  




function handleUpload( req , res )
{
  // Delegation an multer ... mit CallBack ... 
  var file     = req.file; // multer speichert die Datei in req.file
  var fileName = req.body.fileName;
  var destDir  = req.body.destDir;

  console.log("handleUpload -> " + file);
  console.log("             -> " + fileName);
  console.log("             -> " + destDir);

    if (!file) return res.send(handleError('no uploadfile found !'));
  
    if (destDir) 
    {  
      const baseName = path.basename(fileName); // nur der Dateiname
  
      // Zielpfad bauen
      const targetDir  = path.join(__dirname, destDir); // z. B. ./uploads/bilder/personen/avatars
      const targetPath = path.join(targetDir, baseName);
  
      // Verzeichnis anlegen, falls nicht vorhanden
      fs.mkdirSync(targetDir, { recursive: true });
  
      // Datei verschieben
      fs.rename(file.path, targetPath, (err) => {
      if (err) return res.send(handleError('Fehler beim Verschieben der Datei: ' + err.message));
  
      utils.log(`Upload & verschoben → ${targetPath}`);
  
      res.send(JSON.stringify({
        error: false,
        errMsg: "OK",
        result: {
          originalName: file.originalname,
          savedName: baseName,
          savedPath: targetPath,
          destination: destDir
        }
      }));
    });
  }
  else
  {
    // Wenn kein Zielverzeichnis angegeben ist, wird die Datei im temporären Verzeichnis gespeichert
    res.send(JSON.stringify({
      error: false,
      errMsg: "OK",
      result: {
        originalName: req.file.originalname,
        savedName: req.file.filename,
        savedPath: req.file.path
      }
    }));
  }  
}


function handleNTLM( req , res )
{
   var result  = {};
  result.username             = req.ntlm ? req.ntlm.UserName : '-';
  result.domain               = req.ntlm ? req.ntlm.DomainName : '-';
  result.workstation          = req.ntlm ? req.ntlm.Workstation : '-';
  result.authType             = req.ntlm ? req.ntlm.AuthType : '-';
  result.userIP               = req.connection.remoteAddress;
  result.userAgent            = req.headers['user-agent'] || '-';

  result.userHost             = req.headers['host'] || '-';
  result.userAccept           = req.headers['accept'] || '-';
  result.userAcceptEncoding   = req.headers['accept-encoding'] || '-';
  result.userAcceptLanguage   = req.headers['accept-language'] || '-';
  result.userConnection       = req.headers['connection'] || '-';
  result.userCacheControl     = req.headers['cache-control'] || '-';
  result.userPragma           = req.headers['pragma'] || '-';
  result.userUpgradeInsecureRequests = req.headers['upgrade-insecure-requests'] || '-';
  res.send( JSON.stringify(result) );
}



function handle_backDoor_Request( reqStr , res)
{
  res.send( "no_Way" );
}

webAPI.setup( dB , etc );


// Erhöhen der Größenbeschränkung
webApp.use(bodyParser.json      ({ limit: '50mb'                 }));  // Für JSON-Anfragen
webApp.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));  // Für URL-kodierte Anfragen
webApp.use(ntlm());

     
webApp.use( ( req , res , next ) =>
      {
        utils.log("request from: " + req.hostname + " (IP: "+req.ip+")" + "  at: " + utils.now() );
        utils.log("Method      : " + req.method);
        utils.log("URL         : " + req.originalUrl);
        utils.log("Params      : " + JSON.stringify(req.params));
        
        if(req.method === 'GET')
        { 
          var q =  JSON.stringify(req.query);
          utils.log("Query       : " + q );
        }  
          
        if(req.method === 'POST') 
         utils.log("Body (post) : " + JSON.stringify(req.body));
      
        utils.log("");
        utils.log("--------------------------------------------------------------------------");
        utils.log("use CORS ...");
        
        res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');

        next();
      
      });
      
      
webApp.use( express.static( globals.staticPath  ) );

webApp.get('/userLogin'                    ,  userLogin );
webApp.get('/userLoginx/:username/:passwd' ,  userLoginx );
webApp.get('/DEBUG'                        ,  handleDebug );
webApp.get('/ntlm'                         ,  handleNTLM );
webApp.get('/x'                            ,  handleRequest );


webApp.post('/xpost'                       ,  handleRequest );
webApp.post('/upload', upload.single('file'), handleUpload );
  
 
var webServer = {};

if(useHTTPS) webServer  = https.createServer( sslOptions , webApp );
else         webServer  = http.createServer (              webApp );

webServer.listen( port , () => {console.log('Server listening on Port ' + port )});

setInterval( webAPI.run          , 60000 ); // jede Minute prüfen, ob etwas im BATCH wartet ...
setInterval( session.ctrlSession , 1000 ); 





