const fs = require('fs');
const https = require('https');
const express = require('express');

const app = express();

// statische Dateien (HTML, JS, CSS)
app.use(express.static('public'));

// Zertifikat laden
const sslOptions  = {
    key : fs.readFileSync('./SSL/privateKex.pem'  , 'utf8' ),     // Pfad zum privaten Schlüssel
    cert: fs.readFileSync('./SSL/certificate.pem' , 'utf8' )    // Pfad zum Zertifikat
   };

// HTTPS-Server starten
https.createServer(sslOptions, app).listen(4049, () => {
  console.log('Smilomat läuft unter https://localhost:4049');
});
