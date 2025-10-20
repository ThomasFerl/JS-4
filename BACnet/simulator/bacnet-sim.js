/**
 * bacnet-sim.js
 *
 * Minimal BACnet Simulator (Node.js + bacstack)
 * - Configurable DeviceId
 * - Two AnalogInput objects (1 and 2) as temperatures
 * - Responds to WhoIs with I-Am
 * - Answers ReadProperty (presentValue)
 * - Handles SubscribeCOV and sends unconfirmed COV notifications
 *
 * Usage:
 *   npm install bacstack
 *   node bacnet-sim.js
 */

const Bacnet = require('bacstack');
const os = require('os');
const interfaces = os.networkInterfaces();
const IP = Object.values(interfaces)
  .flat()
  .find(i => i.family === 'IPv4' && !i.internal)?.address;


// === Configuration ===
const DEVICE_ID = 12345; // Device Instance
const VENDOR_ID = 260;   // optional
const UDP_PORT = 47808;  // default BACnet UDP port
const DEVICE_NAME = 'JS-BACnet-Sim';
const ANNOUNCE_IAM_ON_START = true;           // send I-Am on startup
const TEMP_UPDATE_INTERVAL_MS = 5000;         // temperature update interval
const COV_DEADBAND = 0.1;                     // change >= deadband triggers notification









// === Simulated Objects ===
const objects = {
  'analogInput:1': {
    type: Bacnet.enum.ObjectType.ANALOG_INPUT || 0,
    instance: 1,
    presentValue: 21.5,
    units: 17 // degreeCelsius
  },
  'analogInput:2': {
    type: Bacnet.enum.ObjectType.ANALOG_INPUT || 0,
    instance: 2,
    presentValue: 22.3,
    units: 17
  }
};

// Track COV subscribers
// each: {address, subscriberProcessIdentifier, monitoredObject, lifetime}
const subscribers = [];

// Create bacstack client (acts as both client/server)
const client = new Bacnet({
  apduTimeout: 6000,
  interface: IP,
  port: UDP_PORT,
  broadcastAddress: '255.255.255.255'
});

setTimeout(() => {
  client.iAmResponse(
    DEVICE_ID,
    0x05,
    Bacnet.enum.Segmentation.SEGMENTATION_NONE,
    VENDOR_ID,
    '10.102.111.255',
  );
  console.log('[I-Am] sent directly to localhost');
}, 1000);




// Helper: send I-Am (supports multiple bacstack versions)
function sendIAm(unicastAddress) {
  try {
    const segNone = Bacnet.enum.Segmentation?.SEGMENTATION_NONE ?? 3;
    const target = unicastAddress || '255.255.255.255'; // <-- Broadcast, wenn keine Zieladresse angegeben
    if (typeof client.iAmResponse === 'function') {
      client.iAmResponse(DEVICE_ID, 0x05, segNone, VENDOR_ID, target);
      console.log(`[I-Am] broadcast sent to ${target}: deviceId=${DEVICE_ID}`);
    } else {
      console.warn('iAmResponse not available on bacstack client');
    }
  } catch (e) {
    console.warn('I-Am send error:', e.message || e);
  }
}

// WhoIs handler -> reply with I-Am
client.on('whoIs', (data) => {
  console.log('[WhoIs] from', data.address);
  sendIAm(data.address);
});

// ReadProperty handler
client.on('readProperty', (request) => {
  try {
    const { objectId, property, address, invokeId } = request;
    const objType = objectId.type;
    const inst = objectId.instance;
    const key = `analogInput:${inst}`;
    const propertyIdentifier = property?.id ?? property?.propertyIdentifier ?? null;

    console.log(`[ReadProperty] from ${address} -> object=${objType}:${inst} property=${JSON.stringify(property)}`);

    if (key in objects && (propertyIdentifier === Bacnet.enum.PropertyIdentifier.PRESENT_VALUE || propertyIdentifier === 85)) {
      const val = objects[key].presentValue;
      const values = [{ type: Bacnet.enum.ApplicationTags.REAL || 4, value: val }];
      try {
        // Newer signature
        client.readPropertyResponse(address, invokeId, objectId, Bacnet.enum.PropertyIdentifier.PRESENT_VALUE || 85, values);
        console.log(`[ReadPropertyResponse] ${key} -> ${val} sent to ${address}`);
      } catch (e1) {
        try {
          // Older variant
          client.readPropertyResponse(address, objectId, { id: Bacnet.enum.PropertyIdentifier.PRESENT_VALUE || 85 }, values, (err) => {
            if (err) console.error('readPropertyResponse err:', err);
            else console.log(`[ReadPropertyResponse] ${key} -> ${val} sent to ${address}`);
          });
        } catch (e2) {
          console.error('ReadPropertyResponse failed due to API mismatch:', e1.message || e1, e2.message || e2);
          try {
            client.errorResponse(address, Bacnet.enum.ConfirmedServiceChoice.READ_PROPERTY, invokeId, Bacnet.enum.ErrorClass.OBJECT, Bacnet.enum.ErrorCode.OTHER);
          } catch {}
        }
      }
    } else {
      try {
        client.errorResponse(address, Bacnet.enum.ConfirmedServiceChoice.READ_PROPERTY, invokeId, Bacnet.enum.ErrorClass.OBJECT, Bacnet.enum.ErrorCode.UNKNOWN_OBJECT);
      } catch (e) {
        console.warn('errorResponse failed (api mismatch?)', e.message || e);
      }
      console.log(`[ReadProperty] unknown object/property -> sent error to ${address}`);
    }
  } catch (e) {
    console.error('Exception in readProperty handler:', e);
  }
});

// SubscribeCOV handler
client.on('subscribeCov', (request) => {
  try {
    const { address, subscriberProcessIdentifier, monitoredObject, lifetime } = request;
    const { type, instance } = monitoredObject;
    console.log(`[SubscribeCOV] from ${address} -> subscriberId=${subscriberProcessIdentifier} object=${type}:${instance} lifetime=${lifetime}`);

    subscribers.push({ address, subscriberProcessIdentifier, monitoredObject, lifetime: lifetime || 0 });

    // Initial unconfirmed COV
    const pv = objects[`analogInput:${instance}`]?.presentValue;
    if (pv != null) {
      sendUnconfirmedCovNotificationTo(address, monitoredObject, pv, subscriberProcessIdentifier, lifetime || 0);
    }
  } catch (e) {
    console.error('subscribeCov handler error:', e);
  }
});

// Helper: send unconfirmed COV notification
function sendUnconfirmedCovNotificationTo(address, objectId, presentValue, subscriberProcessIdentifier = 1, timeRemaining = 0) {
  try {
    const listOfValues = [
      { property: { id: Bacnet.enum.PropertyIdentifier.PRESENT_VALUE || 85 }, value: [{ type: Bacnet.enum.ApplicationTags.REAL || 4, value: presentValue }] }
    ];
    if (typeof client.covNotifyUnconfirmed === 'function') {
      try {
        // Newer signature
        client.covNotifyUnconfirmed(address, subscriberProcessIdentifier, DEVICE_ID, objectId, timeRemaining, listOfValues);
        console.log(`[COV] unconfirmed notification sent to ${address} for ${objectId.type}:${objectId.instance} -> ${presentValue}`);
        return;
      } catch (e1) {
        // Older variant
        const values = [{ objectId, values: listOfValues }];
        client.covNotifyUnconfirmed(address, DEVICE_ID, values, (err) => {
          if (err) console.error('covNotifyUnconfirmed err (fallback):', err);
          else console.log(`[COV] unconfirmed notification (fallback) sent to ${address} for ${objectId.type}:${objectId.instance} -> ${presentValue}`);
        });
        return;
      }
    }
    console.warn('covNotifyUnconfirmed not available on bacstack client.');
  } catch (e) {
    console.warn('covNotifyUnconfirmed failed (api mismatch?):', e.message || e);
  }
}

// Periodic temp updates + COV
setInterval(() => {
  Object.keys(objects).forEach((k) => {
    const old = objects[k].presentValue;
    const delta = (Math.random() - 0.5) * 0.5; // +/- 0.25°C
    const next = Math.round((old + delta) * 10) / 10; // one decimal
    objects[k].presentValue = next;

    if (Math.abs(next - old) >= COV_DEADBAND) {
      subscribers.forEach((s) => {
        const obj = s.monitoredObject;
        if (obj && obj.type === objects[k].type && obj.instance === objects[k].instance) {
          sendUnconfirmedCovNotificationTo(s.address, obj, next, s.subscriberProcessIdentifier, s.lifetime || 0);
        }
      });
    }
  });
}, TEMP_UPDATE_INTERVAL_MS);

// Start-up I-Am announce
if (ANNOUNCE_IAM_ON_START) {
  setTimeout(() => sendIAm(), 1000);
}

console.log(`BACnet simulator started. Device=${DEVICE_ID}, UDP port=${UDP_PORT}`);
console.log('Objects:');
Object.keys(objects).forEach(k => {
  console.log('  -', k, 'value=', objects[k].presentValue);
});

process.on('uncaughtException', (err) => {
  console.error('Unhandled exception:', err);
});
