const globals    = require('./backendGlobals.js');
const ExcelJS    = require('exceljs');
const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;



 module.exports.run = async function( fs , path , dB , filePath , orgFileName , arcFileName ) 
{
  var   result   = {error:true, errMsg:'unknown Error', result:{}};

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  // Spaltennamen aus erster Zeile
  const headerRow = worksheet.getRow(1);
  const columns   = headerRow.values.slice(1); // Index 0 ist leer

  const rows      = [];
  worksheet.eachRow((row, rowNumber) => {
                                          if (rowNumber === 1) return; // Header überspringen
                                          const rowData = {};
                                          row.values.slice(1).forEach((value, i) => { rowData[columns[i]] = value; });
                                          rows.push(rowData);
                                        });

// JSON in Datenbank speichern...
// zuerst eine Tabelle erstellen, falls es diese noch nicht gibt....
var tableName = arcFileName;

if (dbUtils.existTable(dB,tableName).result==false)
 {  
  console.log('Tabelle "'+tableName+'" existiert nicht und wird jetzt erstellt...');
   var row0      = rows[0]; 
   var fields    = [];
   for (var f in row0) fields.push({ fieldName:f, fieldType:'Text'});
   var response = dbUtils.createTable( dB , tableName , fields );
 }
 else{
       console.log('Tabelle "'+tableName+'" existiert bereits und wird geleert...');
       dbUtils.runSQL('Delete from '+tableName);  
     }   

// Dateninhalt in Tabelle speichern ...     
var response = dbUtils.insertBatchIntoTable(dB, tableName , rows );
if (response.error) 
{
  // verweiste Tabelle gleich löschen ....
  dbUtils.runSQL('drop table '+tableName);
  result.errMsg = "Fehler beim Einlesen der Daten ins SQL-Datenbank: " + response.errMsg;
  return result; 
} 

// original-Excelfile archivieren....
const source = filePath; // ist aktuell der Pfad zum temporären Upload-Ordner
const dest   = path.join(__dirname, globals.archivePath , arcFileName );    // z. B. Archivordner

// Datei kopieren
try {
  fs.renameSync(source, dest);
  // erfolgreich kopiert -> ArchivEintrag in DB
  var newRecord = dbUtils.insertIntoTable(dB,'billArchive',{ORGFILENAME :orgFileName,
                                            ARCPATH     :dest,
                                            TABLENAME   :tableName,
                                            IMPORTED    :new TFDateTime().excelTimestamp, 
                                            DESCRIPTION1:"unbenannter Datenimport vom "+new TFDateTime().formatDateTime() 
                                          });
  
} catch (err) {
                // Datenbankleiche löschen
                dbUtils.runSQL('drop table '+tableName);
                console.error('Fehler beim Archivieren der Exceldatei:', err);
                result.errMsg = err;
                return result; 
}

result.error  = false;
result.errMsg = 'OK';
result.result.lastInsertRowid = newRecord.result.lastInsertRowid;
result.result.excelValues     = rows;

return result;

}
