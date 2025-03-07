const { Parser } = require('node-sql-parser');
const utils      = require('./nodeUtils');


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
  if(utils.debug)console.log('fetchValue_from_Query(' + sql +')');   // Vermeidung von Rekursion
  try {
        var query  = db.prepare( sql );

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
  if(utils.debug)console.log('fetchRecord_from_Query(' + sql +')');
    try {
        var query  = db.prepare( sql );

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
  if(utils.debug)console.log('fetchRecords_from_Query ->( db:'+db+' , sql:"' + sql +'")');
  try {
      var stmt  = db.prepare( sql );
      
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
  utils.log("runSQL->"+statement);

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
  _createTable( db , tableName , fieldDef )
}


function _insertIntoTable( db , tableName , fields )
{
  var fieldNames  = [];
  var fieldValues = []
  
  for(var fieldName in fields ) 
      if(fieldName.toUpperCase()!="ID") {fieldNames.push(fieldName) , fieldValues.push(fields[fieldName]) };

  var sql = "insert into "+tableName+"("+fieldNames[0] ;
  for( var i=1; i<fieldNames.length; i++ )  sql=sql+","+fieldNames[i];
  sql = sql + ") values('"+fieldValues[0]+"'";
  for( var i=1; i<fieldValues.length; i++ )  sql=sql+", '"+fieldValues[i]+"'";
  sql= sql + ")"
  
  return  _runSQL( db , sql );
}


module.exports.insertIntoTable = ( db , tableName , fields ) =>
{
  return _insertIntoTable( db , tableName , fields );
}


function _insertBatchIntoTable( db , tableName , records )
// Quelle: chatGPT
{ 
  try{
  const insert = db.transaction((records) =>
                {
                  for (const record of records) 
                  {
                    var fieldNames = Object.keys(record);
                    var placeholders = fieldNames.map(() => '?').join(', ');
                    var sql = `INSERT INTO ${tableName} (${fieldNames.join(', ')}) VALUES (${placeholders})`;
                    db.prepare(sql).run(...Object.values(record));
                  }
                });

  // Führt die Transaktion mit allen Datensätzen aus
  insert(records);

  return {error:false, errMsg:'OK', result:{} }

  }
  catch(e) { return {error:true, errMsg:e.message, result:{} } }
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


module.exports.insertBatchIntoTable = ( db , tableName , batch ) =>
{
    return _insertBatchIntoTable( db , tableName , batch );
}


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
  
  for(var fieldName in fields ) 
    {
      if(fieldName!=ID_field) 
        {
          fieldNames.push(fieldName) , 
          fieldValues.push(fields[fieldName]) 
        };
  }    

  var sql = "update "+tableName+" set "+fieldNames[0]+" = '"+fieldValues[0]+"'";
  for( var i=1; i<fieldNames.length; i++ )  sql=sql+ " , " +fieldNames[i]+"='"+fieldValues[i]+"'" ;
  
  sql= sql + " where "+ID_field+" = '"+ID_value+"'";
  
  return  _runSQL( db , sql );
}


module.exports.updateTable = (db , tableName , ID_field , ID_value , fields ) =>
{
  return _updateTable(db , tableName , ID_field , ID_value , fields )
}
    

function _updateBatchInTable(db, tableName, records, keyField) {
  try {
       const update = db.transaction((records) => {
       for (const record of records) 
       {
         var fieldNames = Object.keys(record).filter(f => f !== keyField); // Schlüssel-Feld auslassen
         var setClause = fieldNames.map(f => `${f} = ?`).join(', ');
         var sql = `UPDATE ${tableName} SET ${setClause} WHERE ${keyField} = ?`;

         db.prepare(sql).run(...fieldNames.map(f => record[f]), record[keyField]);
       }
    });

    // Führt die Transaktion mit allen Datensätzen aus
    update(records);

    return { error: false, errMsg: 'OK', result: {} };
  } catch (e) {
    return { error: true, errMsg: e.message, result: {} };
  }
}

module.exports.updateBatchInTable = (db, tableName, records, keyField) =>
  {
    return _updateBatchInTable(db, tableName, records, keyField)
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





