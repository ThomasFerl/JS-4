import * as globals  from "./globals.js";
import * as utils    from "./utils.js";

import {
         TFObject,
         TFLabel, 
         TFPanel  
       }           from "./tfObjects.js"; 

var zIndexStart = 100;
var windows     = [];       

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
   super.render();

   this.__rezising = null;
           
    // finde max zIndex in windows
   var zIndex = zIndexStart; 
   for(var i=0;i<windows.length;i++) if(windows[i].zIndex>zIndex) zIndex = windows[i].zIndex;
   this.zIndex = zIndex + 1;
   windows.push(this);
   

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
         this.leftPx = this.leftPx + dx;
         this.topPx  = this.topPx + dy;
        } 
    }
     
    // keinen Zugridff übwer die Propertuies, weil diese überladen werden, damit diese Eigenschaften für das Fenster
    // und nicht für den Container gelten
    this.DOMelement.style.backgroundColor = 'black';

    utils.buildGridLayout_templateColumns(this,'1fr',{stretch:true});
    utils.buildGridLayout_templateRows(this,'1.7em 1fr',{stretch:true});
       
    this.caption  = new TFPanel( this , 1 , 1 , 1 , 1 , {css:"cssWindowCaptionJ4"} );
    this.caption.buildGridLayout_templateColumns('1fr 2em 2em 2em');
    this.caption.buildGridLayout_templateRows('1fr');
  
    //close button
    this.btnClose = new TFPanel( this.caption , 4 , 1 , 1 , 1 , {css:'cssWindowSysButtonJ4'} );
    this.btnClose.imgURL = './tfWebApp/res/close_icon_red.png'; 
    this.btnClose.callBack_onClick = ()=>{this.destroy();}

     //min button
     this.btnMinimize = new TFPanel( this.caption , 2 , 1 , 1 , 1 , {css:'cssWindowSysButtonJ4'} );
     this.btnMinimize.imgURL = './tfWebApp/res/minimize_icon_gray.png'; 
     this.btnMinimize.callBack_onClick = ()=>{this.minimize();}

      //max button
      this.btnMaximize = new TFPanel( this.caption , 3 , 1 , 1 , 1 , {css:'cssWindowSysButtonJ4'} );
      this.btnMaximize.imgURL = './tfWebApp/res/maximize_icon_gray.png'; 
      this.btnMaximize.callBack_onClick = ()=>{ if(this.__ismaximized) this.normelize();
                                                else this.maximize();}

    this.captionText = new TFLabel( this.caption , 1 , 1 , 1 , 1 , {css:'cssWindowCaptionTextJ4',caption:this.params.caption} );
    this.captionText.textAlign      = 'left';
    
    this.hWnd                       = new TFPanel( this , 1 , 2 , 1 , 1 , {css:"cssWindowJ4"} );
  
  }


  normelize()
  {
    this.__ismaximized = false;
    this.width         = this.__savedWidth;
    this.height        = this.__savedHeight;
    this.left          = this.__savedLeft;
    this.top           = this.__savedTop;
  }

    maximize()
    {
      this.__ismaximized = true;
      this.__savedWidth  = this.width;
      this.__savedHeight = this.height;
      this.__savedLeft   = this.left;
      this.__savedTop    = this.top;
      this.width         = '100%';
      this.height        = '100%';
      this.left          = 0;
      this.top           = 0;
    }

    minimize()
    {
      this.__isminimized = true;
      this.hide();
      this.icon = new TFPanel( this.parent , this.leftPx+'px' , (this.topPx+this.heightPx)+'px' , '100px' , '100px' , {css:"cssWindowIconJ4",dragable:true,preventGrid: true} );
      this.icon.callBack_onClick = ()=>{this.show(); this.icon.destroy();}

      this.icon.callBack_onDragStart = ( e )=>{ 
        // Speichere den Abstand zwischen dem Mauszeiger und der oberen linken Ecke des DIVs
           this.dragOffsetX = e.clientX ;
           this.dragOffsetY = e.clientY ;
   }        

   this.icon.callBack_onDragEnd = ( e )=>{ 
        // Setze die neue Position des DIVs
       const dx = e.clientX - this.dragOffsetX;
       const dy = e.clientY - this.dragOffsetY;
       
       if(dx!=0 || dy!=0) 
       {    
        this.icon.leftPx = this.icon.leftPx + dx;
        this.icon.topPx  = this.icon.topPx + dy;
       } 
   }
    
}


 
  set title( value )
  {
    this.captionText.caption = value;
  }


  get title()
  {
   return this.captionText.caption;
  }

get fontSize()
{
  return  this.hWnd.DOMelement.style.fontSize;
}

set fontSize(value) 
{
    this.hWnd.DOMelement.style.fontSize = value;
}


get fontWeight()  
{
  return  this.hWnd.DOMelement.style.fontWeight;
}

set fontWeight(value)
{
    this.hWnd.DOMelement.style.fontWeight = value;
}


set gap(value)
{
    this.hWnd.DOMelement.style.gap = value;
}

get gap()
{
  return  this.hWnd.DOMelement.style.gap;
}

  buildGridLayout( gridSizeOrTemplate )
  {
    utils.buildGridLayout(  this.hWnd , gridSizeOrTemplate , {stretch:this.params.stretch} );

  }    

 
  buildGridLayout_templateColumns(template)
  {
   utils.buildGridLayout_templateColumns(  this.hWnd , template , {stretch:this.params.stretch}  );
  }  

 
  buildGridLayout_templateRows(template)
  {
   utils.buildGridLayout_templateRows(  this.hWnd , template , {stretch:this.params.stretch}  );
  }  

  buildBlockLayout() 
  {
    utils.buildBlockLayout(  this.hWnd );
  }

  buildFlexBoxLayout() 
  {
   utils.buildFlexBoxLayout(  this.hWnd );
  }
   

   set innerHTML(html)
  {
    this.hWnd.DOMelement.innerHTML = html;
  }

  get innerHTML()
  {
    return  this.hWnd.DOMelement.innerHTML;
  }


  set display(value)
  {
    this.hWnd.DOMelement.style.display = value;  
  }


  get display()
  {
    return  this.hWnd.DOMelement.style.display;  
  }


set placeItems(value)
  {
    this.hWnd.DOMelement.style.placeItems = value;
  }


 get placeItems()
  {
    return  this.hWnd.DOMelement.style.placeItems;
  }

  set justifyContent(value)
  {
    this.hWnd.DOMelement.style.justifyContent = value;  
  }


  get justifyContent()
  {
    return  this.hWnd.DOMelement.style.justifyContent;  
  }


  set alignItems(value)
  {
    this.hWnd.DOMelement.style.alignItems = value;  
  }


  get alignItems()
  {
    return  this.hWnd.DOMelement.style.alignItems;  
  }


  set flexDirection(value)  
  {
    this.hWnd.DOMelement.style.flexDirection = value;
  }
 

  get flexDirection()   
  {
    return  this.hWnd.DOMelement.style.flexDirection;
  }
  

  get overflow()  
  {     
    return  this.hWnd.DOMelement.style.overflow;  
  }

  set overflow(value) 
  {
    this.hWnd.DOMelement.style.overflow = value;
  }


 set backgroundColor(value)
  {
    this.hWnd.DOMelement.style.backgroundColor = value;
  } 

  get backgroundColor()
  {
    var r=undefined;
    r =  this.hWnd.DOMelement.style.backgroundColor;
    return r;
  } 

  set color(value)
  {
    this.hWnd.DOMelement.style.color = value;
  } 

  get color()
  {
    var r=undefined;
    r =  this.hWnd.DOMelement.style.color;
    return r;
  } 

  
  set padding( value ) 
  {
    this.hWnd.DOMelement.style.padding = value;
  }

  get padding()
  {
    return  this.hWnd.DOMelement.style.padding;
  }

  set paddingTop( value )   
  {
    this.hWnd.DOMelement.style.paddingTop = value; 
  }


  get paddingTop()
  {
    return  this.hWnd.DOMelement.style.paddingTop;
  }

  set paddingLeft( value )
  {
    this.hWnd.DOMelement.style.paddingLeft = value;
  }

  get paddingLeft()
  {
    return  this.hWnd.DOMelement.style.paddingLeft;
  }

  set paddingRight( value )
  {
    this.hWnd.DOMelement.style.paddingRight = value;
  }

  get paddingRight()
  {
    return  this.hWnd.DOMelement.style.paddingRight;
  }

  set paddingBottom( value )
  {
    this.hWnd.DOMelement.style.paddingBottom = value;
  }

  get paddingBottom()
  {
    return  this.hWnd.DOMelement.style.paddingBottom;
  }

 
set blur(value)
{
    this.hWnd.DOMelement.style.filter = 'blur('+value+'px)';
}

get blur()
{
  return  this.hWnd.DOMelement.style.filter;
}


set opacity(value)  
{
    this.hWnd.DOMelement.style.opacity = value;
}

get opacity()
{
  return  this.hWnd.DOMelement.style.opacity;
}

  set imgURL( value )
  {
    this.hWnd.DOMelement.style.backgroundImage  = "url('"+value+"')";
    this.hWnd.DOMelement.style.backgroundRepeat = 'no-repeat';
    this.hWnd.DOMelement.style.backgroundSize   = 'cover';  
  }

  get imgURL()
  {// "url("./pix/21_1733947066104.jpeg")"
    var url =  this.hWnd.DOMelement.style.backgroundImage;
        url = url.slice(5);
        url = url.slice(0,-2);
    
    return url;
    
  }

}