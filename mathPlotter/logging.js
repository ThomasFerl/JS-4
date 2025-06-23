const utils          = require('./nodeUtils');
const dbUtils        = require('./dbUtils');
const { TFQueue }    = require('./queue');

class TFLogging 
{ 
   
  constructor() 
  {
    this.topic        = "";
    this.subTopic     = "";
    this.objName      = "";
    this.objID        = "";
    this.loggingID    = "";
    this.loggingStart = 0;
    this.loggingState = "";
    this.buffer       = new TFQueue(10000);
    this.isRecording  = false;
    this.db           = null;
    return this;
  }


  startLogRecording (_dB , _topic, _subTopic, _objName, _objID)
  {
      if(this.isRecording) this.stopLogRecording();

      this.topic        = _topic    || "";
      this.subTopic     = _subTopic || "";
      this.objName      = _objName  || "";
      this.objID        = _objID    || "";
      this.loggingStart = utils.now();
      this.loggingState = "nothing";
      this.db           = _dB;
    
      var response = dbUtils.insertIntoTable_if_not_exist( db , "logging" , {topic:this.topic, subTopic:this.subTopic, objName:this.objName, objID:this.objID, STARTTIME:this.loggingStart, STATE:this.loggingState} )
    
      console.log('startLogRecording: ' + this.topic + ' -> ' + JSON.stringify(response) );
    
      if(!response.error) 
      {
        this.isRecording  = true;
        this.loggingState = "running";
        this.loggingID    = response.result;
      }
      return this;
  }


   stopLogRecording()
   {
    this.isRecording  = false;
    this.loggingState = "done";
    this.loggingID    = "";
    this.loggingStart = 0;
    this.topic        = "";
    this.subTopic     = "";
    this.objName      = "";
    this.objID        = "";
}



   log(s)
   {
     this.buffer.push(s);
     if(utils.debug) console.log(s);  
    // if(this.isRecording) dbUtils.doLogRecord ( logRecording.db , logRecording.loggingID , s ) 
   }  

}

module.exports.TFLogging = TFLogging;
