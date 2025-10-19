import dgram from 'node:dgram';

const UDP_PORT  = 47808;
const DEVICE_ID = 260001;
const VENDOR_ID = 260;

// Analoge Werte
const av = new Map();
av.set(1, { name: 'AV1_Temperatur', presentValue: 21.5 });
av.set(2, { name: 'AV2_Feuchte', presentValue: 47.0 });

// ================= Encoder =================
function encUnsigned(n){ return Buffer.from([0x21, n]); }
function encEnum(n){ return Buffer.from([0x91, n]); }
function encObjectId(type, instance){
  const v = ((type & 0x3FF) << 22) | (instance & 0x3FFFFF);
  return Buffer.from([0xC4, (v>>>24)&0xFF,(v>>>16)&0xFF,(v>>>8)&0xFF,v&0xFF]);
}
function encReal(f){
  const b = Buffer.alloc(5); b[0]=0x44; b.writeFloatBE(Number(f),1); return b;
}
function encChar(str){
  const bytes = Buffer.from(str,'ascii');
  return Buffer.concat([Buffer.from([0x70|(bytes.length+1),0x00]),bytes]);
}
function encCtxUnsigned(tagNo,n){ return Buffer.from([(tagNo<<4)|0x08|0x01,n]); }
function encCtxObjId(tagNo,type,inst){
  const v=((type&0x3FF)<<22)|(inst&0x3FFFFF);
  return Buffer.from([(tagNo<<4)|0x08|0x04,(v>>>24)&0xFF,(v>>>16)&0xFF,(v>>>8)&0xFF,v&0xFF]);
}
const ctxOpen=t=>Buffer.from([(t<<4)|0x08|0x06]);
const ctxClose=t=>Buffer.from([(t<<4)|0x08|0x07]);

// ================= BVLC/NPDU =================
function wrapBvllNpdu(apdu){
  const npdu=Buffer.from([0x01,0x04]);
  const payload=Buffer.concat([npdu,apdu]);
  const len=payload.length+4;
  return Buffer.concat([Buffer.from([0x81,0x0a,(len>>8)&0xFF,len&0xFF]),payload]);
}

// ================= Builders =================
function buildIAmApdu(){
  return Buffer.concat([
    Buffer.from([0x10,0x00]),
    encObjectId(8,DEVICE_ID),
    encUnsigned(1476),
    encEnum(3),
    encUnsigned(VENDOR_ID)
  ]);
}
function buildReadPropertyAck({invokeId,objectId,propertyId,arrayIndex,valuePayload}){
  const header=Buffer.from([0x30,invokeId,0x0C]);
  const obj=encCtxObjId(0,objectId.type,objectId.instance);
  const prop=encCtxUnsigned(1,propertyId);
  const arr=(arrayIndex!==undefined)?encCtxUnsigned(2,arrayIndex):Buffer.alloc(0);
  const val=Buffer.concat([ctxOpen(3),valuePayload,ctxClose(3)]);
  return Buffer.concat([header,obj,prop,arr,val]);
}
function buildErrorResponse({invokeId,service,errorClass=0,errorCode=32}){
  return Buffer.concat([
    Buffer.from([0x50,invokeId,service]),
    Buffer.from([0x91,errorClass]),
    Buffer.from([0x91,errorCode])
  ]);
}

// ================= Parser =================
function parseApduOffset(msg){
  if(!msg||msg.length<8||msg[0]!==0x81)return-1;
  let off=4;if(msg[1]===0x04)off+=6;
  if(msg.length<off+2||msg[off]!==0x01)return-1;
  const ctl=msg[off+1];off+=2;
  if(ctl&0x80)return-1;
  if(ctl&0x20){if(msg.length<off+3)return-1;const dlen=msg[off+2];off+=3+(dlen>0?dlen:0)+1;}
  if(ctl&0x08){if(msg.length<off+3)return-1;const slen=msg[off+2];off+=3+(slen>0?slen:0);}
  return(off<msg.length)?off:-1;
}
function isWhoIs(msg){
  const o=parseApduOffset(msg);
  return(o>=0&&(msg[o]&0xF0)===0x10&&msg[o+1]===0x08);
}
function parseReadProperty(msg){
  const o=parseApduOffset(msg);
  if(o<0||(msg[o]&0xF0)!==0x00||msg[o+3]!==0x0C)return null;
  const invokeId=msg[o+2];
  const v=(msg[o+4+1]<<24)|(msg[o+4+2]<<16)|(msg[o+4+3]<<8)|msg[o+4+4];
  const objType=(v>>>22)&0x3FF,objInst=v&0x3FFFFF;
  let p=o+9;const t1=msg[p++];const len1=t1&0x07;let propId=0;
  for(let i=0;i<len1;i++)propId=(propId<<8)|msg[p++];
  let hasIndex=false,arrIdx=0;
  if(p<msg.length&&(msg[p]&0xF0)===0x20){const t2=msg[p++],len2=t2&0x07;hasIndex=true;for(let i=0;i<len2;i++)arrIdx=(arrIdx<<8)|msg[p++];}
  return{invokeId,objectId:{type:objType,instance:objInst},propertyId:propId,hasIndex,arrayIndex:arrIdx};
}

// ================= Property-Encoding =================
function encodeObjectList(arrayIndex){
  const objs=[encObjectId(8,DEVICE_ID),...Array.from(av.keys()).map(i=>encObjectId(2,i))];
  if(arrayIndex===undefined)return Buffer.concat(objs);
  if(arrayIndex===0)return encUnsigned(objs.length);
  const i=arrayIndex-1;return(i>=0&&i<objs.length)?objs[i]:Buffer.alloc(0);
}
function encodeAvPresentValue(inst){const o=av.get(inst);return o?encReal(o.presentValue):null;}
function encodeAvName(inst){const o=av.get(inst);return o?encChar(o.name):null;}

// ================= UDP-Server =================
const sock=dgram.createSocket('udp4');
sock.on('listening',()=>console.log(`BACnet Device aktiv auf Port ${UDP_PORT}`));
sock.on('message',(msg,rinfo)=>{
  if(isWhoIs(msg)){
    const iam=wrapBvllNpdu(buildIAmApdu());
    sock.send(iam,rinfo.port,rinfo.address);
    console.log('Who-Is → I-Am');
    return;
  }
  const rp=parseReadProperty(msg);
  if(rp){
    const {invokeId,objectId,propertyId,hasIndex,arrayIndex}=rp;
    let valuePayload=null;
    if(objectId.type===8&&objectId.instance===DEVICE_ID&&propertyId===76){
      valuePayload=encodeObjectList(hasIndex?arrayIndex:undefined);
    }else if(objectId.type===2){
      if(propertyId===85)valuePayload=encodeAvPresentValue(objectId.instance);
      else if(propertyId===77)valuePayload=encodeAvName(objectId.instance);
    }
    if(valuePayload&&valuePayload.length>0){
      const ack=wrapBvllNpdu(buildReadPropertyAck({invokeId,objectId,propertyId,arrayIndex:hasIndex?arrayIndex:undefined,valuePayload}));
      sock.send(ack,rinfo.port,rinfo.address);
      console.log(`ACK → obj(${objectId.type}:${objectId.instance}) prop=${propertyId}${hasIndex?`[${arrayIndex}]`:''}`);
    }else{
      const err=wrapBvllNpdu(buildErrorResponse({invokeId,service:0x0C}));
      sock.send(err,rinfo.port,rinfo.address);
      console.warn(`ErrorResponse → obj(${objectId.type}:${objectId.instance}) prop=${propertyId}`);
    }
  }
});
sock.bind(UDP_PORT);

// Demo: Werte ändern
setInterval(()=>{const o1=av.get(1);if(o1)o1.presentValue=20+5*Math.sin(Date.now()/60000);const o2=av.get(2);if(o2)o2.presentValue=40+Math.random()*10;},3000);