const useHTTPS          = false;
const port              = '4000';

const http        = require('http');
const https       = require('https');

const express     = require('express');
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

const {TMQTTDistributor}    = require('./nodeMQTT');
const { networkInterfaces } = require('os');
const { Console }           = require('console');

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


// MQTT - Distributor starten
mqttDist = new TMQTTDistributor({ wsPort    : 4400 , 
                                  mqttBroker: 'mqtt://10.102.13.5:4701',
                                  topic     : '#' 
                                })

mqttDist.start();

const webApp      = express();
  var staticPath  = path.join (__dirname, 'frontend' );
      utils.log("static Path: " + staticPath );


 // Konfiguriere Multer, für fileUpload
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'tmp/'); }, // Zielverzeichnis für uploads 
  
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
      if(!globals.ignoreSession)
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


function lsPix( req , res )
{
  // ermittle alle Datein im Ordner ./frontend/pix
  var pixPath = path.join(__dirname, 'frontend/pix');
  var files   = fs.readdirSync(pixPath);
  var pix     = [];
  for(var i=0; i<files.length; i++)
  {
    var f = files[i];
    var p = path.join(pixPath , f);
    var s = fs.statSync(p);
    if(s.isFile()) pix.push(f);
  }
 
  res.send( JSON.stringify({error:false, errMsg:"OK", result:pix}));
}  







function handle_backDoor_Request( reqStr , res)
{
  res.send( "no_Way" );
}

webAPI.setup( dB , etc );


// Erhöhen der Größenbeschränkung
webApp.use(bodyParser.json      ({ limit: '50mb'                 }));  // Für JSON-Anfragen
webApp.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));  // Für URL-kodierte Anfragen

     
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
      
      
webApp.use( express.static( staticPath  ) );

webApp.get('/userLogin'                    ,  userLogin );
webApp.get('/userLoginx/:username/:passwd' ,  userLoginx );
webApp.get('/DEBUG'                        ,  handleDebug );
webApp.get('/x'                            ,  handleRequest );

webApp.get('/lsPix'                        ,  lsPix );

webApp.post('/xpost'                       ,  handleRequest );
webApp.post('/upload', upload.single('file'), (req, res) => {
                                                              if (!req.file) return res.send(handleError('no uploadfile found !'));
                                                              
                                                              // Datei wurde erfolgreich hochgeladen und ist über req.file zugänglich
                                                              res.send(JSON.stringify({error:false, errMsg:"OK", result:req.file}))
                                                              utils.log('Datei hochgeladen:', req.file);
  
                                                              // Weitere Verarbeitung oder Antwort hier...
                                                            });  // Ende UPLOAD




var webServer = {};

if(useHTTPS) webServer  = https.createServer( sslOptions , webApp );
else         webServer  = http.createServer (              webApp );

webServer.listen( port , () => {console.log('Server listening on Port ' + port )});

setInterval( webAPI.run          , 60000 ); // jede Minute prüfen, ob etwas im BATCH wartet ...
setInterval( session.ctrlSession , 1000 ); 