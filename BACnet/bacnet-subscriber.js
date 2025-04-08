const bacnet      = require('bacstack');
const SERVER_IP   = '10.102.118.8';
const SERVER_PORT = 47808;

// BACnet-Client starten
const client = new bacnet();

console.log("Read Property");

client.readProperty( SERVER_IP , { type: 8, instance: 2492222 }, 85, (err, value) => {
    if (err) return console.error('Fehler:', err);
    console.log('Antwort:', value);
});






console.log('🚀 Starte BACnet-Testprogramm...');

// **Who-Is gezielt an Gerät senden**
console.log('🚀 Sende gezielte Who-Is-Anfrage an '+SERVER_IP+' port:'+SERVER_PORT);
client.whoIs({ address:SERVER_IP});

// **Listener für BACnet-Daten**
client.on('indication', (msg) => {
  console.log('📩 Neue BACnet-Nachricht empfangen:', JSON.stringify(msg, null, 2));
});

// Wer sendet "I-Am"?
client.on('iAm', (device) => {
  console.log('🆔 BACnet-Gerät gefunden:');
  console.log(`- Geräte-ID: ${device.deviceId}`);
  console.log(`- IP-Adresse: ${device.address}`);

  // Fix: Extrahiere IP-Adresse für readProperty()
  const ip = device.address.split(':')[0]; // IP-Adresse extrahieren
  console.log(`🔍 Versuche, Objektliste von ${ip} zu lesen...`);

  client.readProperty(ip, { type: 8, instance: 2492222 }, 76, (err, value) => {
    if (err) {
      console.error('❌ Fehler beim Lesen der Objektliste:', err);
    } else {
      console.log('📊 Objektliste:', JSON.stringify(value, null, 2));
    }
  });
});

// Wer sendet COV-Updates?
client.on('covNotification', (data) => {
  console.log('🔄 COV-Update erhalten:', JSON.stringify(data, null, 2));
});

// Fehlerlistener aktivieren
client.on('error', (err) => {
  console.error('❌ BACnet-Fehler:', err);
});

// **Programm sicher beenden**
process.on('SIGINT', () => {
  console.log('👋 Verbindung wird geschlossen...');
  client.close();
  process.exit();
});
