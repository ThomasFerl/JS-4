const mqtt          = require('mqtt');
const nodeInfluxDB  = require('./nodeInfluxDB');  // Deinen InfluxDB-Wrapper importieren

// MQTT-Broker (Mosquitto) Konfiguration
const MQTT_BROKER_URL = 'mqtt://localhost:4701'; 
const mqttClient      = mqtt.connect(MQTT_BROKER_URL);

// InfluxDB-Client initialisieren
const influx = new nodeInfluxDB({
    url: 'http://localhost:8086',
    token: 'bqc9XmF2V8q2Di8ySTLZBrIJKdw33dMA2KfYP8QP1OT70WQkfGqo4kkhXCF8lHtzWkMBSBJVxgTPi3X_kMVQWQ==',
    org: 'Energie Mittelsachsen',
    bucket: 'mqttData'
});

// Verbindung zu Mosquitto herstellen
mqttClient.on('connect', () => 
    {
     console.log('✅ Verbunden mit Mosquitto-Broker');
     mqttClient.subscribe('#', (err) => {
        if (err) {
            console.error('❌ Fehler beim Abonnieren aller Topics:', err);
        } else {
            console.log('📡 Abonniert: ALLE Topics (#)');
        }
    });
});

// Nachricht empfangen und in InfluxDB speichern
mqttClient.on('message', async (topic, payload) => {
    console.log(`📩 Empfangen: ${topic} -> ${payload.toString()}`);

    try {
        await influx.saveValues('mqttPayloads', [{
            id: topic,  
            timestamp: new Date().toISOString(),
            wert: payload.toString()
        }]);
        console.log('✅ Gespeichert in InfluxDB');
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
    }
});

// Fehlerbehandlung
mqttClient.on('error', (err) => {
    console.error('❌ MQTT-Fehler:', err);
});
