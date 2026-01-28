const { Parser } = require('node-sql-parser');
const utils      = require('./nodeUtils');


// für Widcards beim "like" sind auch "*" erlaubt.
// diese müssen hier wieder zurück-gewandelt werden !
// Schützenhilfe vom CoPilot weil ich mit RegEx auf Kriegsfuß stehe ;-)
function _convertLikeWildcards(sql) {
  return sql.replace(/like\s+(['"])(.*?)\1/gi, (match, quote, content) => {
    const replaced = content.replace(/\*/g, '%');
    return `LIKE ${quote}${replaced}${quote}`;
  });
}

function _extractTableNames(sqlStatement)
{
  const parser = new Parser();
  const ast    = parser.astify(sqlStatement);
  
  try {
      const ast    = parser.astify(sqlStatement);        // Konvertiert das SQL-Statement in einen AST (Abstract Syntax Tree)
      const tables = ast.from.map(table => table.table); // Extrahiert die Tabellennamen aus dem AST
      return {error:false,errMsg:'OK',result:tables}
      } catch (err) {
      return {error:true,errMsg:err.message,result:[]}
  }
}


module.exports.extractTableNames = (sqlStatement) =>
{
  return _extractTableNames(sqlStatement);
}


module.exports.structure = ( db , sqlStatement) =>
{
  if(!sqlStatement) return {error:true,errMsg:'dbUtils.structure() -> fehlendes SQLStatement / Table ',result:res}

  utils.log("Structure for SQL: " + sqlStatement )
  var response = _extractTableNames( sqlStatement );
  utils.log("response: " + JSON.stringify(response));
  
  if (response.error) return response;

  var tables = response.result;

  utils.log("found tables: " + tables.join(' / ') );

  var res    = [];
  var pragma = {};

  for(var i=0; i<tables.length; i++)
  {
    pragma = _fetchRecords_from_Query( db , 'PRAGMA table_info('+tables[i]+')' );

    utils.log("pragma response: " + JSON.stringify(pragma));
       
    if(!pragma.error) 
    for(var j=0; j<pragma.result.length; j++) 
    {
      utils.log("->" + pragma.result[j] );
      res.push( pragma.result[j] )
    }  
  }

  return  {error:false,errMsg:'OK',result:res}
}



module.exports.schema = ( db , tableName) =>
{
  // Schema der Tabelle "meineTabelle" abfragen   
  const stmt = db.prepare("PRAGMA table_info('"+tableName+"');");
  const columns = stmt.all();
  var   res     = [];
  columns.forEach((column) => {res.push({fieldName:column.name , fieldTyp:column.type , notNull:column.notnull , defaultValue:column.dflt_value , primaryKey:column.pk}); });

  return {error:false, errMsg:'OK',result:res}
}





function _fetchValue_from_Query( db , sql , params )
{
  if(utils.debug)console.log('fetchValue_from_Query(' + _convertLikeWildcards(sql) +')');   // Vermeidung von Rekursion
  try {
        var query  = db.prepare( _convertLikeWildcards(sql) );

        if(params)  var record  = query.get(params);
        else        var record  = query.get();

        if (record)
        {
          var results = [];
          for(var key in record ) results.push( record[key]);
          return {error:false, errMsg:'OK', result:results[0]};
        } 
        else return {error:false, errMsg:'empty', result:''};
      } 
      catch(e) { return {error:true, errMsg:e.message, result:'' };  } 
}


module.exports.fetchValue_from_Query = ( db , sql , params ) =>
{
  return _fetchValue_from_Query( db , sql , params);
}


function _fetchRecord_from_Query ( db , sql ,  params)
{
  if(utils.debug)console.log('fetchRecord_from_Query(' + _convertLikeWildcards(sql) +')');
    try {
        var query  = db.prepare( _convertLikeWildcards(sql) );

        if(params)  var record  = query.get(params);
        else        var record  = query.get();

        if (record === undefined) return {error:true, errMsg:"record not found", result:{} }
        
         return {error:false, errMsg:'OK', result:record};
       } 
      catch(e) { return {error:true, errMsg:e.message, result:{} }; } 
}


module.exports.fetchRecord_from_Query = ( db , sql  , params ) =>{
  return _fetchRecord_from_Query ( db , sql , params );  
}


function _fetchRecords_from_Query( db , sql , params )
{
  if(utils.debug)console.log('fetchRecords_from_Query ->( db:'+db+' , sql:"' + _convertLikeWildcards(sql) +'")');
  try {
      var stmt  = db.prepare( _convertLikeWildcards(sql) );
      
      if(params)  var records  = stmt.all(params);
      else        var records  = stmt.all();
      
      if(utils.debug)console.log("records:" + JSON.stringify(records));
      return {error:false, errMsg:'OK', result:records};
     } 
    catch(e) { return {error:true, errMsg:e.message, result:[] }; } 
}


module.exports.fetchRecords_from_Query = ( db , sql , params ) =>
{
  return _fetchRecords_from_Query( db , sql , params )
}


function _drop( db , tableName , idField , idValue )
{
   return _runSQL(db, 'Delete from '+tableName+" Where "+idField+"="+idValue);
}


module.exports.drop = ( db , tableName , idField , idValue ) =>
{
  return _drop( db , tableName , idField , idValue )
}


function _runSQL ( db , statement , params )
{
  if(utils.debug)console.log("runSQL("+statement+")");

  try{
       var stmt   = db.prepare( statement ); 

       if(params)  var res  = stmt.run(params);
       else        var res  = stmt.run();

       if(utils.debug)console.log('SQL - OK');
       return {error:false, errMsg:'OK', result:res};
     }  
  catch(err) { return {error:true, errMsg:err.message, result:{} };}   
}


module.exports.runSQL = ( db , statement , params ) =>
{
  return _runSQL ( db , statement , params )
}



function _createTable( db , tableName , fieldDef )
{
  if(!fieldDef)          return {error:true, errMsg:"missing fieldDefinition", result:{} }
  if(!fieldDef.length)   return {error:true, errMsg:"missing fieldDefinition", result:{} }
  if(fieldDef.length==0) return {error:true, errMsg:"missing fieldDefinition", result:{} }


  var sql = "create Table "+tableName+"( ID	INTEGER NOT NULL UNIQUE ";

  for ( var i=0; i<fieldDef.length; i++ )
   {
     var f = fieldDef[i];
     if(f.fieldName.toUpperCase()!='ID') sql = sql + ',' + f.fieldName + ' ' + f.fieldType;
   } 

  sql = sql + " , PRIMARY KEY( ID AUTOINCREMENT))";

  if(utils.debug)console.log( sql )
  
  return  _runSQL( db , sql );
}


module.exports.createTable = ( db , tableName , fieldDef ) =>
{
  return _createTable( db , tableName , fieldDef )
}


function _insertIntoTable(db, tableName, fields) 
{
  var fieldNames = [];
  var fieldValues = [];

  // ID-Feld ausschließen, falls vorhanden
  for (var fieldName in fields) {
    if (fieldName.toUpperCase() != 'ID') {  
      fieldNames.push(fieldName);
      fieldValues.push(fields[fieldName]);
    }
  }

  // SQL-String korrekt zusammenbauen
  var sql = "INSERT INTO " + tableName + " (" + fieldNames.join(", ") + ") VALUES ('" + fieldValues.join("', '") + "')";

  return _runSQL(db, sql);
}



module.exports.insertIntoTable = ( db , tableName , fields ) =>
{
  return _insertIntoTable( db , tableName , fields );
}


module.exports.insertBatchIntoTable = ( db , tableName , records ) =>
{
    return _insertBatchIntoTable( db , tableName , records );
}



function _insertBatchIntoTable(db, tableName, records) {
  try {
    const insert = db.transaction((records) => {
      for (const record of records) {
        const fieldNames = Object.keys(record);

        const values = Object.values(record).map(v => {
          if (v === undefined) return null; // undefined → null
          if (v === null) return null;
          if (typeof v === 'object') return JSON.stringify(v); // Objekt → JSON-String
          if (typeof v === 'boolean') return v ? 1 : 0; // Boolean → Zahl
          return v; // Zahl oder String bleibt wie er ist
        });

        const placeholders = fieldNames.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${fieldNames.join(', ')}) VALUES (${placeholders})`;

        console.log("SQL:", sql, "VALUES:", JSON.stringify(values));
        db.prepare(sql).run(...values);
      }
    });

    insert(records);
    return { error: false, errMsg: 'OK', result: {} };
  } catch (e) {
    return { error: true, errMsg: e.message, result: {} };
  }
}



module.exports.updateBatchInTable = ( db , tableName , records , id ) =>
{
    return _updateBatchInTable( db , tableName , records , id );
}


function _updateBatchInTable(db, tableName, records, keyField = "ID") {
  try {
    const update = db.transaction((records) => {
      for (const record of records) {

        // Key muss existieren
        if (!record || record[keyField] === undefined || record[keyField] === null) {
          throw new Error(`Record missing keyField '${keyField}'`);
        }

        const fieldNames = Object.keys(record).filter(k => k !== keyField);

        // Nichts zu updaten? -> überspringen
        if (fieldNames.length === 0) continue;

        const toSqlValue = (v) => {
          if (v === undefined) return null;           // undefined → null
          if (v === null) return null;
          if (typeof v === "object") return JSON.stringify(v); // Objekt → JSON-String
          if (typeof v === "boolean") return v ? 1 : 0;        // Boolean → Zahl
          return v;                                   // Zahl oder String bleibt wie er ist
        };

        const setClause = fieldNames.map(f => `${f} = ?`).join(", ");
        const values = fieldNames.map(f => toSqlValue(record[f]));
        const keyValue = toSqlValue(record[keyField]);

        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${keyField} = ?`;

        console.log("SQL:", sql, "VALUES:", JSON.stringify([...values, keyValue]));
        db.prepare(sql).run(...values, keyValue);
      }
    });

    update(records);
    return { error: false, errMsg: "OK", result: {} };
  } catch (e) {
    return { error: true, errMsg: e.message, result: {} };
  }
}


/* Kurze Erklärung zum "..."  Spread-Operator:
Im speziellen Fall von ...Object.values(record) wird der Spread-Operator verwendet, 
um die Werte des Objekts record als separate Argumente an die Methode run() zu übergeben. 
Hier ein paar Punkte, die erklären, wie das funktioniert:
(1) Object.values(record) nimmt ein Objekt record und gibt ein Array zurück, das alle Werte der Eigenschaften dieses Objekts enthält. 
Zum Beispiel, wenn record { column1: 'value1', column2: 'value2' } ist, dann gibt Object.values(record) das Array ['value1', 'value2'] zurück.
(2) Anwendung des Spread-Operators
In db.prepare(sql).run(...Object.values(record)); 
wird das von Object.values(record) zurückgegebene Array in einzelne Argumente umgewandelt und an run() übergeben. 
Das bedeutet, dass, wenn Object.values(record) ['value1', 'value2'] zurückgibt, 
der Aufruf von run(...['value1', 'value2']) zu run('value1', 'value2') wird.
*/







function _insertIntoTable_if_not_exist( db , tableName , fields , checkUpFieldName )
{
  var f     = true;
  var chk   = [];
  var where = ''

  if( Array.isArray(checkUpFieldName)) chk = checkUpFieldName;
  else chk.push(checkUpFieldName)       
  
  for(var i=0; i<chk.length; i++)
  {
    if (fields.hasOwnProperty(chk[i])) 
    {
      if(where=='') where  = chk[i] +"= '"+ fields[chk[i]] +"'";
      else          where  = where + " AND " +  chk[i] +"= '"+ fields[chk[i]]+"'";
    }
  } 
    
  var response = _fetchValue_from_Query( db , "Select count(*) from "+tableName+" Where "+ where);
      if( response.result != 0 ) f=false; 
  
  if(f) return _insertIntoTable( db , tableName , fields ); 
  else  return {error:true, errMsg:"record already exist", result:{}}
}


module.exports.insertIntoTable_if_not_exist = ( db , tableName , fields , checkUpFieldName ) =>
{
   return _insertIntoTable_if_not_exist( db , tableName , fields , checkUpFieldName );
}




function _updateTable(db , tableName , ID_field , ID_value , fields )
{
  var fieldNames  = [];
  var fieldValues = []
  
  for(var fieldName in fields ) {fieldNames.push(fieldName) , fieldValues.push(fields[fieldName]) };

  var sql = "update "+tableName+" set "+fieldNames[0]+" = '"+fieldValues[0]+"'";
  for( var i=1; i<fieldNames.length; i++ )  sql=sql+ " , " +fieldNames[i]+"='"+fieldValues[i]+"'" ;
  
  sql= sql + " where "+ID_field+" = '"+ID_value+"'";
  
  console.log("updateTable: " + sql);
  return  _runSQL( db , sql );
}


module.exports.updateTable = (db , tableName , ID_field , ID_value , fields ) =>
{
  return _updateTable(db , tableName , ID_field , ID_value , fields )
}
    

function _existTable( db , tableName )
{
  var response = _fetchValue_from_Query( db , "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='"+tableName+"'");
  if (response.error) return response;

  return {error:false, errMsg:'OK', result:response.result=='1'}
}


module.exports.existTable = (db , tableName ) =>
{
  return _existTable( db , tableName );
}  



function _existRecord( db , tableName , fieldName , value )
{
  if(isNaN(value)) var response = _fetchValue_from_Query( db , "SELECT count(*) FROM "+tableName+" WHERE "+fieldName+"='"+value+"'");
  else             var response = _fetchValue_from_Query( db , "SELECT count(*) FROM "+tableName+" WHERE "+fieldName+"="+value     );  

  if (response.error) return response;

  return {error:false, errMsg:'OK', result:((response.result)*1)>0}
}


module.exports.existRecord = ( db , tableName , fieldName , value ) =>
{
  return _existRecord( db , tableName , fieldName , value );
}


module.exports.migrate = ( db , fs , path , param ) =>
{
  console.log("");
  console.log("dbUtils.migrate() -> param: " + JSON.stringify(param));

  var tableName      = param.tableName;     // Name der Tabelle
  var fields         = param.fields;        // Felder: {fieldName1:fieldValue1, fieldName2:fieldValue2, ...}
  var checkUpFields  = param.checkUpFields; // Felder, die auf Existenz geprüft werden sollen [FeldName1,FeldName2,...]
  var mapping        = param.mapping;       // Mapping der Felder: {fieldName1:mappedFieldName1, fieldName2:mappedFieldName2, ...}
  var destFields     = {};                  // resultierende Felder unter Berücksichtigung des Mappings
  var idFieldName    = param.idFieldName;   // ID-Feldname
  var fileAttachment = param.fileAttachment;// Dateianhang: {fileName:"thumb123.png", fileDir:"/.../",linkedFieldName:"thumb"}
  
  var sql            = param.sql;

// {fieldNames.push(fieldName) , fieldValues.push(fields[fieldName]) };
  // destFields unter Berücksichtigung des Mappings erstellen
  for(var fn in fields ) 
 {
  if(fn!=idFieldName) 
  {
     if(mapping[fn]) destFields[mapping[fn]] = fields[fn];
     else            destFields[fn]          = fields[fn];
  }
 }
 
 // Datensatz einfügen...
 var response = _insertIntoTable_if_not_exist( db , tableName , destFields , checkUpFields);

 if(response.error) return response;

  // ID des eingefügten Datensatzes abrufen
  var id = response.result.lastInsertRowid;

  // Dateianhang verarbeiten
  if(fileAttachment)
  {
    var sourceFile      = fileAttachment.sourceFile;
    var extension       = path.extname(sourceFile);
    // Nur der Dateiname ohne Extension
    var destFileName    = path.basename(sourceFile, extension);
        destFileName    = destFileName + '_' + id + extension;
    var destPath        = path.join(fileAttachment.destPath, destFileName );
    var linkedFieldName = fileAttachment.linkedFieldName;

    if (!fs.existsSync(fileAttachment.destPath))
    {
      console.log('migrate Attachment: ('+fileAttachment.destPath+') not found - create this ...');
      fs.mkdirSync(fileAttachment.destPath, { recursive: true });
    } 
    
    try {
      fs.copyFileSync(sourceFile, destPath);
    }
    catch (err) {
      console.error('Error copying file:', err);
      return {error:true, errMsg:'Error copying file: ' + err.message, result:{} };
    }
    
    // Datentabelle aktualisieren
    return _runSQL(db, "Update " + tableName + " set " + linkedFieldName + "='" +destFileName+"' Where " + idFieldName + "=" + id);
  }


}





