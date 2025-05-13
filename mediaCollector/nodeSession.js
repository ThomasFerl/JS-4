// const { session } = require("./frontend/tfWebApp/globals");

const sessionTimeOut=300;  // 5 Minuten = 300 Sekunden

var sessions = [];


function now()
{
  var dt=new Date();
  return Math.round(dt.valueOf()/1000);  
}

function newSession( sessionID , username )
{
  var s = 
  {
    id          :sessionID, 
    user        :username,
    lastActivity:now(),
    sessionVars :
    {  
      boundDT_from  :0,
      boundDT_to    :0, 
    
      // to be continued ....
      script        :"foo"
    }  
  }

  sessions.push( s );

  return sessions.length;
}


function sessionVar( sessionID , varName )
{
  var s = sessions.find( (session) => session.id == sessionID );

  if(s) 
  {
    if(varName) return s.sessionVars[varName];
    else return s;
  } else return null;
}


function killSession( sessionID )
{
  var s = sessions.find( (session) => session.id.id == sessionID );
  if(s) 
  {
    var ndx = sessions.indexOf(s);
    console.log('kill session with ID:'+sessionID+'  -> ndx:'+ndx);
    if(ndx>=0) sessions.splice(ndx,1);  
  }
}

function checkSessionTimeOut()
{
    for( var i=0; i<sessions.length; i++)
    {
       var s = sessions[i];
       if((now()-s.lastActivity)>sessionTimeOut) { sessions.splice(i,1); return; } 
    }
}
