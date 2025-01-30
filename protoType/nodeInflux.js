const { InfluxDB, Point } = require('@influxdata/influxdb-client');

class InfluxDB 
{
  constructor(params) 
  {
    if (!params.url || !params.token || !params.org || !params.bucket) 
    {
      throw new Error('❌ Fehlende InfluxDB-Verbindungsdaten!');
    }

    this.client   = new InfluxDB({ url: params.url, token: params.token });
    this.writeApi = this.client.getWriteApi(params.org, params.bucket, 'ns');
    this.queryApi = this.client.getQueryApi(params.org);
    this.bucket   = params.bucket;
  }


  async saveValues(values) 
  {
    if (!Array.isArray(values)) values = [values];  // Falls Einzelwert → Array machen

    const points = values.map(entry => {
                                         if (!entry.id || !entry.timestamp || entry.wert === undefined)  throw new Error('❌ Werte müssen mindestens eine ID, einen Timestamp und einen Wert enthalten!');
                                         const point = new Point('messungen')
                                               .tag('id', entry.id)
                                               .floatField('wert', parseFloat(entry.wert))
                                               .timestamp(new Date(entry.timestamp).getTime() * 1e6); // ns Timestamp

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

  /**
   * Fragt Werte mit Filtern und Aggregationen ab
   * @param {Object} params - JSON mit {tags, groupBy, aggregate}
   */
  async selectValues(params) {
    if (!params || !params.groupBy || !params.aggregate) {
      throw new Error('❌ `groupBy` und `aggregate` sind erforderlich!');
    }

    const groupByMap = {
      hour: '1h',
      day: '1d',
      week: '7d',
      quarter: '3mo',
      year: '1y'
    };

    const aggregateMap = {
      sum: 'sum()',
      avg: 'mean()',
      min: 'min()',
      max: 'max()'
    };

    if (!groupByMap[params.groupBy] || !aggregateMap[params.aggregate]) {
      throw new Error('❌ Ungültige Werte für `groupBy` oder `aggregate`!');
    }

    // Basis-Query
    let fluxQuery = `
      from(bucket: "${this.bucket}")
      |> range(start: -1y)
      |> filter(fn: (r) => r._measurement == "messungen")
    `;

    // Falls Tags zum Filtern vorhanden sind
    if (params.tags) {
      Object.entries(params.tags).forEach(([key, value]) => {
        fluxQuery += `\n  |> filter(fn: (r) => r.${key} == "${value}")`;
      });
    }

    // Aggregation & Gruppierung
    fluxQuery += `
      |> aggregateWindow(every: ${groupByMap[params.groupBy]}, fn: ${aggregateMap[params.aggregate]})
      |> yield()
    `;

    console.log(`📌 Flux-Query:\n${fluxQuery}`);

    return new Promise((resolve, reject) => {
      const results = [];
      this.queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          results.push(tableMeta.toObject(row));
        },
        error(err) {
          console.error('❌ Fehler bei der Abfrage:', err);
          reject(err);
        },
        complete() {
          resolve(results);
        }
      });
    });
  }
}

module.exports = InfluxDBWrapper;
