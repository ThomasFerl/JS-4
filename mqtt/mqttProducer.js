const mqtt = require('mqtt');

// Verbindungsparameter
const brokerUrl = 'mqtt://10.102.13.99:4701'; // Broker-URL (anpassen, falls notwendig)

const topics    = ['ems/test/01/pt1000.1',
                   'ems/test/01/pt1000.2',
                   'ems/test/01/pt1000.3',
                   'ems/test/02/pt1000.1',
                   'ems/test/02/pt1000.2',
                   'ems/test/02/pt1000.3'];
  
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
        x     = x+dx;
        var y = (Math.sin(x)+1)*70; // Zufallswert zwischen 0 und 140;

        for(var i=0; i<topics.length; i++)
          client.publish(topics[i], JSON.stringify({ value: Math.round(y+(Math.random() * 35)) , timestamp: Date.now() }));

      }, 10000);
  }
);

// Fehlerbehandlung
client.on('error', (err) => {
  console.error('MQTT-Verbindungsfehler:', err);
});
