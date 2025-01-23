const mqtt = require('mqtt');

// Verbindungsparameter
const brokerUrl = 'mqtt://localhost:4700'; // Broker-URL (anpassen, falls notwendig)
const topic = 'wago/mqtt/test'; // Topic, auf dem die Daten gesendet werden

// MQTT-Client erstellen und verbinden
const client = mqtt.connect(brokerUrl);

// Verbindung herstellen
client.on('connect', () => {
  console.log('Verbunden mit dem Broker:', brokerUrl);

  // Sende jede Sekunde einen zufälligen Wert
  setInterval(() => {
    const randomValue = Math.floor(Math.random() * 100); // Zufallswert zwischen 0 und 99
    client.publish(topic, JSON.stringify({ value: randomValue, timestamp: Date.now() }));
    console.log(`Wert gesendet: ${randomValue}`);
  }, 1000);
});

// Fehlerbehandlung
client.on('error', (err) => {
  console.error('MQTT-Verbindungsfehler:', err);
});
