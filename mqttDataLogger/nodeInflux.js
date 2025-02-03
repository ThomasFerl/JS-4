const { InfluxDB, Point } = require('@influxdata/influxdb-client');

class nodeInfluxDB 
{
  constructor(params) 
  {
    if (!params.url || !params.token || !params.org || !params.bucket) 
    {
      throw new Error('❌ Fehlende InfluxDB-Verbindungsdaten!');
    }

        this.client   = new InfluxDB({ url: params.url, token: params.token });
        this.writeApi = this.client.getWriteApi(params.org, params.bucket, 'ms');
        this.queryApi = this.client.getQueryApi(params.org);
        this.bucket   = params.bucket;
        this.org      = params.org;
        this.orgID    = params.org;
        this.token    = params.token;
        this.url      = params.url;
  }


  async saveValues( measurement , values) 
  {
    if (!Array.isArray(values)) values = [values];  // Falls Einzelwert → Array machen

    console.log(values)

    const points = values.map(entry => {
                                         if (!entry.id || !entry.timestamp || entry.wert === undefined)  throw new Error('❌ Werte müssen mindestens eine ID, einen Timestamp und einen Wert enthalten!');
                                         const point = new Point(measurement)
                                               .tag('id', entry.id)
                                               .floatField('wert', parseFloat(entry.wert))
                                               .timestamp(new Date(entry.timestamp).getTime() );

                                               // Falls weitere Tags vorhanden sind, hinzufügen
                                               Object.keys(entry).forEach( (key) => {if (!['id', 'timestamp', 'wert'].includes(key)) point.tag(key, entry[key]); } );

                                               return point;
                                       });

    try {
           this.writeApi.writePoints(points);
           await this.writeApi.flush();
           console.log(`✅ ${points.length} Werte gespeichert!`);
    } catch (error) {console.error('❌ Fehler beim Speichern:', error);}
  }


  async deleteValues(measurement, filter = "") {
    const deleteUrl = `${this.url}/api/v2/delete?org=${encodeURIComponent(this.org)}&bucket=${encodeURIComponent(this.bucket)}`; // 🟢 ORG & BUCKET in URL

    const body = JSON.stringify({
        start: "1970-01-01T00:00:00Z",
        stop: new Date().toISOString(),
        predicate: filter ? `_measurement="${measurement}" AND ${filter}` : `_measurement="${measurement}"`
    });

    try {
        const response = await fetch(deleteUrl, {
            method: "POST",
            headers: {
                "Authorization": `Token ${this.token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: body
        });

        if (response.ok) {
            console.log(`✅ Erfolgreich gelöscht: ${measurement} (${filter || "alle Werte"})`);
        } else {
            console.error("❌ Fehler beim Löschen:", await response.text());
        }
    } catch (error) {
        console.error("❌ Fehler:", error);
    }
}



   ___validateAndFormatDate(date) 
   {
    if (!date) return null; // Kein Datum gesetzt

    let parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        throw new Error(`Ungültiges Datum: ${date}`);
    }

    return parsedDate.toISOString(); // Konvertiert zu "YYYY-MM-DDTHH:mm:ss.sssZ"
   }


  /**
   * Führt eine Flux-Query in InfluxDB aus
   */
  async ___influxQuery(fluxQuery) {
    return new Promise((resolve, reject) => {
        const rows = [];
        console.log("📡 Sende Query an InfluxDB:", fluxQuery);

        try {
            this.queryApi.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    const values = tableMeta.toObject(row);  // Umwandlung in lesbares JSON
                    rows.push(values);
                },
                error: (error) => {
                    console.error("❌ Fehler in `queryRows()`:", error);
                    reject(error);
                },
                complete: () => {
                    console.log(`✅ Query erfolgreich! ${rows.length} Datensätze gefunden.`);
                    resolve(rows);
                }
            });
        } catch (error) {
            console.error("❌ Schwerer Fehler bei influxQuery:", error);
            reject(error);
        }
    });
}


  /**
   * Fragt Werte mit Filtern und Aggregationen ab
   * JSON mit {tags, groupBy, aggregate}
   */
  async selectValues( fromMeasurement , params = {}) 
  {
    const { filters = {}, groupBy, aggregate, dtFrom, dtTo } = params;

    if (!fromMeasurement) {
        throw new Error("Parameter 'measurement' ist erforderlich.");
    }

    // Prüfe und konvertiere Datumswerte
    const validFrom = this.___validateAndFormatDate(dtFrom);
    const validTo = this.___validateAndFormatDate(dtTo);

    // Standard: Falls keine Zeitwerte gesetzt sind, nehme "alles" mit Limit
    let rangeClause = validFrom && validTo 
        ? `|> range(start: ${validFrom}, stop: ${validTo})` 
        : `|> range(start: -inf) |> limit(n: 250000)`;

    // Basis-Query
    let fluxQuery = `from(bucket: "${this.bucket}") 
                     ${rangeClause} 
                     |> filter(fn: (r) => r._measurement == "${fromMeasurement}")`;

    // Falls Filter (Tags) angegeben sind
    if (Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            fluxQuery += ` |> filter(fn: (r) => r.${key} == "${value}")`;
        });
    }

    // Falls Aggregation und Gruppierung angegeben sind
    if (aggregate) {
        if (!groupBy) {
            throw new Error("Ein 'groupBy'-Wert ist erforderlich, wenn eine Aggregation verwendet wird.");
        }
        fluxQuery += ` |> aggregateWindow(every: ${groupBy}, fn: ${aggregate}, createEmpty: false)`;
    } else if (groupBy) {
        fluxQuery += ` |> window(every: ${groupBy})`;
    }

    console.log("------------------------------");
    console.log("Ausgeführte Query:", fluxQuery);
    console.log("------------------------------");
    

    try {
        const result = await this.___influxQuery(fluxQuery);
        return result;
    } catch (error) {
        throw new Error(`Fehler bei der Abfrage: ${error.message}`);
    }
}

}

module.exports = nodeInfluxDB;



async function test_InsertFluxDB() 
{
  console.log('Starte Test...');

  // InfluxDB-Client initialisieren
  var influx = new nodeInfluxDB({
      url   : 'http://localhost:8086',
      token : 'bqc9XmF2V8q2Di8ySTLZBrIJKdw33dMA2KfYP8QP1OT70WQkfGqo4kkhXCF8lHtzWkMBSBJVxgTPi3X_kMVQWQ==',
      org   : 'Energie Mittelsachsen',
      bucket: 'testBucket'
  });

  //alles löschen
  await influx.deleteValues('testValues');

  // 🔹 Testdaten erzeugen (100.000 Einträge mit einzigartigen IDs & Timestamps)
  var values = [];
  for (var i = 0; i < 10; i++) 
    {
      var record = {
                     id       : i+1, // Einzigartige ID
                     timestamp: new Date(Date.now() + i).toISOString(), // Zeitstempel leicht variieren
                     wert     : Math.round(Math.random() * 1000)/10,
                     test     : 'test'
                   };

       // 🔹 Daten in InfluxDB einzeln speichern             
       // alternativ ein Array befüllen und dann speichern
      await influx.saveValues('testValues' , record);             
  }

   // 🔹 Daten wieder aus InfluxDB abrufen & prüfen
  console.log('Prüfe gespeicherte Daten...');
  const result = await influx.selectValues( 'testValues' , {} );

  console.log(`Abfrage abgeschlossen! Gefundene Einträge: ${result.length}`);
  console.log(result.slice(0, 10)); // Zeige die ersten 10 Ergebnisse zur Kontrolle

  console.log('Ende Test.');
}

//test_InsertFluxDB();

