const dgram = require('dgram');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const socket = dgram.createSocket('udp4');

socket.on('message', (msg, rinfo) => {
  const src = `${rinfo.address}:${rinfo.port}`;
  console.log(`[RECV] From ${src} (${msg.length} bytes)`);

  if (isFromBdt(rinfo.address)) {
    socket.send(msg, 0, msg.length, config.local.port, config.local.broadcast, (err) => {
      if (err) console.error('[ERROR] Broadcast send:', err);
      else console.log(`[RE-BCAST] To ${config.local.broadcast}`);
    });
  } else {
    config.bdt.forEach(entry => {
      socket.send(msg, 0, msg.length, entry.port, entry.ip, (err) => {
        if (err) console.error(`[ERROR] Forward to ${entry.ip}:`, err);
        else console.log(`[FWD] To ${entry.ip}:${entry.port}`);
      });
    });
  }
});

function isFromBdt(addr) {
  return config.bdt.some(entry => entry.ip === addr);
}

socket.bind(config.local.port, () => {
  socket.setBroadcast(true);
  console.log(`[BBMD] Listening on UDP ${config.local.port}`);
});