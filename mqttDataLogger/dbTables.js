const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];


tables.push( 
            {tableName:"mqttTopics",
             tableFields:[
                {fieldName:"topic"    , fieldType:"Text" },
                {fieldName:"descr"    , fieldType:"Text" },
             ]});


tables.push( 
            {tableName:"mqttPayloads",
             tableFields:[
                          {fieldName:"ID_Topic"  , fieldType:"INTEGER" },
                          {fieldName:"payload"   , fieldType:"TEXT" }, 
                          {fieldName:"sync"      , fieldType:"INTEGER" },
                          {fieldName:"DT"        , fieldType:"Real" } 

                       ]});


tables.push( 
            {tableName:"devices",
             tableFields:[
                          {fieldName:"BEZEICHNUNG" , fieldType:"Text"} ,
                          {fieldName:"TYP" , fieldType:"Text"} ,
                          {fieldName:"AnlagenSchluessel", fieldType:"Text"} ,
                          {fieldName:"SERIENNUMMER" , fieldType:"Text"} ,
                          {fieldName:"MAC" , fieldType:"Text"} ,
                          {fieldName:"IP" , fieldType:"Text"} ,
                          {fieldName:"STANDORT" , fieldType:"Text"} ,
                          {fieldName:"PLZ" , fieldType:"Text"} ,
                          {fieldName:"Ort" , fieldType:"Text"} ,
                          {fieldName:"Strasse" , fieldType:"Text"} ,
                          {fieldName:"HNr" , fieldType:"Text"} ,
                          {fieldName:"BEMERKUNGEN" , fieldType:"Text"} ,
                          {fieldName:"Pix1" , fieldType:"Text"} ,
                          {fieldName:"Pix2" , fieldType:"Text"} ,
                          {fieldName:"Pix3" , fieldType:"Text"} ,
                          {fieldName:"EMF" , fieldType:"Text"} ,
                          {fieldName:"GPS" , fieldType:"Text"} ,
                          {fieldName:"TOPIC" , fieldType:"Text"}
                          
                         ]});
                       
                    
tables.push( 
            {tableName:"chanels",
             tableFields:[
                          {fieldName:"ID_Device"         , fieldType:"INTEGER"} ,
                          {fieldName:"ID_TOPIC"          , fieldType:"Text"} ,
                          {fieldName:"NAME"              , fieldType:"Text"} ,
                          {fieldName:"TYP"               , fieldType:"Text"} ,
                          {fieldName:"UNIT"              , fieldType:"Text"} ,
                          {fieldName:"BESCHREIBUNG"      , fieldType:"Text"} ,
                          {fieldName:"InfoPktName"       , fieldType:"Text"} ,
                          {fieldName:"Betriebsmittel"    , fieldType:"Text"} ,
                          {fieldName:"lfdNr_BM"          , fieldType:"Text"} ,
                          {fieldName:"SIGNALART"         , fieldType:"Text"} ,
                          {fieldName:"payloadField_val"  , fieldType:"Text"} ,
                          {fieldName:"payloadField_dt"   , fieldType:"Text"} ,
                          {fieldName:"DESC"              , fieldType:"Text"} 
                         
                       ]});
                       

tables.push( 
            {tableName:"Measurements",
             tableFields:[
                          {fieldName:"ID_Chanel"     , fieldType:"INTEGER"} ,
                          {fieldName:"DT"            , fieldType:"REAL"} ,
                          {fieldName:"Wert"          , fieldType:"REAL"} ,
                          {fieldName:"sync"          , fieldType:"INTEGER"} 
                       ]});


tables.push( 
            {tableName:"hourly_Measurements",
             tableFields:[
                          {fieldName:"ID_Chanel"     , fieldType:"INTEGER"} ,
                          {fieldName:"DT"            , fieldType:"REAL"} ,
                          {fieldName:"Wert"          , fieldType:"REAL"} ,
                          {fieldName:"cnt"           , fieldType:"INTEGER"},
                          {fieldName:"sync"          , fieldType:"INTEGER"} 
                       ]});


tables.push( 
            {tableName:"daily_Measurements",
             tableFields:[
                          {fieldName:"ID_Chanel"     , fieldType:"INTEGER"} ,
                          {fieldName:"DT"            , fieldType:"REAL"} ,
                          {fieldName:"Wert"          , fieldType:"REAL"} ,
                          {fieldName:"cnt"           , fieldType:"INTEGER"},
                          {fieldName:"sync"          , fieldType:"INTEGER"}  
                       ]});                       


                                  // USW




module.exports.buildTables = function( dB )
{
   for(var i=0; i< tables.length; i++)
   {
    var t        = tables[i];
    var response = dbUtils.existTable(dB , t.tableName);
    utils.log('check table ('+t.tableName+') -> ' + JSON.stringify(response));    

    if(!response.result) 
    {
      utils.log('Table '+t.tableName+' not exist - try to create this ...');  
      response = dbUtils.createTable( dB , t.tableName , t.tableFields );
      utils.log('build Table response: '+ JSON.stringify(response));  
    } 
    else utils.log(t.tableName + ' alredy exist'); 

    for(var j=0; j<content.length; j++)
    {
      if(content[j].table==t.tableName)
      {
        var c = JSON.parse(JSON.stringify(content[j]));  // werte Kopie  -----  C=content[j] erzeugt Referenz. d.h. ein Änderung in c ändert auch die Quelle im Array
        delete( c.table );
        dbUtils.insertIntoTable_if_not_exist( dB , t.tableName , c , 'key' );
      }
    }
   } 
    

  // mache irgendwas .....z.B. ein View erzeugen   
  /*    
  var SQL =      "Create View lpspView as ";
      SQL = SQL +" SELECT lpspRaw.ID, lpspRaw.LPSP_NR, ";
      SQL = SQL +"     (strftime('%s', substr(lpspRaw.DATA_BEGIN, 1, 19)) / 86400) + 25569 AS DT_Begin,  ";
      SQL = SQL +"     (strftime('%s', substr(lpspRaw.DATA_END, 1, 19)) / 86400) + 25569 AS DT_End,  ";
      SQL = SQL +"     strftime('%s', substr(lpspRaw.DATA_BEGIN, 1, 19)) AS uxDT_Begin, ";
      SQL = SQL +"     strftime('%s', substr(lpspRaw.DATA_END, 1, 19)) AS uxDT_End,  ";
      SQL = SQL +"     strftime('%d.%m.%Y', substr(lpspRaw.DATA_BEGIN, 1, 19)) AS fDT_Begin,  ";
      SQL = SQL +"     strftime('%d.%m.%Y', substr(lpspRaw.DATA_END, 1, 19)) AS fDT_End,  ";
      SQL = SQL +"     lookUp_UNIT.value AS Einheit,  ";
      SQL = SQL +"     lpspRaw.KZ AS EDIS,  ";
      SQL = SQL +"     lookUp_LPART.value AS LastprofilArt,  ";
      SQL = SQL +"     lpspRaw.LP_BEZ,  ";
      SQL = SQL +"     lpspRaw.MALOID,  ";
      SQL = SQL +"     lookUp_LPSTATUS.value AS LastprofilStatus  ";
      SQL = SQL +" FROM lpspRaw  LEFT JOIN  lookUp_UNIT ON lpspRaw.Einheit = lookUp_UNIT.key ";
      SQL = SQL +"               LEFT JOIN  lookUp_LPART ON lpspRaw.LP_ART = lookUp_LPART.key ",
      SQL = SQL +"               LEFT JOIN  lookUp_LPSTATUS ON lpspRaw.LP_STATUS = lookUp_LPSTATUS.key ";
      

      dbUtils.runSQL( dB , 'drop View lpspView' , [] );
      dbUtils.runSQL( dB , SQL , [] );

*/

}  



