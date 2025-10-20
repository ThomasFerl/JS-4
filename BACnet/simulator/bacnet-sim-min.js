/**
 * bacnet-sim.js
 *
 * Minimaler BACnet-Simulator (Node.js + bacstack) für lokalen Test mit YABE
 * - Läuft als BACnet-Device auf eigenem UDP-Port (Default 47809, damit kein Konflikt mit YABE 47808)
 * - Zwei AnalogInput-Objekte (1 und 2) als Temperaturen
 * - Sendet beim Start ein gezieltes I-Am an YABE (Unicast)
 * - Beantwortet ReadProperty (presentValue)
 * - Unterstützt SubscribeCOV und sendet unbestätigte COV-Notifications
 *
 * Usage:
 *   npm install bacstack
 *   node bacnet-sim.js
 *   PORT=47900 YABE=127.0.0.1:47808 node bacnet-sim.js
 *   node bacnet-sim.js --iface 127.0.0.1 --port 47809 --yabe 127.0.0.1:47808
 */

'use strict';

const Bacnet = require('bacstack');
const os = require('os');

// --- CLI/ENV Konfiguration ---
function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {};
  argv.forEach((a) => {
    const m = a.match(/^--([^=\s]+)(?:=(.+))?$/);
    if (m) args[m[1]] = m[2] ?? true;
    else if (a.includes(':')) args.yabe = a;
  });
  return args;
}

const args = parseArgs();

const DEFAULT_IFACE = '127.0.0.1';         // Lokaler Test mit YABE auf demselben Rechner
const DEFAULT_PORT = Number(process.env.PORT || args.port || 47809); // eigener Port ≠ 47808
const DEFAULT_YABE = process.env.YABE || args.yabe || '127.0.0.1:47808'; // YABE-Ziel für I-Am
const IFACE = process.env.IFACE || args.iface || DEFAULT_IFACE;

let yabeLearned = false;

// YABE-Ziel auflösen
function parseAddressPort(str) {
  if (typeof str === 'object' && str.address) return str;
  const [address, portStr] = String(str).split(':');
  const port = Number(portStr || 47808);
  return { address, port };
}
const YABE_TARGET = parseAddressPort(DEFAULT_YABE);

// --- Gerätekonfiguration ---
const DEVICE_ID = Number(process.env.DEVICE_ID || args.deviceId || 12345);
const VENDOR_ID = Number(process.env.VENDOR_ID || args.vendorId || 260);
const DEVICE_NAME = String(process.env.DEVICE_NAME || args.name || 'JS-BACnet-Sim');

const ANNOUNCE_IAM_ON_START = true;        // I-Am beim Start an YABE senden
const TEMP_UPDATE_INTERVAL_MS = Number(process.env.TEMP_UPDATE_MS || args.tempMs || 5000);
const COV_DEADBAND = Number(process.env.COV_DEADBAND || args.cov || 0.1);

// --- Objekte (simulierte AI) ---
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

// COV-Abonnenten: {address, subscriberProcessIdentifier, monitoredObject, lifetime}
const subscribers = [];

// --- BACnet-Client (Serverrolle) ---
const client = new Bacnet({
  apduTimeout: 6000,
  interface: IFACE,             // 127.0.0.1 oder deine LAN-IP
  port: DEFAULT_PORT,           // eigener Port, kein Konflikt mit YABE
  broadcastAddress: '255.255.255.255' // korrekt, aber lokal nicht zwingend nötig
});

// --- Helper: I-Am senden (Unicast an YABE oder zurück an Absender) ---
function sendIAm(unicast) {
  try {
    const segNone = Bacnet.enum.Segmentation?.SEGMENTATION_NONE ?? 3;
    const target = unicast || YABE_TARGET;
    if (typeof client.iAmResponse === 'function') {
      client.iAmResponse(DEVICE_ID, 0x05, segNone, VENDOR_ID, target);
      const tstr = typeof target === 'string' ? target :
                   `${target.address}${target.port ? ':' + target.port : ''}`;
      console.log(`[I-Am] gesendet an ${tstr} (DeviceId=${DEVICE_ID})`);
    } else {
      console.warn('iAmResponse() nicht verfügbar in dieser bacstack-Version.');
    }
  } catch (e) {
    console.warn('Fehler beim Senden von I-Am:', e && (e.message || e));
  }
}

// --- Events/Handler ---
// Optional: WhoIs (lokal oft nicht relevant, da YABE meist Zielport 47808 nutzt)
client.on('whoIs', (data) => {
  try {
    console.log('[WhoIs] von', data.address);
    // Antworte unicast an den Absender
    sendIAm(data.address);
  } catch (e) {
    console.error('Fehler im whoIs-Handler:', e);
  }
});

// ReadProperty: unterstütze presentValue für AI:1/2
client.on('readProperty', (request) => {
  try {
    const { objectId, property, address, invokeId } = request;
    const objType = objectId?.type;
    const inst = objectId?.instance;
    const key = `analogInput:${inst}`;
    const pidEnum = Bacnet.enum.PropertyIdentifier;
    const propertyIdentifier = property?.id ?? property?.propertyIdentifier ?? null;

    console.log(`[ReadProperty] von ${address} -> object=${objType}:${inst} property=${JSON.stringify(property)}`);

    const isPV = propertyIdentifier === pidEnum.PRESENT_VALUE || propertyIdentifier === 85;

    if (objects[key] && isPV) {
      const val = objects[key].presentValue;
      const values = [{ type: Bacnet.enum.ApplicationTags.REAL || 4, value: val }];

      // Versuche neue Signatur (mit invokeId)
      try {
        client.readPropertyResponse(address, invokeId, objectId, pidEnum.PRESENT_VALUE || 85, values);
        console.log(`[ReadPropertyResponse] ${key} -> ${val} an ${address}`);
      } catch (e1) {
        // Fallback auf ältere Signatur
        try {
          client.readPropertyResponse(address, objectId, { id: pidEnum.PRESENT_VALUE || 85 }, values, (err) => {
            if (err) console.error('readPropertyResponse (Fallback) Fehler:', err);
            else console.log(`[ReadPropertyResponse] ${key} -> ${val} an ${address} (Fallback)`);
          });
        } catch (e2) {
          console.error('ReadPropertyResponse API-Mismatch:', e1?.message || e1, e2?.message || e2);
          try {
            client.errorResponse(address, Bacnet.enum.ConfirmedServiceChoice.READ_PROPERTY, invokeId,
              Bacnet.enum.ErrorClass.OBJECT, Bacnet.enum.ErrorCode.OTHER);
          } catch {}
        }
      }
    } else {
      try {
        client.errorResponse(address, Bacnet.enum.ConfirmedServiceChoice.READ_PROPERTY, invokeId,
          Bacnet.enum.ErrorClass.OBJECT, Bacnet.enum.ErrorCode.UNKNOWN_OBJECT);
      } catch (e) {
        console.warn('errorResponse fehlgeschlagen (API-Mismatch?):', e?.message || e);
      }
      console.log(`[ReadProperty] unbekanntes Objekt/Property -> Fehler an ${address}`);
    }
  } catch (e) {
    console.error('Exception im readProperty-Handler:', e);
  }
});

// SubscribeCOV: registriere und sende Initial-Notification (unbestätigt)
client.on('subscribeCov', (request) => {
  try {
    const { address, subscriberProcessIdentifier, monitoredObject, lifetime } = request || {};
    const { type, instance } = monitoredObject || {};
    console.log(`[SubscribeCOV] von ${address} -> subscriberId=${subscriberProcessIdentifier} object=${type}:${instance} lifetime=${lifetime}`);

    subscribers.push({ address, subscriberProcessIdentifier, monitoredObject, lifetime: lifetime || 0 });

    const pv = objects[`analogInput:${instance}`]?.presentValue;
    if (pv != null) {
      sendUnconfirmedCovNotificationTo(address, monitoredObject, pv, subscriberProcessIdentifier, lifetime || 0);
    }
  } catch (e) {
    console.error('subscribeCov-Handler Fehler:', e);
  }
});

// Helper: Unconfirmed COV Notification
function sendUnconfirmedCovNotificationTo(address, objectId, presentValue, subscriberProcessIdentifier = 1, timeRemaining = 0) {
  try {
    const pidEnum = Bacnet.enum.PropertyIdentifier;
    const app = Bacnet.enum.ApplicationTags;
    const listOfValues = [
      { property: { id: pidEnum.PRESENT_VALUE || 85 }, value: [{ type: app.REAL || 4, value: presentValue }] }
    ];

    if (typeof client.covNotifyUnconfirmed === 'function') {
      try {
        // Neuere Signatur
        client.covNotifyUnconfirmed(address, subscriberProcessIdentifier, DEVICE_ID, objectId, timeRemaining, listOfValues);
        console.log(`[COV] unconfirmed an ${address} für ${objectId.type}:${objectId.instance} -> ${presentValue}`);
        return;
      } catch (e1) {
        // Ältere Signatur (Fallback)
        const values = [{ objectId, values: listOfValues }];
        client.covNotifyUnconfirmed(address, DEVICE_ID, values, (err) => {
          if (err) console.error('covNotifyUnconfirmed (Fallback) Fehler:', err);
          else console.log(`[COV] unconfirmed (Fallback) an ${address} für ${objectId.type}:${objectId.instance} -> ${presentValue}`);
        });
        return;
      }
    }
    console.warn('covNotifyUnconfirmed() nicht verfügbar.');
  } catch (e) {
    console.warn('covNotifyUnconfirmed fehlgeschlagen:', e?.message || e);
  }
}

// --- Periodische Temperaturänderung + COV ---
setInterval(() => {
  Object.keys(objects).forEach((k) => {
    const obj = objects[k];
    const old = obj.presentValue;
    const delta = (Math.random() - 0.5) * 0.5; // +/- 0.25°C
    const next = Math.round((old + delta) * 10) / 10; // eine Nachkommastelle
    obj.presentValue = next;

    if (Math.abs(next - old) >= COV_DEADBAND) {
      subscribers.forEach((s) => {
        const mon = s.monitoredObject;
        if (mon && mon.type === obj.type && mon.instance === obj.instance) {
          sendUnconfirmedCovNotificationTo(s.address, mon, next, s.subscriberProcessIdentifier, s.lifetime || 0);
        }
      });
    }
  });
}, TEMP_UPDATE_INTERVAL_MS);

// --- Start: Announce I-Am an YABE ---
if (ANNOUNCE_IAM_ON_START) {
  setTimeout(() => sendIAm(YABE_TARGET), 700);
}

// --- Logging ---
console.log(`BACnet-Simulator gestartet: Device=${DEVICE_ID} "${DEVICE_NAME}"`);
console.log(`Interface=${IFACE}, UDP-Port=${DEFAULT_PORT}`);
console.log(`YABE-Ziel für I-Am: ${YABE_TARGET.address}:${YABE_TARGET.port}`);
console.log('Objekte:');
Object.keys(objects).forEach((k) => {
  console.log(`  - ${k} presentValue=${objects[k].presentValue} units=${objects[k].units}`);
});

// --- Safety ---
process.on('uncaughtException', (err) => {
  console.error('Unhandled exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});



const I_AM_INTERVAL_MS = 1500; // alle 15s
const periodicIAm = setInterval(() => {
  if (!yabeLearned) sendIAm(YABE_TARGET);
}, I_AM_INTERVAL_MS);
