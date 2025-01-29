const express = require("express");
const app     = express();
const port    = 4444;


// Route für die Startseite (HTML-Tabelle anzeigen)
app.get("/",      (req, res) => { res.send("Hallo Welt!"); });
app.get("/datum", (req, res) => { res.send("<H2>"+ new Date() +"</H2>"); });
  

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
