const bacnet      = require('bacstack');
const SERVER_IP   = '192.168.1.18';
const SERVER_PORT = 47808;

// BACnet-Client starten
const client = new bacnet({ port: SERVER_PORT });



console.log('🚀 Starte BACnet-Testprogramm...');

// Debugging: Lausche auf **alle empfangenen UDP-Pakete**
client.on('indication', (msg) => {
  console.log('📩 Neue BACnet-Nachricht empfangen:', JSON.stringify(msg, null, 2));
});

// Debugging: Lausche auf Rohdaten (nur für UDP-Fehlersuche)
client.transport._server.on('message', (msg, rinfo) => {
  console.log(`📡 Rohdaten von ${rinfo.address}:${rinfo.port}:`, msg.toString('hex'));
});

// Debugging: Wer sendet "I-Am"?
client.on('iAm', (device) => {
  console.log('🆔 BACnet-Gerät gefunden:', device);
});

// Wer sendet COV-Updates?
client.on('covNotification', (data) => {
  console.log('🔄 COV-Update erhalten:', data);
});

// Fehlerlistener aktivieren
client.on('error', (err) => {
  console.error('❌ BACnet-Fehler:', err);
});

// **Who-Is gezielt an Gerät senden**
console.log('🚀 Sende gezielte Who-Is-Anfrage...');
client.whoIs({ address: SERVER_IP });

// **Zusätzlich: Geräte-ID auslesen (Falls I-Am nicht kommt)**
setTimeout(() => {
  console.log('📡 Versuche, die Geräte-ID direkt zu ermitteln...');
  client.readProperty({ address: SERVER_IP }, { type: 8, instance: 4194303 }, 76, (err, value) => {
    if (err) {
      console.error('❌ Fehler beim Abrufen der Geräte-ID:', err);
    } else {
      console.log('🆔 Gefundene Geräte-ID:', value);
    }
  });
}, 3000);

// **Programm sicher beenden**
process.on('SIGINT', () => {
  console.log('👋 Verbindung wird geschlossen...');
  client.close();
  process.exit();
});
