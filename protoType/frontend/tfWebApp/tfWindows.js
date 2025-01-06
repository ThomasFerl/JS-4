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
    super(aParent , 1 , 1 , aWidth , aHeight ,{css        :"cssBaseWindowContainerJ4",
                                               caption    : aCaption, 
                                               position   : position, 
                                               preventGrid: true, 
                                               dragable   : true
                                              }) 
    this.objName = this.constructor.name;                                          

    if(this.parent==document.body)
    {
      // finde max zIndex in rootwindows
        var zIndex = zIndexStart; 
        for(var i=0;i<rootwindows.length;i++) if(rootwindows[i].zIndex>zIndex) zIndex = rootwindows[i].zIndex;
        this.zIndex = zIndex + 1;
        rootwindows.push(this);
    } else this.zIndex = this.parent.zIndex + 1;  
    
  }  

  render()
  {
    super.render();

    this.callBack_onDragStart = ( e )=>{ 
         // Speichere den Abstand zwischen dem Mauszeiger und der oberen linken Ecke des DIVs
            this.dragOffsetX = e.clientX ;
            this.dragOffsetY = e.clientY ;
    }        

    this.callBack_onDragEnd = ( e )=>{ 
         // Setze die neue Position des DIVs
        const dx = e.clientX - this.dragOffsetX;
        const dy = e.clientY - this.dragOffsetY;
        console.log('dragEnd: dx=' +dx+'   dy='+dy);

        if(dx!=0 || dy!=0) 
                          this.leftPx = this.leftPx + dx;
                          this.topPx  = this.topPx + dy;
    }

     
    this.backgroundColor = 'green';

  
    
    this.buildGridLayout_templateColumns('1fr');
    this.buildGridLayout_templateRows('4px 2em 1fr');
   
    this.caption         = new TFPanel( this , 1 , 2 , 1 , 1 , {css:"cssCaptionJ4"} );
    this.caption.buildGridLayout_templateColumns('1fr 2em');
    this.caption.buildGridLayout_templateRows('1fr');
/* 
    this.captionText = new TFLabel( this.caption , 1 , 1 , 1 , 1 , {caption:this.params.caption} );
    this.captionText.textAlign      = 'left';
    this.captionText.paddingLeft    = '4px';
    this.captionText.fontWeight     = 'bold';
    this.captionText.fontSize       = '1em';
    this.captionText.color          = 'white';

    this.hWnd                      = new TFPanel( this , 1 , 1 , '100%' , '100%' , {css:"cssWindowJ4",preventGrid:true} );
*/
  
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