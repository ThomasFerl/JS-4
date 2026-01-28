// const { session } = require("./frontend/tfWebApp/globals");

const sessionTimeOut=60*120;  // 2 Stunden

var sessions       = [];
var etc            = {};
var usr            = null;

const globals      = require('./backendGlobals');
const utils        = require('./nodeUtils');
const dbUtils      = require('./dbUtils');
const grants       = require('./nodeGrants');

module.exports.userLogin=function( etcDB , remoteIP , userName , passwd )
{ 
  console.log("login from (user) :" + userName + " from remote IP: " + remoteIP);

  etc          = etcDB; 
  var response = dbUtils.fetchRecord_from_Query( etc , "select * from user Where username='"+userName+"'" );
   
  if (response.error)
  {
    console.log('ubekannter Benutzer');
    return {error:true, errMsg:"unknwon user", session:{}, grants:[]}
  }

  usr=response.result;
  
  if(passwd!=usr.PASSWD)
  {
    console.log('wrong password');
    return {error:true, errMsg:"wrong password", session:{}, grants:[]}
  }  

  return newSession( usr , remoteIP );

 }


 module.exports.userLogout=function( sessionID , reason )
  { 
     return killSession( sessionID , reason );
  }   
 

module.exports.validSession=function(sessionID)
{
  return findSessionBySessionID( sessionID ) != null;
}


module.exports.getSession=function(sessionID)
{
  return findSessionBySessionID( sessionID );
}


function currentTimestamp()
{
  var d        = new Date();
  return         Math.floor(d.getTime()/1000);
}


function newSession( user , remoteIP )   //  username als String oder user als Objekt sind möglich ...
{
  if(!utils.isJSON(user)) var user = dbUtils.fetchRecord_from_Query( etc , "select * from user Where username='"+user+"'" ).result;
  
  var userID  = user.ID*1;

   // nach letzter Session dieses Useres suchen und dessen sessionsVars laden....
   response = dbUtils.fetchRecord_from_Query( etc, "select * from session where ID_user="+userID+" order by dt_end desc Limit 1");
   console.log('newSession for ' + user.username + "  load last sessionVars:"+JSON.stringify( response) )  
   var lastSessionVars =  null;
   if(!response.error)
     if(response.result) 
     { 
       try   {lastSessionVars = JSON.parse(response.result.vars)}
       catch {}
  }

   if(lastSessionVars) console.log('newSession for ' + user.username + "  load last sessionVars:"+JSON.stringify(lastSessionVars) )  
   else              { console.log('newSession for ' + user.username + "  no sessionVars found" ) ; lastSessionVars = {number:"42"} }

  // neue Session speichern ....
  response = dbUtils.insertIntoTable( etc , "session" , { ID_user:userID,dt_begin:currentTimestamp(),ip:remoteIP } );
  if (response.error) return response;

  var dbID       = response.result.lastInsertRowid; 
  var sessionID  = dbID + '747' + currentTimestamp();

  console.log("new Session : " + sessionID );

 response = grants.getUserGrants( etc , userID );

 console.log('getUserGrants: ' + JSON.stringify(response));

 var g = [];
 if (!response.error) g = response.result;
 
 console.log("GRANTS: " + JSON.stringify(g))

 var s = 
  {
    dbID        :dbID,
    id          :sessionID,
    userID      :userID, 
    userName    :user.username,
    user        :user,
    grants      :g,
    lastActivity:currentTimestamp(),
    sessionVars :lastSessionVars
  }

  if (lastSessionVars) s.sessionVars = lastSessionVars;

  sessions.push( s );

  user.passwd = '*******';

  return {error:false, errMsg:"login ok", session:sessionID , userID:userID , grants:g , user:user }
}


function findSessionNdxBySessionID ( sessionID )
{
  if(globals.ignoreSession) return 0;

  //console.log("findSessionNdxBySessionID(sessionID:"+sessionID+")");
  for(var i=0; i<sessions.length; i++ )
  {
    s = sessions[i];
    //console.log("compare with session["+i+"] : "+s.id)
    if(s.id==sessionID) { return i }
  }

  //console.log(" not found ")
  return -1;
}


function findSessionBySessionID ( sessionID )
{
  if(globals.ignoreSession) return { dbID :0,id :0,userID:'noName',userName:'noName',user:{},grants:[],lastActivity:currentTimestamp,sessionVars:{} };

  var ndx = findSessionNdxBySessionID(sessionID)
  if(ndx<0) return null;
  else      return sessions[ndx]   
}


module.exports.setSessionVar = function( sessionID , varName  , value )
{
  var s = findSessionBySessionID( sessionID );
  console.log("setSessionVar( sessionID: "+sessionID+" , varName: "+varName+"  , value: "+value +" )");
  if(s)
  {
    s.sessionVars[varName] = value;
    console.log('session.vars: ' + JSON.stringify(s.sessionVars) );
    return {error:false , errMsg:"OK" ,  result:s.sessionVars } 
  } 
  else
     {
      console.log('invalid session ');
      return {error:true , errMsg:"invalid session" ,  result:"{}" }  
     } 
}


module.exports.getSessionVar = function( sessionID , varName )
{
  var s = findSessionBySessionID( sessionID );
  console.log("getSessionVar( sessionID: "+sessionID+" , varName: "+varName+" )");
  if(s)
  {
    var v = s.sessionVars;

    if (v.hasOwnProperty(varName)) 
    {
      var value = v[varName];
      console.log('session.vars: ' + varName + " : " + value );
      return {error:false , errMsg:"OK" ,  result:{varname:value} }
    } else return {error:true , errMsg:"'"+varName+"' is not defined" ,  result:{} }    
  } 
  else
     {
      console.log('invalid session ');
      return {error:true , errMsg:"invalid session" ,  result:"" }  
     } 
}


module.exports.deleteSessionVar = function( sessionID , varName )
{
  var s = findSessionBySessionID( sessionID );
  console.log("delete SessionVar ( sessionID: "+sessionID+" , varName: "+varName+" )");
  if(s)
  {
    if (s.sessionVars.hasOwnProperty(varName)) 
    {
      delete( s.sessionVars[varName])
      return {error:false , errMsg:"OK" ,  result:{} }
    } else return {error:true , errMsg:"'"+varName+"' is not defined" ,  result:{} }    
  } 
  else
     {
      console.log('invalid session ');
      return {error:true , errMsg:"invalid session" ,  result:{} }  
     } 
}



module.exports.getSessionVars = function( sessionID )
{
  var s = findSessionBySessionID( sessionID );
  console.log("getSessionVars( sessionID: "+sessionID+" )");
  if(s)
  {
    var v = s.sessionVars;
 
    if (v) 
    {
      return {error:false , errMsg:"OK" ,  result:v }
    } else return {error:true , errMsg:"no variables are defined " ,  result:{} }    
  } 
  else
     {
      console.log('invalid session ');
      return {error:true , errMsg:"invalid session" ,  result:"" }  
     } 
}


module.exports.VAR = function( sessionID , varName )
{
  console.log("VAR("+varName+")");
  var s = findSessionBySessionID( sessionID );
  if(s)
  {
    var v = s.sessionVars;
    console.log("all sessenVars: " + JSON.stringify(v));
    if (v.hasOwnProperty(varName))  return v[varName];
    else                            return null;
  } 
  else return null;
}



function killSession( sessionID , reason )
{
  console.log("killSession( sessionID:"+sessionID+" , reason:" + reason );
  var ndx = findSessionNdxBySessionID( sessionID );
  console.log("killed Index is: " + ndx );
  if(ndx<0) 
  {
    var msg = 'try to kill session with ID:'+sessionID+'  but session ID is invalid'
    console.log(msg);
    return {error:true, errMsg:msg  }
  }

  console.log("..save sessionVars and delete this session")
  var s  = sessions[ndx];
  var d  = new Date();
  var t  = Math.floor(d.getTime()/1000);
  dbUtils.updateTable( etc , "session" , 'id' , s.dbID , {dt_end:t , end_reason:reason , vars:JSON.stringify(s.sessionVars) } );
  sessions.splice(ndx,1);  
  return {error:false, errMsg:"Logged out..."}
        
}



module.exports.keepAlive=function(sessionID)
{
 console.log("keepAlive(sessionID:"+sessionID+")");

 for( var i=0; i<sessions.length; i++)
 {
   var s = sessions[i];
   if(s.id==sessionID) s.lastActivity = currentTimestamp();
 } 
  return {error:false, errMsg:'OK', result:{keep:"alive"} }
}


module.exports.ctrlSession=function()
{
  checkSessionTimeOut();
}


function checkSessionTimeOut()
{
    for( var i=0; i<sessions.length; i++)
    {
       var s    = sessions[i];
       var la   = s.lastActivity;
       var ct   = currentTimestamp();
       var st   = sessionTimeOut;
       var idle = ct-la;
      // console.log("checkSession: idle            : " +idle);
       if(( idle>sessionTimeOut ) &&  (s.lastActivity>0))  { killSession( s.id , 'timout' ); }
    }
}



function ___compare( operator , str1 , str2 )  // str1 = Temperatur    str2 = "Temp*"
{
  var result = false;

  if(operator=="=")  {console.log("___compare " +str1+" equal "+str2);      result = (str1.toUpperCase()==str2.toUpperCase()); }

  if(operator=="!=") {console.log("___compare " +str1+" not equal "+str2); result = (str1.toUpperCase()!=str2.toUpperCase()); }

  if(operator=="~")  {console.log("___compare " +str1+" like "+str2);      result = utils.strCompare( str1.toUpperCase() , str2.toUpperCase() ); }
  
  if(operator=="!~") {console.log("___compare " +str1+" not like "+str2);  result = !utils.strCompare( str1.toUpperCase() , str2.toUpperCase() ); }

  console.log('result:'+result);

  return result;
}



module.exports.checkGrant=function( session , grantName , param )
{
  //console.log('');
  //console.log('checkGrant -> cmd/grantName:' + grantName); 
  //console.log('-----------------------------------------'); 

  
  var result = false;

  for(var i=0; i<session.grants.length; i++)  // durchlaufe alle Grants dieser Session
  {
    g=session.grants[i];
    //console.log('');
    //console.log('');
    //console.log(i+'. grant:'+g.name);

    if(g.name.toUpperCase()==grantName)       // falls Grant in der Liste dann ->TRUE sofern keine grantCondition existiert.....
    {
      if(g.kind=="") result = g.access; 
      else { 
             //console.log('es existiert eine Grant-Condition:'+g.kind+' die gegen params:'+JSON.stringify(param)+' geprüft wird ...' );
             // Reihenfolge beachten da ein IndexOf("=") auch bei != einen Treffer liefert ...
             if(g.kind.indexOf('!=')>-1)
             {
              var items=g.kind.split('!=');
              if (param.hasOwnProperty(items[0])) if(___compare("!=" , param[items[0]] , items[1])) result=g.access;
              //console.log('result '+result);
             }
        
             if(g.kind.indexOf('=')>-1)
             {
               var items=g.kind.split('=');
               if (param.hasOwnProperty(items[0])) if(___compare("=" , param[items[0]] , items[1])) result=g.access;
               //console.log('result '+result);
             } 
             
             if(g.kind.indexOf('!~')>-1)
             {
               var items=g.kind.split('!~');
               if (param.hasOwnProperty(items[0])) if(___compare("!~" , param[items[0]] , items[1])) result=g.access;
               //console.log('result '+result);
             } 

             if(g.kind.indexOf('~')>-1)
             {
              var items=g.kind.split('~');
              if (param.hasOwnProperty(items[0])) if(___compare("~" , param[items[0]] , items[1])) result=g.access;
              //console.log('result '+result);
             } 
            } 

       if(result)  return true;
    }
  }   
  
  return false;

}
