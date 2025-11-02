const utils    =  require('./nodeUtils.js');
const edmUtils =  require('./edmUtils.js');


var childProc  = require('child_process');
var { spawn }  = require('child_process');

var axios      = require('axios');
const excelJS  = require('exceljs');
const { error } = require('console');


var backgroundProcess = [];  


class TBackgroudProcess
// Ergänzung um SESSION, damit unterschiedliche Benutzer sich nicht gegenseitig die Prozesse zerschießen ...
{
  constructor( processName , shellCmd , shellParam )
  {
     this.processName = processName;
     this.shellCmd    = shellCmd;
     this.shellParam  = shellParam;
     this.child       = null;

     this.periodic    = {active:false, intervall:60}  // intervall in SEKUNDEN
     
     this.vars        = {};
     this.state       = '';
     this.error       = false;
     this.errMsg      = 'OK';
     this.result      = 'scriptFoo()';
     this.log         = [];
     this.maxLoops    = 0;
     this.loopCnt     = 0;
  }

  __log(st)
  {
    this.log.push(st) 
    utils.log(st);
  }

  function addTask



__runShellCmd() 
  {
    this.result = [];

    this.child  = spawn( this.shellCmd , this.shellParam );

    // Setze Event-Listener
    this.child.stdout.on('data' , this.__handleStdout.bind(this));
    this.child.stderr.on('data' , this.__handleStderr.bind(this));
    this.child.on       ('close', this.__handleClose.bind(this));
    this.child.on       ('error', this.__handleError.bind(this));
 }

__handleStdout(data) 
{
  this.__log(`Child stdout: ${data}`);
  this.result.push(data.toString());
}

__handleStderr(data) 
{
  this.__log(`Child stderr: ${data}`);
  this.error  = true;
  this.errMsg = data.toString();;
  this.state  = 'aborted';
}

__handleClose(code) 
{
  this.__log(`Child process exited with code ${code}`);
  this.state  = 'done';
}

__handleError(err) 
{
  this.__log(`Failed to start child process: ${err}`);
  this.error  = true;
  this.errMsg = err;
  this.state  = 'not started';
}

__killProcess() 
{
  if (this.child) 
  {
    this.child.kill();
    this.__log('Child process killed');
    this.state  = 'killed';
  }
}


  // diese Funktion wird später durch die ECHTE Funktionalität ergänzt....
  run()
  {

  }



  getState()
  {
    return {error:this.error, errMsg:this.errMsg, progress:Math.round(this.loopCnt/this.maxLoops*1000)/10, state:this.state,result:this.result}
  }


  execute()
  {
    if(this.periodic.active) this.__log('starte periodischen Prozess  (Intervall:'+this.periodic.intervall+'[s] )');
    else                     this.__log('starte Prozess');

    this.state = 'running';

    if(this.shellCmd) this.__runShellCmd();
    else{
          try      { this.run();  return this.getState() }
          catch(e) { this.error=true; this.errMsg=e.errMsg; this.state='aborted'; return this.getState() }
        }  
  }
} 

module.exports.TBackgroudProcess = TBackgroudProcess

 //------------------------------------------------------------------------------

module.exports.start = (dB , processName , processParam ) =>
{
   var pName = processName.toUpperCase();

   utils.startLogRecording( dB , "log for " + processName );
  
   if(pName=='TEST')
   {
     var p                = new TBackgroudProcess(processName);
         p.dB             = dB;  // wird hier nicht gebraucht - dient lediglich der Demonstration ....
         p.result         = 0;
         p.maxLoops       = processParam.maxvalue;
         p.loopCnt        = 0;
         p.vars.intervall = processParam.intervall;
         
         backgroundProcess.push( p );
     
     p.run = function ()
             {
              this.vars.timer = setInterval( function()
                                            {
                                              this.loopCntp++;
                                              utils.log('Test-bgProcess : ' + this.loopCntp )  
                                              this.result++; 
                                              if(this.loopCnt > this.maxLoops) 
                                                {clearInterval(this.vars.timer);
                                                 this.state = 'done';
                                                 utils.stopLogRecording();
                                                 utils.log('Test-bgProcess DONE');  
                                                } 
                                            }.bind(this) , this.vars.intervall)
             }.bind(p)


   return p.execute()
  }
    


  
  if(pName=='whatEver') 
  {
    if(edmUtils.BUSY) return { error:true, errMsg:"System is busy !" , result:{} };
    
    var p            = new TBackgroudProcess(processName);
    p.dB             = dB;
    p.result         = [];
    p.loopCnt        = 0;
    p.vars.batchList = {};
    p.maxLoops       = 10;
    backgroundProcess.push( p );
   
    p.run = function ()
            {
              this.vars.timer = setInterval( function() {}.bind(this) , 60000 );
        }.bind(p)

    return p.execute()
  }

}


module.exports.shellExcecute = (processName , shellCmd , execParam)=>
{
   var p = new utils.TBackgroudProcess(processName , shellCmd , execParam );
   backgroundProcess.push( p );
  p.execute();
   return p.getState()
}


module.exports.ls = ()=>
{
  var prcs = [];
  for(var i=0; i<backgroundProcess.length;i++)
  {
    var pi=backgroundProcess[i];
        prcs.push({ndx:i,processName:pi.processName,state:pi.state })
  } 
  
  return {error:false, errMsg:'OK', result:prcs }
}


module.exports.state = (processName)=>
{
   var p = utils.findEntryByField(backgroundProcess,'processName',processName);
  if(p==null) return {error:true, errMsg:'Process "'+processName+'" not found !', result:{} } 
  else        return p.getState() ;
}


module.exports.kill = ( processName ) =>
{
    var p = utils.findEntryByField(backgroundProcess,'processName',processName);
     if(p==null) return {error:true, errMsg:'Process "'+processName+'" not found !', result:{} } 

     var res = p.getState();
               p.__killProcess();  
     
     // Finde den Index des Objekts
    var ndx = backgroundProcess.findIndex( item=>item.processName === processName );
     // Entferne das Objekt, wenn es gefunden wurde
    if (ndx !== -1) { backgroundProcess.splice(ndx, 1); return res; }
    else return {error:true, errMsg:'Process "'+processName+'" not found !', result:{} } 
  }


module.exports.cleanUp = () =>
  {
    backgroundProcess = backgroundProcess.filter(p => p.state === 'running');
    return {error:false, errMsg:'OK', result:{} }
   }
   





