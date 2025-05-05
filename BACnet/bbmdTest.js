const dgram = require('dgram');
const client = dgram.createSocket('udp4');

// === 🔧 Konfiguration ===
const LOCAL_PORT = 47809;           // Lokaler Port zum Empfang der I-Am Antworten
const BBMD_IP = '10.102.111.200';     // IP-Adresse des BBMD
const BBMD_PORT = 47808;            // Standard BACnet/IP-Port
const TTL_SECONDS = 60;             // Gültigkeit der Foreign Registration

// === 🛰️ Schritt 1: FDR senden ===
const fdrPacket = Buffer.from([
  0x81, 0x05,             // BVLC: Type = 0x81, Function = 0x05 (Register-Foreign-Device)
  0x00, 0x06,             // Length = 6 bytes
  (TTL_SECONDS >> 8) & 0xFF, TTL_SECONDS & 0xFF  // TTL in Sekunden
]);

console.log(`📡 Sende Foreign Device Registration an ${BBMD_IP}:${BBMD_PORT}...`);

client.send(fdrPacket, 0, fdrPacket.length, BBMD_PORT, BBMD_IP, (err) => {
  if (err) {
    console.error('❌ Fehler beim Senden:', err);
    client.close();
    return;
  }
});

// === 🎧 Listener aktivieren ===
client.on('message', (msg, rinfo) => {
  if (msg.length >= 4 && msg[0] === 0x81) {
    const func = msg[1];
    if (func === 0x00) {
      const resultCode = msg[4];
      if (resultCode === 0x00) {
        console.log('✅ Registrierung erfolgreich – sende Who-Is...');
        sendWhoIs();
      } else {
        console.log(`⚠️ Registrierung abgelehnt (Result=${resultCode})`);
        client.close();
      }
    } else if (func === 0x0a) {
      // BVLC: Original-Unicast-NPDU → möglicherweise eine I-Am-Antwort
      console.log(`📬 Antwort von ${rinfo.address}:${rinfo.port}`);
      decodeIAm(msg);
    } else {
      console.log(`🔍 Unerwartete BVLC-Funktion: 0x${func.toString(16)}`);
    }
  }
});

// === 🛰️ Schritt 2: Who-Is nach erfolgreicher FDR ===
function sendWhoIs() {
  const npdu = Buffer.from([0x01, 0x20]); // NPDU Header (normal priority)
  const apdu = Buffer.from([0x10, 0xff, 0xff, 0xff, 0xff]); // Who-Is (Low/High device ID = 0xFFFFFFFF)
  const whoIsPacket = Buffer.concat([
    Buffer.from([0x81, 0x0b, 0x00, 0x0c]), // BVLC: Original-Broadcast-NPDU, Length = 12
    npdu, apdu
  ]);

  client.send(whoIsPacket, 0, whoIsPacket.length, BBMD_PORT, BBMD_IP, (err) => {
    if (err) {
      console.error('❌ Fehler beim Senden des Who-Is:', err);
      client.close();
    } else {
      console.log('📤 Who-Is gesendet. Warte auf I-Am-Antworten...');
    }
  });

  // Nach 10 Sekunden schließen
  setTimeout(() => {
    console.log('\n🧾 Fertig – Client wird beendet.');
    client.close();
  }, 10000);
}

// === 🧠 I-Am Telegramm analysieren ===
function decodeIAm(msg) {
  const apduStart = msg.indexOf(0x10); // Unconfirmed Request (I-Am)
  if (apduStart < 0 || msg.length < apduStart + 7) return;

  const deviceId = (msg[apduStart + 1] << 24) |
                   (msg[apduStart + 2] << 16) |
                   (msg[apduStart + 3] << 8) |
                    msg[apduStart + 4];

  console.log(`➡️ I-Am von Device-ID: ${deviceId}`);
}

// === ✋ Fallback-Timeout bei keiner Antwort ===
setTimeout(() => {
  console.log('⏱️ Keine Antwort vom BBMD nach 3 Sekunden – evtl. FDR gescheitert?');
}, 3000);

// Lokalen Port binden (damit I-Am empfangen wird)
//client.bind(LOCAL_PORT);
