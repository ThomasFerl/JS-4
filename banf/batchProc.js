const utils       = require('./nodeUtils');

module.exports.TBatchPocess = {cmd:'', param:{}, state:'', result:{}};


class TBatchQueue
{
  constructor( _handlerProc)
  {
     this.log          = [];
     this.queue        = [];
     this.sheduler     = null;   
     this.isRunning    = false;
     this.handlerProc  = _handlerProc;
     this.enviroment   = { sessionID:'' ,  fs:{} , path:{} , req:{} , res:{} };

     console.log('TBatchQueue.constructor.queue -> '+this.queue.length); 
  }


addBatchProc( cmd , param , enviromentParam)
{
  console.log('addBatchProc cmd-> '+cmd+' / param-> '+JSON.stringify(param));
  this.enviroment = enviromentParam;
  this.queue.push( {cmd:cmd, param:param, state:'pending', result:{} } ); 
  if(!this.sheduler) this.start();
}


lsBatchProc()
{
  return {error:false, errMsg:'OK', result:this.queue};
}


count()
{
    var n=0;
    for(var i=0; i<this.queue.length; i++) if(this.queue[i].state!='running') n++;
    return n;
}


async runNextProc() 
{
    if( this.count()==0 ) {  return null; }
    if( this.isRunning  ) {  utils.log('Ein Prozess ist bereist in Bearbeitung.');  return null; }
  
    var newJob     = this.queue[0];
    newJob.state   = 'running';
    this.isRunning = true;

    console.log('runNextProc.newJob -> '+JSON.stringify(newJob));

    if( this.handlerProc ) 
    {
       console.log('callback Handler-Procedure...');
       await this.handlerProc( newJob , this.enviroment );
       console.log('Rückkehr von Handler-Procedure...');
       this.queue.shift();
       this.isRunning = false;
      }   
    return newJob;
}


start()
{
  this.sheduler = setInterval( this.runNextProc.bind(this) , 1000); 
}

}

module.exports.TBatchQueue = TBatchQueue;