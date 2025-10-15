const Bacnet = require('node-bacnet');

// 1) BACnet-Client starten
const client = new Bacnet({
  port: 47808, // eigener Port für den Client
  interface: '10.102.111.139', // IP-Adresse Deiner Netzwerkkarte
  broadcastAddress: '10.102.111.255' // Broadcast-Adresse passend zur Netzmaske
});

// 2) Auf I-Am antworten
client.on('iAm', (device) => {
  console.log('✅ Antwort erhalten von BACnet-Gerät:');
  console.log(`- Device-Instance: ${device.deviceId}`);
  console.log(`- Adresse: ${device.address}`);
});

// 3) Who-Is senden
client.whoIs();
console.log('📡 Who-Is gesendet. Warte auf Antwort...');

// 4) Nach 5 Sekunden beenden
setTimeout(() => {
  client.close();
  console.log('🛑 Test abgeschlossen.');
}, 50000);