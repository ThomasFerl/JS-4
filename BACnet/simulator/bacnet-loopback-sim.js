/**
 * BACnet Loopback Simulator – funktioniert komplett auf einem PC
 * npm install bacstack
 * node bacnet-loopback-sim.js
 */

const Bacnet = require('node-bacstack');

const DEVICE_ID = 12345;
const UDP_PORT_SERVER = 47808;
const UDP_PORT_CLIENT = 47809; // interne Client-Portnummer
const VENDOR_ID = 260;
const COV_DEADBAND = 0.2;
const TEMP_UPDATE_INTERVAL = 4000;

// === Server (simuliertes Device) ===
const server = new Bacnet({ port: UDP_PORT_SERVER, interface: '127.0.0.1' });
const objects = {
  'analogInput:1': { type: 0, instance: 1, presentValue: 21.5 },
  'analogInput:2': { type: 0, instance: 2, presentValue: 22.3 }
};
let subscribers = [];

function logServer(msg) {
  console.log(`[Server] ${msg}`);
}

// Reagiert auf Who-Is
server.on('whoIs', (data) => {
  logServer(`Who-Is empfangen von ${data.address}`);
  server.iAmResponse(DEVICE_ID, 0x05, Bacnet.enum.Segmentation.SEGMENTATION_NONE, VENDOR_ID, data.address);
  logServer(`I-Am an ${data.address} gesendet`);
});

// Reagiert auf ReadProperty
server.on('readProperty', (req) => {
  const key = `analogInput:${req.objectId.instance}`;
  if (objects[key]) {
    const val = objects[key].presentValue;
    server.readPropertyResponse(req.address, req.invokeId, req.objectId, Bacnet.enum.PropertyIdentifier.PRESENT_VALUE, [
      { type: Bacnet.enum.ApplicationTags.REAL, value: val }
    ]);
    logServer(`ReadProperty: ${key} -> ${val} an ${req.address}`);
  }
});

// Reagiert auf SubscribeCOV
server.on('subscribeCov', (req) => {
  logServer(`SubscribeCOV von ${req.address} für Obj ${req.monitoredObject.type}:${req.monitoredObject.instance}`);
  subscribers.push(req);
  const key = `analogInput:${req.monitoredObject.instance}`;
  if (objects[key]) {
    sendCov(req.address, req.monitoredObject, objects[key].presentValue);
  }
});

// Sendet COV Notification
function sendCov(address, objId, value) {
  server.covNotifyUnconfirmed(address, DEVICE_ID, [
    {
      objectId: objId,
      values: [
        { property: { id: Bacnet.enum.PropertyIdentifier.PRESENT_VALUE }, value: [{ type: Bacnet.enum.ApplicationTags.REAL, value }] }
      ]
    }
  ]);
  logServer(`COV -> ${address}: ${objId.type}:${objId.instance}=${value}`);
}

// Temperaturänderung simulieren
setInterval(() => {
  Object.keys(objects).forEach(k => {
    const old = objects[k].presentValue;
    const next = Math.round((old + (Math.random() - 0.5)) * 10) / 10;
    objects[k].presentValue = next;
    if (Math.abs(next - old) >= COV_DEADBAND) {
      subscribers.forEach(s => {
        sendCov(s.address, s.monitoredObject, next);
      });
    }
  });
}, TEMP_UPDATE_INTERVAL);

// === Client (simulierte GLT) ===
const client = new Bacnet({ port: UDP_PORT_CLIENT, interface: '127.0.0.1' });

function logClient(msg) {
  console.log(`[Client] ${msg}`);
}

// Empfang von I-Am
client.on('iAm', (device) => {
  logClient(`I-Am erhalten von ${device.address} für Device ${device.deviceId}`);
  // anschließend ReadProperty abfragen
  [1, 2].forEach(ai => {
    client.readProperty(device.address, { type: 0, instance: ai }, Bacnet.enum.PropertyIdentifier.PRESENT_VALUE, (err, val) => {
      if (err) logClient(`ReadProperty Fehler: ${err.message}`);
      else logClient(`AI${ai} Wert: ${val?.values?.[0]?.value}`);
    });
    // COV abonnieren
    client.subscribeCov(device.address, { type: 0, instance: ai }, false, 60);
  });
});

// Startablauf: Who-Is schicken
setTimeout(() => {
  logClient('Who-Is wird gesendet ...');
  client.whoIs('127.0.0.1');
}, 1500);

console.log('-----------------------------------------------');
console.log(' BACnet Loopback Simulator gestartet');
console.log(` Server-Port: ${UDP_PORT_SERVER}`);
console.log(` Client-Port: ${UDP_PORT_CLIENT}`);
console.log('-----------------------------------------------');
