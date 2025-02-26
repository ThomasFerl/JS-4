const mqtt = require('mqtt');

// Verbindungsparameter
const brokerUrl = 'mqtt://10.102.13.99:4701'; // Broker-URL (anpassen, falls notwendig)
const topic = 'ems/test/01/pt1000'; // Topic, auf dem die Daten gesendet werden
var x = 0;
var dx=0.01;

// MQTT-Client erstellen und verbinden
const client = mqtt.connect(brokerUrl);

// Verbindung herstellen
client.on('connect', () => 
  {
    console.log('Verbunden mit dem Broker:', brokerUrl);

    // Sende jede 4 Sekunden einen zufälligen Wert
    setInterval(() => 
      {
        x=x+dx;
        var y = Math.sin(x)*70+(Math.random() * 7); // Zufallswert zwischen 0 und 99
        client.publish(topic, JSON.stringify({ value: Math.round(y) , timestamp: Date.now() }));
        console.log(`Wert gesendet: ${Math.round(y)}`);
      }, 4000);
  }
);

// Fehlerbehandlung
client.on('error', (err) => {
  console.error('MQTT-Verbindungsfehler:', err);
});
