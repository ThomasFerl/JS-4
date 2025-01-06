import {
         TFObject,
         TFLabel, 
         TFPanel  
       }           from "./tfObjects.js"; 

var zIndexStart = 1000;
var rootwindows = [];       

export class TFWindow extends TFObject 
{ 
   constructor ( aParent , aCaption , aWidth , aHeight , position )
  {
    var L=1;
    var T=1;
    var W=1;
    var H=1;

    aWidth   = aWidth.toString();
    aHeight  = aHeight.toString();

    var parentWidth  = aParent.widthPx;
    var parentHeight = aParent.heightPx; 
   
    if(aWidth.indexOf('%')>-1)   W = parseFloat(aWidth.replace('%','')*parentWidth/100);
    if(aHeight.indexOf('%')>-1)  H = parseFloat(aHeight.replace('%','')*parentHeight/100);

    if(aWidth.indexOf('vw')>-1)  W = parseFloat(aWidth.replace('vw','')*parentWidth/100);
    if(aHeight.indexOf('vh')>-1) H = parseFloat(aHeight.replace('vh','')*parentHeight/100);

    if(aWidth.indexOf('px')>-1)  W = parseFloat(aWidth.replace('px',''));
    if(aHeight.indexOf('px')>-1) H = parseFloat(aHeight.replace('px',''));

    
    if(position==undefined) position = 'CENTER';
    
    if(position=='CENTER')
    {
       L = Math.round((parentWidth - W)/2);    
       T = Math.round((parentHeight - H)/2); 
    }

    
    if(position=='LEFT_TOP')
    {
       L = 0;    
       T = 0; 
    }

    if(position=='RIGHT_TOP')
    {
         L = parentWidth - W;
         T = 0;
    }
    
    if(position=='LEFT_BOTTOM')
    {   
         L = 0;
         T = parentHeight - H;
    }


    if(position=='RIGHT_BOTTOM')
    {
        L = parentWidth - W;
        T = parentHeight - H;
    }    

    super(aParent , L , T , W , H ,{css        :"cssBaseWindowContainerJ4",
                                               caption    : aCaption, 
                                               position   : position, 
                                               preventGrid: true, 
                                               dragable   : true
                                              }) 
    
  }  

  render()
  {
    
    if(this.parent==document.body)
        {
          // finde max zIndex in rootwindows
            var zIndex = zIndexStart; 
            for(var i=0;i<rootwindows.length;i++) if(rootwindows[i].zIndex>zIndex) zIndex = rootwindows[i].zIndex;
            this.zIndex = zIndex + 1;
            rootwindows.push(this);
        } else this.zIndex = this.parent.zIndex + 1;  
        
    debugger;
    super.render();

    this.callBack_onDragStart = ( e )=>{ 
         // Speichere den Abstand zwischen dem Mauszeiger und der oberen linken Ecke des DIVs
            console.log('dragStart: x=' +this.leftPx+'   y='+this.topPx); 
            this.dragOffsetX = e.clientX ;
            this.dragOffsetY = e.clientY ;
    }        

    this.callBack_onDragEnd = ( e )=>{ 
         // Setze die neue Position des DIVs
        const dx = e.clientX - this.dragOffsetX;
        const dy = e.clientY - this.dragOffsetY;
        console.log('dragEnd: dx=' +dx+'   dy='+dy);

        if(dx!=0 || dy!=0) 
        {    
         debugger;
         this.leftPx = this.leftPx + dx;
         this.topPx  = this.topPx + dy;
        } 
    }
     
    this.backgroundColor = 'black';
    
    this.buildGridLayout_templateColumns('1fr');
    this.buildGridLayout_templateRows('2em 1fr');
   
    this.caption         = new TFPanel( this , 1 , 1 , 1 , 1 , {css:"cssWindowCaptionJ4"} );
    this.caption.buildGridLayout_templateColumns('1fr 2em');
    this.caption.buildGridLayout_templateRows('1fr');

    this.captionText = new TFLabel( this.caption , 1 , 1 , 1 , 1 , {css:'cssWindowCaptionTextJ4',caption:this.params.caption} );
    this.captionText.textAlign      = 'left';
    
    this.hWnd                      = new TFPanel( this , 1 , 2 , 1 , 1 , {css:"cssWindowJ4"} );

  
  }

 
  set title( value )
  {
    this.captionText.caption = value;
  }


  get title()
  {
   return this.captionText.caption;
  }


}