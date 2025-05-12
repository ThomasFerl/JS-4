const globals             = require('./backendGlobals.js');
const utils               = require('./nodeUtils.js');
const dbUtils             = require('./dbUtils.js');
const { TFDateTime }      = require('./nodeUtils.js');



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

if( CMD=='LSBANF') 
  {
    console.log('run LSBANF stringify(param) => '+ JSON.stringify(param));
    var sql = "SELECT * FROM banf WHERE ID_HEAD = " + param.ID_HEAD 
    sql += " ORDER BY POSITIONSTEXT ASC";
    return dbUtils,dbUtils.fetchRecords_from_Query(dB,sql);
  }

  if( CMD=='DELBANF') 
    {
      console.log('run DELBANF stringify(param) => '+ JSON.stringify(param));
      var sql = "DELETE * FROM banf WHERE ID = " + param.ID 
     
      return dbUtils,dbUtils.runSQL(dB,sql);
    }


  if( CMD=='MAXPOS') 
    {
      console.log('run MAXPOS stringify(param) => '+ JSON.stringify(param));
      var sql = "SELECT max(POSITIONSTEXT) FROM banf WHERE ID_HEAD = " + param.ID_HEAD 
      return dbUtils,dbUtils.fetchValue_from_Query(dB,sql);
    }  


if( CMD=='LSBANFHEAD') 
    {
      console.log('run LSBANFHEAD stringify(param) => '+ JSON.stringify(param));
      var sql = "SELECT * FROM banfHead ";
      if (param.OWNER) sql += " WHERE OWNER = '" + param.OWNER + "'";
      sql += " ORDER BY ID DESC";
      return dbUtils,dbUtils.fetchRecords_from_Query(dB,sql);
    }

if( CMD=='BANFHEAD') 
   {
        console.log('run BANFHEAD stringify(param) => '+ JSON.stringify(param));
        var sql = "SELECT * FROM banfHead where ID = " + param.ID;
        return dbUtils,dbUtils.fetchRecord_from_Query(dB,sql);
   }

  
  if( CMD=='SAVEBANFHEAD') 
  {   
         console.log('run SAVEBANFHEAD stringify(param) => '+ JSON.stringify(param));
         console.log('param.banfHead : '+ param.banfHead);
         
         if(!param.banfHead)     return {error:true, errMsg:" banfHead-data not found in params !", result:{} };
        
         if (!param.banfHead.ID) return dbUtils.insertIntoTable( dB , 'banfHead' , param.banfHead )
         else                    return dbUtils.updateTable( dB ,'banfHead','ID', param.banfHead.ID , param.banfHead); 
  }

  if( CMD=='DELETEBANFHEAD') 
    {   
           console.log('run DELETEBANFHEAD stringify(param) => '+ JSON.stringify(param));
           console.log('param.ID : '+ param.ID);
           
           if(!param.ID)     return {error:true, errMsg:" banfHead-ID not found in params !", result:{} };
          
           dbUtils.runSQL( dB , 'Delete from banfHead Where ID='+param.ID );
           return dbUtils.runSQL( dB , 'Delete from banf Where ID_HEAD not in (Select ID from banfHead)' );
    }
      

  if( CMD=='SAVEBANF') 
    {   
           console.log('run SAVEBANF stringify(param) => '+ JSON.stringify(param));
           console.log('param.banf : '+ param.banf);
           
           if(!param.banf)     return {error:true, errMsg:" BANF-data not found in params !", result:{} };
          
           if (!param.banf.ID) return dbUtils.insertIntoTable( dB , 'banf' , param.banf )
           else                return dbUtils.updateTable( dB ,'banf','ID', param.banf.ID , param.banf); 
    }
    



  if( CMD=='LOOKUPLIST')
    {
      console.log('run LOOKUPLIST stringify(param) => '+ JSON.stringify(param));
      var sql = "SELECT * FROM " + param.tableName + " Order by v"

      var response = dbUtils.fetchRecords_from_Query(dB,sql);
      if (response.error) return response;
      var lookUp = [];
      for (var i = 0; i < response.result.length; i++) 
      {
        var rec = response.result[i];
        if(param.asStringList) lookUp.push(rec.v);
        else                   lookUp.push({value:rec.ID,caption:rec.v});
      }
      return {error:false,errMsg:"OK",result:lookUp};
      
    }


    if( CMD=='LSBANFUSER')
      {
        console.log('run LSBanfUser ');
        var sql = "SELECT Distinct(owner) as OWNER FROM banfHead Order by Owner";
  
        var response = dbUtils.fetchRecords_from_Query(dB,sql);
        if (response.error) return response;
        var lookUp = [];
        for (var i = 0; i < response.result.length; i++) lookUp.push( response.result[i].OWNER )
       
        return {error:false,errMsg:"OK",result:lookUp};
        
      }  


}
