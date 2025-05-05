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

    if(aParent==undefined) aParent = globals.webApp.activeWorkspace;

    position = position.toUpperCase();
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

   this.__rezising             = null;
   this.resizeTargetWidth      = this.width;
   this.resizeTargetHeight     = this.height;
   this.resizeAnimationRunning = false;
   this.callBack_onClose       = null;

           
    // finde max zIndex in windows
   var zIndex = zIndexStart; 
   for(var i=0;i<windows.length;i++) if(windows[i].zIndex>zIndex) zIndex = windows[i].zIndex;
   this.zIndex = zIndex;
   windows.push(this);
   

   this.callBack_onClick = ( e )=>{
         // bringe das Fenster in den Vordergrund
            var zIndex = zIndexStart;
            for(var i=0;i<windows.length;i++) if(windows[i].zIndex>zIndex) zIndex = windows[i].zIndex;
            this.zIndex = zIndex;
  }  
   
    // keinen Zugridff übwer die Propertuies, weil diese überladen werden, damit diese Eigenschaften für das Fenster
    // und nicht für den Container gelten
    this.DOMelement.style.backgroundColor = 'black';

    utils.buildGridLayout_templateColumns(this,'1fr',{stretch:true});
    utils.buildGridLayout_templateRows(this,'1.7em 1fr',{stretch:true});
       
    this.caption  = new TFPanel( this , 1 , 1 , 1 , 1 , {css:"cssWindowCaptionJ4" , dragable:true} );
    this.caption.buildGridLayout_templateColumns('1fr 2em 2em 2em');
    this.caption.buildGridLayout_templateRows('1fr');

    this.caption.DOMelement.addEventListener('mousedown', function(e)
    {
        e.preventDefault();
      
        // Fenster in den Vordergrund bringen
        const maxZ = windows.reduce((z, w) => Math.max(z, w.zIndex), zIndexStart);
        this.zIndex = maxZ + 1;
      
        const offsetX = e.clientX - this.leftPx;
        const offsetY = e.clientY - this.topPx;
      
        const onMouseMove = (e) => {
          this.leftPx = e.clientX - offsetX;
          this.topPx = e.clientY - offsetY;
        };
      
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
      
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }.bind(this));
  

    // scrollen im Header bei gedrückter CTRLtaste .... this.caption.DOMelement.addEventListener()
    this.caption.DOMelement.addEventListener('wheel', function(e)
    {
      if (!e.ctrlKey) return;
  
      e.preventDefault();
      e.stopPropagation();

      const bounds = this.caption.DOMelement.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const zone = x / bounds.width;
  
      const scaleFactor = Math.min(Math.max(Math.abs(e.deltaY) / 100, 1), 5); 
      const grow = (e.deltaY < 0) ? 1 : -1;
      const step = 10 * scaleFactor;

      if (zone < 0.3) {
        // Links: nur Breite
        this.resizeTargetWidth  += grow * step;
      } else if (zone > 0.7) {
        // Rechts: nur Höhe
        this.resizeTargetHeight += grow * step;
      } else {
        // Mitte: beides
        this.resizeTargetWidth  += grow * step;
        this.resizeTargetHeight += grow * step;
      }

      // Grenzen setzen
      if (this.resizeTargetWidth  < 200) this.resizeTargetWidth  = 200;
      if (this.resizeTargetHeight < 200) this.resizeTargetHeight = 200;
  
      // Nur EIN Resize-Loop soll laufen
      if (!this.resizeAnimationRunning) {
          this.resizeAnimationRunning = true;
          this.__animateResize();
      }
  }.bind(this));

    
  
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


// Smooth-Resize Funktion
__animateResize()
{
  const speed             = 0.4; // Sanfte Geschwindigkeit
  const minSize           = 200; // Kleinste erlaubte Größe

  // Differenzen berechnen
  const diffW = this.resizeTargetWidth  - this.width;
  const diffH = this.resizeTargetHeight - this.height;

  // Schrittweise Annäherung
  this.width  += diffW * speed;
  this.height += diffH * speed;

  // Prüfen, ob Ziel erreicht
  if (Math.abs(diffW) > 0.5 || Math.abs(diffH) > 0.5) {
      requestAnimationFrame(() => this.__animateResize());
  } else {
      // Ziel erreicht → Feinjustierung
      this.width  = this.resizeTargetWidth;
      this.height = this.resizeTargetHeight;
     
      this.resizeAnimationRunning = false;

      // Wenn minimale Größe erreicht wurde → Vibrationseffekt
      if (this.width <= minSize || this.height <= minSize) {
          this.__vibrateWindow();
      }
  }
};

// 🌀 Kleine Vibrationsanimation
__vibrateWindow () 
{
  const originalLeft = parseInt(this.DOMelement.style.left || 0);
  const originalTop  = parseInt(this.DOMelement.style.top  || 0);
  const shakePixels  = 3; // Wie stark das Zittern ist
  const shakes       = 7; // Wie oft gezittert wird
  let count = 0;

  const doShake = () => {
      if (count >= shakes) {
          // Wieder auf Ursprungsposition setzen
          this.DOMelement.style.left = originalLeft + "px";
          this.DOMelement.style.top  = originalTop + "px";
          return;
      }

      const offsetX = (Math.random() - 0.5) * shakePixels * 2;
      const offsetY = (Math.random() - 0.5) * shakePixels * 2;
      this.DOMelement.style.left = (originalLeft + offsetX) + "px";
      this.DOMelement.style.top  = (originalTop  + offsetY) + "px";

      count++;
      setTimeout(doShake, 30); // Intervall zwischen Zittern
  };

  doShake();
};



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
  
  close()
  {
    this.destroy();
  }

  destroy()
  {
    if(this.callBack_onClose) this.callBack_onClose();
    
    this.hWnd.destroy();
    this.caption.destroy();
    
     while(this.childList.lenth>0)
     {
        var o=this.childList.pop();
        o.destroy();
        o=null;
      }
      
      if(utils.isHTMLElement(this.parent)) this.parent.removeChild(this.DOMelement);
      else this.parent.DOMelement.removeChild(this.DOMelement); 

      for(var i=0;i<windows.length;i++) if(windows[i]==this) windows.splice(i,1);

      this.DOMelement.remove();
  }
 }
    //end class ...
  
  
  
   
   

