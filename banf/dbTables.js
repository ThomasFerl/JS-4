const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];


tables.push( 
   {tableName: "banf",
    tableFields: [
       {fieldName: "POSITIONSTEXT"      , fieldType: "Text"    },
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
       {fieldName: "OWNER"              , fieldType: "Text"    }
    ]});

  tables.push( 
      {tableName: "banfHead",
       tableFields: [
          {fieldName: "NAME"               , fieldType: "Text"    },
          {fieldName: "BESCHREIBUNG"       , fieldType: "Text"    },
          {fieldName: "DATUM"              , fieldType: "numeric" },
          {fieldName: "OWNER"              , fieldType: "Text"    },
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



