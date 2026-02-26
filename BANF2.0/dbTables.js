const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];


tables.push( 
   {tableName: "banf",
    tableFields: [
       {fieldName: "ID_HEAD"            , fieldType: "numeric" },      
       {fieldName: "POSITIONSTEXT"      , fieldType: "Text"    },
       {fieldName: "KURZTEXT"           , fieldType: "Text"    },
       {fieldName: "MENGE"              , fieldType: "numeric" },
       {fieldName: "MENGENEINHEIT"      , fieldType: "Text"    },
       {fieldName: "PREIS"              , fieldType: "numeric" },
       {fieldName: "WARENGRUPPE"        , fieldType: "Text"    },
       {fieldName: "LIEFERDATUM"        , fieldType: "Text"    }, // ggf. als Date, wenn dein Framework das kennt
       {fieldName: "LIEFERANT"          , fieldType: "Text"    },
       {fieldName: "WERK"               , fieldType: "Text"    },
       {fieldName: "EINKAEUFERGRUPPE"   , fieldType: "Text"    },
       {fieldName: "EINKAUFSORGANISATION", fieldType: "Text"   },
       {fieldName: "ANFORDERER"         , fieldType: "Text"    },
       {fieldName: "BEMERKUNG"          , fieldType: "Text"    },
       {fieldName: "SACHKONTO"          , fieldType: "Text"    },
       {fieldName: "AUFTRAG"            , fieldType: "Text"    },
       {fieldName: "OWNER"              , fieldType: "Text"    },
       {fieldName: "FELD_K"             , fieldType: "Text"    },
       {fieldName: "FELD_P"             , fieldType: "Text"    },
       {fieldName: "MATERIAL"           , fieldType: "Text"    }
    ]});

  tables.push( 
      {tableName: "banfHead",
       tableFields: [
          {fieldName: "NAME"               , fieldType: "Text"    },
          {fieldName: "BESCHREIBUNG"       , fieldType: "Text"    },
          {fieldName: "DATUM"              , fieldType: "numeric" },
          {fieldName: "OWNER"              , fieldType: "Text"    },
          {fieldName: "STATE"              , fieldType: "Text"    },
       ]});
        
 
tables.push( 
      {tableName: "exportFields",
       tableFields: [
         {fieldName: "POS"       , fieldType: "INT"     },
         {fieldName: "FIELDNAME" , fieldType: "Text"    },
         {fieldName: "CAPTION"   , fieldType: "Text"    }
       ]});


tables.push( 
      {tableName: "mengeneinheit",
       tableFields: [
         {fieldName: "v"      , fieldType: "Text"    }
       ]});

tables.push( 
         {tableName: "warengruppe",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]});

tables.push( 
            {tableName: "lieferant",
             tableFields: [
               {fieldName: "v"      , fieldType: "Text"    }
             ]});

tables.push( 
      {tableName: "werk",
       tableFields: [
         {fieldName: "v"      , fieldType: "Text"    }
       ]});  
       
       
tables.push( 
         {tableName: "einkaufsgruppe",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]});       


tables.push( 
         {tableName: "einkaufsorganisation",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]}); 
          
tables.push( 
         {tableName: "sachkonto",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]});       

          
tables.push( 
         {tableName: "auftrag",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]});       

tables.push( 
         {tableName: "material",
          tableFields: [
            {fieldName: "v"      , fieldType: "Text"    }
          ]});       


module.exports.checkSingleTableStructure = function( dB , table)
{
   // Tabellenstruktur von dB abfragen
   var response = dbUtils.fetchRecords_from_Query( dB , "PRAGMA table_info('"+table.tableName+"')" );

  for(var i=1; i<10;i++) console.log('.');

   console.log('check table structure ('+table.tableName+') -> ' + JSON.stringify(response));

   if(!response.error)
   {
    // durchlaufe die Felder von table und suche das Datenfeld in response.result. 
    // Wenn nicht gefunden, dann Alter Table add Column ... ausführen...
    table.tableFields.forEach( field => {
                                          var exist = response.result.find( f => f.NAME.toUpperCase() == field.fieldName.toUpperCase() );
                                          if(!exist)
                                             {
                                               utils.log('Table '+table.tableName+': field '+field.fieldName+' not exist - try to add this ...');  
                                               dbUtils.runSQL( dB , 'Alter Table '+table.tableName+' Add Column '+field.fieldName+' '+field.fieldType );
                                             }  
                                        });
   } 
}



module.exports.checkTableStructure = function( dB )
{
    tables.forEach( table => { this.checkSingleTableStructure( dB , table ) } );
}



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








    

}  



