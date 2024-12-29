import * as globals  from "./globals.js";
import * as utils    from "./utils.js";



function assignMouseEventData( e , obj )
{
  obj.mouse.clientX   = e.clientX;
  obj.mouse.clientY   = e.clientY;
  obj.mouse.pageX     = e.pageX;  
  obj.mouse.pageY     = e.pageY;    
  obj.mouse.offsetX   = e.offsetX;    
  obj.mouse.offsetY   = e.offsetY;  
  obj.mouse.screenX   = e.screenX;
  obj.mouse.screenY   = e.screenY;
  obj.mouse.movementX = e.movementX;
  obj.mouse.movementY = e.movementY;
  obj.mouse.buttons   = e.buttons;
  obj.mouse.ctrlKey   = e.ctrlKey;
  obj.mouse.shiftKey  = e.shiftKey;
  obj.mouse.altKey    = e.altKey;
  obj.mouse.metaKey   = e.metaKey;
}


//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------


export class TFObject
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!parent) { alert("constructor TFObject => parent = null ! "); return; }
       
    if (!params) this.params = {};
    else         this.params = params;

    this.params.left  = left  || 1;
    this.params.top   = top   || 1;
    this.params.width = width || 1;
    this.params.height= height|| 1;
    if(!this.params.stretch) this.params.stretch =true;
    

    this.isTFObject   = true;
    this.objName      = this.constructor.name;  
    this.ID           = this.objName + Date.now()+Math.round(Math.random()*100);
    this.dataBinding  = {};
    this.childList    = [];
    this.DOMelement   = null;
    this.layout       = ()=>{return window.getComputedStyle(this.DOMelement).getPropertyValue("display").toUpperCase()};
    
    this.hasGridLayout= ()=> { return this.layout == 'GRID'; }; 
        
    this.grid         = {left:0, top:0, width:0, height:0};
        
    this.mouse        = { clientX:0 , 
                          clientY:0 , 
                          pageX:0 ,
                          pageY:0 ,
                          offsetX:0 ,
                          offsetY:0 ,
                          screenX:0 , 
                          screenY:0 , 
                          movementX:0 ,
                          movementY:0 ,
                          buttons:0 , 
                          ctrlKey:false , 
                          shiftKey:false , 
                          altKey:false , 
                          metaKey:false 
                      };   

    if(utils.isHTMLElement(parent)) 
    {
        // Wenn das Parent-Objekt ein normales HTML-Element ist, müssen ein paar Kompatibilitätsanpassungen vorgenommen werden,
        // damit der Prozess trotzdem funktioniert...
        // Es wird ein "Minimal-Objekt"als Parent erstellt ...
        this.parent               = {isTFObject:false};  // erstellung eines Minimal-Objektes mit den notw. Properties
        this.parent.objName       = 'HTMLelement';
        this.parent.layout        = ()=>{return window.getComputedStyle(parent).getPropertyValue("display").toUpperCase()};
        this.parent.hasGridLayout = ()=>{ return this.parent.layout == 'GRID'; }; 
        this.parent.DOMelement    = parent;
        this.parentWidth          = parent.clientWidth;
        this.parentHeight         = parent.clientHeight;
        this.parent.appendChild   = function (child) {this.parent.DOMelement.appendChild(child)}.bind(this);
      }
      else {
             this.parent       = parent; 
             this.parentWidth  = parent.DOMelement.clientWidth
             this.parentHeight = parent.DOMelement.clientHeight;
             if(this.parent.childList) this.parent.childList.push(this);
      }  
     
    this.callBack_onKeyDown    = undefined;
    this.callBack_onKeyUp      = undefined;
    this.callBack_onClick      = undefined;
    this.callBack_onDblClick   = undefined;
    this.callBack_onMouseDown  = undefined;
    this.callBack_onMouseUp    = undefined;
    this.callBack_onWheel      = undefined;
    this.callBack_onMouseMove  = undefined;
    this.callBack_onMouseOut   = undefined;
    this.callBack_onContextMenu= undefined;

   this.render();  

  }

  render()
  {
    this.DOMelement = document.createElement('DIV'); 
    this.parent.appendChild( this.DOMelement ); 
     
    if(this.params.css) this.DOMelement.className =  this.params.css;
    else                this.DOMelement.className = "cssObject";
    this.DOMelement.setAttribute('ID'   ,  this.ID );
    this.left   = this.params.left;
    this.top    = this.params.top;
    this.width  = this.params.width;
    this.height = this.params.height;
    this.DOMelement.data =  this;
   
          this.DOMelement.addEventListener('wheel'      , (e)=>{if( this.callBack_onWheel)       this.callBack_onWheel      (e,this.dataBinding) });
          this.DOMelement.addEventListener('click'      , (e)=>{if( this.callBack_onDblClick)    this.callBack_onDblClick   (e,this.dataBinding) });
          this.DOMelement.addEventListener('dblclick'   , (e)=>{if( this.callBack_onClick)       this.callBack_onClick      (e,this.dataBinding) });
          this.DOMelement.addEventListener('mousemove'  , (e)=>{if( this.callBack_onMouseMove)   this.callBack_onMouseMove  (e,this.dataBinding) });
          this.DOMelement.addEventListener('mouseleave' , (e)=>{if( this.callBack_onMouseOut )   this.callBack_onMouseOut   (e,this.dataBinding) });
          this.DOMelement.addEventListener('mousedown'  , (e)=>{if( this.callBack_onMouseDown)   this.callBack_onMouseDown  (e,this.dataBinding) });
          this.DOMelement.addEventListener('mouseup'    , (e)=>{if( this.callBack_onMouseUp  )   this.callBack_onMouseUp    (e,this.dataBinding) });
          this.DOMelement.addEventListener('contextmenu', (e)=>{if( this.callBack_onContextMenu) this.callBack_onContextMenu(e,this.dataBinding) });
          this.DOMelement.addEventListener('keydown'    , (e)=>{if( this.callBack_onKeyDown)     this.callBack_onKeyDown    (e,this.dataBinding) });
          this.DOMelement.addEventListener('keyup'      , (e)=>{if( this.callBack_onKeyUp)       this.callBack_onKeyUp      (e,this.dataBinding) });

  } 



  setParent( aParent )
  {
    if(aParent != this.parent)
    {
      this.parent = aParent;
      this.parent.appendChild( this.DOMelement );
    }  
  } 
  

  set id(value)
  {
    this.ID = value;
    this.DOMelement.setAttribute('ID'   ,  value);
  }

  get id()
  {
    return this.DOMelement.getAttribute('ID');
  }


  set css(value)
  {
    this.DOMelement.className = value;
  }


  get css()
  {
    return this.DOMelement.className;
  }

  set left( value )
  {
      if(this.hasGridLayout) this.gridLeft = value;
      else{
            if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.left = value;
            else              if(this.DOMelement) this.DOMelement.style.left = value+'px';
         }   
  } 

  get left()
  {
    if(this.hasGridLayout) return this.gridLeft;
    else{
         var rect = this.DOMelement.getBoundingClientRect();
         return rect.left;
    } 
  } 

  set top( value )
  {
    if(this.hasGridLayout) this.gridTop = value;
    else{
          if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.top = value;
          else              if(this.DOMelement) this.DOMelement.style.top = value+'px';
       }   
  } 

  get top()
  {
    if(this.hasGridLayout) return this.gridTop;
    else{
         var rect = this.DOMelement.getBoundingClientRect();
         return rect.top;
    } 
  } 


  set width( value )
  {
    if(this.hasGridLayout) this.gridWidth = value;
    else{
         if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.width = value;
         else              if(this.DOMelement) this.DOMelement.style.width = value+'px';
    }  
    
  } 

  get width()
  {
    if(this.hasGridLayout) return this.gridWidth;
    else{
         var rect = this.DOMelement.getBoundingClientRect();
         return rect.width;
    } 
  } 


  set height( value )
  {
    if(this.hasGridLayout) this.gridHeight = value;
    else{
          if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.height = value;
          else              if(this.DOMelement) this.DOMelement.style.height = value+'px';
    }  
    
  } 

  get height()
  {
    if(this.hasGridLayout) return this.gridHeight;
    else{
         var rect = this.DOMelement.getBoundingClientRect();
         return rect.height;
    }
    
  } 
   
//------------------------------------------------------------------------

  set gridLeft( g )
  {
      this.grid.left = parseInt(g, 10);
      this.DOMelement.style.gridColumnStart  = this.grid.left;
      this.DOMelement.style.gridColumnEnd    = this.grid.left +  this.grid.width;
    }           
  
    get gridLeft()
    {
      this.grid.left = parseInt(this.DOMelement.style.gridColumnStart,10); 
      return this.grid.left;
    }           
  
  
    set gridTop( g )
    {
       this.grid.top = parseInt(g, 10);
       this.DOMelement.style.gridRowStart = this.grid.top;  
       this.DOMelement.style.gridRowEnd   = this.grid.top + this.grid.height;
    }           
  
    get gridTop()
    {
      this.grid.top = parseInt(this.DOMelement.style.gridRowStart,10);
      return this.grid.top;
    }           
  
    set gridWidth( g )
    {
       this.grid.width = parseInt(g, 10);
       this.DOMelement.style.gridColumnEnd = this.gridLeft +  this.grid.width;
    }           
  
  
    get gridWidth()
    {
      this.grid.width = parseInt(this.DOMelement.style.gridColumnEnd,10) - parseInt(this.DOMelement.style.gridColumnStart,10);
      return this.grid.width;
    }           
  
  
    set gridHeight( g )
    {
       this.grid.height        = g
       this.DOMelement.style.gridRowEnd = this.gridTop + this.grid.height;
    }           
  
    get gridHeight()
    {
      this.grid.width = this.DOMelement.style.gridRowEnd - this.gridTop;
      return  this.grid.width;
    }     
  
  
get fontSize()
{
  return this.DOMelement.style.fontSize;
}

set fontSize(value) 
{
  this.DOMelement.style.fontSize = value;
}


get fontWeight()  
{
  return this.DOMelement.style.fontWeight;
}

set fontWeight(value)
{
  this.DOMelement.style.fontWeight = value;
}


  buildGridLayout( gridSizeOrTemplate )
  {
    utils.buildGridLayout( this , gridSizeOrTemplate );
  }    

 
  buildGridLayout_templateColumns(template)
  {
   utils.buildGridLayout_templateColumns( this , template );
  }  

 
  buildGridLayout_templateRows(template)
  {
   utils.buildGridLayout_templateRows( this , template );
  }  

  buildBlockLayout() 
  {
    utils.buildBlockLayout( this );
  }

  buildFlexBoxLayout() 
  {
   utils.buildFlexBoxLayout( this );
  }
   

  // der unterschied zwischen hide/show  u. setInvisible/setVisible besteht darin, dass ersteres das Objekt unsichtbar macht und es im Hintergrund noch existiert
  // während setInvisible/setVisible das Objekt aus dem DOM-Baum entfernt und wieder einfügt
  
  hide()
  {
    this.DOMelement.style.visibility = 'hidden';
  }


  setInvisible()
  {
    this.DOMelement.style.display = 'none';   
  }


  show()
  {
    this.DOMelement.style.visibility = 'visible';
  }


  setVisible()
  {
    this.DOMelement.style.display = 'block';  
  }


  set innerHTML(html)
  {
    this.DOMelement.innerHTML = html;
  }

  get innerHTML()
  {
    return this.DOMelement.innerHTML;
  }


  set display(value)
  {
    this.DOMelement.style.display = value;  
  }


  get display()
  {
    return this.DOMelement.style.display;  
  }


set placeItems(value)
  {
    this.DOMelement.style.placeItems = value;
  }


 get placeItems()
  {
    return this.DOMelement.style.placeItems;
  }

  set justifyContent(value)
  {
    this.DOMelement.style.justifyContent = value;  
  }


  get justifyContent()
  {
    return this.DOMelement.style.justifyContent;  
  }


  set alignItems(value)
  {
    this.DOMelement.style.alignItems = value;  
  }


  get alignItems()
  {
    return this.DOMelement.style.alignItems;  
  }


  set flexDirection(value)  
  {
    this.DOMelement.style.flexDirection = value;
  }
 

  get flexDirection()   
  {
    return this.DOMelement.style.flexDirection;
  }
  

  get overflow()  
  {     
    return this.DOMelement.style.overflow;  
  }

  set overflow(value) 
  {
    this.DOMelement.style.overflow = value;
  }


  appendChild(aDOMelement)
  {
    this.DOMelement.appendChild(aDOMelement);
  }

 set backgroundColor(value)
  {
    if(this.DOMelement) this.DOMelement.style.backgroundColor = value;
  } 

  get backgroundColor()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.style.backgroundColor;
    return r;
  } 

  set color(value)
  {
    if(this.DOMelement) this.DOMelement.style.color = value;
  } 

  get color()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.style.color;
    return r;
  } 

  
  set margin( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.margin = value;
  }


  get margin()
  {
    return this.DOMelement.style.margin;
  }


  set marginTop( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.marginTop = value;
  }


  get marginTop()
  {
    return this.DOMelement.style.marginTop;
  }

  set marginLeft( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.marginLeft = value;
  }


  get marginLeft()
  {
    return this.DOMelement.style.marginLeft;
  }


  set marginRight( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.marginRight = value;
  }


  get marginRight()
  {
    return this.DOMelement.style.marginRight;
  }


set marginBottom( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.marginBottom = value;
  }


  get marginBottom()
  {
    return this.DOMelement.style.marginBottom;
  }

  set padding( value ) 
  {
    if(this.DOMelement) this.DOMelement.style.padding = value;
  }

  get padding()
  {
    return this.DOMelement.style.padding;
  }

  set paddingTop( value )   
  {
    if(this.DOMelement) this.DOMelement.style.paddingTop = value; 
  }


  get paddingTop()
  {
    return this.DOMelement.style.paddingTop;
  }

  set paddingLeft( value )
  {
    if(this.DOMelement) this.DOMelement.style.paddingLeft = value;
  }

  get paddingLeft()
  {
    return this.DOMelement.style.paddingLeft;
  }

  set paddingRight( value )
  {
    if(this.DOMelement) this.DOMelement.style.paddingRight = value;
  }

  get paddingRight()
  {
    return this.DOMelement.style.paddingRight;
  }

  set paddingBottom( value )
  {
    if(this.DOMelement) this.DOMelement.style.paddingBottom = value;
  }

  get paddingBottom()
  {
    return this.DOMelement.style.paddingBottom;
  }

  set borderWidth( value )
  {
    if(this.DOMelement) this.DOMelement.style.borderWidth = value;
  }

  get borderWidth()
  {
    return this.DOMelement.style.borderWidth;
  }

  set borderColor( value )
  {
    if(this.DOMelement) this.DOMelement.style.borderColor = value;
  }

  get borderColor()
  {
    return this.DOMelement.style.borderColor;
  }

  set borderRadius(value) 
  {
    if (this.DOMelement) {
        this.DOMelement.style.borderRadius = typeof value === 'string' ? value : value + 'px';
    }
}


  get borderRadius()
  {
    return this.DOMelement.style.borderRadius;
  }


set blur(value)
{
  if(this.DOMelement) this.DOMelement.style.filter = 'blur('+value+'px)';
}

get blur()
{
  return this.DOMelement.style.filter;
}


set opacity(value)  
{
  if(this.DOMelement) this.DOMelement.style.opacity = value;
}

get opacity()
{
  return this.DOMelement.style.opacity;
}





  set shadow(value) 
  {
    this._shadowDepth = value;

    if (value === 0) {
        // Schatten entfernen
        if (this.DOMelement) this.DOMelement.style.boxShadow = '';
    } else {
        // Schatten hinzufügen
        var u = (value * 2) - 1;
        var v = value + 'px ' + value + 'px ' + u + 'px';
        var w = ' rgba(0,0,0,0.7)';
        if (this.DOMelement) this.DOMelement.style.boxShadow = v + w;
    }
}

  get shadow()
  { 
    return this._shadowDepth; 
  }  


  fadeOut(duration)
  {
    const steps    = 100;              // Anzahl der Schritte
    const interval = duration / steps; // Zeit pro Schritt
    let opacity    = 1;  
    let blur       = 0;             

    const fadeInterval = setInterval(() => {
                                             opacity -= 1 / steps; // Reduziere die Transparenz
                                             blur    += 0.2;
                                             if (opacity <= 0) 
                                             {
                                              clearInterval(fadeInterval); // Stoppe den Prozess
                                              opacity = 0; // Sicherheitshalber auf 0 setzen
                                              this.destroy(); // Bild entfernen
                                             } 
                                             this.DOMelement.style.opacity = opacity; 
                                             this.DOMelement.style.filter = 'blur('+Math.round(blur)+'px)';
                                           } , interval );
 }




  set imgURL( value )
  {
    if(this.DOMelement) 
      {
        this.DOMelement.style.backgroundImage  = "url('"+value+"')";
        this.DOMelement.style.backgroundRepeat = 'no-repeat';
        this.DOMelement.style.backgroundSize   = 'cover';
      }
  }

  get imgURL()
  {// "url("./pix/21_1733947066104.jpeg")"
    var url = this.DOMelement.style.backgroundImage;
        url = url.slice(5);
        url = url.slice(0,-2);
    
    return url;
    
  }

  destroy()
  {
    while(this.childList.lenth>0)
    {
      var o=this.childList.pop();
      o.destroy();
      o=null;
    }
    
    if(utils.isHTMLElement(this.parent)) this.parent.removeChild(this.DOMelement);
    else this.parent.DOMelement.removeChild(this.DOMelement); 
    
  }
}   //end class ...


export class TFSlider extends TFObject 
{
  constructor (parent , left , top , width , height , params ) 
  {
    super(parent , left , top , width , height , params );
    
    // this.render() wird von bereits von der TFObjects Basisklasse aufgerufen
    // alles was jetzt passiert passiert NACH "unserem" this.render()
    this.onChange        = null;
    this.display         = 'flex';
    this.alignItems      = 'center';
    this.justifyContent  = 'center'; 
    this.overflow        = 'hidden';
  }  

  render()
  {
    super.render();

    this.slider       = document.createElement('INPUT');
    this.slider.type  = 'range';
    this.slider.min   = 0;
    this.slider.max   = 100;
   
    if(this.params.position !=null) this.value = this.params.position;
    else                            this.value = 50;

    this.slider.step  = 1;
    this.slider.style.width = '90%';
    this.slider.style.height = '90%';
    this.slider.style.backgroundColor = this.backgroundColor;

    //this.slider.addEventListener("input", ()=>{ debugger; if(this.onChange!=null) this.onChange(this.slider.value , this.dataBinding)});
    
     // Eventhandler für Input
     this.slider.addEventListener("input", () => {
      //console.log("Slider changed:", this.slider.value);
      console.log(this);

      if (this.onChange != null) {
        this.onChange(this.slider.value, this.dataBinding);
      }
    });
    
    this.appendChild(this.slider);
  } 
  // Getter und Setter für den Wert des Sliders
  set value( v )
  {
    this.slider.value = v;
  }

  get value()
  {
    return this.slider.value;
  }

 
}


export class TFLabel extends TFObject 
{
  
  constructor (parent , left , top , width , height , params ) 
  {
    params.css = params.css || "cssLabel";
    super(parent , left , top , width , height , params );
    
    // this.render() wird von bereits von der TFObjects Basisklasse aufgerufen
    // alles was jetzt passiert passiert NACH "unserem" this.render()
  }  

  render()
  {
    super.render();

    this.display         = 'grid';
    this.placeItems      = 'center';
    this.overflow        = 'hidden';
    this.padding         = 0;
    this.margin          = 0;
    
    this.paragraph = document.createElement('p');
    this.appendChild(this.paragraph);
    this.caption   = this.params.caption || '' ;
  }  
  
  set caption( value )
  {
    if(this.paragraph) this.paragraph.textContent = value;
  } 

  get caption()
  {
    return this.paragraph.textContent;
  } 

  set textAlign( value )
  {
    
    this.__ta = value;
    if(value.toUpperCase() == 'LEFT')
    {
     this.paragraph.style.textAlign = 'left';
     this.alignItems = 'center';
     this.justifyContent = 'start';
    }

    if(value.toUpperCase() == 'RIGHT')
    {
     this.paragraph.style.textAlign = 'right';
     this.alignItems = 'center';
     this.justifyContent = 'end';
    }

    if(value.toUpperCase() == 'CENTER')
    {
     this.paragraph.style.textAlign = 'center';
     this.alignItems = 'center';
     this.justifyContent = 'center';
    }
} 

get textAlign()
{
  return this.__ta;
} 

}

//---------------------------------------------------------------------------


export class TFPanel extends TFObject 
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!params) params = {css:"cssPanel"};
    else    params.css = params.css || "cssPanel";
  super(parent , left , top , width , height , params );
  }  
} 

//---------------------------------------------------------------------------

