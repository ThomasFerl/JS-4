const express = require('express');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Zertifikate laden
const sslOptions  = {
    key : fs.readFileSync('./SSL/privateKex.pem'  , 'utf8' ),     // Pfad zum privaten Schlüssel
    cert: fs.readFileSync('./SSL/certificate.pem' , 'utf8' )    // Pfad zum Zertifikat
   };

// Statische Dateien
app.use(express.static(__dirname));
app.use(bodyParser.json());

// Fake-CRM-Endpunkt
app.get('/api/contact', (req, res) => {
  res.json({ id: 1, name: "Max Mustermann", email: "max@example.com" });
});

// Fake-Speichern-Endpunkt
app.post('/api/saveDoc', (req, res) => {
  console.log("Dokument gespeichert:", req.body);
  res.send("OK");
});

// HTTPS-Server starten
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`Add-in läuft auf https://localhost:${port}`);
});
