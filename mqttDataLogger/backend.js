const useHTTPS          = false;
const port              = '4001';

const MQTT_BROKER_URL   = 'mqtt://10.102.13.99:4701'; 

const globals           = require('./backendGlobals');

const http        = require('http');
const https       = require('https');

const express     = require('express');
const multer      = require('multer');
const bodyParser  = require('body-parser');

const Database    = require('better-sqlite3');
const fs          = require('fs-extra');
const path        = require('path');
const mqtt        = require('mqtt');
const mqttHandler = require('./mqttHandler');


const utils       = require('./nodeUtils');
const webAPI      = require('./nodeAPI');
const userAPI     = require('./userAPI');
const session     = require('./session');
const dbUtils     = require('./dbUtils');
const dbTables    = require('./dbTables');


const {TMQTTDistributor}    = require('./mqttDistributor');
const { networkInterfaces } = require('os');
const { Console }           = require('console');

const sslOptions  = {
    key : fs.readFileSync('./SSL/privateKex.pem'  , 'utf8' ),     // Pfad zum privaten Schlüssel
    cert: fs.readFileSync('./SSL/certificate.pem' , 'utf8' )    // Pfad zum Zertifikat
   };

const dBetc       = './etc.db';
const etc         = new Database( dBetc  , { verbose: utils.log } );
      utils.log("etc-dB: "+etc.constructor.name);

const dBName      = './mqtt_registry.db';
const dB          = new Database( dBName  , { verbose: utils.log ,  readonly: false } );
      utils.log("working-dB: "+dB.constructor.name);


// Datenstruktur lt. dBTables erzeugen ....
dbTables.buildTables( dB );


//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
// MQTT - Client starten und zum Mosquitto-Server Verbindung aufnehmen
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

const defaultTopic = '#';

mqttHandler.setup( dB );

const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
                                  console.log('✅ Verbunden mit Mosquitto-Broker');
                                  mqttClient.subscribe( defaultTopic , (err) => {
                                                                       if (err) console.error('❌ Fehler beim Abonnieren des Topics: ' + defaultTopic , err);
                                                                       else     console.log('📡 Abonniert: ' + defaultTopic );
                                                                     });
                                });                                      

// Nachricht empfangen und in DB speichern
mqttClient.on('message', async (topic, payload) => { mqttHandler.onMessage(topic, payload); });
 
// Fehlerbehandlung
mqttClient.on('error', (err) => { console.error('❌ MQTT-Fehler:', err); });



//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
// MQTT - Distributor starten und mqtt-Topics zum Frontend zu senden
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

// MQTT - Distributor starten
mqttDist = new TMQTTDistributor({ mqttBroker: MQTT_BROKER_URL,
                                  topic     : defaultTopic 
                                })

mqttDist.start();


//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------



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

    // utils.log('return from webAPI-Handler : ' + response );
  
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


function handle_backDoor_Request( reqStr , res)
{
  res.send( "no_Way" );
}


function handleSyncForce( req , res )
{
  mqttHandler.synchronize();   
  mqttHandler.aggregateHourly();   
  mqttHandler.aggregateDaily();   
  mqttHandler.cleanUp_old_payLoads(); 
  res.send("Synchronisation außerhalb des Scheduler ausgeführt ...");
}  


function handleMQTT( req , res )
{
  for(var i=0; i<0; i++) console.log(".");

  const url       = req.originalUrl;
  const parts     = url.split("/mqtt/");
  const topicPath = parts[1]; 
  console.log("TOPIC " + topicPath);

  // Paylods zum Topic ermitteln....
  var response = dbUtils.fetchRecords_from_Query( dB , "Select ID from mqttTopics Where topic like '"+topicPath+"%'" );
  if ((response.error) || (response.result.lengtt==0))return res.send( handleError("mqttTopic not found: " + topicPath ));

  result = ['<?xml version="1.0"?>']
  result.push('<PV>');

  for(var i=0; i<response.result.length; i++)
  {
    var ID_topic = response.result[i].ID;

    console.log("("+i+") ID_topic: " + ID_topic);

    var payload = dbUtils.fetchRecord_from_Query( dB , "Select * from mqttPayloads Where ID_Topic="+ID_topic+" order by ID desc limit 1" );

   if (!payload.error) 
    {
      try {
            var pl = payload.result.payload;
            console.log("("+i+") payload:" + pl );

            var jsn = JSON.parse(pl); 
            var n=jsn.name;
            var v=jsn.value;
            
            console.log("("+i+") payload: Name=" + n + "  Value: " + v );
            // entferne leerzeichen aus dem Namen:
            n = n.replace(/\s+/g, '');
            result.push('  <'+n+' _="' + v + '"/>');
          }
      catch(e) {  console.log("Fehler: " + e.message); jsn = {} }
    }  
  }  

  result.push('</PV>');

  console.log("result: " + result.join('\n'));

  if ((result.length==0)) res.send( handleError("mqttPayload not found: " + topicPath ));
  else 
  {
    var r = '';
    for(var i=0; i<result.length; i++) r += result[i]+'\n'; 
    
     res.setHeader('Content-Type', 'application/xml');
     res.send(r);
  }  

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
webApp.get('/syncForce'                    ,  handleSyncForce );
webApp.post('/xpost'                       ,  handleRequest );
webApp.get('/mqtt/*'                         ,  handleMQTT );
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

// interne Session-Steuerung
setInterval( session.ctrlSession , 1000 ); 

// jede Minute prüfen, ob etwas im BATCH wartet ...
setInterval( webAPI.run          , 60000 ); 

// Prüft jede Minute ob neue RAW-Payloads vorliegen ung kopiert die Daten ggf in "Measurements"...
setInterval(() => {
                   mqttHandler.synchronize();   
                  } , 60 * 1000); 

// Prüft jede Stunde ob neue Daten in "Measurements" vorliegen und aggregiert diese zu Stundenwerten
setInterval(() => {
                   mqttHandler.aggregateHourly();   
                  } , 60 * 60 * 1000); 


// Prüft bei jedem Tageswechsel ob neue Daten in "hourly_Measurements" vorliegen und aggregiert diese zu Tageswerten
setInterval(() => {
                    // liegt ein Tageswechsel vor ?
                    var d = new utils.TFDateTime();
                    if(d.hour=1) mqttHandler.aggregateDaily();   
                  } , 60 * 60 * 1000); 


// Prüft jede Stunde(60 sekunden*60), was an RAW-Payloads gelöscht werden kann... (Daten wurden in Measurements gespeichert und sind älter als "maxAgePayloadHistory")
setInterval(() => {
                    mqttHandler.cleanUp_old_payLoads(); 
                  } , 60*60 * 1000);