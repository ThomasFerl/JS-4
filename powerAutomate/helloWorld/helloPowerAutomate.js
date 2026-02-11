const { XMLHttpRequest } = require("xmlhttprequest");

function triggerFlow() 
{
    const url = "https://default2df289064776439c8c960b68836d6c.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/24d2eceee4564dbfb461af9c12f80b1e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WiRfXgabepSqEsaLGBIJ_LhhK52etiBYw6DmBNZMHLs";

    const payload = {
                      name    : "Silie",
                      vorName : "Peter",
                      refNr   : "1234567890ff"
                    };

    console.log("--------------------------------------------------");
    console.log("Starte PowerAutomate-Trigger…");
    console.log("URL:", url);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("--------------------------------------------------");

    const xhr = new XMLHttpRequest();

    console.log("Öffne Verbindung (POST, synchron)…");
    try {
        xhr.open("POST", url, false);
    } catch (err) {
        console.error("FEHLER beim Öffnen der Verbindung:", err.message);
        return;
    }

    console.log("Setze Header Content-Type: application/json");
    try {
        xhr.setRequestHeader("Content-Type", "application/json");
    } catch (err) {
        console.error("FEHLER beim Setzen der Header:", err.message);
        return;
    }

    console.log("Sende Request…");
    try {
        xhr.send(JSON.stringify(payload));
    } catch (err) {
        console.error("FEHLER beim Senden:", err.message);
        return;
    }

    console.log("--------------------------------------------------");
    console.log("Antwort von PowerAutomate:");
    console.log("readyState:", xhr.readyState);
    console.log("status:", xhr.status);
    console.log("statusText:", xhr.statusText);
    console.log("responseText:", xhr.responseText);
    console.log("--------------------------------------------------");

    if (xhr.status >= 200 && xhr.status < 300) {
        console.log("✔️ Flow erfolgreich ausgelöst!");
    } else {
        console.log("❌ Flow NICHT erfolgreich ausgelöst!");
        console.log("Mögliche Ursachen:");
        console.log("- URL falsch?");
        console.log("- Flow nicht veröffentlicht?");
        console.log("- Premium-Lizenz fehlt?");
        console.log("- Firewall blockiert?");
        console.log("- Trigger erwartet andere Methode (GET/POST)?");
    }
}

triggerFlow();
