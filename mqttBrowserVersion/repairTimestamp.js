const Database    = require('better-sqlite3');
const utils       = require('../../protoType/nodeUtils');
const dbUtils     = require('../../protoType/dbUtils');


const dB          = new Database( 'workingBase.db'  , { verbose: utils.log ,  readonly: false } );
      utils.log("working-dB: "+dB.constructor.name);

      function repairTimestamp( timestamp)
      {
          var parts = timestamp.split("-");
          if (parts.length > 3) {
              parts[2] += "T" + parts[3];
              parts.splice(3, 1); // Entfernt den vierten Teil (jetzt überflüssig)
              return parts.join("-");
          }
          return timestamp;
      }  


      function toExcelDate(dateString) 
      {
        // Wandelt das Datum in einen Unix-Timestamp um (ms seit 1970)
        const date = new Date(dateString);
        const unixTimestamp = date.getTime() / 1000; // in Sekunden

        // Unix-Timestamp in Excel-Datum umrechnen
        const daysSinceUnixEpoch = unixTimestamp / 86400; // Sekunden in Tage
        var excelDate = daysSinceUnixEpoch + 25569; // Differenz zu Excel-Datum
            excelDate = excelDate + (1/24); // Zeitzone: 1 Stunde

        return (Math.round(excelDate*1000)/1000);
      }
      


// repariere das TimeStamp-Feld und füge die Excel-Time hinzu


var response = dbUtils.fetchRecords_from_Query( dB , 'Select * from mqttPayloads' );

for (var i=0; i<response.result.length; i++)
{
   var record       = response.result[i];
   console.log( record);
   record.timestamp = repairTimestamp( record.timestamp );
   record.exceltime = toExcelDate( record.timestamp );
   dbUtils.updateTable( dB, 'mqttPayloads', 'ID' , record.ID , record );
}





      