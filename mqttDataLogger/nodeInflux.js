const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const utils               = require('./nodeUtils');
const { error } = require('console');


class nodeInfluxDB 
{
  constructor(params) 
  {
    if ( !params.url || !params.token || !params.org || !params.bucket || !params.measurement ) 
    {
      throw new Error('❌ Fehlende InfluxDB-Verbindungsdaten! Das sind die Parameter: ' + JSON.stringify(params));
    }
        this.client      = new InfluxDB({ url: params.url, token: params.token });
        this.writeApi    = this.client.getWriteApi(params.org, params.bucket, 'ms');
        this.queryApi    = this.client.getQueryApi(params.org);
        this.bucket      = params.bucket;
        this.org         = params.org;
        this.orgID       = params.org;
        this.token       = params.token;
        this.url         = params.url;
        this.measurement = params.measurement;
  }


  async saveValues(values) 
  {
    if (!Array.isArray(values)) values = [values];  // Falls Einzelwert → Array machen

    utils.log(values)

    const points = values.map(entry => {
                                         if (!entry.timestamp || entry.value === undefined)  throw new Error('❌ Werte müssen mindestens einen "timestamp" und eine "value" enthalten!');
                                         var _value     = parseFloat(entry.value) || 0;
                                         var _timestamp = this.___validateAndFormatDate(entry.timestamp) 
                                         
                                         const point = new Point(this.measurement)
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


  async deleteValues( filter = "") {
    const deleteUrl = `${this.url}/api/v2/delete?org=${encodeURIComponent(this.org)}&bucket=${encodeURIComponent(this.bucket)}`; // 🟢 ORG & BUCKET in URL

    const body = JSON.stringify({
        start: "1970-01-01T00:00:00Z",
        stop: new Date().toISOString(),
        predicate: filter ? `_measurement="${this.measurement}" AND ${filter}` : `_measurement="${this.measurement}"`
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
            utils.log(`✅ Erfolgreich gelöscht: ${this.measurement} (${filter || "alle Werte"})`);
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
  async ___influxQuery(fluxQuery)
   {
    utils.log("------------------------------");
    utils.log("   inFlux Query:" + fluxQuery);     // 
    utils.log("------------------------------");

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


buildQuery( params )
/*
Beispiel:
params.filter   = {idPayloadField="123" , weiteresFeld:"wert" ...}   ... Suchbedingung(en)
params.typeCast = {idPayloadField:"int" , weiteresFeld:"string" ...}  [optional - Im Normalfall wird immer von String ausgegangen]
params.range    = {start:"2021-01-01T00:00:00Z" , stop:"2021-01-02T00:00:00Z" ...} [optional - Im Normalfall wird start:-inf gesetzt]

   ID_topic: 8,
  fieldName: 'value',
  group: { interval: '1m', aggregate: 'mean' },
  filter: { idPayloadField: 171 },
  typeCast: { idPayloadField: 'int' }





*/
{
  var rangeClause = `|> range(start: -inf)`;

  if (params.hasOwnProperty('range')) 
  {
    // Ist params.range vom Typ String?
    if (typeof params.range === 'string') rangeClause = `|> range(start:${params.range})`;
    
    // Ist params.range vom Typ Object?
    if (typeof params.range === 'object') 
    {
        // Prüfe und konvertiere Datumswerte
        const validStart = this.___validateAndFormatDate(params.range.start);
        const validStop  = this.___validateAndFormatDate(params.range.stop);
        rangeClause = `|> range(start: ${validStart}, stop: ${validStop})`;
    }
  }

  var mapClause = '';
  if (params.hasOwnProperty('typeCast')) 
  {
    Object.entries(params.typeCast).forEach(([key, value]) => 
        {
          mapClause += `|> map(fn: (r) => ({ r with ${key}: ${value}(v: r.${key}) }))`;
        });  
  } 

   // Durchlaufe alle Filter und füge sie der Query hinzu
   var filterClause = '';

   if (params.hasOwnProperty('filter')) 
   {
        Object.entries(params.filter).forEach(([key, value]) => 
        {
          // ist dieses Feld in den TypCasts enthalten ?
          console.log("Filter => Key: "+key+" Value: "+value);
          var type='string';
          if (params.typeCast.hasOwnProperty(key)) type = params.typeCast[key];

        if (type == "int") filterClause += ` |> filter(fn: (r) => r.${key} == ${value})`;
        else               filterClause += ` |> filter(fn: (r) => r.${key} == "${value}")`;
        });
   }


   if (params.hasOwnProperty('limit')) filterClause += ` |> limit(n: ${params.limit})`;
   

   var query = `from(bucket: "${this.bucket}")`
          + rangeClause
          + '|> filter(fn: (r) => r._measurement == "'+this.measurement+'")'
          + mapClause
          + filterClause
      
    return query;
};


async count (params)
{
   var q = this.buildQuery(params);

        q = q + ' |> group()'
        q = q + ' |> count()';
    
    try {
        const response = await this.___influxQuery(q); 
      
        return { error: false, errMsg: "OK", result: response[0]._value };
        } 
        catch (error) { return { error: true, errMsg: error.message, result: {} }; }
};


 async selectValues( params = {}) 
  {
    
    console.log("--------------selectValues-----------------");
    console.log(params);
    console.log("-------------------------------------------");
    
    var q = this.buildQuery(params);

   
    // Falls Aggregation und Gruppierung angegeben sind
    /*
       params.group = {interval:'24h,1d,1month....' , aggregate:'mean, sum, count, min, max, median, mode, stddev, first, last, diff, integral'}
    */
    if (params.hasOwnProperty('group'))  q += ` |> aggregateWindow(every: ${params.group.interval}, fn: ${params.group.aggregate}, createEmpty: false)`;

    try {
        var rows = await this.___influxQuery(q); 

        var r = rows[0];
            r.timeSeries = [];
            rows.forEach( (row) => { r.timeSeries.push({time: row._time, value: row._value}); });
            
        return { error: false, errMsg: "OK", result: r};
        } 
        catch (error) { return { error: true, errMsg: error.message, result: {} }; }
}


 async selectLastValues( params = {})
 {
 
    console.log("--------------selectLastValues-----------------");
    console.log(params);
    console.log("-------------------------------------------");
    
 
 
    var q = this.buildQuery(params);
      q = q + '|> sort(columns: ["_time"], desc: true)';  // Neueste zuerst
    
  try {
      var rows = await this.___influxQuery(q); 

      var r = rows[0];
          r.timeSeries = [];
          rows.forEach( (row) => { r.timeSeries.push({time: row._time, value: row._value}); });
          
      return { error: false, errMsg: "OK", result: r};
      } 
      catch (error) { return { error: true, errMsg: error.message, result: {} }; }
 }



}

module.exports = nodeInfluxDB;



async function test_InsertFluxDB() 
{
  utils.log('Starte Test...');

  // InfluxDB-Client initialisieren
  var influx = new nodeInfluxDB({
      url        : 'http://10.102.13.99:4400',
      token      : 'SGcPDZ2JY6IYzaPFhnLGIiEHeUXtyrjjzLHzkFutvBmlCkrfwvxEk8NnR3z7Wl4YDJFcJj2f5yTJt45vn0bzHw==',
      org        : 'Energie Mittelsachsen',
      bucket     : 'testBucket',
      measurement: 'testValues'
  });

  //alles löschen
 // await influx.deleteValues();

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
      await influx.saveValues( record);             
  }

   // 🔹 Daten wieder aus InfluxDB abrufen & prüfen
  utils.log('Prüfe gespeicherte Daten...');
  const result = await influx.selectValues( {} );

  utils.log(`Abfrage abgeschlossen! Gefundene Einträge: ${result.length}`);
  utils.log(result.slice(0, 10)); // Zeige die ersten 10 Ergebnisse zur Kontrolle

  utils.log('Ende Test.');
}

// test_InsertFluxDB();

