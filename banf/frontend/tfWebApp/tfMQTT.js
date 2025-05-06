
import * as globals   from "./globals.js";
import * as utils     from "./utils.js";
import { TFDateTime } from "./utils.js";
import { TFWindow   } from "./tfWindows.js";
import { THTMLTable } from "./tfGrid.js";
import { TFTreeView } from "./tfTreeView.js"; 
import { TFLabel,     
         TFChart,
         TFPanel,
                    } from "./tfObjects.js";



export class TFDistributor
{
  constructor( brokerAddr)
  {
    this.subscribers = [];
    this.lastError   = '';

    this.ws          = new WebSocket(globals.getWebSocketServerURL('4400'));
    this.ws.onopen   = () => { console.log('Verbunden mit WebSocket-Server');};

    this.ws.onmessage = (event) => {
                                     const data = JSON.parse(event.data);
                                     for( var i=0; i<this.subscribers.length; i++ )
                                        {
                                          var subscriber = this.subscribers[i];
                                          if(utils.strMatches( subscriber.topic , data.topic )) subscriber.callBack( data.topic , data.payload );
                                        }
                                   }  
        
    this.ws.onclose = () => {
                              console.log('WebSocket-Verbindung geschlossen');
                            };

    this.ws.onerror = (error) => {
                                   this.lastError = error;
                                   console.error('WebSocket-Fehler:', error);
                                 }
  }  


  addSubscriber( topic , callBack )
  {
    this.subscribers.push( { topic: topic , callBack: callBack } );
  }

  removeSubscriber( topic )
  {
    this.subscribers = this.subscribers.filter( sub => sub.topic != topic );
  } 
}  
 


export class TFMQTTPanelBase extends TFPanel
{
  constructor( parent , x , y , w , h , params )
  {
    super( parent , x , y , w , h , params);

    this.distributor = this.params.distributor;
    this.topic       = this.params.topic;   
    this.value       = this.params.value;
    this.caption     = this.params.caption || '';
    this.appendix    = this.params.appendix || '';
    this.lastMessage = null;

    this.distributor.addSubscriber( this.topic , this.update.bind(this) );
  }   

  
  getCaption() 
  { 
    if(!this.params.caption) return ''
    
    // ist Caption ein Literal ?
    if (this.params.caption.startsWith('"') && this.params.caption.endsWith('"')) return this.params.caption.slice(1, -1); // Entferne die Anführungszeichen
    
    if (this.lastMessage == null) return ''
   
    var captionFieldName = this.params.caption;

    if(this.lastMessage.hasOwnProperty(captionFieldName)) return this.lastMessage[captionFieldName];
    else return ' ';
  }   


  getAppendix() 
  { 
    if(!this.params.appendix) return ''
    
    // ist Appendix ein Literal ?
    if (this.params.appendix.startsWith('"') && this.params.appendix.endsWith('"')) return this.params.appendix.slice(1, -1); // Entferne die Anführungszeichen
    
    if (this.lastMessage == null) return ''
   
    var appendixFieldName = this.params.appendix;

    if(this.lastMessage.hasOwnProperty(appendixFieldName)) return this.lastMessage[appendixFieldName];
    else return ' ';
  }   


  getValue()
  {
    if(!this.params.value) return ''
    
    // ist value ein Literal ?
    if (this.params.value.startsWith('"') && this.params.value.endsWith('"')) return this.params.value.slice(1, -1); // Entferne die Anführungszeichen
    
    if (this.lastMessage == null) return '-'
   
    var valueFieldName = this.params.value;

    if(this.lastMessage.hasOwnProperty(valueFieldName)) return this.lastMessage[valueFieldName];
    else return '-';
  }   





    update( topic , message )
    {
        try { this.lastMessage = JSON.parse(message);}
        catch(e)
                 {
                   console.log('Fehler beim Parsen der MQTT-Nachricht:', e);
                   this.lastMessage = null;
                   return;
                 }  
    }   

       
 
}


export class TFMQTTPanel extends TFMQTTPanelBase
{
  constructor( parent , x , y , w , h , params )
  {
    super( parent , x , y , w , h , params);

    this.padding = 0;


    if( (this.params.caption=='')  &&  (this.params.appendix=='') )
    {
        this.buildGridLayout_templateColumns( '1fr 1px' );
        this.buildGridLayout_templateRows   ( '1px 1fr' );   
    }    

    if( (this.params.caption!='')  &&  (this.params.appendix=='') )
        {
            this.buildGridLayout_templateColumns( '1fr 1px' );
            this.buildGridLayout_templateRows   ( '1.7em 1fr' );   
        }    

    if( (this.params.caption=='')  &&  (this.params.appendix!='') )
        {
            this.buildGridLayout_templateColumns( '1fr 4em' );
            this.buildGridLayout_templateRows   ( '1px 1fr' );   
        }    
        
    if( (this.params.caption!='')  &&  (this.params.appendix!='') )
        {
            this.buildGridLayout_templateColumns( '1fr 4em' );
            this.buildGridLayout_templateRows   ( '1.7em 1fr' );   
        }        

    if( this.caption != '')  
    {
      this.captionPanel           = new TFPanel( this , 1 , 1 , 2 , 1 , {css:'cssWindowCaptionJ4'} );
      this.captionPanel.margin    = '0px';
      this.captionPanel.padding   = '0px';


      if(this.params.captionBackgroundColor) {
                                               this.captionPanel.backgroundColor = this.params.captionBackgroundColor;
                                               this.captionPanel.DOMelement.style.backgroundImage = 'none';
           }   
                                             
      
      this.captionPanel.backgroundColor = this.params.captionBackgroundColor || 'lightgray';

      this.captionLabel = new TFLabel( this.captionPanel , 1 , 1 , '100%' , '100%' , {} );
      this.captionLabel.margin    = '0px';
      this.captionLabel.padding   = '0px';
      this.captionLabel.textAlign = 'left';
      this.captionLabel.fontSize  = '1em';
      this.captionLabel.color     = 'white'; // this.params.captionColor || 'white';
      this.captionLabel.fontWeight= 'bold';
      this.captionLabel.caption   = this.getCaption();
    }
    else  this.captionPanel = null;


    if( this.apendix != '')  
    {
          this.apendixLabel = new TFLabel( this , 2 , 2 , 1 , 1 ,{} );
          this.apendixLabel.textAlign = 'center';
          this.apendixLabel.fontSize  = this.params.fontSize || '1em';
          this.apendixLabel.color     = this.params.valueColor || 'black';
          this.apendixLabel.fontWeight= 'bold';
          this.apendixLabel.caption   = this.getAppendix();
    }
    else  this.apendixLabel = null;

    
    this.valueLabel = new TFLabel( this , 1 , 2 , 1 , 1 , {} );
    this.valueLabel.textAlign = 'center';
    this.valueLabel.fontSize  = this.params.fontSize || '1em';
    this.valueLabel.color     = this.params.valueColor || 'black';
    this.valueLabel.fontWeight= 'bold';
    this.valueLabel.caption   = this.getValue();
    
  }   

  
    update( topic , message )
    {
       super.update( topic , message );

        if( this.captionPanel != null ) this.captionLabel.caption = this.getCaption();
        if( this.apendixLabel != null ) this.apendixLabel.caption = this.getAppendix();
        this.valueLabel.caption = this.getValue();
    }
 
}



export class TFMQTTChart extends TFMQTTPanelBase
{
  constructor( parent , x , y , w , h , params )
  {
    super( parent , x , y , w , h , params);

    this.lfdX    = 0;
    this.padding = 0;

    this.buildGridLayout_templateColumns( '1fr' );

    if( (this.params.caption=='') ) this.buildGridLayout_templateRows   ( '1px 1fr' );   
    else                            this.buildGridLayout_templateRows   ( '1.7em 1fr' );    

    if( this.caption != '')  
    {
      this.captionPanel           = new TFPanel( this , 1 , 1 , 2 , 1 , {css:'cssWindowCaptionJ4'} );
      this.captionPanel.margin    = '0px';
      this.captionPanel.padding   = '0px';
      if(this.params.captionBackgroundColor) {
                                               this.captionPanel.backgroundColor = this.params.captionBackgroundColor;
                                               this.captionPanel.DOMelement.style.backgroundImage = 'none';
                                             }   
                                             
      
      this.captionPanel.backgroundColor = this.params.captionBackgroundColor || 'lightgray';

      this.captionLabel = new TFLabel( this.captionPanel , 1 , 1 , '100%' , '100%' , {} );
      this.captionLabel.margin    = '0px';
      this.captionLabel.padding   = '0px';
      this.captionLabel.textAlign = 'left';
      this.captionLabel.fontSize  = '1em';
      this.captionLabel.color     = 'white'; // this.params.captionColor || 'white';
      this.captionLabel.fontWeight= 'bold';
      this.captionLabel.caption   = this.getCaption();
    }
    else  this.captionPanel = null;

     this.chart = new TFChart( this , 1 , 2 , 1 , 1 , {chartBackgroundColor:'white',chartType:'Spline',maxPoints:50} );
     this.series = this.chart.addSeries('x','green');
} 
                                             

  

    update( topic , message )
    {
       super.update( topic , message );

        if( this.captionPanel != null ) this.captionLabel.caption = this.getCaption();

        this.lfdX++;
        this.chart.addPoint(this.series , {x:this.lfdX, y:this.getValue() } )
    }
 


}

