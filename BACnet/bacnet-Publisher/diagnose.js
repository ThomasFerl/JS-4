import dgram from 'node:dgram';

// ========================== Konfiguration & Modell ===========================
const UDP_PORT  = Number(process.env.BACNET_PORT  || 47808);
const DEVICE_ID = Number(process.env.BACNET_DEVID || 260001);
const VENDOR_ID = Number(process.env.BACNET_VID   || 260);

const av = new Map();
function addAV(instance, name, initial = 42.0) {
  av.set(instance, { instance, name, presentValue: initial });
}
addAV(1, 'AV1_Temperatur', 21.5);
addAV(2, 'AV2_Feuchte',    47.0);

// =============================== Encoder ====================================
function encUnsigned(n){
  if (n <= 0xFF)   return Buffer.from([0x21, n]);
  if (n <= 0xFFFF) return Buffer.from([0x22, (n>>8)&0xFF, n&0xFF]);
  return Buffer.from([0x24, (n>>>24)&0xFF, (n>>>16)&0xFF, (n>>>8)&0xFF, n&0xFF]);
}
function encEnum(n){
  if (n <= 0xFF)   return Buffer.from([0x91, n]);
  if (n <= 0xFFFF) return Buffer.from([0x92, (n>>8)&0xFF, n&0xFF]);
  return Buffer.from([0x94, (n>>>24)&0xFF, (n>>>16)&0xFF, (n>>>8)&0xFF, n&0xFF]);
}
function encObjectId(type, instance){
  const v = ((type & 0x3FF) << 22) | (instance & 0x3FFFFF);
  return Buffer.from([0xC4, (v>>>24)&0xFF, (v>>>16)&0xFF, (v>>>8)&0xFF, v&0xFF]);
}
function encReal(f){
  const b = Buffer.alloc(5);
  b[0] = 0x44;
  b.writeFloatBE(Number(f), 1);
  return b;
}
function encChar(str){
  const bytes = Buffer.from(String(str), 'ascii');
  const header = 0x70 | (bytes.length + 1);
  return Buffer.concat([Buffer.from([header, 0x00]), bytes]);
}
function encCtxUnsigned(tagNo, n){
  const body =
    (n <= 0xFF)   ? Buffer.from([n]) :
    (n <= 0xFFFF) ? Buffer.from([(n>>8)&0xFF, n&0xFF]) :
                    Buffer.from([(n>>>24)&0xFF,(n>>>16)&0xFF,(n>>>8)&0xFF,n&0xFF]);
  const hdr = ((tagNo & 0x0F) << 4) | 0x08 | (body.length & 0x07);
  return Buffer.concat([Buffer.from([hdr]), body]);
}
function encCtxObjId(tagNo, type, instance){
  const v = ((type & 0x3FF) << 22) | (instance & 0x3FFFFF);
  const hdr = ((tagNo & 0x0F) << 4) | 0x08 | 0x04;
  return Buffer.from([hdr, (v>>>24)&0xFF, (v>>>16)&0xFF, (v>>>8)&0xFF, v&0xFF]);
}
const ctxOpen  = (tagNo) => Buffer.from([ ((tagNo&0x0F)<<4) | 0x08 | 0x06 ]);
const ctxClose = (tagNo) => Buffer.from([ ((tagNo&0x0F)<<4) | 0x08 | 0x07 ]);

// =============================== BVLC/NPDU ===================================
function wrapBvllNpdu(apdu, unicast = true){
  const npdu   = Buffer.from([0x01, 0x04]);
  const payload= Buffer.concat([npdu, apdu]);
  const func   = unicast ? 0x0A : 0x0B;
  const len    = payload.length + 4;
  const bvlc   = Buffer.from([0x81, func, (len>>8)&0xFF, len&0xFF]);
  return Buffer.concat([bvlc, payload]);
}

// ============================ APDU-Parser ====================================
function parseApduOffset(msg){
  if (!msg || msg.length < 8) return -1;
  if (msg[0] !== 0x81) return -1;
  let off = 4;
  const func = msg[1];
  if (func === 0x04) off += 6;
  if (msg.length < off + 2) return -1;
  const ver = msg[off];    if (ver !== 0x01) return -1;
  const ctl = msg[off+1]; off += 2;
  if (ctl & 0x80) return -1;
  if (ctl & 0x20) {
    if (msg.length < off+3) return -1;
    const dlen = msg[off+2]; off += 3 + (dlen>0 ? dlen : 0) + 1;
  }
  if (ctl & 0x08) {
    if (msg.length < off+3) return -1;
    const slen = msg[off+2]; off += 3 + (slen>0 ? slen : 0);
  }
  return (off < msg.length) ? off : -1;
}
function isWhoIs(msg){
  const o = parseApduOffset(msg);
  if (o < 0 || msg.length < o+2) return false;
  return ((msg[o] & 0xF0) === 0x10) && (msg[o+1] === 0x08);
}
function parseReadProperty(msg){
  const o = parseApduOffset(msg);
  if (o < 0) return null;
  const apduType = msg[o] & 0xF0;
  if (apduType !== 0x00) return null;
  const invokeId = msg[o+2];
  const svc      = msg[o+3];
  if (svc !== 0x0C) return null;
  let p = o + 4;

  if (msg[p] !== 0x0C) return null;
  const v = (msg[p+1]<<24)|(msg[p+2]<<16)|(msg[p+3]<<8)|msg[p+4];
  const objType = (v >>> 22) & 0x3FF;
  const objInst = v & 0x3FFFFF;
  p += 5;

  const t1 = msg[p++]; if ((t1 & 0xF0) !== 0x10) return null;
  const len1 = t1 & 0x07;
  let propId = 0; for (let i=0;i<len1;i++) propId = (propId<<8) | msg[p++];

  let hasIndex = false, arrIdx = 0;
  if (p < msg.length && (msg[p] & 0xF0) === 0x20) {
    const t2 = msg[p++], len2 = t2 & 0x07;
    hasIndex = true; for (let i=0;i<len2;i++) arrIdx = (arrIdx<<8) | msg[p++];
  }
  return { invokeId, objectId:{type:objType, instance:objInst}, propertyId:propId, hasIndex, arrayIndex: arrIdx };
}

// ============================= APDU Builder ==================================
function buildIAmApdu(){
  return Buffer.concat([
    Buffer.from([0x10, 0x00]),
    encObjectId(8, DEVICE_ID),
    encUnsigned(1476),
    encEnum(3),
    encUnsigned(VENDOR_ID)
  ]);
}
function buildReadPropertyAck({invokeId, objectId, propertyId, arrayIndex, valuePayload}){
  const header = Buffer.from([0x30, invokeId, 0x0C]);
  const obj    = encCtxObjId(0, objectId.type, objectId.instance);
  const prop   = encCtxUnsigned(1, propertyId);
  const arr    = (arrayIndex !== undefined) ? encCtxUnsigned(2, arrayIndex) : Buffer.alloc(0);
  const val    = Buffer.concat([ctxOpen(3), valuePayload, ctxClose(3)]);
  return Buffer.concat([header, obj, prop, arr, val]);
}
function buildErrorResponse({invokeId, service, errorClass=0, errorCode=32}){
  // Error Class 0 = device, Error Code 32 = property-unknown
  return Buffer.concat([
    Buffer.from([0x50, invokeId, service]),
    Buffer.from([0x91, errorClass]), // Enumerated
    Buffer.from([0x91, errorCode])
  ]);
}

// ========================== Property-Encoding ================================
function encodeObjectList(arrayIndex) {
  const objs = [
    encObjectId(8, DEVICE_ID),
    ...Array.from(av.keys()).map(inst => encObjectId(2, inst))
  ];
  if (arrayIndex === undefined) {
    return Buffer.concat(objs);
  }
  if (arrayIndex === 0) {
    return encUnsigned(objs.length);
  }
  const i = arrayIndex - 1;
  return (i >= 0 && i < objs.length) ? objs[i] : Buffer.alloc(0);
}
function encodeAvPresentValue(inst){
  const o = av.get(inst);
  return o ? encReal(o.presentValue) : null;
}
function encodeAvName(inst){
  const o = av.get(inst);
  return o ? encChar(o.name) : null;
}

// ================================ UDP-Server =================================
const sock = dgram.createSocket('udp4');

sock.on('listening', () => {
  const a = sock.address();
  console.log(`BACnet Device aktiv: ${a.address}:${a.port}  DeviceId=${DEVICE_ID}`);
});

sock.on('message', (msg, rinfo) => {
  if (isWhoIs(msg)) {
    sock.send(wrapBvllNpdu(buildIAmApdu()), rinfo.port, rinfo.address);
    console.log(`Who-Is → I-Am(Device ${DEVICE_ID})`);
    return;
  }

  const rp = parseReadProperty(msg);
  if (rp) {
    const { invokeId, objectId, propertyId, hasIndex, arrayIndex } = rp;
    let valuePayload = null;

    if (objectId.type === 8 && objectId.instance === DEVICE_ID && propertyId === 76) {
      valuePayload = encodeObjectList(hasIndex ? arrayIndex : undefined);
    }
    if (objectId.type === 2) {
      if (propertyId === 85) valuePayload = encodeAvPresentValue(objectId.instance);
      else if (propertyId === 77) valuePayload = encodeAvName(objectId.instance);
    }

    if (valuePayload && valuePayload.length > 0) {
      const ack = buildReadPropertyAck({
        invokeId,
        objectId,
        propertyId,
        arrayIndex: hasIndex ? arrayIndex : undefined,
        valuePayload
      });
      sock.send(wrapBvllNpdu(ack), rinfo.port, rinfo.address);
      console.log(`ACK → obj(${objectId.type}:${objectId.instance}) prop=${propertyId}${hasIndex?`[${arrayIndex}]`:''}`);
    } else {
      const err = buildErrorResponse({invokeId, service:0x0C});
      sock.send(wrapBvllNpdu(err), rinfo.port, rinfo.address);
      console.warn(`ErrorResponse → obj(${objectId.type}:${objectId.instance}) prop=${propertyId}`);
    }
  }
});

sock.bind(UDP_PORT);

setInterval(() => {
  const o1 = av.get(1); if (o1) o1.presentValue = 20 + 5*Math.sin(Date.now()/60000);
  const o2 = av.get(2); if (o2) o2.presentValue = 40 + Math.random()*10;
}, 3000);