const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];


tables.push( 
  {tableName:"files",
   tableFields:[
      {fieldName:"TYPE"         , fieldType:"Text" } ,
      {fieldName:"DIR"          , fieldType:"integer" } ,
      {fieldName:"FILENAME"	    , fieldType:"numeric" } ,
      {fieldName:"DIMENSION"	  , fieldType:"Text" } ,
      {fieldName:"FILESIZE"	    , fieldType:"INT" } ,
      {fieldName:"PLAYTIME"	    , fieldType:"INT" } ,
      {fieldName:"QUALITY"	    , fieldType:"INT" } ,
      {fieldName:"RATING"	      , fieldType:"INT" } ,
      {fieldName:"SOURCE"	      , fieldType:"Text" } ,
      {fieldName:"KATEGORIE"    , fieldType:"Text" } ,
      {fieldName:"DESCRIPTION"	, fieldType:"Text" } ,
      {fieldName:"HASH"       	, fieldType:"Text" } ,
      {fieldName:"GUID"         , fieldType:"Text" } 
   ]});

   tables.push( 
      {tableName:"mediaSets",
       tableFields:[
          {fieldName:"TYPE"         , fieldType:"Text" } ,
          {fieldName:"NAME"	      , fieldType:"numeric" } ,
          {fieldName:"KATEGORIE"    , fieldType:"Text" } ,
          {fieldName:"DESCRIPTION"	, fieldType:"Text" } 
       ]}); 
       
   tables.push( 
      {tableName:"mediaInSet",
            tableFields:[
               {fieldName:"ID_FILE"	    , fieldType:"INTEGER" } ,
               {fieldName:"ID_MEDIA"    , fieldType:"INTEGER" } 
            ]});
      

   

tables.push( 
  {tableName:"thumbs",
     tableFields:[
        {fieldName:"ID_FILE"      , fieldType:"integer" } ,
        {fieldName:"NDX"    	    , fieldType:"numeric" } ,
        {fieldName:"THUMBFILE"	  , fieldType:"Text" } ,
        {fieldName:"POSITION"	    , fieldType:"REAL" } 
     ]});


tables.push( 
  {tableName:"persons",
     tableFields:[
        {fieldName:"NAME"    	    , fieldType:"Text" } ,
        {fieldName:"VORNAME"	    , fieldType:"Text" } ,
        {fieldName:"ALIAS1"	      , fieldType:"Text" } ,
        {fieldName:"ALIAS2"	      , fieldType:"Text" } ,
        {fieldName:"ALIAS3"	      , fieldType:"Text" } ,
        {fieldName:"GEBURTSJAHR"	, fieldType:"REAL" } ,
        {fieldName:"HERKUNFT"	    , fieldType:"Text" } ,
        {fieldName:"BUSINESSTART"	, fieldType:"REAL" } ,
        {fieldName:"BUSINESENDE"	, fieldType:"REAL" } ,
        {fieldName:"RANKING"	    , fieldType:"INTEGER" } ,
        {fieldName:"BEMERKUNGEN"	, fieldType:"Text" } 
       ]});
	
    
tables.push( 
        {tableName:"personsInMedia",
           tableFields:[
              {fieldName:"ID_FILE"	    , fieldType:"INTEGER" } ,
              {fieldName:"ID_PERSON"    , fieldType:"INTEGER" } 
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



