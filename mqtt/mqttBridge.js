/*
MQTT - Bridge
=============
Eine MQTT-Bridge ist ein Vermittler, der Nachrichten zwischen zwei MQTT-Brokern weiterleitet.

Der sourceBroker empfängt die Daten von den Messknoten.
Der targetBroker leitet die Daten an das zweite Netzwerk weiter.

sourceBroker Callback-Funktion bei Datenempfang:
------------------------------------------------
Die Funktion, die auf sourceBroker.on('message') reagiert, wird jedes Mal getriggert, wenn eine Nachricht auf einem abonnierten Topic eingeht.
Innerhalb der Callback-Funktion wird die empfangene Nachricht (message) mit demselben Topic (topic) an den Ziel-Broker veröffentlicht.
Das entspricht einer 1:1-Weiterleitung:

Fehlerbehandlung:
-----------------
Fehler beim Veröffentlichen oder bei der Verbindung werden in der Konsole ausgegeben.


Vorteile:
---------
Direkt und effizient: Nachrichten werden sofort weitergeleitet.
Minimaler Codeaufwand: Keine zusätzlichen Datenstrukturen oder Filter erforderlich, falls alles 1:1 weitergeleitet wird.
Erweiterbarkeit: Protokollierung, SQL-Datenbank oder andere Funktionen können einfach hinzugefügt werden.

*/

const mqtt   = require('mqtt');    // MQTT-Client-Bibliothek für targetBroker
const aedes  = require('aedes')(); // MQTT-Broker-Instanz für sourceBroker
const server = require('net').createServer(aedes.handle);

const sourceBroker_port     = 4700;

const targetBroker_port     = 4701;
const targetBroker_address  = 'mqtt://10.102.13.5';
const targetBroker_userName = '';
const targetBroker_password = '';

// Starte den Source-Broker
server.listen(sourceBroker_port, () => { console.log(`Source-Broker läuft auf Port ${sourceBroker_port}`); });

// Verbindung zum Ziel-Broker
const targetBroker = mqtt.connect(targetBroker_address + ':' + targetBroker_port , {reconnectPeriod: 5000});

// Wenn der Ziel-Broker verbunden ist
targetBroker.on('connect', () => { console.log('Verbunden mit Ziel-Broker'); });

// Ereignis: Offline
targetBroker.on('offline', () => { console.log('Ziel-Broker ist offline. Warte auf Wiederverbindung...'); });

// Ereignis: Wiederverbindung
targetBroker.on('reconnect', () => {console.log('Versuche, Verbindung zum Ziel-Broker wiederherzustellen...'); });


// Nachrichten-Handling im Source-Broker
// ankommende Nachrichten werden an den Ziel-Broker weitergeleitet
aedes.on('publish', (packet, client) =>
                                      {
                                        if (client) 
                                        {
                                          console.log(`Empfangen: ${packet.topic} -> ${packet.payload.toString()}`);

                                          // Weiterleitung an den Ziel-Broker
                                          targetBroker.publish(packet.topic, packet.payload, (err) => {
                                                                                                        if (err) console.error(`Fehler beim Weiterleiten von ${packet.topic}:`, err);
                                                                                                        else     console.log(`Weitergeleitet: ${packet.topic}`);
            
                                                                                                       });
                                       }
                                      });  // onPublish



