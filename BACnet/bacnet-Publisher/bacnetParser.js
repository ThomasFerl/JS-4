// parser.js
export function hexDump(buf, max = 128) {
  const len = Math.min(buf.length, max);
  let out = '';
  for (let i = 0; i < len; i += 16) {
    const slice = buf.slice(i, Math.min(i + 16, len));
    const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ');
    out += `${i.toString(16).padStart(4, '0')}: ${hex}\n`;
  }
  if (len < buf.length) out += `... (${buf.length - len} bytes more)\n`;
  return out;
}

/**
 * Liefert den Byte-Offset des APDU-Beginns innerhalb eines BACnet/IP-Datagrams.
 * Gibt -1 zurück, wenn:
 *  - BVLC-Typ/Function unerwartet
 *  - NPDU-Version != 0x01
 *  - NPDU Control Bit7=1 (Network Layer Message → kein APDU)
 *  - Felder sind inkonsistent oder zu kurz.
 *
 * Unterstützt BVLC Functions:
 *   0x0A = Original-Unicast-NPDU
 *   0x0B = Original-Broadcast-NPDU
 *   0x04 = Forwarded-NPDU  (enthält zusätzlich 4+2 Byte Ursprung-IP:Port)
 */
export function parseApduOffset(msg, log = console) {
  try {
    if (!msg || msg.length < 8) return -1;

    const bvlcType = msg[0];
    const bvlcFunc = msg[1];
    const bvlcLen  = (msg[2] << 8) | msg[3];

    if (bvlcType !== 0x81) {
      log?.warn?.(`[BVLC] Unexpected type 0x${bvlcType.toString(16)} (expect 0x81)`);
      return -1;
    }
    if (bvlcLen > msg.length) {
      log?.warn?.(`[BVLC] Length ${bvlcLen} > packet ${msg.length}`);
      return -1;
    }

    // Start-Offset hinter BVLC
    let off = 4;

    // Forwarded-NPDU hat zusätzlich 6 Byte (Originating IP + Port)
    if (bvlcFunc === 0x04) {
      if (msg.length < off + 6) return -1;
      off += 6; // 4 (IP) + 2 (Port)
    } else if (bvlcFunc === 0x0A || bvlcFunc === 0x0B) {
      // ok, nichts zusätzliches
    } else {
      // Andere BVLC-Funktionen (Result, FDR, BDT, ...) → kein APDU
      log?.debug?.(`[BVLC] Function 0x${bvlcFunc.toString(16)} not NPDU/APDU`);
      return -1;
    }

    // NPDU: Version + Control
    if (msg.length < off + 2) return -1;
    const npduVersion = msg[off];
    if (npduVersion !== 0x01) {
      log?.warn?.(`[NPDU] Version 0x${npduVersion.toString(16)} != 0x01`);
      return -1;
    }
    const control = msg[off + 1];
    off += 2;

    // Wenn Bit7=1 → Network-Layer-Message (kein APDU, MessageType (+ evtl. VendorId) folgt)
    const isNetworkMsg = (control & 0x80) !== 0;
    if (isNetworkMsg) {
      log?.debug?.('[NPDU] Network-layer message (bit7=1) → no APDU');
      return -1;
    }

    // Bit5: Destination present → DNET(2) + DLEN(1) [+ DADR(DLEN)] + HopCount(1)
    if (control & 0x20) {
      if (msg.length < off + 3) return -1;
      const dnet  = (msg[off] << 8) | msg[off + 1];
      const dlen  = msg[off + 2];
      off += 3;
      if (dlen > 0) {
        if (msg.length < off + dlen) return -1;
        off += dlen; // DADR
      }
      // Hop Count
      if (msg.length < off + 1) return -1;
      const hop = msg[off];
      off += 1;
      log?.debug?.(`[NPDU] DNET=${dnet}, DLEN=${dlen}, Hop=${hop}`);
    }

    // Bit3: Source present → SNET(2) + SLEN(1) + SADR(SLEN)
    if (control & 0x08) {
      if (msg.length < off + 3) return -1;
      const snet = (msg[off] << 8) | msg[off + 1];
      const slen = msg[off + 2];
      off += 3;
      if (slen > 0) {
        if (msg.length < off + slen) return -1;
        off += slen; // SADR
      }
      log?.debug?.(`[NPDU] SNET=${snet}, SLEN=${slen}`);
    }

    // Jetzt sollte off auf dem APDU-Beginn stehen
    if (off >= msg.length) return -1;
    return off;
  } catch (e) {
    log?.error?.('parseApduOffset error:', e);
    return -1;
  }
}