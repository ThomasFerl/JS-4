const express = require('express');
const path = require('path');

const app = express();
const PORT = 4049;

// Statische Dateien ausliefern (HTML, JS, Modelle)
app.use(express.static(path.join(__dirname, 'public')));

// Route für Smilomat
app.get('/smilomat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'smilomat.html'));
});

app.listen(PORT, () => {
  console.log(`Smilomat läuft auf http://localhost:${PORT}/smilomat`);
});
