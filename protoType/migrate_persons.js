
const Database    = require('better-sqlite3');
const fs          = require('fs-extra');
const path        = require('path');

const dbUtils     = require('./dbUtils');
const globals     = require('./dbUtils');

function isJSON(data) 
{
  if (typeof data === "string") return false;
  
  else 
      if (typeof data === "object" && data !== null) return true;
      else return false;
}


function buildURL(  _cmd , _param )
{
  if(isJSON(_param)) _param = JSON.stringify(_param);

  console.log("buildURL(session:"+2411200016012013+" , cmd:"+_cmd+" , param:"+_param+" )");

  var jsnStr   = JSON.stringify( {session:"2411200016012013" , cmd:_cmd , param:_param } );
  var result   = globals.URL_webAppRequest() + encodeURIComponent( jsnStr); 

  console.log("=> "+result);

  return result;
}


function webApiRequest( _cmd , _param  )
{
  var url = buildURL( _cmd , _param )

  const request = new XMLHttpRequest();
  
  request.open('GET', url , false );  // `false` makes the request synchronous
  
  try {request.send(null);} catch(err) {return { error:true, errMsg:err.message , result:{} };}
  
  if (request.readyState == 4 && request.status == 200) 
  { 
    // Try to parse response as JSON 
    try        { var resultJsn = JSON.parse(request.responseText);                 }
    catch      { return { error:false, errMsg:'OK', result:request.responseText }; }

    if(resultJsn.errMsg && (resultJsn.errMsg.toUpperCase()=='INVALID SESSION'))
    {
      console.log("Sitzung abgelaufen - Applikation beendet");
      return {error:true, errMsg:resultJsn.errMsg, result:{} }; 
    }
    
    if (resultJsn.hasOwnProperty('result')) return  resultJsn;
    else                                    return  {error:false, errMsg:'OK', result:resultJsn}; 
    
  }
  else return { error:true, errMsg:'not found', result:{} };
}


console.log("Migrate...");

// 1. Datenquelle
var sourceDB     = '/media/tferl/home/tferl/clipperWebApp/tfclipper.db';
var soureTable   = 'actor';
const db         = new Database( sourceDB  , { readonly: true } );

// 2. Zieldatenbank
var destDB       = '/home/tferl/GIT/JS-4/protoType/workingBase.db';
destTable        = 'persons';
const db2        = new Database( destDB  , { readonly: false } );


// Attachments...
var sourceDir    = '/media/tferl/home/tferl/clipperWebApp/files';
var destDir      = '/home/tferl/GIT/JS-4/protoType/mediaCache/persons'

// Daten ermitteln:
var response = dbUtils.fetchRecords_from_Query( db , 'SELECT * FROM '+soureTable+" Where Name <>'' Order by ID");
if(response.error) {console.log("Fehler: "+response.errMsg); return; }
var dataSet = response.result;

// Web-API-Request - Parameter packen...
var param             = {};
param.tableName       = destTable;
param.idFieldName     = 'ID';
param.checkUpFields   = ['ID','name','VORNAME','GEBURTSJAHR'];     
param.mapping         = {CAPTURE:"PORTRAIT"};

// durch Dataset iterieren
for(var i=0; i<dataSet.length; i++)
{
  var record = dataSet[i];
  console.log("ID: "+record.ID+" , Name: "+record.name+" , Vorname: "+record.VORNAME+" , Bild: "+record.CAPTURE);
  
  // Datenfelder übergeben...
  param.fields = record;
  
  param.fileAttachment = {sourceFile     :path.join(sourceDir, record.CAPTURE),
                          destPath       :destDir,
                          linkedFieldName:'PORTRAIT'};

  
  // Web-API-Request
  // var response = webApiRequest( 'MIGRATE' , param );

// direct:
  console.log(dbUtils.migrate( db2 , fs , path , param ).errMsg);

  }

