// server.js (Ausschnitt)
import dgram from 'node:dgram';
import { parseApduOffset, hexDump } from './bacnetParser.js';

const sock = dgram.createSocket('udp4');

sock.on('message', (msg, rinfo) => 
{
  console.log(`incoming ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
  const apduOffset = parseApduOffset(msg, console);
  console.log('apduOffset =', apduOffset);

  if (apduOffset < 0) 
  {
    // Fürs Debugging einmal hex-dumpen:
     console.log(hexDump(msg, 256));
     return;
  }

  const apduType = msg[apduOffset] & 0xF0;
  const svc      = msg[apduOffset + 1];

  // Beispiel: UnconfirmedRequest (0x10) + Who-Is (0x08)
  if (apduType === 0x10 && svc === 0x08) {
    // → hier dein I-Am senden ...
  }

  // Beispiel: ConfirmedRequest (0x00) + ReadProperty (0x0C)
  if (apduType === 0x00 && svc === 0x0C) {
    // → hier deinen Complex-ACK mit presentValue zurücksenden ...
  }
});