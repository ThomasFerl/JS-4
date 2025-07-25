const { TFLogging }= require('./logging.js');
const globals      = require('./backendGlobals.js');
const utils        = require('./nodeUtils.js');
const batchProc    = require('./batchProc.js');
const dbUtils      = require('./dbUtils');
const grants       = require('./nodeGrants');
const session      = require('./session');
const userAPI      = require('./userAPI');

var   dB              = {}; // lokale Kopie der Arbeits-Datenbank - wird via startBackend() initialisiert ....   
var   etc             = {}; // lokale Kopie der Konfigurations-Datenbank - wird via startBackend() initialisiert ....  
var   batchProcesses  = new batchProc.TBatchQueue( batchProcedureHandler );
      // der Scheduler, der alle 7 Sekunden nachschaut, ob ein Batch-Prozess vorhanden ist, bewirkt auf Grund der noch leeren Queue, dass erst einmal nichts passiert... ;-)
      batchProcesses.start(); 

//für diese Befehle wird kein GrantCheck() durchgeführt ...
var sysCommands    = ['KEEPALIVE' , 'LSGRANTS' , 'GETUSERGRANTS' , 'GETVAR' , 'GETVARS' , 'USERLOGOUT' , 'CREATETABLE' , 'FETCHVALUE' , 'FETCHRECORD' , 'FETCHRECORDS',
                      'INSERTINTOTABLE' , 'UPDATETABLE' , 'DROP' , 'EXISTTABLE' , 'STRUCTURE' , 'AST' , 'LSUSER' , 'ADDUSER' ,  'EDITUSER' , 'ADDGRANT' , 'IDGRANT' , 
                      'RESETUSERGRANTS' , 'ADDUSERGRANT' , 'SETUSERGRANTS' , 'GETUSERGRANTS' , 'SETVAR' , 'DELVAR' , 'JSN2EXCEL' , 'LSFORMS' , 'LOADFORM' , 'SAVEFORM' , 'DELFORM'];

var startTime      = utils.seconds();
utils.log('StartTime: '+startTime);


module.exports.setup = function( _dB , _etc ) 
{
  utils.log('-------------------nodeAPI.SETUP-----------------');
  dB  = _dB;
  etc = _etc;
  userAPI.setup( _dB , _etc )
  utils.log("nodeAPI.working-dB : " + dB.constructor.name)
  if(etc) utils.log("nodeAPI.config-dB  : " + etc.constructor.name)
  else utils.log("nodeAPI.config-dB  :  not set")
}


module.exports.run = function() 
// durchläuft alle Kanäle und führt für jeden Kanal ein httpRequest() auf dem jeweiligen Gerät aus, sofern das Update-Intervall erreicht ist..
{
   userAPI.run();
}


// Prozedur, die aufgerufen wird, wenn ein Batch-Prozess abgearbeitet werden soll
async function batchProcedureHandler( processParam , enviroment )
{
  console.log("batchProcedureHandler() called ..." + JSON.stringify(processParam) );
  
  // es wird der "normale" webAPI-Handler aufgerufen, der die Befehle abarbeitet...
  // ACHTUNG : in diersem Fall ist das request- und response-Objekt natürlich nicht vorhanden...
  var response  = await module.exports.handleCommand( enviroment.sessionID ,  processParam.cmd , processParam.param , null , null , enviroment.fs , enviroment.path );

  console.log( "batchProcedureHandler() response: "+JSON.stringify(response) )
}




module.exports.handleCommand = async function( sessionID , cmd , param , req ,  res , fs , path )
{
 var webResponse = res;
 var webRequest  = req;
 
  var CMD = cmd.toUpperCase().trim();
 utils.log("handle nodeAPI-Command ("+CMD+")   sessionID:"+sessionID);
 utils.log("params (stringifyd): "+JSON.stringify(param) );
         
 var s = session.getSession( sessionID );
 if(!s) return { error:true, errMsg:"invalid Sessiom-ID", result:{} }

if(sysCommands.indexOf(cmd)<0)      // für alle NICHT-System API-Befehle 
if(!s.user.admin)                   // für alle NICHT-SYSADMINS ...
{ 
   utils.log("user: "+s.user.username+" is not sysadmin -> checkGrants ...")
   utils.log("is API-Call : "+cmd+" a valid grantObject ?") 
   if(grants.isGrantObj(cmd))          // prüfen, ob angeforderte API-Funktion im Pool der "Berechtigungsobjekte" vorhanden ist 
   {
    utils.log("-> YES -> check if the user of this session has the right to do that ...");
    if(!session.checkGrant( s , cmd , param )) return {error:true, errMsg:"permission denied", result:{} }  // ist der User für dieses Objekt bzw. für bestimme Fallausprägungen (params) berechtigt
   } 
} else utils.log("user: "+s.user.username+" is a sysadmin -> everything is allowed");     
  /*   z.B.:
  
  grant.name = 'lsChan'  
  grant.kind =  device ="Temperatur#1"  // erlaubt für Geräte mit dem Namen "Temperatur#1"
           oder device!="Temperatur#2"  // nicht erlaubt für Geräte mit demm Namen "Temperatur#2"
           oder device~"Temp*"          // erlaubt für Geräte, die mit demm Namen "Temp" beginnen...
           oder device!~"Temp*"         // nicht erlaubt für Geräte, die mit demm Namen "Temp" beginnen...

  Voraussetzung:  Es muss einen Parameter mit dem Namen "device" geben.....
                         

  */  

if( CMD=='WAIT')            {setTimeout(()=>{return{error:false, errMsg:"10 Sekunden gewartet", result:""}}, param.timeOut || 10000 ) ; return {error:false, errMsg:"OK", result:""} }

if( CMD=='KEEPALIVE')       return session.keepAlive(sessionID)

if( CMD=='SCANDIR')         return utils.scanDir ( fs , path , param.dir , param.fileExt);

if( CMD=='GETFILE')         return utils.getTextFile( fs , param.fileName );

if( CMD=='GETTEXTFILE')     return utils.getTextFile( fs , param.fileName );

if( CMD=='GETIMAGEFILE')    {
                             await utils.getImageFile  ( fs , path , param.fileName , webRequest , webResponse ); // function streamt direkt 
                             return {isStream:true};
                            }

if(CMD=='LSSYMBOLGROUPS') 
  {
     var spath = globals.symbolPath(); 
     console.log('LSSYMBOLGROUPS: -> '+spath)
     var response = utils.scanDir ( fs , path , spath , '*.*');
     if (response.error) return response;
     var grp = [];  
     for (var i=0; i<response.result.length; i++) if(response.result[i].isDir) grp.push(response.result[i].name); 
     return {error:false, errMsg:"", result:grp};  
  } 

if(CMD=='SYMBOLPATH') 
  {
    return utils.getSymbolPath(param.symbol);
  } 
  

if( CMD=='LSSYMBOLS')       {
                              var spath = globals.symbolPath(param.path || ''); 
                              console.log('LSSYMBOLS: -> '+spath)
                              var response = utils.scanDir ( fs , path , spath , '*.*');
                              if (response.error) return response;
                              var sym = [];  
                              for (var i=0; i<response.result.length; i++) sym.push( path.basename(response.result[i].name, '.svg')); 
                              return {error:false, errMsg:"", result:sym};  
                            }



if( CMD=='SYMBOL')         {
                             var p = globals.symbolPath(param.path || '');
                                 p = path.join( p , param.symbolName+'.svg');
                             return utils.getTextFile( fs , p );
                           }

if( CMD=='GETMOVIEFILE')    {
                             await utils.getMovieFile  ( fs , path , param.fileName , webRequest , webResponse ); // function streamt direkt 
                             return {isStream:true};
                            }



if( CMD=='CREATETABLE') 
   if(param.etc)            return dbUtils.createTable ( etc, param.tableName , param.fieldDefs );
   else                     return dbUtils.createTable ( dB , param.tableName , param.fieldDefs );


if( CMD=='FETCHVALUE')      
   if(param.etc)            return dbUtils.fetchValue_from_Query( etc, param.sql );
   else                     return dbUtils.fetchValue_from_Query( dB , param.sql );


if( CMD=='FETCHRECORD')     
  if(param.etc)             return dbUtils.fetchRecord_from_Query( etc , param.sql );
  else                      return dbUtils.fetchRecord_from_Query( dB , param.sql );
  

if( CMD=='FETCHRECORDS')    
  if(param.etc)             return dbUtils.fetchRecords_from_Query( etc , param.sql );
  else                      return dbUtils.fetchRecords_from_Query( dB , param.sql );


if( CMD=='INSERTINTOTABLE') 
  if(param.etc)             return dbUtils.insertIntoTable( etc , param.tableName , param.fields );
  else                      return dbUtils.insertIntoTable( dB , param.tableName , param.fields );


if( CMD=='UPDATETABLE')     
  if(param.etc)             return dbUtils.updateTable( etc , param.tableName , param.ID_field , param.ID_value , param.fields );
  else                      return dbUtils.updateTable( dB , param.tableName , param.ID_field , param.ID_value , param.fields );


  if( CMD=='DROP')     
  if(param.etc)             return dbUtils.drop( etc , param.tableName , param.ID_field , param.ID_value  );
  else                      return dbUtils.drop( dB , param.tableName , param.ID_field , param.ID_value   );



if( CMD=='EXISTTABLE')     
if(param.etc)             return dbUtils.existTable( etc , param.tableName );
else                      return dbUtils.existTable( dB , param.tableName );


if( CMD=='STRUCTURE')
{
  if(param.tableName)
  { 
    if(param.etc) return dbUtils.fetchRecords_from_Query( etc , "PRAGMA table_info('"+param.tableName+"')" );
    else          return dbUtils.fetchRecords_from_Query( dB  , "PRAGMA table_info('"+param.tableName+"')" ); 
  }
  
  if(param.sql) 
  { 
    if(param.etc==true) return dbUtils.structure( etc , param.sql ); 
    else                return dbUtils.structure( dB  , param.sql ); 
  }
}


if( CMD=='SCHEMA')          return dbUtils.schema( dB , param.tableName )
    
if( CMD=='AST' )            return dbUtils.extractTableNames( param.sql );

if( CMD=='LSUSER')          return dbUtils.fetchRecords_from_Query( etc , 'Select * from user' );

if( CMD=='ADDUSER') 
{
 var sql    = "insert into user( username , firstName , lastName , jobFunction , passwd , email) values(?,?,?,?,?,?)";
 var params = [ param.username , param.firstname , param.lastname , param.jobfunction , param.passwd , param.email ];
 return dbUtils.runSQL( etc , sql , params );
}

if( CMD=='EDITUSER') 
{
 var sql    = "update user set username=? , firstName=? , lastName=? , jobFunction=? , passwd=? , email=? where id=?";
 var params = [ param.username , param.firstname , param.lastname , param.jobfunction , param.passwd , param.email , param.ID ];
 return dbUtils.runSQL( etc , sql , params );
}

if( CMD=='LSGRANTS' ) 
{
 return grants.lsGrants( etc );
}


if( CMD=='ADDGRANT' ) 
{
 return grants.addGrant( etc , param.grantName );
}


if( CMD=='IDGRANT' ) 
{
 return grants.idGrant( etc , param.grantName );
}


if( CMD=='RESETUSERGRANTS') 
{
 return grants.resetUserGrant( etc , param.userName  );
}


if( CMD=='ADDUSERGRANT') 
{
 return grants.addUserGrant( etc , param.userName , param.grantName );
}


if(CMD=='SETUSERGRANTS') 
{
  return grants.setUserGrants( etc , param ); 
}  


if(CMD=='GETUSERGRANTS') 
{
  return grants.getUserGrants( etc , param.userName ); 
} 


if(CMD=='GETVAR') 
{
  return session.getSessionVar( sessionID , param.varName ); 
} 


if(CMD=='GETVARS') 
{
  return session.getSessionVars( sessionID ); 
} 


if(CMD=='SETVAR') 
{
  return session.setSessionVar( sessionID , param.varName , param.value ); 
} 


if(CMD=='DELVAR') 
{
  return session.deleteSessionVar( sessionID , param.varName ); 
} 


if(CMD=='JSN2EXCEL') 
{
  return utils.json2Excel( param.worksheetName , param.data , param.excludeFields , param.fieldTitles , res )
} 


if(CMD=='USERLOGOUT') 
{
  return session.userLogout( sessionID , param.reason ); 
} 


if(CMD=='SHOWLOG') 
  {
    return {error:false, errMsg:"", result:utils.logging.buffer.getData() }
  } 


  if(CMD=='MIGRATE') 
    {
     return dbUtils.migrate(dB,fs,path, param );
  }  


if(CMD=='LSFORMS') 
  {
     return dbUtils.fetchRecords_from_Query( etc , "Select FORMNAME from forms order by formName");
  }  

if(CMD=='LOADFORM') 
  {
     return dbUtils.fetchRecord_from_Query( etc , "Select * from forms Where formName='"+param.formName+"'" );
  }  


if(CMD=='SAVEFORM') 
  {
    console.log('SAVEFORM:');
    console.log('========');
    console.log('prüfe die Existenz des Formular "'+param.formName+'"');
    var ID = dbUtils.fetchValue_from_Query( etc , "Select ID from forms Where formName='"+param.formName+"'" ).result;  

    if(!ID)
      {
         console.log('Datensatz existiert nicht -> Neuanlage');
         return dbUtils.insertIntoTable( etc , "forms" , {formName:param.formName, FormData:JSON.stringify(param.formData)});
      }   
       else
       { 
        console.log('Datensatz existiert bereits -> Akualisierung');
        return dbUtils.updateTable(etc , 'forms' , 'ID' , ID , {formName:param.formName, FormData:JSON.stringify(param.formData)} );
       } 

  }  


if(CMD=='DELFORM') 
  {
    return dbUtils.runSQL(etc , "Delete forms where formName='"+param.formName+"'" );
  }  

  
//----------------------------------------------------------------
if(CMD=='ADD_BATCHPROC')  // Befehl an den Batch-Process-Manager weiterleiten   
// Dieser Endpunkt sorgt dafür, dass der in den parametern angegebene Befehl param.batchCmd mit den Parametern param.batchParam in die Warteschlange eingereiht wird... 
// Wenn dieser dann im Rahmen der internen Batch-Verarbeitung an die Reihe kommt, wird dieser Befehl an die "normale" handleCommand()-Prozedur weitergeleitet, so dass
// dieser wie ein "Web-Request" abgearbeitet wird...
// Session, path und fs werden später vom batchProcess-Manager als "enviroment" übergeben und werden hier im Rahmen des Aufrufs von addBatchProc() ermittelt...
{                                           
      batchProcesses.addBatchProc( param.batchCmd , param.batchParam , {sessionID:sessionID , fs:fs , path:path} );
      return {error:false, errMsg:"Prozess erfolgreich in Warteschlange eingereiht...", result:{} }
 }  
    

  if(CMD=='LS_BATCHPROC')  // Befehl an den Batch-Process-Manager weiterleiten    
  {                                           
    return batchProcesses.lsBatchProc()
  } 
  //----------------------------------------------------------------
  //----------------------------------------------------------------
  //----------------------------------------------------------------

  

return  await userAPI.handleCommand( sessionID , cmd , param , req ,  res , fs , path )
                       
}   


