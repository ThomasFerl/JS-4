const express = require('express');
const ntlm = require('express-ntlm');
const path = require('path');

const app = express();
const port = 4000;

// NTLM-Middleware aktivieren
app.use(ntlm());

// Beispiel-Logging
app.use((req, res, next) => {
  console.log('NTLM-Authentifizierung:', req.ntlm);
  next();
});

// Statische HTML-Datei ausliefern
app.get('/', (req, res) => {
  const username = req.ntlm ? req.ntlm.UserName : 'Unbekannt';
  res.send(`
    <html>
      <head><title>NTLM-Test</title></head>
      <body style="font-family:sans-serif">
        <h1>Hallo, ${username} 👋</h1>
        <p>Sie sind automatisch über Windows angemeldet.</p>
      </body>
    </html>
  `);
});

// Server starten
app.listen(port, () => {
  console.log(`✅ NTLM-Server läuft auf http://localhost:${port}`);
});
