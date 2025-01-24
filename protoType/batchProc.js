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
     this.enviroment   = { sessionID:'' ,  fs:{} , path:{} };

     console.log('TBatchQueue.constructor.queue -> '+this.queue.length); 
  }


addBatchProc( cmd , param , enviromentParam)
{
  console.log('addBatchProc cmd-> '+cmd+' / param-> '+JSON.stringify(param));
  this.enviroment = enviromentParam;
  this.queue.push( {cmd:cmd, param:param, state:'pending', result:{} } ); 
}


lsBatchProc()
{
  return {error:false, errMsg:'OK', result:this.queue};
}


count()
{
    var n=0;
    for(var i=0; i<this.queue.length; i++) if(this.queue[i].status!='running') n++;
    return n;
}


async runNextProc() 
{
    utils.log('runNextProc -> '+this.queue);
    console.log('runNextProc -> '+this.queue.length);
    
    if( this.count()==0 ) {  utils.log('keine BatchProc`s in der Queue'); return null; }
    if( this.isRunning  ) {  utils.log('Ein Prozess ist bereist in Bearbeitung.');  return null; }
  
    var newJob     = this.queue[0];
    newJob.status  = 'running';
    this.isRunning = true;

    console.log('runNextProc.newJob -> '+JSON.stringify(newJob));

    if( this.handlerProc ) 
    {
       console.log('callback Handler-Procedure...');
       await this.handlerProc( newJob , this.enviroment );
       console.log('Rückkehr von Handler-Procedure...');
       this.queue.shift();
       this.isRunning = false;
       if(this.queue.length==0) clearInterval(this.sheduler);
    }   
    return newJob;
}


start()
{
  this.sheduler = setInterval( this.runNextProc.bind(this) , 7000); 
}

}

module.exports.TBatchQueue = TBatchQueue;