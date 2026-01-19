const globals   = require('./backendGlobals');
const utils     = require('./nodeUtils');
const mqtt      = require('mqtt');
const WebSocket = require('ws');


class TMQTTDistributor
{
  constructor( mqttParam , mqttOptions )
  {
    this.wsPort       = globals.__Port_webSocket;
    this.mqttBroker   = mqttParam.mqttBroker; 
    this.topic        = mqttParam.topic      || '#';       
    this.mqttOptions  = mqttOptions || {};
    this.wsClients    = new Set();
    this.mqttClient   = null;
    this.wsServer     = null;
  }

  start()
  {
    if( this.mqttClient != null ) this.mqttClient.end();
    if( this.wsServer   !=null  ) this.wsServer.close();

    // WebSocket - Part
    this.wsServer        = new WebSocket.Server({ port: this.wsPort });
    utils.log('WebSocket-Server läuft auf ' + this.wsServer );

    // WebSocket-Client-Verbindungen verwalten
    this.wsServer.on('connection', (ws) => {
                                             console.log('Browser-Client verbunden');
                                             this.wsClients.add(ws);

                                             ws.on('close', () => {
                                                                    console.log('Browser-Client getrennt');
                                                                    this.wsClients.delete(ws);
                                                                  });
                                            });


    // MQTT - Part
    this.mqttClient = mqtt.connect( this.mqttBroker , this.mqttOptions);

    this.mqttClient.on('connect', () => {
                                          utils.log(`Verbunden mit MQTT-Broker: ${this.mqttBroker}`);
                                          // Topics abonnieren
                                          this.mqttClient.subscribe([this.topic], (err) => {
                                                                                             if (err) console.error('Fehler beim Abonnieren:', err);
                                                                                             else utils.log('Topics abonniert:', this.topic);
                                                                                           }
                                                                   );
                                        });
    
    
    // MQTT-Nachrichten empfangen und an WebSocket-Clients senden
    this.mqttClient.on('message', (topic, message) => {
                                                        utils.log(`MQTT-Nachricht empfangen: ${topic} -> ${message.toString()}`);
                                                        //Nachricht an alle WebSocket-Clients senden
                                                        for (const ws of this.wsClients)
                                                          {
                                                            var mqttMsg = { topic: topic , payload: message.toString() };
                                                            utils.log('Nachricht an WebSocket-Client senden ->'+ mqttMsg);
                                                            ws.send(JSON.stringify(mqttMsg));
                                                          }  
                                                 });

    
    // Fehlerbehandlung
    this.mqttClient.on('error', (err) => {console.error('MQTT-Fehler:', err); });
  
}


stop()
{
  if( this.mqttClient != null ) this.mqttClient.end();
  if( this.wsServer   !=null  ) this.wsServer.close();  
  
  this.mqttClient = null;
  this.wsServer   = null;
}


destroy()
{
  this.stop();
  this.wsClients.clear();   
}  


}

module.exports.TMQTTDistributor = TMQTTDistributor;

















