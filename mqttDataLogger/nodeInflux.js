const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const utils               = require('./nodeUtils');


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

    utils.log(values)

    const points = values.map(entry => {
                                         if (!entry.timestamp || entry.value === undefined)  throw new Error('❌ Werte müssen mindestens einen "timestamp" und eine "value" enthalten!');
                                         var _value     = parseFloat(entry.value) || 0;
                                         var _timestamp = this.___validateAndFormatDate(entry.timestamp) 
                                         
                                         const point = new Point(measurement)
                                                .floatField('value', _value )
                                                .timestamp(          _timestamp );
                                                 // Falls weitere Tags vorhanden sind, hinzufügen
                                                Object.keys(entry).forEach( (key) => {if (!['timestamp', 'value'].includes(key)) point.tag(key, entry[key]); } );

                                               return point;
                                       });

    try {
           this.writeApi.writePoints(points);
           await this.writeApi.flush();
           utils.log(`✅ ${points.length} Werte gespeichert!`);
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
            utils.log(`✅ Erfolgreich gelöscht: ${measurement} (${filter || "alle Werte"})`);
        } else {
            console.error("❌ Fehler beim Löschen:", await response.text());
        }
    } catch (error) {
        console.error("❌ Fehler:", error);
    }
}


___validateAndFormatDate(date) 
{
 //InfluxDB erwartet einen Unix-Zeitstempel in Nanosekunden (ns), Millisekunden (ms) oder als ISO 8601-String mit Millisekunden.
 return new utils.TFDateTime(date || new Date()).unixDateTime();
}




  /**
   * Führt eine Flux-Query in InfluxDB aus
   */
  async ___influxQuery(fluxQuery) {
    return new Promise((resolve, reject) => {
        const rows = [];
        utils.log("📡 Sende Query an InfluxDB:", fluxQuery);

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
                    utils.log(`✅ Query erfolgreich! ${rows.length} Datensätze gefunden.`);
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

    utils.log("------------------------------");
    utils.log("Ausgeführte Query:", fluxQuery);
    utils.log("------------------------------");
    

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
  utils.log('Starte Test...');

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
                     timestamp: new Date(Date.now() + i).toISOString(), // Zeitstempel leicht variieren
                     value    : Math.round(Math.random() * 1000)/10,
                     test     : 'test'
                   };

       // 🔹 Daten in InfluxDB einzeln speichern             
       // alternativ ein Array befüllen und dann speichern
      await influx.saveValues('testValues' , record);             
  }

   // 🔹 Daten wieder aus InfluxDB abrufen & prüfen
  utils.log('Prüfe gespeicherte Daten...');
  const result = await influx.selectValues( 'testValues' , {} );

  utils.log(`Abfrage abgeschlossen! Gefundene Einträge: ${result.length}`);
  utils.log(result.slice(0, 10)); // Zeige die ersten 10 Ergebnisse zur Kontrolle

  utils.log('Ende Test.');
}

// test_InsertFluxDB();

