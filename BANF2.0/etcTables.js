const dbUtils    = require('./dbUtils');
const utils      = require('./nodeUtils');
const TFDateTime = require('./nodeUtils').TFDateTime;

var tables  = [];
var content = [];


tables.push( 
  {tableName:"user",
   tableFields:[
      {fieldName:"ID"          , fieldType:"integer" } ,
      {fieldName:"USERNAME"    , fieldType:"text" } ,
      {fieldName:"PASSWD"	   , fieldType:"text" } ,
      {fieldName:"FIRSTNAME"   , fieldType:"text" } ,
      {fieldName:"LASTNAME"	   , fieldType:"text" } ,
      {fieldName:"EMAIL"	   , fieldType:"text" } , 
      {fieldName:"JOBFUNCTION" , fieldType:"text" } 
   ]});


tables.push( 
  {tableName:"grantObj",
   tableFields:[
      {fieldName:"ID"          , fieldType:"integer" } ,
      {fieldName:"NAME"        , fieldType:"text" } ,
      {fieldName:"CAPTION"	   , fieldType:"text" } ,
      {fieldName:"KIND"        , fieldType:"text" } 
   ]});
   

tables.push( 
  {tableName:"userGrants",
   tableFields:[
      {fieldName:"ID"          , fieldType:"integer" } ,
      {fieldName:"ID_USER"     , fieldType:"integer" } ,
      {fieldName:"ID_GRANT"	   , fieldType:"integer" }       
   ]});   


tables.push( 
  {tableName:"session",
   tableFields:[
      {fieldName:"ID"          , fieldType:"integer" } ,
      {fieldName:"ID_USER"     , fieldType:"integer" } ,
      {fieldName:"IP"	       , fieldType:"text"    } ,
      {fieldName:"DT_BEGIN"	   , fieldType:"float"   } ,
      {fieldName:"DT_END"	   , fieldType:"float"   } ,
      {fieldName:"END_REASON"  , fieldType:"text"    } ,
      {fieldName:"VARS"        , fieldType:"text"    } 
   ]});
   


tables.push( 
  {tableName:"forms",
   tableFields:[
      {fieldName:"ID"          , fieldType:"integer" } ,
      {fieldName:"FORMNAME"    , fieldType:"text"   } ,
      {fieldName:"FORMDATA"	   , fieldType:"text"    } 
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
    

  // ggf einen Initial-User anlegen:
  if(!dbUtils.fetchValue_from_Query(dB,'Select * from user').result) 
  { 
     dbUtils.insertIntoTable( dB , 'user'     , {USERNAME:'sysdba',PASSWD:'masterkey',FIRSTNAME:'Initial',LASTNAME:'sysAdmin',EMAIL:'',JOBFUNCTION:'InitialUser'});
     dbUtils.runSQL         ( dB , "Delete from grantObj" );
     dbUtils.runSQL         (dB  , "Delete from userGrnts" );
     dbUtils.insertIntoTable( dB , 'grantObj' , {NAME:'sysadmin',CAPTION:'Systemadministrator',KIND:'sys'});
     dbUtils.insertIntoTable( dB , 'userGrants',{ID_USER:'1',ID_GRANT:'1'});
  }   



}  



