const aedes     = require('aedes')();
const http      = require('http');
const webSocket = require('ws');

// HTTP Server für WebSocket-Clients

const httpServer = http.createServer();
const wsServer = new webSocket.Server({ server: httpServer });

// Beenden des Brokers bei STRG+C
process.on('SIGINT', () => {
    console.log('MQTT Broker wird beendet ...');
    process.exit(0);
  });
  

// Port für MQTT-WebSocket-Clients
const WS_PORT = 4701;

// Port für MQTT-TCP-Clients
const TCP_PORT = 4700;

// MQTT TCP-Server
const net = require('net');
const tcpServer = net.createServer(aedes.handle);

// Start des TCP-Servers
tcpServer.listen(TCP_PORT, () => {
  console.log(`MQTT TCP-Broker läuft auf Port ${TCP_PORT}`);
});

// Start des WebSocket-Servers
wsServer.on('connection', (socket) => {
  const stream = require('stream');
  const duplex = new stream.Duplex({
    write(chunk, encoding, callback) {
      socket.send(chunk, callback);
    },
    read(size) {},
  });

  duplex.on('data', (data) => {
    socket.emit('data', data);
  });

  duplex.on('end', () => {
    socket.emit('end');
  });

  socket.on('message', (data) => {
    duplex.push(data);
  });

  socket.on('close', () => {
    duplex.emit('end');
  });

  aedes.handle(duplex);
});

// Start des HTTP-Servers
httpServer.listen(WS_PORT, () => {
  console.log(`MQTT WebSocket-Broker läuft auf Port ${WS_PORT}`);
});

// Ereignisse des Brokers
aedes.on('clientReady', (client) => {
  console.log(`Client verbunden: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`Client getrennt: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`Nachricht von ${client.id}: ${packet.topic} -> ${packet.payload.toString()}`);
  }
});
