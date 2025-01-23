
//import * as mqtt      from './mqtt.min.js';
//import * as mqtt from 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js';

import * as globals   from "./globals.js";
import * as utils     from "./utils.js";
import { TFDateTime } from "./utils.js";
import { TFWindow   } from "./tfWindows.js";
import { THTMLTable } from "./tfGrid.js";
import { TFTreeView } from "./tfTreeView.js"; 

import { TFLabel,     
         TFPanel,
                    } from "./tfObjects.js";



export class TFDistributor
{
  constructor( brokerAddr)
  {
    this.subscribers = [];
    this.mqttClient  = null;
    this.brokerAddr  = brokerAddr;
    this.log         = [];
    this.errorLog    = [];
    this.error       = false;
    
  }


  addSubscriber( topic , callBack )
  {
    this.subscribers.push( { topic: topic , callBack: callBack } );
  }

  removeSubscriber( topic )
  {
    this.subscribers = this.subscribers.filter( sub => sub.topic != topic );
  } 
  
  
  start()
  {
    this.mqttClient = mqtt.connect( this.brokerAddr );

    this.mqttClient.on('connect', ()               => { this.error = false; this.log.push('Connected to broker: ' + this.brokerAddr);
                                                        this.mqttClient.subscribe('#' , (err)=>{} )   } );

    this.mqttClient.on('message', (topic, message) => { this.distribute( topic , message ) });
    this.mqttClient.on('error'  , (err)            => { this.errorLog.push(err); });
  }

    stop()
    {
        if( this.mqttClient ) this.mqttClient.end();
        this.mqttClient = null;
    }


  distribute( topic , message )
  {
    for( var i=0; i<this.subscribers.length; i++ )
    {
      var t = this.subscribers[i].topic;    

      if( t.includes('*') )
        {
            var re = new RegExp( t.replace('*','.*') );
            if( re.test(topic) ) this.subscribers[i].callBack( topic , message );
        }    
        else
        {
          if( t == topic )  this.subscribers[i].callBack( topic , message );
        }  
    }
  }



}

export class TFMQTTlabel extends TFLabel
{
  render()                   
  {
    super.render();
    this.distributor = this.params.distributor;
    this.distributor.addSubscriber( this.params.topic , this.onMQTTmssage.bind(this) );
  }

   onMQTTmssage( topic , message )
   {
        this.caption = message.toString();
        this.render();
   }   

}

