import * as globals  from "./globals.js";
import * as utils    from "./utils.js";
import * as graphics from "./tfGrafics.js";
import * as chartJS  from "./chart.js";


var screen = null;


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

export class TFPopUpMenu 
{
  constructor(menuItems) 
  {
      this.menuItems = menuItems;
      this.popup     = null;
      this.sender    = null;
      this.onClick   = null;
      this.createPopup();
      this.addEventListeners();
  }

  createPopup() 
  {
      // Create popup div
      this.popup = document.createElement('div');
      this.popup.classList.add('popup');

      // Create popup content div
      const popupContent = document.createElement('div');
      popupContent.classList.add('popup-content');

      // Add menu items to the popup
      this.menuItems.forEach(item => {
          const menuItem = document.createElement('div');
          menuItem.classList.add('menu-item');
          menuItem.textContent = item.caption;
          menuItem.addEventListener('mouseup', ()=>{if(this.onClick) this.onClick( this.sender , item )} );
          popupContent.appendChild(menuItem);
      });
      // Append content to popup
      this.popup.appendChild(popupContent);
      document.body.appendChild(this.popup);
  }

  addEventListeners() 
  {
        // Hide popup on mouse up
      document.addEventListener('mouseup', () => {
          this.hide();
      });

      // Prevent popup from closing when clicking inside
      this.popup.addEventListener('mousedown', (event) => {
          event.stopPropagation();
      });
  
  }

  show( sender , x, y) 
  {
      this.sender = sender;
      this.popup.style.display = 'block';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;
  }

  hide() {
      this.popup.style.display = 'none';
  }
}

//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------

export class TAnimation
{
  constructor( canvas , prepare , runOneStep )
  {
    this.runOneStep = runOneStep;
    this.prepare    = prepare;
    this.stop       = false;
    this.canvas     = canvas;
    this.ctx        = this.canvas.getContext('2d');
  }

  run()
  {
    if(this.prepare)
      {
        this.prepare( this.ctx );  
        this.animate();
      }
  }           


  animate()
  {
    // Canvas löschen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if(this.runOneStep) this.runOneStep( this.ctx );
 
    // ggf. Nächsten Frame anfordern
    if(!this.stop) requestAnimationFrame(
                                        ()=>{this.animate();}
                                        );
     
  }






}



export class TFObject
{
  constructor (aParent , left , top , width , height , params ) 
  { 
    if(!aParent) { alert("constructor TFObject => parent = null ! "); return; }

    if(utils.isHTMLElement(aParent)) 
      {
          // Wenn das Parent-Objekt ein normales HTML-Element ist, müssen ein paar Kompatibilitätsanpassungen vorgenommen werden,
          // damit der Prozess trotzdem funktioniert...
          // Es wird ein "Minimal-Objekt"als Parent erstellt ...
          this.parent               = {isTFObject:false};  // erstellung eines Minimal-Objektes mit den notw. Properties
          this.parent.objName       = 'HTMLelement';
          this.parent.layout        = ()=>{return window.getComputedStyle(parent).getPropertyValue("display").toUpperCase()};
  
          this.parent.hasGridLayout = ()=>{ if(this.params.preventGrid) return false; 
                                            else                        return this.parent.layout().toUpperCase() == 'GRID'; }; 
          this.parent.widthPx       = ()=>{ return this.DOMelement.getBoundingClientRect().width; };
          this.parent.heightPx      = ()=>{ return this.DOMelement.getBoundingClientRect().height; };
          this.parent.DOMelement    = aParent;
          this.parentWidth          = aParent.clientWidth;
          this.parentHeight         = aParent.clientHeight;
          this.parent.appendChild   = function (child) {this.parent.DOMelement.appendChild(child)}.bind(this);
        }
        else {
               this.parent       = aParent; 
               this.parentWidth  = parent.clientWidth
               this.parentHeight = parent.clientHeight;
               if(this.parent.childList) this.parent.childList.push(this);
        }  

    // Params aufbereiten / ergänzen 

    if (!params) this.params = {};
    else         this.params = params;

    this.params.left   = left  || 1;
    this.params.top    = top   || 1;
    this.params.width  = width || 1;
    this.params.height = height|| 1;
    if(!this.params.stretch) this.params.stretch =true;

    if(this.params.popupMenu) this.popupMenu = this.params.popupMenu;

    this.isDragable   = false;
    if( this.params.dragable)   this.isDragable   = this.params.dragable;

    this.isDropTarget = false;
    if( this.params.dropTarget) this.isDropTarget   = this.params.dropTarget;  
  
    this.isTFObject   = true;
    this.objName      = this.constructor.name;  
    this.ID           = this.objName + Date.now()+Math.round(Math.random()*100);
    this.dataBinding  = {};
    this.childList    = [];
    this.DOMelement   = null;
    this.layout       = ()=>{return window.getComputedStyle(this.DOMelement).getPropertyValue("display").toUpperCase()};
    
    this.hasGridLayout= ()=> { if(this.params.preventGrid) return false; 
                               else                        return this.parent.layout().toUpperCase() == 'GRID'; 
                             }; 

    this.grid          = {left:1, top:1, width:1, height:1};

    this.mouse         = {clientX:0 , 
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

    this.callBack_onDragStart  = undefined;
    this.callBack_onDragOver   = undefined;
    this.callBack_onDrop       = undefined;   
    this.callBack_onDragEnd    = undefined;


   this.render();  

  }

  render()
  {
    this.DOMelement = document.createElement('DIV'); 
    this.parent.appendChild( this.DOMelement ); 
     
    if(this.params.css) this.DOMelement.className =  this.params.css;
    else                this.DOMelement.className = "cssObject";

    this.DOMelement.style.boxSize = 'border-box';

    this.DOMelement.setAttribute('ID'   ,  this.ID );

    if(this.isDragable) 
    {
      this.DOMelement.setAttribute('draggable', true);
      this.DOMelement.addEventListener('dragstart', (e)=>{
                                                          var d = null;
                                                          if(this.draggingData) d=this.draggingData;
                                                          else if(this.dataBinding) d=this.dataBinding;
                                                          if(d==null) d = '';
                                                          if(utils.isJSON(d)) d = JSON.stringify(d);
                                                          e.dataTransfer.setData('application/json', d );
                                                          if( this.callBack_onDragStart) this.callBack_onDragStart(e);
                                                          });  
      this.DOMelement.addEventListener('dragend',   (e)=>{
                                                            var d = null;
                                                            if(this.draggingData) d=this.draggingData;
                                                            else if(this.dataBinding) d=this.dataBinding;
                                                            if(d==null) d = '';
                                                            if(utils.isJSON(d)) d = JSON.stringify(d);
                                                            e.dataTransfer.setData('application/json', d );
                                                            if( this.callBack_onDragEnd) this.callBack_onDragEnd(e);
                                                            });  

    }
    
    if(this.isDropTarget) 
      {
        this.DOMelement.addEventListener('dragover', (e)=>{ 
                                                            e.preventDefault();
                                                            var d = e.dataTransfer.getData('application/json');
                                                            if(utils.isJSON(d)) d = JSON.parse(d);
                                                            if( this.callBack_onDragOver)  this.callBack_onDragOver (e ,d); 
                                                          });

        this.DOMelement.addEventListener('drop',      (e)=>{ 
                                                            e.preventDefault();
                                                            var d = e.dataTransfer.getData('application/json');
                                                            if(utils.isJSON(d)) d = JSON.parse(d);
                                                            if( this.callBack_onDrop)  this.callBack_onDrop (e ,d); 
         });
    }

    this.left   = this.params.left;
    this.top    = this.params.top;
    this.width  = this.params.width;
    this.height = this.params.height;  
    this.DOMelement.data =  this;   
   
          this.DOMelement.addEventListener('wheel'      , (e)=>{if( this.callBack_onWheel)       this.callBack_onWheel      (e,this.dataBinding) });
          this.DOMelement.addEventListener('click'      , (e)=>{if( this.callBack_onClick)       this.callBack_onClick      (e,this.dataBinding) });
          this.DOMelement.addEventListener('dblclick'   , (e)=>{if( this.callBack_onDblClick)    this.callBack_onDblClick   (e,this.dataBinding) });
          this.DOMelement.addEventListener('mousemove'  , (e)=>{if( this.callBack_onMouseMove)   this.callBack_onMouseMove  (e,this.dataBinding) });
          this.DOMelement.addEventListener('mouseleave' , (e)=>{if( this.callBack_onMouseOut )   this.callBack_onMouseOut   (e,this.dataBinding) });
          
          if(this.popupMenu)
           {  
            this.DOMelement.addEventListener('contextmenu', (e)=>{ if(this.popupMenu) 
                                                                   {
                                                                     e.preventDefault();
                                                                     this.popupMenu.show(this,e.pageX, e.pageY);
                                                                   }
                                                                  });   
          } 
          else this.DOMelement.addEventListener('contextmenu', (e)=>{e.preventDefault();
                                                                     if( this.callBack_onClick) this.callBack_onClick (e,this.dataBinding) 
                                                                    });   
          
                                                               
          this.DOMelement.addEventListener('mousedown'  , (e)=>{if( this.callBack_onMouseDown)   this.callBack_onMouseDown  (e,this.dataBinding) });
          this.DOMelement.addEventListener('mouseup'    , (e)=>{if( this.callBack_onMouseUp  )   this.callBack_onMouseUp    (e,this.dataBinding) });
          this.DOMelement.addEventListener('contextmenu', (e)=>{if( this.callBack_onContextMenu) this.callBack_onContextMenu(e,this.dataBinding) });
          this.DOMelement.addEventListener('keydown'    , (e)=>{if( this.callBack_onKeyDown)     this.callBack_onKeyDown    (e,this.dataBinding) });
          this.DOMelement.addEventListener('keyup'      , (e)=>{if( this.callBack_onKeyUp)       this.callBack_onKeyUp      (e,this.dataBinding) });

  } 

  set id(value)
  {
    this.ID = value;
    this.DOMelement.setAttribute('id'   ,  value);
  }

  get id()
  {
    return this.DOMelement.getAttribute('id');
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
      if(this.hasGridLayout()) this.gridLeft = value;
      else                     this.leftPx = value;
  } 

  get left()
  {
    if(this.hasGridLayout()) return this.gridLeft;
    else                     return this.leftPx;
  } 

  set top( value )
  {
    if(this.hasGridLayout()) this.gridTop = value;
    else                     this.topPx = value;
  } 

  get top()
  {
    if(this.hasGridLayout()) return this.gridTop;
    else                     return this.topPx;
  } 


  set width( value )
  {
    if(this.hasGridLayout()) this.gridWidth = value;
    else this.widthPx = value;
  } 

  get width()
  {
    if(this.hasGridLayout()) return this.gridWidth;
    else                     return this.widthPx;
  } 


  set height( value )
  {
    if(this.hasGridLayout()) this.gridHeight = value;
    else                     this.heightPx = value;
  } 

  get height()
  {
    if(this.hasGridLayout()) return this.gridHeight;
    else                     return this.heightPx;
  } 
   

  set zIndex( value )
  {
    if(this.DOMelement) this.DOMelement.style.zIndex = value;
  }

  get zIndex()
  {
    return this.DOMelement.style.zIndex;
  }


  set leftPx( value )
  {
    var st  = value;
    if(!isNaN(value)) st = st + 'px';
    this.DOMelement.style.left = st;
 } 

  get leftPx()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return Math.round(rect.left);
  } 

  set topPx( value )  
  {
    var st  = value;
    if(!isNaN(value)) st = st + 'px';
    this.DOMelement.style.top = st;
  }

  get topPx()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return  Math.round(rect.top);
  }

  set widthPx( value )
  {
    var st  = value;
    if(!isNaN(value)) st = st + 'px';
    this.DOMelement.style.width = st;
 } 

  get widthPx()
  {
    //var rect = this.DOMelement.getBoundingClientRect();
    //return Math.round(rect.width);
    return this.DOMelement.clientWidth;
  } 


  set heightPx( value )
  {
    var st  = value;
    if(!isNaN(value)) st = st + 'px';
    this.DOMelement.style.height = st;
  } 

  get heightPx()
  {
    //var rect = this.DOMelement.getBoundingClientRect();
    //return  Math.round(rect.height);
    return this.DOMelement.clientHeight;
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
  

    get gridTemplateAreas()
    {
      return this.DOMelement.style.gridTemplateAreas; 
    }

    set gridTemplateAreas( value )
    {
      this.DOMelement.style.gridTemplateAreas = value;
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


set gap(value)
{
  this.DOMelement.style.gap = value;
}

get gap()
{
  return this.DOMelement.style.gap;
}

  buildGridLayout( gridSizeOrTemplate )
  {
    utils.buildGridLayout( this , gridSizeOrTemplate , {stretch:this.params.stretch} );

  }    

 
  buildGridLayout_templateColumns(template)
  {
   utils.buildGridLayout_templateColumns( this , template , {stretch:this.params.stretch}  );
  }  

 
  buildGridLayout_templateRows(template)
  {
   utils.buildGridLayout_templateRows( this , template , {stretch:this.params.stretch}  );
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


  async fadeOut(duration , callBack_when_ready )
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
                                              if(callBack_when_ready) callBack_when_ready();
                                             } 
                                             this.DOMelement.style.opacity = opacity; 
                                             this.DOMelement.style.filter = 'blur('+Math.round(blur)+'px)';
                                           } , interval );
 }



 set imgURL(value) 
 {
  if (value.endsWith('.svg')) 
    {
      this.__svgURL = value;
      // SVG als `<img>` oder Inline-SVG einfügen
      fetch(value)
          .then((response) => { if (!response.ok) throw new Error('SVG konnte nicht geladen werden.');
                                return response.text();
                              }
                            )
          .then((svgContent) => {
                                 // Alte Inhalte entfernen
                                 this.DOMelement.innerHTML = ''; 
              
                                 // SVG-Inhalt direkt einfügen
                                 this.DOMelement.innerHTML = svgContent;
                                 this.DOMelement.style.backgroundImage = ''; // Hintergrund zurücksetzen
                                })
          .catch(error => console.error('Fehler beim Laden der SVG:', error));
  } else {
      // Standard-Fallback für andere Bildtypen
      this.__svgURL = '';
      this.DOMelement.style.backgroundImage = "url('" + value + "')";
      this.DOMelement.style.backgroundPosition = 'center center';
      this.DOMelement.style.backgroundRepeat = 'no-repeat';
      this.DOMelement.style.backgroundSize = 'contain';
  }
}


  get imgURL()
  {
    if (this.__svgURL) return this.__svgURL;
    else 
         {// "url("./pix/21_1733947066104.jpeg")"
           var url = this.DOMelement.style.backgroundImage;
               url = url.slice(5);
               url = url.slice(0,-2);
               return url;
         }      
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
    this.paragraph.className = this.params.css;
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

export class TFImage extends TFObject 
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!params) params = {css:"cssPanel"};
    else    params.css = params.css || "cssPanel";

    super(parent , left , top , width , height , params );
  } 
  
  render()
  { 
    super.render();

    this.imgContainer = new TFPanel(this , 1 , 1 , '100%' , '100%' , { preventGrid:true , css:"cssImageContainer"});
    this.imgContainer.overflow = 'hidden';
 
    if(this.params.imgURL) this.imgContainer.imgURL = this.params.imgURL;
  }  


  set svgContent( value )
  {
    this.__svgContent = value; 
    this.imgContainer.innerHTML = value;
  }    


  get svgContent()
  {
    return this.__svgContent;
  }    

  set imgURL(value) 
  {
    this.__URL = value;

   if (value.endsWith('.svg')) 
     {
       // SVG als `<img>` oder Inline-SVG einfügen
       fetch(value)
           .then((response) => { if (!response.ok) throw new Error('SVG konnte nicht geladen werden.');
                                 return response.text();
                               }
                             )
           .then((svgContent) => { this.svgContent = svgContent; }) 
           .catch(error => console.error('Fehler beim Laden der SVG:', error));
   } else {
       // Standard-Fallback für andere Bildtypen
       this.__svgURL = '';
       this.imgContainer.DOMelement.innerHTML = '<img src="' + value + '" style="width:100%;height:100%;object-fit:contain;">'; 
   }
 }
 
 
   get imgURL()
   {
     return this.__URL;
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


  render()
  {
    super.render();
    this.__canvas = null;

  }

  
  set canvas( value ) 
  {
    this.__canvas = value;
  }

  get canvas()
  {
   if(this.__canvas == null)
   {
    var c = document.createElement("Canvas");
        c.setAttribute('ID' , 'canvas_'+this.ID); 
        //c.style.position = 'relative';  
        //c.style.left     = '0px';
        //c.style.top      = '0px';
        c.width          =  this.widthPx;
        c.height         =  this.heightPx;
        c.style.border   = '1px solid lightgray';
        this.appendChild( c );
        this.__canvas = c;
  }
  return this.__canvas;
 } 


 animation( prepare , runOneStep )
 {
   this.animation = new TAnimation(this.canvas , prepare , runOneStep);
   this.animation.run();
 }

 stopAnimation()
 {
  if(this.animation)  this.animation.stop = true;
 }

 toggleAnimation()
 {
  if(this.animation) 
    {
      this.animation.stop = !this.animation.stop;
      if(!this.animation.stop ) this.animation.animate()
    
    }
 }




} // class

//---------------------------------------------------------------------------

export class TFButton extends TFObject
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!params) params = {css:"cssButton01", caption:"Ok" , stretch:true};
    else    params.css = params.css || "cssButton01";

    params.caption = params.caption || "Ok";  

  super(parent , left , top , width , height , params );
  }


render()
{
   super.render();

   this.margin = 0;
   this.padding = 0;

   this.buttonText           = document.createElement('P');
   this.buttonText.className = "cssButtonText";
   this.appendChild( this.buttonText );
   this.caption = this.params.caption;

   if(this.params.glyph)
    {
      btn.DOMelement.style.display        = 'grid';
      btn.DOMelement.style.placeItems     = 'center';
      btn.DOMelement.style.paddingTop     = '0.4em';
      btn.DOMelement.innerHTML            = '<center><p style="margin:0;padding:0"><i class="'+this.params.glyph+'"></i>'+this.caption+'</p></center>';
    }  

 } 

  set caption( txt )
 {
   this.buttonText.textContent  = txt;
 }

 get caption() 
 {
  return this.buttonText.textContent ; 
 }
}  

//---------------------------------------------------------------------------

export class TFileUploader
{
  constructor ( button , fileTyp , multiple , onChange )
 {
  this.uploader               = document.createElement("input");
  this.uploader.type          = 'file';
  this.uploader.multiple      = multiple;
  this.uploader.accept        = fileTyp;

  if(!onChange) this.onChange = ()=>{console.log('no handler for file upload')};
  else          this.onChange = onChange;

  this.uploader.style.display = 'none';
      button.callBack_onClick = ()=>{console.log('uploader.click()');this.uploader.click()}
      document.body.appendChild(this.uploader);
      
      // Event Listener hinzufügen, um die ausgewählten Dateien zu ggf verarbeiten / vorschauen / ...
      this.uploader.addEventListener('change', function() { this.onChange( this.uploader.files ); }.bind(this) ); 
}


async upload( pathName )
{
  const files = this.uploader.files;
  for (let i = 0; i < files.length; i++) utils.uploadFileToServer(files[i], globals.session.userName+'_' + utils.buildRandomID(1), ()=>{console.log('uploaded ... ' + files[i] )} ) 
}
}

//---------------------------------------------------------------------------

export class TFCheckBox extends TFObject
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!params) params = {css:"cssPanelForInput", caption:"checkBox", checked:false , checkboxLeft:true};
    else    
         {
          params.css          = params.css          || "cssPanelForInput";
          params.caption      = params.caption      || "checkBox";
          params.checked      = params.checked      || false;
          if(params.checkboxLeft == undefined) params.checkboxLeft = true;
         } 
    
    super(parent , left , top , width , height , params );
  }
  

  render()
  {
    super.render();
    
    if(this.params.checkboxLeft) utils.buildGridLayout_templateColumns(this , '2em 1fr');
    else                    utils.buildGridLayout_templateColumns(this , '1fr 2em');
    utils.buildGridLayout_templateRows(this ,'1fr');
   
    if(this.params.checkboxLeft) this.gridTemplateAreas    = ' "checkbox editLabel" ';
    else                         this.gridTemplateAreas    = ' "editLabel checkbox" ';

    this.label             = document.createElement("LABEL");
    this.label.className   = "cssLabelForInput";
    this.label.textContent = this.params.caption;
    this.appendChild( this.label );  
     
    this.input             = document.createElement("INPUT");
    this.input.className   = "cssCheckBox";
    this.input.setAttribute('type' , 'checkbox');
    this.appendChild(  this.input ); 
    
    if(this.callBack_onChange) this.input.onchange = this.callBack_onChange;
    if(this.callBack_onClick)  this.input.onclick  = this.callBack_onClick;
    
  } 

  get checked()
  {
    return this.input.checked;
  }

  set checked( value )  
  {
    this.input.checked = value;
  }

}

//---------------------------------------------------------------------------
export class TFListCheckbox extends TFObject
{
  __render()
  {
    this.innerHTML = '';  

    for(var i=0; i<this.items.length; i++)
      {
        var item            = this.items[i];
        var cbID            = 'lcb'+utils.buildRandomID(i);
        var container       = document.createElement("DIV");
      container.className = "cssPanelForCbListBox";
      this.appendChild(container);
  
      var  input        = document.createElement("INPUT");
      input.className   = "cssCheckBox";
      input.setAttribute('type' , 'checkbox');
      input.id          = cbID; 
      input.checked     = item.checked;
      input.cbItem      = item;   // wechselseitig verknüpfen ...
      item.checkBox     = input;  // wechselseitig verknüpfen ...
  
      input.addEventListener('change', function(event) 
                                       {
                                         var htmlElement = event.target;
                                         if (htmlElement.type === 'checkbox') htmlElement.cbItem.checked = htmlElement.checked
                                       } );
  
      container.appendChild(  input ); 
    
      var  label        = document.createElement("LABEL");
      label.className   = "cssLabelForInput";
      label.htmlFor     = cbID;
      label.textContent = item.text || item.caption;
      
      container.appendChild( label );  
     
    } 
  }
  
  
  render()
  {
    super.render();
    utils.buildBlockLayout( this );

    this.items = [];
    if(this.params.items) this.items = this.params.items;

    this.overflow = 'auto';
    this.backgroundColor = 'gray';
   
    this.__render();
 }

focus( ndx )
{
  if(ndx<0) return;
  if(ndx>=this.items.length) return;
  var item = this.items[ndx];
  item.checkBox.focus();
}

  addItem( item )
  {
    this.items.push(item);
    this.__render();
  }   

  removeItem( item )  
  {
    var ndx = this.items.indexOf(item);
    if(ndx>=0) this.items.splice(ndx,1);
    this.__render();
  }

  addItems( items )
  {
    this.items = items;
    this.__render();
  }


 setCheckBox( ndx , state )
 {
   if (ndx<0) return;

   if(ndx<this.items.length)
   {
    var item                  = this.items[ndx];
        item.checked          = state;
        item.checkBox.checked = state;
   }
 }

 getCheckBox( ndx )
 {
   if (ndx<0) return null;
   
   if(ndx<this.items.length)
   {
    var item    = this.items[ndx];
        return item.checked;
   }
   else return null;
 }


 selectAll()
 {
  for(var i=0; i<this.items.length; i++)
  {
    var item = this.items[i];
        item.checked = true;
        item.checkBox.checked = item.checked;
   } 
 }


 deSelectAll()
 {
  for(var i=0; i<this.items.length; i++)
  {
    var item = this.items[i];
        item.checked = false;
        item.checkBox.checked = item.checked;
   } 
 }

getSelectedItems()
{
  var r = [];
  for(var i=0; i<this.items.length; i++)
  {
    var item = this.items[i];
    if(item.checked) r.push(item);
  } 
  return r; 
}


 invert()
 {
  for(var i=0; i<this.items.length; i++)
  {
    var item = this.items[i];
        item.checked = !item.checked;
        item.checkBox.checked = item.checked;
  } 
} 


toggle( ndx )
{
  if (ndx<0) return;
  if (ndx>=this.items.length) return;

  this.setCheckBox( ndx , !this.getCheckBox(ndx) );
 }

 


findItemByText(text) 
{
  const index = this.items.findIndex(i => i.caption === text);
  if (index >= 0) return { item: this.items[index], index:index }; // Return the item and its index
  return {item:null , index:-1}
}

} //end class

//---------------------------------------------------------------------------
export class TFEdit extends TFObject
{
  constructor (parent , left , top , width , height , params ) 
  {
    if(!params)        params = {};
        params.css            = "cssContainerPanel";
        params.caption        = params.caption        || "";
        params.value          = params.value          || "";
        params.labelPosition  = params.labelPosition  || "LEFT";
        params.appendix       = params.appendix       || "";
        params.captionLength  = (params.captionLength  || params.caption.length)+1;
        params.appendixLength = (params.appendixLength || params.appendix.length)+1;
        params.editLength     = params.editLength     || 4;
        params.type           = params.type           || 'text';
      
    
    super(parent , left , top , width , height , params );
  }
  

  render()
  {
    super.render(); 
    this.padding = 0;
    this.overflow = 'hidden';
    this.fontSize = this.params.fontSize || '1em';
    
    var gridTemplate = {variant:1 , columns:'1fr', rows:'1fr', edit:{left:1,top:1,width:1,height:1} };

  // es existieren folgende Varianten:
  // 1. kein Label, kein Appendix  --> template kann so bleiben
  
  // 2. kein Label, Appendix vorhanden 
  if (this.params.caption == "" &&  this.params.appendix!="" )  
    gridTemplate = {variant:2 , columns:'1fr ' + this.params.appendixLength + 'em', rows:'1fr', edit:{left:1,top:1,width:1,height:1}, apx:{left:2,top:1,width:1,height:1}};
  
  // 3. Label vorhanden, kein Appendix 
  if (this.params.caption != "" &&  this.params.appendix=="" )
  {
    // 3.1 Label left 
    if(this.params.labelPosition.toUpperCase() == "LEFT") 
      gridTemplate = {variant:31 , columns:this.params.captionLength+'em  1fr' , rows:'1fr', caption:{left:1,top:1,width:1,height:1},edit:{left:2,top:1,width:1,height:1}};
     
   // 3.2 Label top
   if(this.params.labelPosition.toUpperCase() == "TOP") 
     gridTemplate = {variant:32 , columns:'1fr' , rows:'1fr 1.2em 2em 1fr', caption:{left:1,top:2,width:1,height:1},edit:{left:1,top:3,width:1,height:1}};
 }

  // 4. Label vorhanden, und Appendix vorhanden
  if (this.params.caption != "" &&  this.params.appendix != "" )
  {
    // 4.1 Label left 
    if(this.params.labelPosition.toUpperCase() == "LEFT") 
      gridTemplate = {variant:41 , columns:this.params.captionLength+'em  1fr ' + this.params.appendixLength + 'em', rows:'1fr', caption:{left:1,top:1,width:1,height:1},edit:{left:2,top:1,width:1,height:1},apx:{left:3,top:1,width:1,height:1}};
     
   // 4.2 Label top
   if(this.params.labelPosition.toUpperCase() == "TOP") 
     gridTemplate = {variant:42 , columns:'1fr '+ this.params.appendixLength+ 'em' , rows:'1fr 1.2em 2em 1fr', caption:{left:1,top:2,width:1,height:1},edit:{left:1,top:3,width:1,height:1},apx:{left:2,top:3,width:1,height:1}};
 }

// nun das Gridlayout aufbauen
utils.buildGridLayout_templateColumns(this , gridTemplate.columns  );
utils.buildGridLayout_templateRows   (this , gridTemplate.rows    );

if(gridTemplate.caption) 
  {
    this.caption  = new TFLabel(this , gridTemplate.caption.left , gridTemplate.caption.top , gridTemplate.caption.width , gridTemplate.caption.height , {caption:this.params.caption  , labelPosition:'LEFT'});
    this.caption.fontWeight = 'bold';
    this.margin             =  0;
    this.caption.marginLeft = '0.5em';
    this.caption.textAlign  = 'LEFT';
    this.caption.alignItems = 'end';
  }  

if(gridTemplate.apx) 
  {
    this.appendix = new TFLabel(this , gridTemplate.apx.left     , gridTemplate.apx.top    , gridTemplate.apx.width      , gridTemplate.apx.height     , {caption:this.params.appendix , labelPosition:'LEFT'});
    this.appendix.textAlign = 'LEFT';
    this.appendix.alignItems = 'end';
    this.appendix.marginLeft = '0.25em';
  }     
    
    // keine Items vorhanden --> normales Inputfeld  
    if(!this.params.items) 
    {
     this.input                   = document.createElement('INPUT');
     this.input.className         = "cssEditField";
     this.input.type              = this.params.type;
     this.combobox                = null; 
    }
    else {
           this.input               = document.createElement('SELECT');
       this.input.className         = "cssComboBox";
       this.combobox                = this.input; 
     } 

     if(this.params.value) this.value = this.params.value;

     this.input.style.gridRowStart     = gridTemplate.edit.top;
     this.input.style.gridRowEnd       = gridTemplate.edit.top+1;
     this.input.style.gridColumnStart  = gridTemplate.edit.left;
     this.input.style.gridColumnEnd    = gridTemplate.edit.left+1;
     this.input.style.margin           = '0.5px';
     if(this.params.editLength) 
      {
       this.input.style.width       = this.params.editLength+'em'; 
       this.input.style.justifySelf = 'end';
      } 
    
    this.input.addEventListener('change',  function() { 
                                                       if(this.callBack_onChange) this.callBack_onChange( this.input.value )
                                                      }.bind(this));  

    this.appendChild(  this.input ); 
  } 
  

  set text( txt )
  {
    this.input.value = txt;
  }

  get text()
  {
    return this.input.value;
  }



  set value( txt )
  {
    this.input.value = txt;
  }

  get value()
  {
    return this.input.value;
  }


  setDateTime( dt )
  {
    var tfDT = null;  
    if (dt.constructor.name.toUpperCase()=='TFDATETIME') tfDT = dt;
    else                                                 tfDT = new utils.TFDateTime(dt);

   var dtStr = '';
   var type  = this.params.type.toUpperCase();
   
   if( type == 'DATE'          ) dtStr = tfDT.formatDateTime('yyyy-mm-dd');
   if( type == 'TIME'          ) dtStr = tfDT.formatDateTime('hh:mn');
   if( type == 'DATETIME-LOCAL') dtStr = tfDT.formatDateTime('yyyy-mm-dd hh:mn');

   if (dtStr != '') this.input.value = dtStr;
 }


  getDateTime()
  {
    var st   = this.input.value;
    var tfdt = new utils.TFDateTime(st);
    return tfdt.unixDateTime();
  }

  set enabled( value )
  {
    this.input.disabled = !value;
  }
  
  get enabled() 
  {
    return !this.input.disabled;
  }
  
}  //end class ...

//---------------------------------------------------------------------------

export class TFComboBox extends TFEdit
{
  constructor (parent , left , top , width , height , params )
  {
    if(!params) params = {};
    if(!params.items) params.items = [];

    super(parent , left , top , width , height , params );
  }



  render()
  {
    this.items = [];
    if(this.params.items) this.items = this.params.items;
    super.render();
    this.combobox = this.input;  // nur aus Gründen der besseren Lesbarkeit / Anwendbarkeit
    this.__render();
    this.combobox.addEventListener('change',  function() { 
      if(this.callBack_onChange)
      {
       var v = this.combobox.value;
       var c = this.items[v];
       this.callBack_onChange( v , c )
      }
     }.bind(this));  

     this.combobox.addEventListener('click',  function() { 
      if(this.callBack_onClick)
      {
       var v = this.combobox.value;
       var c = this.items[v];
       this.callBack_onClick( v , c )
      }
     }.bind(this));  
  }

  __render()
  {
    if(!this.combobox) return;

    this.combobox.innerHTML = '';
    for(var i=0; i<this.items.length; i++)
    {
      var item = this.items[i];
      var option = document.createElement("OPTION");
      option.text  = item.caption || item.text;
      option.value = item.value;
      this.combobox.appendChild(option);
    }
  } 

  set text( txt )
 {
   this.combobox.value = txt;
 }

 get text()
 {
  var ndx = this.combobox.selectedIndex;
  return this.combobox.options[ndx].text;
 }

 setItems( items )
 {
  if(items==null)this.items = [];
  else this.items = items;
  __render();
 } 

getItems()
{
  return this.items;
} 

addItem( caption , value )
{
  // prüfen, ob bereits vorhanden ...
  var ndx = this.items.findIndex( i => i.value == value );  
  if(ndx<0)   
  {
    this.items.push( {caption:caption , value:value} );
    var option = document.createElement("OPTION");
    option.text  = caption;
    option.value = value;
    this.combobox.appendChild(option);
  }
  
}

set itemIndex(ndx) 
{ 
  this.combobox.selectedIndex=ndx; 
}

get itemIndex()    
{ 
  return this.combobox.selectedIndex; 
}


set value( value )  
{
  // ist value in der Items-Liste ?
  var ndx = this.items.findIndex( i => i.value == value );
  if (ndx<0) 
    {
      this.addItem( value , value );
      ndx = this.items.length-1;
    }  

  this.itemIndex = ndx;
}

get value() 
{
  var ndx = this.itemIndex;
  return this.items[ndx].value; 
}


set item( item )  
{
  // ist value in der Items-Liste ?
  var ndx = this.items.indexOf( item );
  if (ndx<0) 
    {
      this.addItem( item.caption , item.value );
      ndx = this.items.length-1;
    }  

  this.itemIndex = ndx;
}

get item() 
{
  var ndx = this.itemIndex;
  return this.items[ndx].value; 
}

}

//---------------------------------------------------------------------------

export class Screen extends TFObject
{
  constructor()
  {
    super(document.body , 0 , 0 , '100%' , '100%' , {css:"cssScreen" , preventGrid:true , fixit:true } );
  }
  
  render()
  {
    super.render();
    this.id = 'SCREEN_' + utils.buildRandomID(1);
    screen = this;
   
  } 
  
  
  setBackgroundImage( path )
  {
    this.imgURL = path;
  }


  set HTML( st ) {this.innerHTML = st;}
  get HTML() { return this.innerHTML;}

}


//---------------------------------------------------------------------------


export class TFWorkSpace extends TFObject
{
  constructor( ID , caption1 , caption2 )  
  {
     // vorsichtshalber ...
     if (screen==null) screen = new Screen() ;
    
    super(screen , 1 , 1 , '100%' , '100%' , {css:"cssWorkSpaceJ4" , preventGrid:true , fixit:true, ID:ID, caption1:caption1, caption2:caption2 } );
    this.self = null;
  }
  
  render()
 {
    this.isWorkspace          = true;
    this.wsID                 = this.params.ID;

    super.render();

    if(this.params.caption1 || this.params.caption2)
    {
      utils.buildGridLayout_templateColumns(this,'1fr', {stretch:true});
      utils.buildGridLayout_templateRows(this,'4em 1fr' , {stretch:true});
      
      //erzeuge Panel für Caption
      this.caption                = new TFPanel(this , 1 , 1 , 1 , 1 , {css:'cssWorkSpaceCaptionJ4'} );
      this.caption.id             = this.wsID +"_caption";
      this.caption.buildGridLayout_templateColumns('1em 1fr 4em');
      this.caption.buildGridLayout_templateRows('1fr 1fr');

       if(this.params.caption1) 
       {  
        var l1 =  new TFLabel(this.caption , 2 , 1 , 1 , 1 , {css:'cssCaption1J4', caption:this.params.caption1 }); 
            l1.textAlign = 'LEFT';  
       }      
           
       if(this.params.caption2) 
       { 
        var l2 = new TFLabel(this.caption , 2 , 2 , 1 , 1 , {css:'cssCaption2J4', caption:this.params.caption2});
            l2.textAlign = 'LEFT';
       }   
          
       this.sysMenu   = new TFPanel(this.caption , 3 , 1 , 1 , 2 , {} ); 
       this.sysMenu.backgroundColor = 'rgba( 255, 255, 255, 0.25)';
       if(globals.session.admin)
       {  
           this.sysMenu.DOMelement.style.color = 'rgb(135, 0, 0)';
           this.sysMenu.DOMelement.innerHTML   = '<center><i class="fa-solid fa-screwdriver-wrench fa-2xl"></i></center>';
       }
       else {
              this.sysMenu.DOMelement.style.color = 'rgb( 77, 77, 77)';
              this.sysMenu.DOMelement.innerHTML   = '<center><i class="fa-solid fa-user fa-2xl"></i></center>';
       }    
           
       this.sysMenu.callBack_onClick       = ( ev )=>{ 
                                                    var htmlElement = ev.target;
                                                    var rect        = htmlElement.getBoundingClientRect();
                                                    var x           = rect.left;
                                                    var y           = rect.top;  
                                                    dialogs.popUpMenu( x , y ) 
                                                   };
                                             
                                                  
    } 
    else 
         {
          this.caption = null;
          utils.buildGridLayout_templateColumns(this,'1fr', {stretch:true});
          utils.buildGridLayout_templateRows(this,'1px 1fr' , {stretch:true});
        } 

    utils.log("Erzeuge Workspace ");
    this.handle                        = new TFPanel(this, 1 , 2 , 1 , 1 , {css:'cssWorkSpaceJ4'});
    this.self                          = this.handle;
    this.handle.id                     = this.wsID +"_dashBoard";
  }
  
 
   
  select()
  {
    /* 
    utils.log("switch Workspace from "+globals.webApp.activeWorkspace.container.id+" to "+this.container.id+")");
      utils.log("Workspace.select( this="+this.container.id+")");
      globals.webApp.activeWorkspace.hide();
      globals.webApp.activeWorkspace = this;
      utils.log("selectWorkspace ... aktivieren von "+this.container.id);
      globals.webApp.activeWorkspace.show()  
   */   
  }


  hide()
  {
    if(this.container.style.display != 'none') this.previousDisplay = this.container.style.display;
    else                                       this.previousDisplay = 'block';

    this.container.style.display = 'none';
  }

  show()
  {
   this.container.style.display = this.previousDisplay; 
  }

  
  get fontSize()
  {
    return this.handle.DOMelement.style.fontSize;
  }
  
  set fontSize(value) 
  {
    this.handle.DOMelement.style.fontSize = value;
  }
  
  
  get fontWeight()  
  {
    return this.handle.DOMelement.style.fontWeight;
  }
  
  set fontWeight(value)
  {
    this.handle.DOMelement.style.fontWeight = value;
  }
  
  
  set gap(value)
  {
    this.handle.DOMelement.style.gap = value;
  }
  
  get gap()
  {
    return this.handle.DOMelement.style.gap;
  }
  
    buildGridLayout( gridSizeOrTemplate )
    {
      utils.buildGridLayout( this.handle , gridSizeOrTemplate , {stretch:this.params.stretch} );
  
    }    
  
   
    buildGridLayout_templateColumns(template)
    {
     utils.buildGridLayout_templateColumns( this.handle , template , {stretch:this.params.stretch}  );
    }  
  
   
    buildGridLayout_templateRows(template)
    {
     utils.buildGridLayout_templateRows( this.handle , template , {stretch:this.params.stretch}  );
    }  
  
    buildBlockLayout() 
    {
      utils.buildBlockLayout( this.handle );
    }
  
    buildFlexBoxLayout() 
    {
     utils.buildFlexBoxLayout( this.handle );
    }
     
  
    set innerHTML(html)
    {
      this.handle.DOMelement.innerHTML = html;
    }
  
    get innerHTML()
    {
      return this.handle.DOMelement.innerHTML;
    }
  
  
    set display(value)
    {
      this.handle.DOMelement.style.display = value;  
    }
  
  
    get display()
    {
      return this.handle.DOMelement.style.display;  
    }
  
  
  set placeItems(value)
    {
      this.handle.DOMelement.style.placeItems = value;
    }
  
  
   get placeItems()
    {
      return this.handle.DOMelement.style.placeItems;
    }
  
    set justifyContent(value)
    {
      this.handle.DOMelement.style.justifyContent = value;  
    }
  
  
    get justifyContent()
    {
      return this.handle.DOMelement.style.justifyContent;  
    }
  
  
    set alignItems(value)
    {
      this.handle.DOMelement.style.alignItems = value;  
    }
  
  
    get alignItems()
    {
      return this.handle.DOMelement.style.alignItems;  
    }
  
  
    set flexDirection(value)  
    {
      this.handle.DOMelement.style.flexDirection = value;
    }
   
  
    get flexDirection()   
    {
      return this.handle.DOMelement.style.flexDirection;
    }
    
  
    get overflow()  
    {     
      return this.handle.DOMelement.style.overflow;  
    }
  
    set overflow(value) 
    {
      this.handle.DOMelement.style.overflow = value;
    }
  
    set backgroundColor(value)
    {
      this.handle.DOMelement.style.backgroundColor = value;
    } 
  
    get backgroundColor()
    {
      return this.handle.DOMelement.style.backgroundColor;
    } 
  
    set color(value)
    {
      this.handle.DOMelement.style.color = value;
    } 
  
    get color()
    {
      return this.handle.DOMelement.style.color;
    } 
  
    
    set margin( value ) 
    {
      this.handle.DOMelement.style.margin = value;
    }
  
  
    get margin()
    {
      return this.handle.DOMelement.style.margin;
    }
  
  
    set marginTop( value ) 
    {
      this.handle.DOMelement.style.marginTop = value;
    }
  
  
    get marginTop()
    {
      return this.handle.DOMelement.style.marginTop;
    }
  
    set marginLeft( value ) 
    {
      this.handle.DOMelement.style.marginLeft = value;
    }
  
  
    get marginLeft()
    {
      return this.handle.DOMelement.style.marginLeft;
    }
  
  
    set marginRight( value ) 
    {
      this.handle.DOMelement.style.marginRight = value;
    }
  
  
    get marginRight()
    {
      return this.handle.DOMelement.style.marginRight;
    }
  
  
  set marginBottom( value ) 
    {
      this.handle.DOMelement.style.marginBottom = value;
    }
  
  
    get marginBottom()
    {
      return this.handle.DOMelement.style.marginBottom;
    }
  
    set padding( value ) 
    {
      this.handle.DOMelement.style.padding = value;
    }
  
    get padding()
    {
      return this.handle.DOMelement.style.padding;
    }
  
    set paddingTop( value )   
    {
      this.handle.DOMelement.style.paddingTop = value; 
    }
  
  
    get paddingTop()
    {
      return this.handle.DOMelement.style.paddingTop;
    }
  
    set paddingLeft( value )
    {
      this.handle.DOMelement.style.paddingLeft = value;
    }
  
    get paddingLeft()
    {
      return this.handle.DOMelement.style.paddingLeft;
    }
  
    set paddingRight( value )
    {
      this.handle.DOMelement.style.paddingRight = value;
    }
  
    get paddingRight()
    {
      return this.handle.DOMelement.style.paddingRight;
    }
  
    set paddingBottom( value )
    {
      this.handle.DOMelement.style.paddingBottom = value;
    }
  
    get paddingBottom()
    {
      return this.handle.DOMelement.style.paddingBottom;
    }
  
    set borderWidth( value )
    {
      this.handle.DOMelement.style.borderWidth = value;
    }
  
    get borderWidth()
    {
      return this.handle.DOMelement.style.borderWidth;
    }
  
    set borderColor( value )
    {
      this.handle.DOMelement.style.borderColor = value;
    }
  
    get borderColor()
    {
      return this.handle.DOMelement.style.borderColor;
    }
  
    set borderRadius(value) 
    {
      this.handle.DOMelement.style.borderRadius = typeof value === 'string' ? value : value + 'px';
    }
  
  
    get borderRadius()
    {
      return this.handle.DOMelement.style.borderRadius;
    }
  
  
  set blur(value)
  {
    this.handle.DOMelement.style.filter = 'blur('+value+'px)';
  }
  
  get blur()
  {
    return this.handle.DOMelement.style.filter;
  }
  
  
  set opacity(value)  
  {
    this.handle.DOMelement.style.opacity = value;
  }
  
  get opacity()
  {
    return this.handle.DOMelement.style.opacity;
  }
  
    set imgURL( value )
    {
      this.handle.DOMelement.style.backgroundImage  = "url('"+value+"')";
      this.handle.DOMelement.style.backgroundPosition = 'center center';
      this.handle.DOMelement.style.backgroundRepeat = 'no-repeat';
      this.handle.DOMelement.style.backgroundSize   = 'contain';
    }
  
    get imgURL()
    {// "url("./pix/21_1733947066104.jpeg")"
      var url = this.handle.DOMelement.style.backgroundImage;
          url = url.slice(5);
          url = url.slice(0,-2);
      
      return url;
      
    }
  
}

//---------------------------------------------------------------------------
export class TFAnalogClock extends TFPanel
{
  render()
  {
    super.render();
    this.padding       = 0; 
    this.overflow      = 'hidden';
    this.ctx           = this.canvas.getContext("2d"); 
    var dimension      = Math.min((this.widthPx , this.heightPx)*0.97);
    this.secHandLength = Math.round( (dimension / 2 ) - 14 );
    this.xm            = Math.round(this.widthPx / 2);
    this.ym            = Math.round(this.heightPx / 2);

    this.__tick();

    setInterval(()=>{this.__tick() }, 1000 );  
  }

  __tick()
    {       if(!this.ctx) return;

            var date   = new Date();

            // CLEAR EVERYTHING ON THE this.canvas. RE-DRAW NEW ELEMENTS EVERY SECOND.
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        

            //OUTER_DIAL1() 
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.xm, this.ym, this.secHandLength + 14, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#92949C';
                this.ctx.stroke();
            
            // OUTER_DIAL2() 
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.xm, this.ym, this.secHandLength + 7, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#929BAC';
                this.ctx.stroke();
                        
            //CENTER_DIAL() 
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.xm, this.ym, 7, 0, Math.PI * 2);
                this.ctx.lineWidth = 3;
                this.ctx.fillStyle = '#353535';
                this.ctx.strokeStyle = '#0C3D4A';
                this.ctx.stroke();
            
            // MARK_THE_HOURS() 
                for (var i = 0; i < 12; i++) 
				        {
                    var angle = (i - 3) * (Math.PI * 2) / 12;       // THE ANGLE TO MARK.
			              this.ctx.lineWidth = 4;            // HAND WIDTH.
                    this.ctx.beginPath();

                    var x1 = (this.xm) + Math.cos(angle) * (this.secHandLength);
                    var y1 = (this.ym) + Math.sin(angle) * (this.secHandLength);
                    var x2 = (this.xm) + Math.cos(angle) * (this.secHandLength - (this.secHandLength / 14));
                    var y2 = (this.ym) + Math.sin(angle) * (this.secHandLength - (this.secHandLength / 14));

                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);

                    this.ctx.strokeStyle = '#466B76';
                    this.ctx.stroke();
                }
            

            // MARK_THE_SECONDS() 
                for (var i = 0; i < 60; i++) 
				{
                    angle = (i - 3) * (Math.PI * 2) / 60;       // THE ANGLE TO MARK.
                    this.ctx.lineWidth = 1;            // HAND WIDTH.
                    this.ctx.beginPath();

                    var x1 = (this.canvas.width / 2) + Math.cos(angle) * (this.secHandLength);
                    var y1 = (this.canvas.height / 2) + Math.sin(angle) * (this.secHandLength);
                    var x2 = (this.canvas.width / 2) + Math.cos(angle) * (this.secHandLength - (this.secHandLength / 30));
                    var y2 = (this.canvas.height / 2) + Math.sin(angle) * (this.secHandLength - (this.secHandLength / 30));

                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);

                    this.ctx.strokeStyle = '#C4D1D5';
                    this.ctx.stroke();
                }
            
            //SHOW_SECONDS() 
                var sec = date.getSeconds();
                angle   = ((Math.PI * 2) * (sec / 60)) - ((Math.PI * 2) / 4);
                this.ctx.lineWidth = 1;              // HAND WIDTH.

                this.ctx.beginPath();
                // START FROM CENTER OF THE CLOCK.
                this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);   
                // DRAW THE LENGTH.
                this.ctx.lineTo((this.canvas.width / 2 + Math.cos(angle) * this.secHandLength),
                    this.canvas.height / 2 + Math.sin(angle) * this.secHandLength);

                // DRAW THE TAIL OF THE SECONDS HAND.
                this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);    // START FROM CENTER.
                // DRAW THE LENGTH.
                this.ctx.lineTo((this.canvas.width / 2 - Math.cos(angle) * 20),
                    this.canvas.height / 2 - Math.sin(angle) * 20);

                this.ctx.strokeStyle = '#586A73';        // COLOR OF THE HAND.
                this.ctx.stroke();
           

            //SHOW_MINUTES() 
                var min = date.getMinutes();
                angle   = ((Math.PI * 2) * (min / 60)) - ((Math.PI * 2) / 4);
                this.ctx.lineWidth = 4;              // HAND WIDTH.

                this.ctx.beginPath();
                this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);  // START FROM CENTER.
                // DRAW THE LENGTH.
                this.ctx.lineTo((this.canvas.width / 2 + Math.cos(angle) * this.secHandLength / 1.1),      
                    this.canvas.height / 2 + Math.sin(angle) * this.secHandLength / 1.1);

                this.ctx.strokeStyle = '#000';  // COLOR OF THE HAND.
                this.ctx.stroke();
            

            //SHOW_HOURS() 
                var hour = date.getHours();
                var min  = date.getMinutes();
                angle = ((Math.PI * 2) * ((hour * 5 + (min / 60) * 5) / 60)) - ((Math.PI * 2) / 4);
                this.ctx.lineWidth = 7;              // HAND WIDTH.

                this.ctx.beginPath();
                this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);     // START FROM CENTER.
                // DRAW THE LENGTH.
                this.ctx.lineTo((this.canvas.width / 2 + Math.cos(angle) * this.secHandLength / 1.5),      
                    this.canvas.height / 2 + Math.sin(angle) * this.secHandLength / 1.5);

                this.ctx.strokeStyle = '#000';   // COLOR OF THE HAND.
                this.ctx.stroke();         
    }

   
}

//---------------------------------------------------------------------------

export class TFChart extends TFPanel
{
  constructor(parent, left, top, width, height, params)
  {
    if (!params) params = {};
    params.chartData               = params.chartData               || [];
    params.chartType               = params.chartType               || 'line';
    params.tension                 = params.tension                 || 0.4;
    params.radius                  = params.radius                  || 3;
    params.showLines               = params.showLines               || true;
    params.chartPointColor         = params.chartPointColor         || 'rgb(147, 147, 147)';
    params.chartBorderColor        = params.chartBorderColor        || 'rgb(2, 10, 70)';
    params.chartBorderWidth        = params.chartBorderWidth        || 1;
    params.chartSelectedColor      = params.chartSelectedColor      || 'rgb(255, 0, 0)';
    params.chartBackgroundColor    = params.chartBackgroundColor    || 'rgb(210, 238, 197)';
    params.gridAreaBackgroundColor = params.gridAreaBackgroundColor || 'rgb(147, 147, 147)';

    super(parent, left, top, width, height, params);
 }  
 

 _convertColor(color) 
 {
  const ctx = this.canvas.getContext('2d');
  ctx.fillStyle = color;
  return ctx.fillStyle;
}
 
 __prepareChart()
 {  
   // Chart type settings
   let _chartType = this.params.chartType;
   let _tension   = this.params.tension;
   let _radius    = this.params.radius;

   this.params.chartPointColor         = this._convertColor(this.params.chartPointColor);
   this.params.chartBorderColor        = this._convertColor(this.params.chartBorderColor);
   this.params.chartSelectedColor      = this._convertColor(this.params.chartSelectedColor);
   this.params.chartBackgroundColor    = this._convertColor(this.params.chartBackgroundColor);

   if (this.params.chartType.toUpperCase().indexOf('LINE') > -1) 
    {
      _chartType = 'line';
      _tension   = 0;
    }

   if (this.params.chartType.toUpperCase().indexOf('SPLINE') > -1) 
     {
       _chartType = 'line';
       _tension   = 0.4;
     }
   
   if (this.params.chartType.toUpperCase().indexOf('SPLINE_NO_POINTS') > -1) 
     {
         _chartType = 'line';
         _tension   = 0.4;
         _radius    = 0;
     }
 
       this.chartOptions.showLines    = this.params.showLines;
       this.chartOptions.elements     = { line: { tension: _tension }, point: { radius: _radius } };
       this.chartOptions.events       = ['mousemove', 'mouseout', 'click', 'touchstart'] ;
       this.chartOptions.interaction  = { mode: 'nearest', axis: 'x', intersect: true };
       this.chartOptions.plugins      = { legend: { display: false } };

       this.chartOptions.onHover = function(event, activeElements) 
                                   {
                                     console.log('onHover-activeElements:', activeElements);
                                     console.log('onHover-even', event);
                                     // Reset all points
                                     this.data.datasets.forEach((dataset) => {
                                                                               console.log('onHover-dataset:', dataset);
                                                                               dataset.backgroundColor = dataset.backgroundColor.map(() => 'rgb(147, 147, 147)');    
                                                                             });
 
                                     // Highlight the current point
                                     if (activeElements.length > 0) 
                                     {
                                       const index        = activeElements[0].index;
                                       const datasetIndex = activeElements[0].datasetIndex;
                                       this.data.datasets[datasetIndex].backgroundColor[index] = 'red';
                                     }
 
                                     this.update();
                                   } ;
 
       this.chartOptions.onClick = function(e) 
                                   {debugger
                                     var c = this.chart;
                                     const clickedPoints = c.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
                                     if (clickedPoints.length > 0) 
                                     {
                                       const clickedPoint = clickedPoints[0];
                                       // Reset all points to original color
                                       c.data.datasets[clickedPoint.datasetIndex].backgroundColor = c.data.datasets[clickedPoint.datasetIndex].backgroundColor.map(() => 'rgb(147, 147, 147)');
                                       // Mark the clicked point
                                       c.data.datasets[clickedPoint.datasetIndex].backgroundColor[clickedPoint.index] = this.self.params.chartSelectedColor;
                                       const label = c.data.labels[clickedPoint.index];
                                       const value = c.data.datasets[clickedPoint.datasetIndex].data[clickedPoint.index];
 
                                       if(this.self.onChartClick) this.self.onChartClick({chart: c, itemIndex: clickedPoint.index, selectedLabel: label, selectedValue: value, hostedObject: hostedObject || {} });
                                       c.update();
                                      }
                                   }.bind({chart:this.chart , self:this});
   
       this.chartParams.type    =  _chartType;
       this.chartParams.options =  this.chartOptions;
       this.chartParams.plugins = [{beforeDraw: function(chart) {
                                                                  const ctx     = chart.ctx;
                                                                  ctx.fillStyle = this.params.gridAreaBackgroundColor || this.backgroundColor;
                                                                  ctx.fillRect(0, 0, chart.width, chart.height);
                                                                }.bind(this)
                                   }];

       this.chartParams.data   = { labels  : [],
                                   datasets: []
                                 }
 }



 render()
 {
   super.render();
   this.chart        = null;
   this.series       = [];
   this.chartParams  = {};
   this.chartOptions = {}
   this.maxPoints    = this.params.maxPoints || -1;

   this.__prepareChart();

  this.ctx   = this.canvas.getContext('2d');
  this.chart = new Chart(this.ctx, this.chartParams); 

  if(this.params.chartData.length > 0) 
    { 
      var s = this.addSeries(this.params.seriesName || '' , this.params.seriesColor || 'black');
      this.addPoint(s , this.params.chartData);
    }  
    
    
 } 


 // Add a new series (dataset) to the chart
 addSeries(seriesName, color) 
 {
   color = this._convertColor(color);
   var newSeries = {
                     label           : seriesName,
                     data            : [],
                     borderColor     : Array.isArray(this.params.chartBorderColor) ? data.map(() => this.params.chartBorderColor) : this.params.chartBorderColor,
                     backgroundColor : Array.isArray(color) ? data.map(() => color) : color,
                     fill            : false
                   };

  this.chart.data.datasets.push(newSeries);
  this.series.push(newSeries);
  this.chart.update();
  return newSeries;
}

// Internal helper to add a single point and handle osci-mode
_addSinglePoint(seriesIndex, point) 
{ 
  console.log('addSinglePoint', seriesIndex, JSON.stringify(point));

  this.chart.data.labels.push(point.x);
  this.chart.data.datasets[seriesIndex].data.push(point.y);

if(this.maxPoints>0)  
  if (this.maxPoints && this.chart.data.labels.length > this.maxPoints) 
  {
      this.chart.data.labels.shift();
      this.chart.data.datasets.forEach(ds => ds.data.shift());
  }
}

addPoint(aSeries, point ) 
{
  if (aSeries) 
  {
      const index = this.chart.data.datasets.indexOf(aSeries);
      if(index < 0 ) return;
       
      if (Array.isArray(point)) point.forEach((p , i) => { this._addSinglePoint(index,p) });
      else this._addSinglePoint(index, point); 
      this.chart.update();
  }   
  else console.error(`missed series`);
}

setTitle(title) 
{
  this.chart.options.plugins = this.chart.options.plugins || {};
  this.chart.options.plugins.title = {
                                       display: true,
                                       text   : title
                                     };
  this.chart.update();
}

setChartType(newType) 
{
  this.chart.config.type = newType;
  this.chart.update();
}



clear(aSeries) 
{
  if(!aSeries) 
  {
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach((dataset) => dataset.data = []);
    this.chart.update();
    this.series = [];
    return;
  }

    const index = this.chart.data.datasets.indexOf(aSeries);
    if (index === -1) return;
    this.chart.data.labels = [];
    this.chart.data.datasets[index].data = [];
    this.chart.update();
    // serie löschen
    this.series.splice(index, 1);
  
 }

}  // TFChart




