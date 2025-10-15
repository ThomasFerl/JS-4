import { BDDevice, BDAnalogValue } from '@bacnet-js/device';
import { EngineeringUnits } from '@bacnet-js/client';

// 1) Device anlegen: Instanznummer + Optionen
const device = new BDDevice(7777, {
  name: 'SimulatedSensor',
  port: 47808,
  interface: '10.102.111.139',
  // Bei /24: 10.102.111.255; falls unsicher: 255.255.255.255
  broadcastAddress: '10.102.111.255',
  modelName: 'BACnet-Simulator (tferl)',
  vendorId: 42,
  firmwareRevision: '1.0.0',
  applicationSoftwareVersion: '1.0.0',
  databaseRevision: 1
});

// 2) AV-Objekte anlegen (Instanzen 4, 5, 7)
const av1 = new BDAnalogValue(4, { name: 'Temperatur1', unit: EngineeringUnits.DEGREES_CELSIUS });
const av2 = new BDAnalogValue(5, { name: 'Temperatur2', unit: EngineeringUnits.DEGREES_CELSIUS });
const av3 = new BDAnalogValue(7, { name: 'Temperatur3', unit: EngineeringUnits.DEGREES_CELSIUS });

// 3) Dem Device hinzufügen (objectList wird automatisch gepflegt)
device.addObject(av1);
device.addObject(av2);
device.addObject(av3);

// 4) Nach Start initiale Werte setzen
device.on('listening', () => {
  console.log('BACnet-Device online – Instance:', device.identifier.instance);
  av1.presentValue.setValue(21.5);
  av2.presentValue.setValue(21.5);
  av3.presentValue.setValue(21.5);
});

// 5) Werte zyklisch verändern
setInterval(() => {
  const newValue = 18 + Math.random() * 6;
  av1.presentValue.setValue(Number(newValue.toFixed(2)));
  console.log(`Temperatur#1 aktualisiert: ${av1.presentValue.getValue()} °C`);
}, 1000);

setInterval(() => {
  const newValue = 18 + Math.random() * 6;
  av2.presentValue.setValue(Number(newValue.toFixed(2)));
  console.log(`Temperatur#2 aktualisiert: ${av2.presentValue.getValue()} °C`);
}, 2000);

setInterval(() => {
  const newValue = 18 + Math.random() * 6;
  av3.presentValue.setValue(Number(newValue.toFixed(2)));
  console.log(`Temperatur#3 aktualisiert: ${av3.presentValue.getValue()} °C`);
}, 3000);

// 6) Fehlerlog
device.on('error', (err) => console.error('BACnet error:', err));