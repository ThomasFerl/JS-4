const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];

tables.push(
  {tableName:"WorkOrderAttachment",
   tableFields:[

      {fieldName:"timestamp"                   , fieldType:"integer"} ,
      {fieldName:"partitionKey"                , fieldType:"text"} ,
      {fieldName:"entryKey"                    , fieldType:"text"} ,
      {fieldName:"type"                        , fieldType:"text"} ,
      {fieldName:"CompanyCode"                 , fieldType:"text"} ,
      {fieldName:"MELO"                        , fieldType:"text"} ,
      {fieldName:"MALO"                        , fieldType:"text"} ,
      {fieldName:"ISUNotificationId"           , fieldType:"text"} ,
      {fieldName:"WBSElementId"                , fieldType:"text"} ,
      {fieldName:"InventoryNumber"             , fieldType:"text"} ,
      {fieldName:"AssetLocationId"             , fieldType:"text"} ,
      {fieldName:"BlobReference"               , fieldType:"text"} ,
      {fieldName:"Description"                 , fieldType:"text"} ,
      {fieldName:"TaskId"                      , fieldType:"text"} ,
      {fieldName:"DocumentId"                  , fieldType:"text"} ,
      {fieldName:"AssetCategory"               , fieldType:"text"} ,
      {fieldName:"OrganizationId"              , fieldType:"text"} ,
      {fieldName:"StartDate"                   , fieldType:"integer"} ,
      {fieldName:"WOLocation"                  , fieldType:"text"} ,
      {fieldName:"AssetLocation"               , fieldType:"text"} ,
      {fieldName:"ObjectType"                  , fieldType:"text"} ,
      {fieldName:"OrderType"                   , fieldType:"text"} ,
      {fieldName:"ObjectId"                    , fieldType:"text"} ,
      {fieldName:"WorkType"                    , fieldType:"text"} ,
      {fieldName:"WorkOrderSchedulingAssignmentId", fieldType:"text"} ,
      {fieldName:"LocationCode"                , fieldType:"text"} ,
      {fieldName:"DocumentType"                , fieldType:"text"} ,
      {fieldName:"OrderId"                     , fieldType:"text"} ,
      {fieldName:"TaskStatus"                  , fieldType:"text"} ,
      {fieldName:"GlobalId"                    , fieldType:"text"} ,
      {fieldName:"PlantSection"                , fieldType:"text"} ,
      {fieldName:"SerialNumber"                , fieldType:"text"} ,
      {fieldName:"ShortText"                   , fieldType:"text"} 
   ]});

tables.push(
  {tableName:"AssetLocationAddress",
   tableFields:[
     
      {fieldName:"workorder_id", fieldType:"integer"} ,
      {fieldName:"HouseNumber" , fieldType:"text"} ,
      {fieldName:"Street"      , fieldType:"text"} ,
      {fieldName:"City"        , fieldType:"text"} 
   ]});

tables.push(
  {tableName:"WorkOrderAddress",
   tableFields:[
   
      {fieldName:"workorder_id", fieldType:"integer"} ,
      {fieldName:"HouseNumber" , fieldType:"text"} ,
      {fieldName:"Street"      , fieldType:"text"} ,
      {fieldName:"City"        , fieldType:"text"} 
   ]});

tables.push(
  {tableName:"ChangeControl",
   tableFields:[

      {fieldName:"workorder_id", fieldType:"integer"} ,
      {fieldName:"TimeStamp"   , fieldType:"integer"} ,
      {fieldName:"Source"      , fieldType:"text"} ,
      {fieldName:"UserId"      , fieldType:"text"} 
   ]});

tables.push(
  {tableName:"MetaInformation",
   tableFields:[

      {fieldName:"workorder_id", fieldType:"integer"} ,
      {fieldName:"MimeType"    , fieldType:"text"} ,
      {fieldName:"Extension"   , fieldType:"text"} 
   ]});

tables.push(
  {tableName:"Tags",
   tableFields:[
    
      {fieldName:"workorder_id", fieldType:"integer"} ,
      {fieldName:"Tag"         , fieldType:"text"} 
   ]});





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
    


// Testdaten anlegen ....
dbUtils.insertIntoTable(dB, "WorkOrderAttachment", {
   timestamp: 1746015431773,
   partitionKey: "1",
   entryKey: "000005005892~000005005892~2200-000000000000068473~11049",
   type: "WorkOrderAttachment",
   CompanyCode: "",
   MELO: "",
   MALO: "",
   ISUNotificationId: "",
   WBSElementId: "S-2200-GUG-0100 Grundstücke und Gebäude SEG 9999",
   InventoryNumber: "",
   AssetLocationId: "2200-000000000000068435",
   BlobReference: "/",
   Description: "Wartung Fluchtwegpiktogramme",
   TaskId: "0020",
   DocumentId: "000005005892~2200-000000000000068473~11049",
   AssetCategory: "Div.-Beleuchtung",
   OrganizationId: "EMS",
   StartDate: 1742299200000,
   WOLocation: "",
   AssetLocation: "",
   ObjectType: "WorkOrder",
   OrderType: "ZSMU",
   ObjectId: "000005005892",
   WorkType: "Eintrag ändern",
   WorkOrderSchedulingAssignmentId: "0a727a87-bb7b-4d58-8dee-60050847a415",
   LocationCode: "",
   DocumentType: "",
   OrderId: "000005005892",
   TaskStatus: "ZIAR Einsatz in Arbeit",
   GlobalId: "",
   PlantSection: "",
   SerialNumber: "",
   ShortText: "Objektliste testen"
});



dbUtils.insertIntoTable(dB, "AssetLocationAddress", {
   workorder_id: 1,
   HouseNumber: "18",
   Street: "Karl-Marx Straße",
   City: "Schönebeck - Schönebeck"
});


dbUtils.insertIntoTable(dB, "WorkOrderAddress", {
   workorder_id: 1,
   HouseNumber: "18",
   Street: "Karl-Marx Straße",
   City: "Schönebeck - Schönebeck"
});


dbUtils.insertIntoTable(dB, "ChangeControl", {
   workorder_id: 1,
   TimeStamp: 1746015367789,
   Source: "CLO",
   UserId: "system"
});



dbUtils.insertIntoTable(dB, "MetaInformation", {
   workorder_id: 1,
   MimeType: "application/pdf",
   Extension: "pdf"
});


dbUtils.insertIntoTable(dB, "Tags", { workorder_id: 1, Tag: "ZEGP" });
dbUtils.insertIntoTable(dB, "Tags", { workorder_id: 1, Tag: "ZIAR" });
dbUtils.insertIntoTable(dB, "Tags", { workorder_id: 1, Tag: "ZERL" });
dbUtils.insertIntoTable(dB, "Tags", { workorder_id: 1, Tag: "ZLTEXT Langtext" });






  
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





