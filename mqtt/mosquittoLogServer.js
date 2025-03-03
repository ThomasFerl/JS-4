const express = require("express");
const fs      = require("fs");
const path    = require("path");

const app      = express();
const PORT     = 4707;
var   maxLines = 50;

// Mosquitto-Log-Datei (anpassen je nach System)
const LOG_FILE_PATH = "C:/temp/mosquitto.log";  


// Funktion zum Lesen der letzten X Zeilen aus der Log-Datei
function getLastLines(filePath, maxLines , keyword = null) 
{
    if (!fs.existsSync(filePath)) {
        return "Log-Datei nicht gefunden!";
    }

    const logData = fs.readFileSync(filePath, "utf8").split("\n");
    let filteredData = logData.reverse().slice(0, maxLines);

    // Falls ein Filter-Keyword angegeben wurde
    if (keyword) {
        filteredData = filteredData.filter(line => line.toLowerCase().includes(keyword.toLowerCase()));
    }

    return filteredData.join("\n");
}

// Route zum Abrufen der Logs
app.get("/mosquittoLogs", (req, res) => 
{
    const maxLines = parseInt(req.query.lines) || 50;
    const keyword  = req.query.keyword || null;

    const logs = getLastLines(LOG_FILE_PATH, maxLines, keyword);
    res.type("text/plain").send(logs);
});

// Startet den Webserver
app.listen(PORT, () => {
    console.log(`🚀 Mosquitto-Log-Server läuft auf http://localhost:${PORT}`);
});
