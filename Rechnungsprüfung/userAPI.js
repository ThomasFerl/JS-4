const globals             = require('./backendGlobals.js');
const utils               = require('./nodeUtils.js');
const dbUtils             = require('./dbUtils.js');
const procExcelFiles      = require('./processExcelFiles.js');
const { TFDateTime }      = require('./nodeUtils.js');
const { error } = require('console');

var   dB           = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc          = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....   
var   media        = {};


module.exports.setup = function( _dB , _etc ) 
{
  utils.log('-------------------userAPI.SETUP-----------------');
  dB  = _dB;
  etc = _etc;

  utils.log("userAPI.working-dB : " + dB.constructor.name);

  if(etc) utils.log("userAPI.config-dB  : " + etc.constructor.name)
  else utils.log("userAPI.config-dB  :  not set")
  // doin your own stuff here for preparing things ...
 
}


module.exports.run = function() 
// wird alle 60 Sekunden aufgerufen und prüft, ob etwas in der BATCH-Verarbeitung ansteht....
{
  
}

module.exports.handleCommand = async function( sessionID , cmd , param , webRequest ,  webResponse , fs , path )
{

 var CMD = cmd.toUpperCase().trim();
 utils.log("handleUserCommand ("+CMD+")");
 utils.log("with params: "+JSON.stringify(param) );
 

//------------------------------------------------------------
//-------------TEST-------------------------------------------
//------------------------------------------------------------

if( CMD=='TEST') 
{
  setTimeout(()=>{console.log("TEST")},1000)
  return {error:false,errMsg:"OK",result:42}
}


if( CMD=='DELETERULE') 
{
  return dbUtils.runSQL(dB,"Delete From quantityAdjustment Where ID="+param.ID_rule);
}


if( CMD=='RUNRULE') 
{
  var sql    ='';
  var ruleID = param.ID_rule;
  var table  = param.tableName;

  // zuerst prüfen, ob diese Regel bereits angewendet wurde ...
  var response = dbUtils.fetchValue_from_Query(dB,"Select count(*) from usedAdjustments Where TABLENAME='"+table+"' AND ID_ADJUSTMENT="+ruleID);
  if (response.error) return response;

  if (response.result>0) return {error:true, errMsg:"Diese Regel wurde bereits angewendet !", result:""}

  response = dbUtils.fetchRecord_from_Query(dB,"Select * from quantityAdjustment Where ID="+ruleID);
  if (response.error) return response;

  if (!response.result.ID)  return {error:true, errMsg:"Diese Regel wurde nicht gefunden !", result:""} 

  var rule = response.result;

  sql = "Update "+table+" set "+rule.DATAFIELD+" = " + rule.DATAFIELD + " " +rule.ADJUSTMENT + " " + rule.VALUE + " Where ORT='"+rule.ORT+"' AND PRODUKT='"+rule.PRODUKT+"'"; 

  response = dbUtils.insertIntoTable(dB,'usedAdjustments',{ID_ADJUSTMENT:rule.ID,TABLENAME:table});
  if (response.error) return response;

  return dbUtils.runSQL(dB,sql);
  
}


if( CMD=='PROCESSEXCELFILE') 
{
  return procExcelFiles.run( fs , path ,  dB , param.excelFile , param.originalName , param.archiveName ); 
}


if( CMD=='PROCESSCSVDATA') 
{
  console.clear();
  console.log('PROCESSCSVDATA: ' + JSON.stringify(param.data));

  var result = {error:false,errMsg:"OK",result:42}

  // Zuerst Daten in Tabelle kopieren ...
  var tableName  = `csv_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  var fileName   = tableName + '.csv';
  if (dbUtils.existTable(dB,tableName).result==false)
   {  
    console.log('Tabelle "'+tableName+'" existiert nicht und wird jetzt erstellt...');
    var fields    = [];
    var _1stRow   = param.data[0];     
    for( var key in _1stRow) fields.push({ fieldName:key, fieldType:'Text'});
    var response = dbUtils.createTable( dB , tableName , fields );
   }
   else{
         console.log('Tabelle "'+tableName+'" existiert bereits und wird geleert...');
         dbUtils.runSQL('Delete from '+tableName);  
       }   
 
  result.result.tableName = tableName;     

  // Dateninhalt in Tabelle speichern ...     
  var response = dbUtils.insertBatchIntoTable(dB, tableName , param.data );
  if (response.error) 
  {
    // falls das schief ging, verweiste Tabelle gleich löschen ....
    dbUtils.runSQL('drop table '+tableName);
    result.errMsg = "Fehler beim Einlesen der Daten in die SQL-Datenbank: " + response.errMsg;
    result.result = {};
    return result; 
  } 
  
  // Daten als CSV speichern / archivieren ...
  var arcFileName = utils.saveTextFile( path , fs , fileName , param.data );
  if(arcFileName != '') 
     {
        var newRecord = dbUtils.insertIntoTable(dB,'billArchive',{ORGFILENAME :param.source || 'CSV-Data',
                                                  ARCPATH     :arcFileName,
                                                  TABLENAME   :tableName,
                                                  IMPORTED    :new TFDateTime().formatDateTime() , 
                                                  DESCRIPTION1:param.description || "unbenannter Datenimport vom "+new TFDateTime().formatDateTime() 
                                                });
        if(newRecord.error) 
        {          
          result = newRecord;
          return result;
        }                                          
        
     }

  }

  


}  

  

