const bacnet = require('bacstack');

// BACnet-Client starten (Port 47808 ist Standard für BACnet/IP)
const client = new bacnet({ port: 47808 });

// BACnet-Server-Adresse (UDP/IP) – hier broadcast, falls IP unbekannt
const SERVER_IP = '192.168.1.18'; // BACnet Broadcast oder bekannte IP
const SERVER_PORT = 47808;         // Standard-Port für BACnet/IP

// Listener für alle eingehenden BACnet-Nachrichten
client.on('indication', (msg) => {
  console.log('📩 Neue BACnet-Nachricht empfangen:');
  console.log(JSON.stringify(msg, null, 2));
});

// Broadcast-Anfrage an alle BACnet-Geräte (Who-Is)
console.log('🚀 Sende Who-Is-Broadcast...');
client.whoIs();

// Listener für I-Am-Antworten (Geräte melden sich)
client.on('iAm', (device) => {
  console.log('🆔 BACnet-Gerät gefunden:');
  console.log(`- Geräte-ID: ${device.deviceId}`);
  console.log(`- IP-Adresse: ${device.address}`);

  // Lese Standardwerte (z. B. Objektliste) vom gefundenen Gerät
  client.readProperty(device.address, { type: 8, instance: 4194303 }, 76, (err, value) => {
    if (err) {
      console.error('❌ Fehler beim Lesen der Objektliste:', err);
    } else {
      console.log('📊 Objektliste:', JSON.stringify(value, null, 2));
    }
  });
});

// Listener für COV-Benachrichtigungen
client.on('covNotification', (data) => {
  console.log('🔄 COV-Update (Change of Value) erhalten:');
  console.log(JSON.stringify(data, null, 2));
});

// Ungefilterte BACnet-Daten empfangen (nur für Debugging)
client.on('error', (err) => {
  console.error('❌ BACnet-Fehler:', err);
});

// Graceful Shutdown bei Beendigung
process.on('SIGINT', () => {
  console.log('👋 Verbindung wird geschlossen...');
  client.close();
  process.exit();
});
