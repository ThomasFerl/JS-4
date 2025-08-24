import * as globals  from "./globals.js";
import * as utils    from "./utils.js";
import * as graphics from "./tfGrafics.js";
import * as chartJS  from "./chart.js";

import { TFWindow   } from "./tfWindows.js"; 
import { TFTreeView  }from "./tfTreeView.js"; 
import { THTMLTable } from "./tfGrid.js";
import { addButton, addLabel, addPanel, createWindow } from "./tfDialogs.js";

const fontList = [
  "Arial", "Verdana", "Helvetica", "Tahoma", "Trebuchet MS",
  "Times New Roman", "Georgia", "Garamond", "Courier New", "Lucida Console",
  "Comic Sans MS", "Impact", "Segoe UI", "Calibri", "Cambria",
  "Fira Code", "Roboto", "Open Sans", "Lato", "Monaco"
];

let objCounter = {};
function countObj( objName )
{
  if(!objCounter[objName]) objCounter[objName] = 0;
  objCounter[objName]++;
  return objName + objCounter[objName];
}

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



export class TFMenu 
{
  constructor(menuItems) 
  {
    this.menuItems               = menuItems;
    this.menu                    = document.createElement('div');
    this.menu.style.position     = 'absolute';
    this.menu.style.background   = '#fff';
    this.menu.style.border       = '1px solid #ccc';
    this.menu.style.borderRadius = '6px';
    this.menu.style.boxShadow    = '0 4px 8px rgba(0,0,0,0.2)';
    this.menu.style.padding      = '5px 0';
    this.menu.style.zIndex       = 9999;
    this.menu.style.display      = 'none';
    this.menu.style.minWidth     = '150px';
    this.menu.style.fontFamily   = 'sans-serif';

    this.buildMenuItems();
    document.body.appendChild(this.menu);
  }

  buildMenuItems() 
  {
    this.menu.innerHTML = '';
    this.menuItems.forEach(item => 
      {
        const entry         = document.createElement('div');
        entry.textContent   = item.caption;
        entry.style.padding = '8px 16px';
        entry.style.cursor  = 'pointer';

        entry.addEventListener('click', function(e) {
                                                       e.stopPropagation();
                                                       this.hide();
                                                       item.action();
                                                 }.bind(this));

        entry.addEventListener('mouseover', () => { entry.style.background = '#f0f0f0'; });
        entry.addEventListener('mouseout',  () => { entry.style.background = 'transparent';});

        this.menu.appendChild(entry);
    });
  }



  run(event) {
    event.preventDefault();
  
    // Menü sichtbar machen
    this.menu.style.display = 'block';
    this.menu.style.left = '0px';
    this.menu.style.top = '0px';
  
    const menuRect = this.menu.getBoundingClientRect();
    const pageWidth = document.documentElement.clientWidth;
    const pageHeight = document.documentElement.clientHeight;
  
    let x = event.pageX;
    let y = event.pageY;
  
    if ((x + menuRect.width) > pageWidth) {
      x = pageWidth - menuRect.width - 5;
    }
  
    if ((y + menuRect.height) > pageHeight) {
      y = pageHeight - menuRect.height - 5;
    }
  
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
  
    // Bestehenden Schließ-Handler entfernen (falls mehrfach geöffnet)
    if (this._closeHandler) {
      document.removeEventListener('click', this._closeHandler);
      this._closeHandler = null;
    }
  
    // Klick außerhalb schließt das Menü
    this._closeHandler = (e) => {
      if (!this.menu.contains(e.target)) {
        this.hide();
        document.removeEventListener('click', this._closeHandler);
        this._closeHandler = null;
      }
    };
  
    setTimeout(() => document.addEventListener('click', this._closeHandler), 0);
  }
  

  hide() 
  {
    this.menu.style.display = 'none';
  }

  destroy() 
  {
    this.menu.remove();
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
      {   // Wenn das Parent-Objekt ein normales HTML-Element ist, müssen ein paar Kompatibilitätsanpassungen vorgenommen werden,
          // damit der Prozess trotzdem funktioniert...
          // Es wird ein "Minimal-Objekt"als Parent erstellt ...
          this.parent               = {isTFObject:false};  // erstellung eines Minimal-Objektes mit den notw. Properties
          this.parent.name          = 'HTMLelement';
          this.parent.objName       = 'HTMLelement';
          this.parent.layout        = function(){return window.getComputedStyle(this.parent.DOMelement).getPropertyValue("display").toUpperCase()}.bind(this);
  
          this.parent.hasGridLayout = function(){ if(this.params.preventGrid) return false; 
                                                  else                        return this.parent.layout().toUpperCase() == 'GRID';  
                                                }.bind(this);

          this.parent.widthPx       = function(){ return this.DOMelement.getBoundingClientRect().width; }.bind(this);
          this.parent.heightPx      = function(){ return this.DOMelement.getBoundingClientRect().height; }.bind(this);
          this.parent.DOMelement    = aParent;
          this.parentWidth          = aParent.clientWidth;
          this.parentHeight         = aParent.clientHeight;
          this.parent.appendChild   = function (child) {this.parent.DOMelement.appendChild(child)}.bind(this);
        }
        else {
               this.parent       = aParent; 
               this.parentWidth  = parent.clientWidth
               this.parentHeight = parent.clientHeight;
               if(!params.dontRegister)
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
    
    if(this.isDragable) {this.draggingData = this.params.draggingData || null;}

    this.isDropTarget = false;
    if( this.params.dropTarget) this.isDropTarget   = this.params.dropTarget;  
  
    this.isTFObject   = true;
    this.objName      = this.constructor.name;  
    this.name         = countObj(this.objName);
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
    this.callBack_onDragging   = undefined;
    this.callBack_onDragOver   = undefined;
    this.callBack_onDrop       = undefined;   
    this.callBack_onDragEnd    = undefined;


   this.render();  

  }

  render()
  {
    this.DOMelement = document.createElement('DIV'); 
    this.DOMelement.setAttribute("tabindex", "0");  // wichtig um Keybourd-Events zu bekommen !!!
    this.parent.appendChild( this.DOMelement ); 
    this.DOMelement.focus();
     
    if(this.params.css) this.DOMelement.className =  this.params.css;
    else                this.DOMelement.className = "cssObject";

    this.DOMelement.style.boxSize = 'border-box';

    this.DOMelement.setAttribute('ID'   ,  this.ID );

    if(this.isDragable)     this.setDragable(); // das element "dragable" machen
    if (this.isDropTarget)  this.setDropTarget(); 
    

    this.left   = this.params.left;
    this.top    = this.params.top;
    this.width  = this.params.width;
    this.height = this.params.height;  

    if(this.params.backgroundColor) this.backgroundColor = this.params.backgroundColor;
    if(this.params.color)           this.color           = this.params.color;
    if(this.params.fontSize)        this.fontSize        = this.params.fontSize;
    if(this.params.fontWeight)      this.fontWeight      = this.params.fontWeight;
    if(this.params.gap)             this.gap             = this.params.gap;
    if(this.params.placeItems)      this.placeItems      = this.params.placeItems;
    if(this.params.justifyContent)  this.justifyContent  = this.params.justifyContent;
    if(this.params.alignItems)      this.alignItems      = this.params.alignItems;
    if(this.params.flexDirection)   this.flexDirection   = this.params.flexDirection;
    if(this.params.overflow)        this.overflow        = this.params.overflow;
    if(this.params.display)         this.display         = this.params.display;
    if(this.params.opacity)         this.opacity         = this.params.opacity;
    if(this.params.shadow)          this.shadow          = this.params.shadow;
    if(this.params.borderRadius)    this.borderRadius    = this.params.borderRadius;
    if(this.params.borderWidth)     this.borderWidth     = this.params.borderWidth;
    if(this.params.borderColor)     this.borderColor     = this.params.borderColor;
    if(this.params.padding)         this.padding         = this.params.padding;
    if(this.params.paddingTop)      this.paddingTop      = this.params.paddingTop;
    if(this.params.paddingLeft)     this.paddingLeft     = this.params.paddingLeft;
    if(this.params.paddingRight)    this.paddingRight    = this.params.paddingRight;
    if(this.params.paddingBottom)   this.paddingBottom   = this.params.paddingBottom;
    if(this.params.margin)          this.margin          = this.params.margin;
    if(this.params.marginTop)       this.marginTop       = this.params.marginTop;
    if(this.params.marginLeft)      this.marginLeft      = this.params.marginLeft;
    if(this.params.marginRight)     this.marginRight     = this.params.marginRight;
    if(this.params.marginBottom)    this.marginBottom    = this.params.marginBottom;
    if(this.params.gridTemplateAreas) this.gridTemplateAreas = this.params.gridTemplateAreas;
    if(this.params.blur)            this.blur            = this.params.blur;


    this.DOMelement.tfObjInstance =  this;   
    this.DOMelement.data          =  this;   // obsolet
   
          this.DOMelement.addEventListener('wheel', function(e) {if (this.callBack_onWheel) this.callBack_onWheel(e, this.dataBinding);}.bind(this));
          this.DOMelement.addEventListener('click', function(e) {if (this.callBack_onClick) this.callBack_onClick(e, this.dataBinding);}.bind(this));
          this.DOMelement.addEventListener('dblclick', function(e) {if (this.callBack_onDblClick) this.callBack_onDblClick(e, this.dataBinding);}.bind(this));
          this.DOMelement.addEventListener('mousemove', function(e) {if (this.callBack_onMouseMove) this.callBack_onMouseMove(e, this.dataBinding);}.bind(this));
          this.DOMelement.addEventListener('mouseleave', function(e) {if (this.callBack_onMouseOut) this.callBack_onMouseOut(e, this.dataBinding);}.bind(this));
      
          if(this.popupMenu) { this.addPopupMenu(this.popupMenu)}
          else this.DOMelement.addEventListener('contextmenu', (e)=>{e.preventDefault();
                                                                     if( this.callBack_onClick) this.callBack_onClick (e,this.dataBinding) 
                                                                    });   
          
                                                                    this.DOMelement.addEventListener('mousedown', function(e) {if (this.callBack_onMouseDown) this.callBack_onMouseDown(e, this.dataBinding);}.bind(this));                                                     
          this.DOMelement.addEventListener('mouseup', function(e) {if (this.callBack_onMouseUp) this.callBack_onMouseUp(e, this.dataBinding);}.bind(this));                                                     
          this.DOMelement.addEventListener('contextmenu', function(e) {if (this.callBack_onContextMenu) this.callBack_onContextMenu(e, this.dataBinding);}.bind(this));                                                     
          
          this.DOMelement.addEventListener('keydown', function(e) { if (this.callBack_onKeyDown) this.callBack_onKeyDown(e, this.dataBinding);}.bind(this));                                                     
          this.DOMelement.addEventListener('keyup', function(e) {if (this.callBack_onKeyUp) this.callBack_onKeyUp(e, this.dataBinding);}.bind(this));                                                     
  } 


  setDragable()
  {
    this.isDragable        = true;
    this.params.isDragable = true;
    if(!this.DOMelement) return;
    else
    { // das element "dragable" machen
      this.DOMelement.setAttribute('draggable', true);
      
      // die Reaktionen diesbezüglich ...
      this.DOMelement.addEventListener('dragstart', (e)=>{
                                                          if(this.draggingData)
                                                          {  
                                                            const d = JSON.stringify(this.draggingData);  
                                                            e.dataTransfer.setData('application/json', d );
                                                          }  
                                                          if( this.callBack_onDragStart) this.callBack_onDragStart(e);
                                                          }); 
                                                          
      this.DOMelement.addEventListener("drag", (e) => {
                                                          if( this.callBack_onDragging) this.callBack_onDragging(e);  
                                                          });                                                          


      this.DOMelement.addEventListener('dragend',   (e)=>{
                                                           if( this.callBack_onDragEnd) this.callBack_onDragEnd(e);
                                                         });  

    } 
  }


  setDropTarget()
  {
    this.isDropTarget       = true;
    this.params.dropTarget  = true;
    if(!this.DOMelement) return;
    else
    {
      this.DOMelement.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this.callBack_onDragOver) this.callBack_onDragOver(e, null);
      });
    
      this.DOMelement.addEventListener("drop", (e) => {
        e.preventDefault();
        const items = e.dataTransfer.items;
        const dropResult = {};
        let pending = 0;
    
        for (let item of items) {
          if (item.kind === "file") {
            dropResult.localFile = item.getAsFile();
          }
    
          else if (item.kind === "string" && item.type === "application/json") {
            pending++;
            item.getAsString((jsonStr) => {
              try {
                dropResult.json = JSON.parse(jsonStr);
              } catch (err) {
                console.warn("Ungültiges JSON im Drop-Item", err);
              }
              if (--pending === 0 && this.callBack_onDrop) this.callBack_onDrop(e, dropResult);
            });
          }
    
          else if (item.kind === "string" && item.type === "text/uri-list") {
            pending++;
            item.getAsString((url) => {
              dropResult.url = url;
              if (--pending === 0 && this.callBack_onDrop) this.callBack_onDrop(e, dropResult);
            });
          }
    
          else if (item.kind === "string" && item.type === "text/plain") {
            pending++;
            item.getAsString((txt) => {
              dropResult.plainText = txt;
              if (--pending === 0 && this.callBack_onDrop) this.callBack_onDrop(e, dropResult);
            });
          }
        }
    
        // Wenn alles synchron war (z.B. nur lokale Datei), sofort Callback
        if (pending === 0 && this.callBack_onDrop) this.callBack_onDrop(e, dropResult);
      });
    }
    
  }


  addPopupMenu(p)
  {  
    this.popupMenu = p;
    this.DOMelement.addEventListener('contextmenu', (e)=>{ if(this.popupMenu) 
                                                           { 
                                                             e.preventDefault();
                                                             this.popupMenu.show(this,e.pageX, e.pageY);
                                                           }
                                                          });   
  } 

  setParent( newParent )
  {
    
    if(this.parent === newParent) return; // nichts zu tun, wenn der Parent gleich bleibt

    //aus der childListe des Parents entfernen ...
    if(this.parent && this.parent.childList)
      {
        const index = this.parent.childList.indexOf(this);
        if (index > -1) 
        {
          this.parent.childList.splice(index, 1);
          // nur in ChildList eintragen, wenn es auch in einer childlist ist bzw. war. 
          // für Hilfsobjekte gilt "dontRegister=true" und die ziehen nur aum DOM-Ebene um ;-)
          newParent.childList.push(this);
        }  
      } 

    newParent.appendChild(this.DOMelement);
    
    this.parent = newParent;
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


  getComputedStyleValue(propertyName)
  {
    return utils.getComputedStyleValue( this.DOMelement , propertyName );
  }


  set css(value)
  { 
    this.params.css = value;
    if (this.DOMelement) this.DOMelement.className = value;
  }

  get css()
  {
    if(this.DOMelement) return this.DOMelement.className;
    else                return this.params.css;                    
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
    if(this.hasGridLayout())
    {   
      if (typeof value === 'string') 
        {
          if (value.includes('px') || value.includes('em')) this.widthPx = value;
          else this.gridWidth = value;
      }
      else if (typeof value === 'number')  this.gridWidth = value;
    }
     else this.widthPx = value;
  } 


  get width()
  {
    var result = 0;
    if(this.hasGridLayout()) result = this.gridWidth;
    else                     result = this.widthPx;
    
     if (this.DOMelement.style.width)  result = this.DOMelement.style.width;

    return result;
  } 


  set height( value )
  { 
    if(this.hasGridLayout())
    {   
      if (typeof value === 'string') 
        {
          if (value.includes('px') || value.includes('em')) this.heightPx = value;
          else this.gridHeight = value;
      }
      else if (typeof value === 'number')  this.gridHeight = value;
    }
     else this.heightPx = value;
  } 


  get height()
  {
    var result = 0;
    if(this.hasGridLayout()) result = this.gridHeight;
    else                     result = this.heightPx;

    if ( this.DOMelement.style.height )  result = this.DOMelement.style.height;

    return result;
  } 

  set zIndex( value )
  {
    if(this.DOMelement) this.DOMelement.style.zIndex = value;
  }

  get zIndex()
  {
    return this.DOMelement?.style.zIndex || this.getComputedStyleValue('zIndex');
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
    return this.DOMelement.offsetWidth; //clientWidth;
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
    return this.DOMelement.offsetHeight; //clientHeight;
 } 


//------------------------------------------------------------------------

  set gridLeft( g )
  {
      var w = this.gridWidth;
      this.grid.left = parseInt(g, 10);
      this.DOMelement.style.gridColumnStart  = this.grid.left;
      this.DOMelement.style.gridColumnEnd    = this.grid.left +  w;
    }           
  
    get gridLeft()
    {
      this.grid.left = parseInt(this.DOMelement.style.gridColumnStart,10); 
      return this.grid.left;
    }           
  
  
    set gridTop( g )
    {
       var h = this.gridHeight;
       this.grid.top = parseInt(g, 10);
       this.DOMelement.style.gridRowStart = this.grid.top;  
       this.DOMelement.style.gridRowEnd   = this.grid.top + h;
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
       this.grid.height  = parseInt(g,10)
       this.DOMelement.style.gridRowEnd = this.gridTop + this.grid.height;
    }           
  
    get gridHeight()
    {
      this.grid.height = parseInt(this.DOMelement.style.gridRowEnd,10) - this.gridTop;
      return  this.grid.height;
    }     
  

    get gridTemplateAreas()
    {
      return this.DOMelement.style.gridTemplateAreas; 
    }

    set gridTemplateAreas( value )
    {
      this.DOMelement.style.gridTemplateAreas = value;
    }


set fontSize(value) 
{
  this.params.fontSize = value;
  if(this.DOMelement) this.DOMelement.style.fontSize = value;
} 

get fontSize() 
{
  if(this.DOMelement) return this.DOMelement.style.fontSize || this.getComputedStyleValue('fontSize');
  else                return this.params.fontSize;
}

set fontWeight(value)
{
  this.params.fontWeight = value;
  this.DOMelement.style.fontWeight = value;
}

get fontWeight() 
{
  if(this.DOMelement) return this.DOMelement?.style.fontWeight || this.getComputedStyleValue('fontWeight');
  else                return this.params.fontWeight;
}

set gap(value)
{
  this.params.gap = value;
  if(this.DOMelement) this.DOMelement.style.gap = value;
}

get gap()
{
  if(this.DOMelement) return this.DOMelement.style.gap;
  else                return this.params.gap;
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
   

appendChild(aDOMelement)
  {
    this.DOMelement.appendChild(aDOMelement);
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
    this.setVisible()
  }


  setVisible()
  {
    this.DOMelement.style.display = 'grid';  
  }


  set visible(value)
  { 
    if(value) this.show();
    else this.setInvisible();
  }

  get visible()
  {
    return this.DOMelement.style.display !== 'none' && this.DOMelement.style.visibility !== 'hidden';
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
    this.params.display = value;
    if(this.DOMelement) this.DOMelement.style.display = value;  
  }


  get display() 
  {
    if(this.DOMelement) return this.DOMelement.style.display || this.getComputedStyleValue('display');
    else                return this.params.display;
  }


  set position(value)
  {
    this.params.position = value;
    if(this.DOMelement) this.DOMelement.style.position = value;  
  }


  get position()
  {
    if(this.DOMelement) return this.DOMelement.style.position || this.getComputedStyleValue('position');
    else                return this.params.position;  
  }



set placeItems(value)
  {
    this.params.placeItems = value;
    if(this.DOMelement) this.DOMelement.style.placeItems = value;
  }

 get placeItems()
  {
    if(this.DOMelement) return this.DOMelement.style.placeItems || this.getComputedStyleValue('placeItems');
    else                return this.params.placeItems; 
  }


  set justifyContent(value)
  {
    this.params.justifyContent = value;
    if(this.DOMelement) this.DOMelement.style.justifyContent = value;  
  }


  get justifyContent()
  {
    if(this.DOMelement) return this.DOMelement.style.justifyContent || this.getComputedStyleValue('justifyContent');
    else                return this.params.justifyContent;
  }


  set alignItems(value)
  {
    this.params.alignItems = value; 
    if(this.DOMelement) this.DOMelement.style.alignItems = value;  
  }


  get alignItems()
  {
    if(this.DOMelement) return this.DOMelement.style.alignItems || this.getComputedStyleValue('alignItems');  
    else                return this.params.alignItems;
  }


  set flexDirection(value)  
  {
    this.params.flexDirection = value;
    if(this.DOMelement) this.DOMelement.style.flexDirection = value;
  }
 

  get flexDirection()   
  {
    if(this.DOMelement) return this.DOMelement.style.flexDirection || this.getComputedStyleValue('flexDirection');
    else                return this.params.flexDirection;
  }
  

 set overflow(value) 
  {
    this.params.overflow = value;   
    if(this.DOMelement) this.DOMelement.style.overflow = value;
  }

  get overflow()  
  {   
    var v = '';  
    if(this.DOMelement) v = this.DOMelement.style.overflow || this.getComputedStyleValue('overflow');  
    else                v = this.params.overflow;

    console.log("get overflow: " + v);
    if(v=='') v= "auto";

    return v;
  }

  set backgroundColor(value)
  {
    this.params.backgroundColor = value;
    if(this.DOMelement) this.DOMelement.style.backgroundColor = value;
  } 

  get backgroundColor()
  {
    if(this.DOMelement) return this.DOMelement.style.backgroundColor || this.getComputedStyleValue('backgroundColor');
    else                return this.params.backgroundColor;
  } 

  set color(value)
  {
    this.params.color = value;
    if(this.DOMelement) this.DOMelement.style.color = value;
  } 

  get color()
  {
    if(this.DOMelement) return this.DOMelement.style.color || this.getComputedStyleValue('color');
                        return this.params.color;
  } 

  
  set margin( value ) 
  { 
    this.params.margin = this.margin;
    if(this.DOMelement) this.DOMelement.style.margin = value;
  }


  get margin()
  {
    if(this.DOMelement) return this.DOMelement.style.margin || this.getComputedStyleValue('margin');
    else                return this.params.margin;
  }


  set marginTop( value ) 
  {
    this.params.marginTop = value;
    if(this.DOMelement) this.DOMelement.style.marginTop = value;
  }

  get marginTop()
  {
    if(this.DOMelement) return this.DOMelement.style.marginTop || this.getComputedStyleValue('marginTop');
    else                return this.params.marginTop;
  }


  set marginLeft( value ) 
  {
    this.params.marginLeft = value;
    if(this.DOMelement) this.DOMelement.style.marginLeft = value;
  }


  get marginLeft()
  {
    if(this.DOMelement) return this.DOMelement.style.marginLeft || this.getComputedStyleValue('marginLeft');
    else                return this.params.marginLeft;
  }


  set marginRight( value ) 
  {
    this.params.marginRight = value;
    if(this.DOMelement) this.DOMelement.style.marginRight = value;
  }


  get marginRight()
  {
    if(this.DOMelement) return this.DOMelement.style.marginRight  || this.getComputedStyleValue('marginRight');
    else                return this.params.marginRight;
  }


  set marginBottom( value ) 
  {
    this.params.marginBottom = value;
    if(this.DOMelement) this.DOMelement.style.marginBottom = value;
  }


  get marginBottom()
  {
    if(this.DOMelement) return this.DOMelement.style.marginBottom || this.getComputedStyleValue('marginBottom');
    else                return this.params.marginBottom;
  }


  set padding( value ) 
  {
    this.params.padding = value; 
    if(this.DOMelement) this.DOMelement.style.padding = value;
  }

  get padding()
  {
    if(this.DOMelement) return this.DOMelement.style.padding || this.getComputedStyleValue('padding');
    else                return this.params.padding; 
  }

  set paddingTop( value )   
  {
    this.params.paddingTop = value;
    if(this.DOMelement) this.DOMelement.style.paddingTop = value; 
  }

  get paddingTop()
  {
    if(this.DOMelement) return this.DOMelement.style.paddingTop || this.getComputedStyleValue('paddingTop');
    else                return this.params.paddingTop;
  }

  set paddingLeft( value )
  {
    this.params.paddingLeft;
    if(this.DOMelement) this.DOMelement.style.paddingLeft = value;
  }

  get paddingLeft()
  {
    if(this.DOMelement) return this.DOMelement.style.paddingLeft || this.getComputedStyleValue('paddingLeft');
    else                return this.params.paddingLeft;
  }


  set paddingRight( value )
  {
    this.params.paddingRight = value;  
    if(this.DOMelement) this.DOMelement.style.paddingRight = value;
  }

  get paddingRight()
  {
    if(this.DOMelement) return this.DOMelement.style.paddingRight || this.getComputedStyleValue('paddingRight');
    else                return this.params,this.paddingRight;
  }


  set paddingBottom( value )
  {
    this.params.paddingBottom = value; 
    if(this.DOMelement) this.DOMelement.style.paddingBottom = value;
  }

  get paddingBottom()
  {
    if(this.DOMelement) return this.DOMelement.style.paddingBottom || this.getComputedStyleValue('paddingBottom');
    else                return this.params.paddingBottom;
  }

  set borderWidth( value )
  {
    this.params.borderWidth = value;
    if(this.DOMelement) this.DOMelement.style.border = value + " solid " + this.borderColor;
  }



  get borderWidth()
  {
    if(this.DOMelement) return this.DOMelement.style.borderWidth || this.getComputedStyleValue('borderWidth');
    else                return this.params.borderWidth;
  }

  set borderColor( value )
  {
    this.params.borderColor = value;   
    if(this.DOMelement) this.DOMelement.style.borderColor = value;
  }

  get borderColor()
  {
    if(this.DOMelement) return this.DOMelement.style.borderColor || this.getComputedStyleValue('borderColor');
    else                return this.params.borderColor;
  }

  set borderRadius(value) 
  {
    this.params.borderRadius = value;
    if (this.DOMelement) this.DOMelement.style.borderRadius = typeof value === 'string' ? value : value + 'px';
  }


  get borderRadius()
  {
    if(this.DOMelement) return this.DOMelement.style.borderRadius || this.getComputedStyleValue('borderRadius');
    else                return this.params.borderRadius;
  }


set blur(value)
{
  this.params.blur = value;
  if(this.DOMelement) this.DOMelement.style.filter = 'blur('+value+'px)';
}

get blur()
{
  if(this.DOMelement) return this.DOMelement.style.filter || 0;
  else                return this.params.blur;
}


set opacity(value)  
{
  this.params.opacity = value;
  if(this.DOMelement) this.DOMelement.style.opacity = value;
}

get opacity()
{
  if(this.DOMelement) return this.DOMelement.style.opacity || this.getComputedStyleValue('opacity');
  else                return this.params.opacity;
}


set shadow(value) 
{
    this.params.shadow = value;

    this._shadowDepth = value;
    if (value === 0) {
        // Schatten entfernen
        if (this.DOMelement) this.DOMelement.style.boxShadow = 'none';
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
  if (this._shadowDepth != null) return this._shadowDepth;
  else                           return this.params.shadow;
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
  if(!value) return;
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


// alle Properties in einer einzigen JSON-Struktur zurückgeben...
getProperties()
{ 
  var properties = [];

  properties.push( {level:1, label:'objName',type:'INPUT',value:this.objName} );
  properties.push( {level:1, label:'name',type:'INPUT',value:this.name} );
  
  properties.push( {level:1, label:'css',type:'LOOKUP',value:this.css || '' , items:utils.getAvailableCSSClasses() || [] } );
  
  properties.push( {level:1, label:'backgroundColor',type:'INPUT',value:this.backgroundColor, dialog:'COLORPICKER'} );
  properties.push( {level:1, label:'color',type:'INPUT',value:this.color , dialog:'COLORPICKER'} ); 
  properties.push( {level:2, label:'borderColor',type:'INPUT',value:this.borderColor, dialog:'COLORPICKER'} ); 
  properties.push( {level:2, label:'borderWidth',type:'INPUT',value:this.borderWidth} ); 
  properties.push( {level:2, label:'borderRadius',type:'INPUT',value:this.borderRadius} ); 
  properties.push( {level:2, label:'shadow',type:'INPUT',value:this.shadow} ); 
  properties.push( {level:3, label:'opacity',type:'INPUT',value:this.opacity} ); 
  properties.push( {level:3, label:'blur',type:'INPUT',value:this.blur} ); 
  //properties.push( {level:3, label:'innerHTML',type:'INPUT',value:this.innerHTML} ); 
  properties.push( {level:3, label:'placeItems',type:'SELECT',value:this.placeItems , items:['start','end','center','stretch','baseline']} ); 
  properties.push( {level:3, label:'justifyContent',type:'SELECT',value:this.justifyContent, items:['flex-start','flex-end','center','space-between','space-around','space-evenly','start','end','left','right']} ); 
  properties.push( {level:3, label:'alignItems',type:'SELECT',value:this.alignItems, items:['stretch','flex-start','flex-end','center','baseline','start','end']} ); 
                                                 
  // Position im GRID-LAYOUT
  properties.push( {level:3, label:'gridLeft',type:'INPUT',value:this.gridLeft} );
  properties.push( {level:3, label:'gridTop',type:'INPUT',value:this.gridTop} );
  properties.push( {level:3, label:'gridWidth',type:'INPUT',value:this.gridWidth} );
  properties.push( {level:3, label:'gridHeight',type:'INPUT',value:this.gridHeight} ); 
  properties.push( {level:3, label:'gap',type:'INPUT',value:this.gap} ); 

  // Nach Initial-Positionierung -> nachträgliche Änderungen der Geometrie
  properties.push( {level:1, label:'left',type:'INPUT',value:this.left} );
  properties.push( {level:1, label:'top',type:'INPUT',value:this.top} );
  properties.push( {level:1, label:'width',type:'INPUT',value:this.width} );
  properties.push( {level:1, label:'height',type:'INPUT',value:this.height} );
  properties.push( {level:3, label:'zIndex',type:'INPUT',value:this.zIndex} );

  properties.push( {level:1, label:'margin',type:'INPUT',value:this.margin || '0px'} );
  properties.push( {level:2, label:'marginLeft',type:'INPUT',value:this.marginLeft || '0px'} );
  properties.push( {level:2, label:'marginRight',type:'INPUT',value:this.marginRight || '0px'} );
  properties.push( {level:2, label:'marginTop',type:'INPUT',value:this.marginTop || '0px'} );
  properties.push( {level:2, label:'marginBottom',type:'INPUT',value:this.marginBottom || '0px'} );

  properties.push( {level:1, label:'padding',type:'INPUT',value:this.padding || '0px'} );
  properties.push( {level:2, label:'paddingTop',type:'INPUT',value:this.paddingTop || '0px'} );
  properties.push( {level:2, label:'paddingLeft',type:'INPUT',value:this.paddingLeft || '0px'} );
  properties.push( {level:2, label:'paddingRight',type:'INPUT',value:this.paddingRight || '0px'} );
  properties.push( {level:2, label:'paddingBottom',type:'INPUT',value:this.paddingBottom || '0px'} );

  properties.push( {level:1, label:'borderWidth',type:'INPUT',value:this.borderWidth || '0px'} );
  properties.push( {level:2, label:'borderColor',type:'INPUT',value:this.borderColor || '0px'} );
  properties.push( {level:2, label:'borderRadius',type:'INPUT',value:this.borderRadius || '0px'} );
  properties.push( {level:2, label:'shadow',type:'INPUT',value:this.shadow} );
  
  properties.push( {level:1, label:'overflow',type:'SELECT',value:this.overflow || "auto" , items:["hidden","auto"] } );
  properties.push( {level:3, label:'visible',type:'SELECT',value:this.visible || "true"  , items:["true","false"] } );
  properties.push( {level:3, label:'display',type:'SELECT',value:this.display || "flex" , items:['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none', 'contents', 'table', 'table-row', 'table-cell', 'list-item']} );
  properties.push( {level:3, label:'position',type:'SELECT',value:this.position, items:['static', 'relative', 'absolute', 'fixed', 'sticky'] });
  properties.push( {level:3, label:'flexDirection',type:'SELECT',value:this.flexDirection  || "row", items:["row","column","row-reverse","column-reverse"]} );
  
// Grid-Infos holen
  var dim = utils.getGridLayoutDimension(this);
  if(dim) properties.push( {level:4, label:'gridLayout',type:'INPUT',value:dim.gridColumnCount+'x'+dim.gridRowCount} );

 // console.log("get Properties: " + JSON.stringify(properties))
  
  return properties;
}

getConstructionProperties()
{
  const properties = this.getProperties();
  const propObj = {};

  for (const { label, value } of properties) { propObj[label] = value; }

  console.log(' - getConstructionProperties:');
  console.log('  ' + propObj.objName + "("+propObj.name+") -> ");
  console.log(JSON.stringify(propObj));

  // Rekursiv alle Kinder durchgehen
  var childs = [];
  if (this.childList && this.childList.length > 0)
     for(var i=0; i<this.childList.length; i++) 
     {
       var child = this.childList[i];
       console.log('dive in recursion for child: ' + child.objName + '('+child.name+') ....' ); 
       childs.push(child.getConstructionProperties());
     }  
  
  console.log('');
  console.log('');   
  console.log('---> Children: ' + JSON.stringify(childs));    
  
  propObj.children = childs;   
  
  return propObj;
}



setProperties( properties )
{
  var propertyObject = {};
  
  if (Array.isArray(properties)) propertyObject = Object.assign({}, ...properties);
  else propertyObject = properties;

  for (let key in propertyObject) 
  if (key in this)
    { 
      console.log('set property "'+key+'" to "'+propertyObject[key]+'"');
      if(propertyObject[key] != null) this[key] = propertyObject[key];
    }    
}


removeChild( child )
{
  if(!child) return;

  // finde das childObjekt in "meiner" childList ...
 var idx = this.childList.indexOf(child);
     if (idx > -1) this.childList.splice(idx, 1); // Element aus dem childListArray entfernen
}


remove()
{
  // alle "meine" childObjekte löschen
  while(this.childList.lenth>0)
  {
    var o=this.childList.pop();
    o.remove();
    o=null;
  }

  // "mich selbst" aus childListe "meines" parents entfernen ... 
  if (this.parent)
  {  
     if(utils.isHTMLElement(this.parent)) this.parent.removeChild(this.DOMelement);
     else this.parent.removeChild(this)
  }   
  
  // HTML-Element aus DOM entfernen  
  this.DOMelement.remove();
}


destroy()
{
  this.remove;  
}

}   //end class ...


export class TFSlider extends TFObject 
{
  constructor (parent , left , top , width , height , params ) 
  { 
    params.backgroundColor = params.backgroundColor || parent.backgroundColor || "transparent";
    params.caption         = params.caption || '';
    params.captionLength   = params.captionLength || params.caption.length;
    params.sliderMin       = params.sliderMin  || params.min || 0;
    params.sliderMax       = params.sliderMax  || params.max || 100;
    params.sliderStep      = params.sliderStep || params.step || 1;
    params.value           = params.value || params.sliderPosition || params.position || 50;
    
    super(parent , left , top , width , height , params );
    
    // this.render() wird von bereits von der TFObjects Basisklasse aufgerufen
    // alles was jetzt passiert passiert NACH "unserem" this.render()
  }  

   getProperties()
   {
    var properties = super.getProperties();
    properties.push( {level:1, label:'caption',type:'INPUT',value:this.caption} );
    properties.push( {level:1, label:'sliderMin',type:'INPUT',value:this.slider.min} ); 
    properties.push( {level:1, label:'sliderMax',type:'INPUT',value:this.slider.max} );
    properties.push( {level:1, label:'sliderStep',type:'INPUT',value:this.slider.step} );
    properties.push( {level:1, label:'value',type:'INPUT',value:this.slider.value} );

    return properties;
  } 
   
    

  render()
  { 
    super.render();
    this.build();
  }
  
  build()
  {
    this.innerHTML             = '';
    this.onChange              = null;
    this.display               = 'flex';
    this.alignItems            = 'center';
    this.justifyContent        = 'center'; 
    this.overflow              = 'hidden';
    this.backgroundColor       = this.params.backgroundColor;
    this.sliderCaption         = null;
    
   
    var s = null;

    if(this.params.caption)
    {
      this.buildGridLayout_templateColumns(this.params.captionLength || this.params.caption.length +'em 1fr');
      this.buildGridLayout_templateRows('1fr');
      this.sliderCaption = new TFLabel(this , 1 , 1 , 1 , 1 , {caption:this.params.caption,labelPosition:'LEFT' , dontRegister:true} );
      if(this.params.fontSize) this.sliderCaption.fontSize = this.params.fontSize;
      this.sliderCaption.textAlign  = 'LEFT';
      this.sliderCaption.fontWeight = 'bold';
      this.sliderCaption.marginLeft = '0.5em';
      s = new TFPanel(this , 2 , 1 , 1 , 1 , {css:"cssContainerPanel" ,  dontRegister:true} );
    } else s=this; 

    s.overflow = 'hidden';
   
    this.slider         = document.createElement('INPUT');
    this.slider.type    = 'range';
    this.slider.min     = this.params.sliderMin;
    this.slider.max     = this.params.sliderMax;
    this.slider.step    = this.params.sliderStep1;
    this.value          = this.params.value;
   
    this.slider.style.width = '100%';
    this.slider.style.height = '100%';
    this.slider.style.backgroundColor = this.backgroundColor;
    
     // Eventhandler für Input
     this.slider.addEventListener("input", () => {
      //console.log("Slider changed:", this.slider.value);
      console.log(this);

      if (this.onChange != null) {
        this.onChange(this.slider.value, this.dataBinding);
      }
    });
    
    s.appendChild(this.slider);
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

  set caption( value )
  {
    if(this.sliderCaption) this.sliderCaption.caption = value;
    else
    {
      this.params.caption = value;
      this.build(); // neu aufbauen, damit die Caption angezeigt wird
    }
  }

  get caption()
  {
    if(this.sliderCaption) return this.sliderCaption.caption || '';
    else return '';
  }  

 
}


export class TFLabel extends TFObject 
{
  
  constructor (parent , left , top , width , height , params ) 
  {
    params     = params || {};
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
    if(!value) value = 'center'; 
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

set font(value) 
{
  if (!value) value = 'Arial, sans-serif'; // Default-Font
  if (this.paragraph) {
    this.paragraph.style.fontFamily = value;
  }
}

get font() {
  const raw = this.paragraph?.style.fontFamily || this.getComputedStyleValue?.('fontFamily') || '';
  return raw.split(',')[0].trim().replace(/^["']|["']$/g, '');
}


set fontSize( value )
{
  if (!value) value = '1em'; // Default-FontSize
  this.paragraph.style.fontSize = value;
}

get fontSize()
{
  return this.paragraph.style.fontSize;
}

set color( value )  
{
  if (!value) value = 'black'; // Default-FontColor
  this.paragraph.style.color = value;
}

get color()
{
  return this.paragraph.style.color;
}


getProperties()
{
    var properties = super.getProperties();
    properties.push( {level:1, label:'caption',type:'INPUT',value:this.caption} );
    properties.push( {level:1, label:'textAlign',type:'INPUT',value:this.textAlign} ); 
    properties.push( {level:1, label:'color',type:'INPUT',value:this.color , dialog:'COLORPICKER'} );
    properties.push( {level:1, label:'font',type:'LOOKUP',value:this.font,items:fontList , dialog:'FONTDIALOG'} );
    properties.push( {level:1, label:'fontWeight',type:'INPUT',value:this.fontWeight} );
    properties.push( {level:1, label:'fontSize',type:'INPUT',value:this.fontSize} );


    return properties;
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

    this.position = 'relative';
    this.overflow = 'hidden';

    var p              = this.params;
        p.preventGrid  = true;
        p.css          = "cssImageContainer";
        p.dontRegister = true;

    this.imgContainer = new TFPanel(this , 1 , 1 , '100%' , '100%' , p );
    this.imgContainer.overflow = 'hidden';

    if(this.params.imgURL) this.imgURL = this.params.imgURL;

  }  

  prepareNextImage( nextImageURL)
  {
    var p=this.params;
    p.preventGrid=true;
    p.css = "cssImageContainer";
    this.nextImgContainer = new TFPanel(this , 1 , 1 , '100%' , '100%' , p );
    this.nextImgContainer.overflow = 'hidden';
    this.nextImgContainer.imgURL = nextImageURL;
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

getProperties()
{
    var properties = super.getProperties();
    properties.push( {level:1, label:'imgURL',type:'INPUT',value:this.imgURL , dialog:'FILEPICKER'} );
    return properties;
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

    params.caption = params.caption || "";  

  super(parent , left , top , width , height , params );
  }


render()
{
   super.render();
   this.build()
}   


build()
{     
   this.innerHTML = '';
   this.btnText  = null;
   this.btnGlyph = null;

   var h = this.heightPx + 'px';

   if(this.params.glyph && this.params.caption)
   {
     this.buildGridLayout_templateColumns(h + ' 1fr');
     this.buildGridLayout_templateRows('1fr');
   }
   
   if(this.params.glyph && !this.params.caption)
    {
      this.buildGridLayout_templateColumns('1fr 1px');
      this.buildGridLayout_templateRows('1fr');
    }

    if(!this.params.glyph && this.params.caption)
      {
        this.buildGridLayout_templateColumns('1px 1fr');
        this.buildGridLayout_templateRows('1fr');
      }

    if(this.params.caption)
    {
      this.btnText = new TFLabel( this , 2 , 1 , 1 , 1 , {caption:this.params.caption,labelPosition:'CENTER',css:"cssButtonText" ,  dontRegister:true} );
      this.btnText.margin  = 0;
      this.btnText.padding = 0;
    } 

   if(this.params.glyph)
    {
      this.btnGlyph = new TFPanel( this , 1 , 1 , 1 , 1 , {css:"cssContainerPanel" ,  dontRegister:true} );
      this.btnGlyph.overflow = 'hidden';
      utils.drawSymbol( this.params.glyph , this.btnGlyph , this.params.glyphColor || this.color || "lightgray" , "104%");
    }  

 } 


 set caption( txt )
 {
   this.params.caption = txt;
   this.build() ;
 }

 get caption() 
 {
  return this.params.caption ; 
 }


set glyph( g )
 { 
   this.params.glyph = g;
   this.build() ;
 }

 get glyph() 
 {
  return this.params.glyph ; 
 }


 set glyphColor( c )
 {
   this.params.glyphColor = c;
   this.build();
 }

 get glyphColor()
 {
    return this.params.glyphColor;
 }

 getProperties()
{
    var properties = super.getProperties();
    properties.push( {level:1, label:'caption',type:'INPUT',value:this.caption} );
    properties.push( {level:1, label:'glyph',type:'INPUT',value:this.glyph,dialog:'SYMBOLPICKER'} );
    properties.push( {level:1, label:'glyphColor',type:'INPUT',value:this.glyphColor, dialog:'COLORPICKER'} );
    
    return properties;
 }
 
}  

//---------------------------------------------------------------------------

export class TFileUploadPanel 
{
  constructor(parent, params) 
  {
    if (!params) params = {};

    this.panel = new TFPanel(parent, 1, 1, '100%' , '100%' , { css: 'cssDropZoneJ4' });
    this.panel.position = 'relative';
    this.panel.display = 'flex';
    this.panel.alignItems = 'center';
    this.panel.justifyContent = 'center';
    this.panel.DOMelement.style.border = '2px dashed gray';
    this.panel.DOMelement.style.minHeight = '100px';
    this.panel.DOMelement.style.cursor = 'pointer';
    
    this.label = new TFLabel(this.panel, 1, 1, '75%','75%', { caption: params.label || 'Datei(en) hierher ziehen oder klicken' });
    this.label.textAlign = 'center';

    this.destDir = params.destDir || '';

    // Upload-Logik
    this.accept = params.accept || '*/*';
    this.onUpload = params.onUpload || ((file, serverResponse) => alert('not handled Upload: ' + utils.JSONstringify(serverResponse)));
                           
    // Versteckter File-Input
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.multiple = params.multiple || false;
    this.input.accept = this.accept;
    this.input.style.display = "none";
    document.body.appendChild(this.input);

    // Button-Click → öffnet Datei-Dialog
    this.panel.callBack_onClick = () => this.input.click();

    // Datei über Dialog ausgewählt
    this.input.addEventListener("change", () => this.__handleFiles(this.input.files));

    // Drag-and-drop Events
    this.panel.DOMelement.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.panel.DOMelement.classList.add("hover");
    });

    this.panel.DOMelement.addEventListener("dragleave", () => {
      this.panel.DOMelement.classList.remove("hover");
    });

    this.panel.DOMelement.addEventListener("drop", (e) => {
      e.preventDefault();
      this.panel.DOMelement.classList.remove("hover");
      const files = e.dataTransfer.files;
      if (files.length > 0) this.__handleFiles(files);
    });
  }

  __handleFiles(fileList) 
  {
    for (let file of fileList) 
    {
      const fileName = globals.session.userName + '_' + utils.buildRandomID();
      utils.uploadFileToServer(file, fileName, (result) =>{this.onUpload(result)} , {destDir:this.destDir} );
    }
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
          params.css          = params.css           || "cssPanelForInput";
          params.caption      = params.caption       || "checkBox";
          params.captionLength= params.captionLength || params.caption.length+1;
          params.checked      = params.checked       || false;
          if(params.checkboxLeft == undefined) params.checkboxLeft = true;
         } 
    
    super(parent , left , top , width , height , params );
  }
  

  render()
  {
    super.render();
    this.build();
  }

  build()
  {
    this.innerHTML = '';

    if(this.params.checkboxLeft) utils.buildGridLayout_templateColumns(this , '2em '+ this.params.captionLength || this.params.caption.length +'em 1fr');
    else                         utils.buildGridLayout_templateColumns(this , this.params.captionLength || this.params.caption.length +'em  2em 1fr');

    utils.buildGridLayout_templateRows(this ,'1fr');
   
    if(this.params.checkboxLeft) this.gridTemplateAreas    = ' "checkbox editLabel" ';
    else                         this.gridTemplateAreas    = ' "editLabel checkbox" ';

    this.label             = document.createElement("LABEL");
    this.label.className   = "cssLabelForInput";
    this.label.textContent = this.params.caption;
    this.label.style.justifySelf = 'start';
    this.appendChild( this.label );  
     
    this.input             = document.createElement("INPUT");
    this.input.className   = "cssCheckBox";
    this.input.setAttribute('type' , 'checkbox');
    this.input.style.justifySelf = 'start';
    this.appendChild(  this.input ); 

    this.input.addEventListener('change', function(event) 
    {
      if(this.callBack_onChange) this.callBack_onChange(this.checked);
    }.bind(this) );

  } 

  get checked()
  {
    return this.input.checked;
  }

  set checked( value )  
  {
    this.input.checked = value;
  }

  get value()
  {
    return this.input.checked;
  }

  set value( value )  
  {
    this.input.checked = value;
  }


  set caption( value )
  {
    if(this.label) this.label.textContent = value;
    else {
           this.params.caption = value;
           this.build();
    }
  }  

  get caption()
  {
    if(this.label) return this.label.textContent || '';
    else return '';   
  }

  getProperties()
 {
    var properties = super.getProperties();
    properties.push( {level:1, label:'checked',type:'SELECT',value:this.checked,items:['true','false']} );
    properties.push( {level:1, label:'caption',type:'INPUT',value:this.caption} );
    return properties;
 }


}

//---------------------------------------------------------------------------
export class TFListBox extends TFObject
{
  render()
  {
    super.render();
    this.items = [];
    if(this.params.items) this.items = this.params.items;

    this.listbox           = document.createElement('select');
    this.listbox.className = 'cssListBox';
    this.listbox.id        = this.ID+'1'
    this.listbox.multiple  = true;
    this.appendChild(this.listbox);
    this.listbox.addEventListener('change', function(event) 
    {
      const htmlElement = event.target;
      const selectedOptions = Array.from(htmlElement.selectedOptions);
      const selectedValues = selectedOptions.map(option => option.value);
      if (this.callBack_onChange) this.callBack_onChange(selectedValues);
    }.bind(this));

    if(this.params.items) this.addItems(this.params.items);
  }
  
  addItem( item )
  {
    this.items.push(item);
    var option = document.createElement('option');
    option.value = item.value || item.text || item.caption;
    option.textContent = item.text || item.caption;
    option.selected = item.selected || false;
    this.listbox.appendChild(option);
  }

  removeItem( item )
  {
    var ndx = this.items.indexOf(item);
    if(ndx>=0)
    {
      this.items.splice(ndx, 1);
      this.listbox.remove(ndx);
    }
  }

  addItems( items )
  {
    this.items = items;
    this.listbox.innerHTML = ''; // Clear existing options
    for (var i = 0; i < this.items.length; i++)
    {
      var item = this.items[i];
      var option = document.createElement('option');
      option.value = item.value || item.text || item.caption;
      option.textContent = item.text || item.caption;
      option.selected = item.selected || false;
      this.listbox.appendChild(option);
    }
  }

  set itemIndex( ndx )
  {
    if (ndx < 0 || ndx >= this.items.length) return;
    this.listbox.selectedIndex = ndx;
    this.listbox.scrollTop = ndx * this.listbox.options[ndx].offsetHeight; // Scroll to the selected item
  }

  get itemIndex()
  {
    if (this.listbox.selectedIndex < 0 || this.listbox.selectedIndex >= this.items.length) return -1;
    return this.listbox.selectedIndex;
  }

  focus( ndx )
  {
    if (ndx < 0 || ndx >= this.items.length) return;
    this.itemIndex = ndx;
    this.listbox.focus(); // Set focus to the listbox
    this.listbox.scrollTop = ndx * this.listbox.options[ndx].offsetHeight; // Scroll to the selected item
  }

  get selectedItems()
  { 
    var selectedItems = [];
    for (var i = 0; i < this.listbox.options.length; i++)
    {
      if (this.listbox.options[i].selected)
      {
        selectedItems.push(this.items[i]);
      }
    }
    return selectedItems;
  }

  set selectedItems( items )
  {
    this.listbox.selectedIndex = -1; // Deselect all options        
    for (var i = 0; i < this.listbox.options.length; i++)
    {
      this.listbox.options[i].selected = false; // Deselect all options
      for (var j = 0; j < items.length; j++)
      {
        if (this.listbox.options[i].value === items[j].value || this.listbox.options[i].textContent === items[j].text || this.listbox.options[i].textContent === items[j].caption)
        {   
          this.listbox.options[i].selected = true; // Select matching options
          this.listbox.selectedIndex = i; // Set the selected index to the last matched item
          this.listbox.scrollTop = i * this.listbox.options[i].offsetHeight; // Scroll to the last matched item
          break; // Exit the inner loop once a match is found
        }
      }
    }
  }

}



//---------------------------------------------------------------------------
export class TFListCheckbox extends TFObject
{
  build()
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
      input.style.marginLeft = '1em';
      input.style.marginTop  = '0.4em';
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
    this.backgroundColor = 'green';
    super.render();
    utils.buildBlockLayout( this );

    this.items = [];
    if(this.params.items) this.items = this.params.items;

    this.overflow = 'auto';
    this.backgroundColor = 'rgba(0,0,0,0.1)';
   
    this.build();
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
    this.build();
  }   

  removeItem( item )  
  {
    var ndx = this.items.indexOf(item);
    if(ndx>=0) this.items.splice(ndx,1);
    this.build();
  }

  addItems( items )
  {
    this.items = items;
    this.build();
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
    if(!params)        params   = {};
        params.css              = "cssContainerPanel";
        params.caption          = params.caption         || "";
        params.value            = params.value           || "";
        params.labelPosition    = params.labelPosition   || "LEFT";
        params.appendix         = params.appendix        || "";
        params.captionLength    = (params.captionLength  || (params.caption.length/2))+1;
        params.appendixLength   = (params.appendixLength || (params.appendix.length/2))+1;
        params.editLength       = params.editLength      || "auto";
        params.justifyEditField = params.justifyEdit     || 'right';
        params.type             = params.type            || 'text';
        params.lookUp           = params.lookUp          || false;
      
    
    super(parent , left , top , width , height , params );
  }
  

  render()
  {
    super.render(); 
    this.build();
  }

  build()
  {
    this.innerHTML = '';
    this.combobox  = null; 
    this.lookUp    = null;
    this.padding   = 0;
    this.overflow  = 'hidden';
    this.fontSize  = this.params.fontSize || '1em';
    
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
    this.editCaption            = new TFLabel(this , gridTemplate.caption.left , gridTemplate.caption.top , gridTemplate.caption.width , gridTemplate.caption.height , {caption:this.params.caption  , labelPosition:'LEFT' ,  dontRegister:true});
    this.editCaption.fontWeight = 'bold';
    this.editCaption.margin     =  0;
    this.editCaption.marginLeft = '0.5em';
    this.editCaption.textAlign  = 'LEFT';
    this.editCaption.alignItems = 'end';
  }  

if(gridTemplate.apx) 
  {
    this.editApendix = new TFLabel(this , gridTemplate.apx.left     , gridTemplate.apx.top    , gridTemplate.apx.width      , gridTemplate.apx.height     , {caption:this.params.appendix , labelPosition:'LEFT' ,  dontRegister:true});
    this.editApendix.textAlign = 'LEFT';
    this.editApendix.alignItems = 'end';
    this.editApendix.marginLeft = '0.25em';
  }     
    
    // keine Items vorhanden --> normales Inputfeld  
    if(!this.params.items) 
    {
     this.input                   = document.createElement('INPUT');
     this.input.className         = "cssEditField";
     this.input.type              = this.params.type;
    }
    else { 
           if(!this.params.lookUp)
           {  // Items als Select-Box nutzen 
            this.input               = document.createElement('SELECT');
            this.input.className     = "cssComboBox";
            this.combobox            = this.input; 
           } 
           else {// Items als LookUp nutzen ... vorbereiten
                 // Input wird als DIV-Element "missbraucht" da das LookUp-Objekt eigenständig in DIESEM Container residiert ..
                 this.input               = document.createElement('DIV');
                 this.input.className     = "cssContainerPanel";
              } 
        }

     this.input.style.gridRowStart     = gridTemplate.edit.top;
     this.input.style.gridRowEnd       = gridTemplate.edit.top+1;
     this.input.style.gridColumnStart  = gridTemplate.edit.left;
     this.input.style.gridColumnEnd    = gridTemplate.edit.left+1;
     this.input.style.margin           = '0.5px';
     if(this.params.editLength) 
      {
        if(this.params.editLength != 'auto') this.input.style.minWidth = this.params.editLength+'em';
        else                                 this.input.style.width = '99%'; 

        if(this.params.justifyEditField =='left') this.input.style.justifySelf = 'start';
        else                                      this.input.style.justifySelf = 'end'; 

      } 

      if(this.params.lookUp)
      { 
        this.lookUp = new __rawComboBox(this.input , {
          options : this.params.items,
          onChange: function() { 
                                 if(this.callBack_onChange) this.callBack_onChange( this.value )
                               }.bind(this)
       });  

      }
      else this.input.addEventListener('change',  function() { 
                                                               if(this.callBack_onChange) this.callBack_onChange( this.value )
                                                             }.bind(this));  
    if(this.params.value) this.value  = this.params.value;
 
    this.appendChild(  this.input ); 
  } 
  

  set text( txt )
  {
    if(this.lookUp) this.lookUp.setValue(txt);
    else                   this.input.value = txt;
  }

  get text()
  {
    if(this.lookUp) return this.lookUp.getValue();
    else                   return this.input.value;
  }



  set value( txt )
  {
    if(this.lookUp) this.lookUp.setValue(txt);
    else                   this.input.value = txt;
  }

  get value()
  {
    if(this.lookUp) return this.lookUp.getValue();
    else                   return this.input.value;
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

   if (dtStr != '') this.value = dtStr;
 }


  getDateTime()
  {
    var st   = this.value;
    var tfdt = new utils.TFDateTime(st);
    return tfdt.unixDateTime();
  }

  set enabled( value )
  {
    if(this.lookUp) this.lookUp.enabled = value;
    else                   this.input.disabled   = !value;
  }
  
  get enabled() 
  {
    if(this.lookUp) return this.lookUp.enabled;
    else                   return !this.input.disabled;
  }


  set caption( txt )
  { 
    this.params.caption       = txt;
    this.params.captionLength = txt.length + 1;
    this.build(); 
  }

  get caption()
  {
    return this.params.caption || '';
  }


  set captionLength( len )
  { 
    if(len=='' || len==null || len=='0' || len==0 || len=='auto') len = this.params.caption.length + 1;
    this.params.captionLength = len;
    this.build();
  } 

  
  get captionLength()
  {
   return  this.params.captionLength || '0'; 
  }

  set editLength( len )
  { 
    this.params.editLength = len;
    this.build();          
  }

  get editLength()
  {
   return this.params.editLength || 'auto';
  }


  set appendix( txt )
  {
    this.params.appendix = txt;
    this.build();
  }


  get appendix()
  {
    return this.params.appendix || '';
  }


  set appendixLength( len )
  {
    this.params.appendixLength = len;
    this.build();
  }
 
 
  get appendixLength()
  {
    return this.params.appendixLength || '0';
  }

  set labelPosition( pos )
  {
   this.params.labelPosition = pos;
   this.build();
  }
  
  get labelPosition()
  {
    return this.params.labelPosition || 'left';
  }

  set justifyEditField( pos )
  {
    this.params.justifyEditField = pos;
    this.build();
  }

  get justifyEditField()
  {
    return this.params.justifyEditField || 'left';
  }


  set type( t )
  {
    // dummy - tut NIX
    // der Typ kann im Nachgang nicht verändert werden...
    // aber im Sinne der Setter/Getter Logik bauen wir hier eine Einbahnstraße ...
  }  


  get type()
  {
    return this.params.type || 'text';
  }  



   getProperties()
 {
    var properties = super.getProperties();
    properties.push( {level:1, label:'caption',type:'INPUT',value:this.caption} );
    properties.push( {level:2, label:'captionLength',type:'INPUT',value:this.captionLength} );
    properties.push( {level:1, label:'value'  ,type:'INPUT',value:this.value} );
    properties.push( {level:2, label:'editLength'  ,type:'INPUT',value:this.editLength} );
    properties.push( {level:1, label:'appendix'  ,type:'INPUT',value:this.appendix} );
    properties.push( {level:2, label:'appendixLength',type:'INPUT',value:this.appendixLength} );
    properties.push( {level:1, label:'labelPosition'  ,type:'SELECT',value:this.checked,items:['left','top']} );
    properties.push( {level:1, label:'justifyEditField'  ,type:'SELECT',value:this.checked,items:['left','right']} );
    properties.push( {level:99, label:'typ'               ,type:'INPUT',value:this.type} );
    return properties;
 }

  
}  //end class ...

//---------------------------------------------------------------------------
//HTML5 unterstütz keine ComboBoxen in der Art, wie diese z.B. in der VCL existieren.
// Daher wird hier eine EditBox mit einer Liste von Items verwendet.
// Die Items werden in einer Liste angezeigt, die bei Bedarf eingeblendet wird.

class __rawComboBox 
{
  constructor(aParent , params) 
  {
    this.parent    = aParent;
    this.options   = params.options || [];
    this.width     = "100%";
    this.onChange  = params.onChange || function () {};

    // === DOM-Struktur erstellen ===
    this.container = document.createElement("div");
    this.container.style.position = "relative";
    this.container.style.width = this.width;
    this.container.style.display = "flex";
    this.container.style.alignItems= "center";
    this.container.style.justifyContent = "space-between";
       
    // Eingabefeld
    this.input = document.createElement("input");
    this.input.className = "cssEditField";
    this.input.type = "text";
    this.input.style.flex = "1";
    this.input.style.boxSizing = "border-box";
    this.container.appendChild(this.input);

    // Button ▼
    this.button = document.createElement("button");
    this.button.className = "cssButton01";
    this.button.style.boxShadow = "0 2px 3px gray";
    this.button.style.border = "1px solid rgb(87, 86, 86)";
    this.button.style.borderRadius="4px";
    this.button.style.backgroundColor = "darkgray";
    this.button.style.color = "rgb(87, 86, 86)";
    this.button.innerHTML = "&#x25BC;"; // ▼
    this.button.style.width = "1.5em";
    this.button.style.height = "1.6em";
    this.button.style.margin = "1px";
    this.button.style.cursor = "pointer";
    this.container.appendChild(this.button);

    // Dropdown
  this.dropdown = document.createElement("div");
  Object.assign(this.dropdown.style, {
  position: "absolute",
  background: "white",
  border: "1px solid #ccc",
  maxHeight: "150px",
  overflowY: "auto",
  width: this.width,
  zIndex: 1000,
  display: "none"
});

document.body.appendChild(this.dropdown);

this.parent.appendChild(this.container);

    // === Event-Handling ===
    this.input.addEventListener("input", () => {
      this.renderOptions(this.input.value);
      this.showDropdown();
      this.onChange(this.input.value);
    });

    this.input.addEventListener("focus", () => {
      // Dropdown wird nicht automatisch geöffnet, um das Button-Verhalten zu betonen
    });

    this.button.addEventListener("click", () => {
      if (this.dropdown.style.display === "block") {
        this.hideDropdown();
      } else {
        this.renderOptions(this.input.value);
        this.showDropdown();
        this.input.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  renderOptions(filter = "") 
  {
    this.dropdown.innerHTML = "";
    this.options.forEach(opt => {
      if (opt.toLowerCase().includes(filter.toLowerCase())) {
        const item = document.createElement("div");
        item.textContent = opt;
        Object.assign(item.style, {
          padding: "5px",
          cursor: "pointer"
        });
        item.addEventListener("mouseenter", () => item.style.background = "#eee");
        item.addEventListener("mouseleave", () => item.style.background = "");
        item.addEventListener("click", () => {
          this.input.value = opt;
          this.hideDropdown();
          this.onChange(opt);
        });
        this.dropdown.appendChild(item);
      }
    });
  }

  showDropdown() {
    const rect = this.input.getBoundingClientRect();
    this.dropdown.style.left = rect.left + "px";
    this.dropdown.style.top = (rect.bottom + window.scrollY) + "px";
    this.dropdown.style.width = rect.width + "px";
    this.dropdown.style.display = "block";
  }

  hideDropdown() {
    this.dropdown.style.display = "none";
  }

  getValue() {
    return this.input.value;
  }

  setValue(v) {
    this.input.value = v;
    this.onChange(v);
  }

 set value(v) 
  {
    this.setValue(v);
  }

  get value()
  { 
    return this.getValue();
  }


  addOption(opt) {
    this.options.push(opt);
    this.renderOptions(this.input.value);
  }

  focus() {
    this.input.focus();
  }

  set enabled( value )
  {
    this.input.disabled = !value;
  }
  
  get enabled() 
  {
    return !this.input.disabled;
  }

  setOptions(list) 
  {
    this.options = list;
    this.renderOptions(this.input.value);
  }

   getOptions() 
   {
     return this.options;    
   }

}


//--------------------------------------------------------------------------- 

export class TFComboBox extends TFEdit
{
   constructor (parent , left , top , width , height , params )
  { 
    if(!params)       params       = {};
    if(!params.items) params.items = [];
    params.lookUp                  = true;
    super(parent , left , top , width , height , params );
  }


 set items( items )
 {
   this.params.items = items;
   if(this.params.lookUp) this.lookUp.setOptions(items);
 }    
 
 get items()
 {
   if(this.params.lookUp) return this.lookUp.getOptions();
   else                   return this.params.items;
 }

}



export class TFSelectBox extends TFEdit
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
    super.render();
   
    this.combobox = this.input;  // nur aus Gründen der besseren Lesbarkeit / Anwendbarkeit
   
   if(this.params.items.length > 0) this.setItems (this.params.items);
   else                             this.__render();
    
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

    var savedValue = this.combobox.value;

    this.combobox.innerHTML = '';
    for(var i=0; i<this.items.length; i++)
    {
      var item = this.items[i];
      var c    = ''
      var v    = ''
      if(typeof item == 'string') {c = item; v = item;}
      else
      {
        c = item.caption || item.text;
        v = item.value; 
      }  
      var option = document.createElement("OPTION");
      option.text  = c;
      option.value = v;
      this.combobox.appendChild(option);
    }

    this.combobox.value = savedValue;
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
   this.items = [];
   if(items!=null) 
   {
     for(var i=0; i<items.length; i++)
     {
        var item = items[i];
        if(typeof item == 'string') this.items.push( {caption:item , value:item} );
        else                        this.items.push( item );
     }     
    }  
    this.__render();
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
  this.item = value;
}

get value() 
{ 
  return this.item;
}


set item( item )  
{
  var _item = {value:'',caption:''};

  if(typeof item == 'string') {_item.value = item; _item.caption = item;}
  else                        _item = item;

  // ist value in der Items-Liste ?
  var ndx = this.items.findIndex( i => i.value == _item.value );
  if (ndx<0) 
    {
      this.addItem( _item.caption , _item.value );
      ndx = this.items.length-1;
    }  
  
  this.itemIndex = ndx;
}

get item() 
{
  var ndx = this.itemIndex;
  if (ndx<0) return null;
  else       return this.items[ndx].value; 
}

}

//---------------------------------------------------------------------------

export class TFScreen 
{
  constructor()
  {
    this.body =  document.body;
    this.body.className = 'cssScreen';
    this.body.style.overflow = 'hidden';
    this.body.style.backgroundColor = 'black';

    this.render();
  }
  
  render()
  {
    this.id = 'SCREEN_' + utils.buildRandomID(1);
    this.body.setAttribute('id', this.id);
    return this;
  } 
  
  
  setBackgroundImage( path )
  {
    const img = document.createElement('img');
    img.src = path;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.filter = 'blur(7px)';
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.zIndex = '-1';
    
    this.body.appendChild(img);
  }


  set HTML( st ) {this.body.innerHTML = st;}
  get HTML() { return this.body.innerHTML;}


  appendChild( child )
  {
    if (child instanceof HTMLElement) this.body.appendChild(child);
    if (child instanceof TFObject)    this.body.appendChild(child.DOMelement);
  }

}


//---------------------------------------------------------------------------


export class TFWorkSpace extends TFObject
{
  constructor( ID , caption1 , caption2 )  
  {
     // vorsichtshalber ...
     if (globals.Screen==null) globals.setScreen( new TFScreen() ) ;
    
    super(globals.Screen , 1 , 1 , '100%' , '100%' , {css:"cssWorkSpaceJ4" , preventGrid:true , fixit:true, ID:ID, caption1:caption1, caption2:caption2 } );
    this.self = null;
    if(!globals.webApp.activeWorkspace) globals.webApp.activeWorkspace = this;
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
       utils.drawSymbol( "whmcs" , this.sysMenu , "black" , "77%");
       
       if(globals.sysMenu.length>0) 
        { 
          this.sysMenu.dataBinding = new TFMenu(globals.sysMenu);
          this.sysMenu.callBack_onClick = function( ev ){ this.sysMenu.dataBinding.run( ev ) }.bind(this);
        }                                         
                                                  
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
      utils.log("switch Workspace from "+globals.webApp.activeWorkspace.container.id+" to "+this.container.id+")");
      utils.log("Workspace.select( this="+this.container.id+")");
      globals.webApp.activeWorkspace.hide();
      globals.webApp.activeWorkspace = this;
      utils.log("selectWorkspace ... aktivieren von "+this.container.id);
      globals.webApp.activeWorkspace.show()     
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
            if( this.secHandLength < 1 ) return;
            

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
 __convertColor(color) 
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

   this.params.chartPointColor         = this.__convertColor(this.params.chartPointColor);
   this.params.chartBorderColor        = this.__convertColor(this.params.chartBorderColor);
   this.params.chartSelectedColor      = this.__convertColor(this.params.chartSelectedColor);
   this.params.chartBackgroundColor    = this.__convertColor(this.params.chartBackgroundColor);

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
       this.chartOptions.onHover      = null;
       this.chartOptions.onClick      = null;

       this.chartParams.type          =  _chartType;
       this.chartParams.options       =  this.chartOptions;
       this.chartParams.plugins       = [{beforeDraw: function(chart) {
                                                                       const ctx     = chart.ctx;
                                                                       ctx.fillStyle = this.params.chartBackgroundColor || this.backgroundColor;
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
   this.overflow                        = 'hidden';
   this.chart                           = null;
   this.series                          = [];
   this.chartParams                     = {};
   this.chartOptions                    = {}
   this.hostedObject                    = this.params.hostedObject || {};
   this.maxPoints                       = this.params.maxPoints || -1;

    this.params.chartData               = this.params.chartData               || [];
    this.params.chartType               = this.params.chartType               || 'line';
    this.params.tension                 = this.params.tension                 || 0;
    this.params.radius                  = this.params.radius                  || 3;
    this.params.showLines               = this.params.showLines               || true;
    this.params.chartPointColor         = this.params.chartPointColor         || 'rgb(147, 147, 147)';
    this.params.chartBorderColor        = this.params.chartBorderColor        || 'rgba(2, 10, 70, 0.35)';
    this.params.chartBorderWidth        = this.params.chartBorderWidth        || 1;
    this.params.chartSelectedColor      = this.params.chartSelectedColor      || 'rgb(255, 0, 0)';
    this.params.chartBackgroundColor    = this.params.chartBackgroundColor    || this.backgroundColor;
    this.params.gridAreaBackgroundColor = this.params.gridAreaBackgroundColor || this.backgroundColor;
 
    this.__prepareChart();

   this.ctx   = this.canvas.getContext('2d');
   this.chart = new Chart(this.ctx, this.chartParams); 


  this.chart.options.onHover = function(event, activeElements) 
  { 
    var c   =this.chart;
    var self=this.self;
    // Reset all points
    c.data.datasets.forEach((ds) => {ds.backgroundColor = ds.backgroundColor.map(() => self.params.chartPointColor); });

    // Highlight the current point
    if (activeElements.length > 0) 
    {
      const index        = activeElements[0].index;
      const datasetIndex = activeElements[0].datasetIndex;
      c.data.datasets[datasetIndex].backgroundColor[index] = self.params.chartSelectedColor;
    }

    c.update();
  }.bind({chart:this.chart, self:this}); 


  this.chart.options.onClick = function(e) 
  {
      var c    = this.chart;
      var self = this.self;
                                     
      const clickedPoints = c.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
      if (clickedPoints.length > 0) 
         {
           const clickedPoint = clickedPoints[0];
           // Reset all points to original color
           c.data.datasets[clickedPoint.datasetIndex].backgroundColor = c.data.datasets[clickedPoint.datasetIndex].backgroundColor.map(() => self.params.chartPointColor);
           // Mark the clicked point
           c.data.datasets[clickedPoint.datasetIndex].backgroundColor[clickedPoint.index] = self.params.chartSelectedColor;
           const label = c.data.labels[clickedPoint.index];
           const value = c.data.datasets[clickedPoint.datasetIndex].data[clickedPoint.index];
           if(self.onChartClick) self.onChartClick({chart: c, itemIndex: clickedPoint.index, selectedLabel: label, selectedValue: value, hostedObject: this.hostedObject });
           c.update();
         }
  }.bind({chart:this.chart , self:this});

 
  if(this.params.chartData.length > 0) 
    { 
      var s = this.addSeries(this.params.seriesName || '' , this.params.seriesColor || 'black');
      this.addPoint(s , this.params.chartData);
    }  
    
    
 } 


 // Add a new series (dataset) to the chart
 addSeries(seriesName, color) 
 {
   // Farbein Form: rgb(rrr, ggg, bbb) bringen
   color = this.__convertColor(color);

   var newSeries = {
                     label           : seriesName,
                     data            : [],
                     borderColor     : this.params.chartBorderColor,
                     backgroundColor : [],
                     fill            : false,
                     seriesColor     : color
                   };

  this.chart.data.datasets.push(newSeries);
  this.series.push(newSeries);
  this.chart.update();
  return newSeries;
}

// Internal helper to add a single point and handle osci-mode
_addSinglePoint(seriesIndex, point) 
{ 
  console.log(`addSinglePoint: ${JSON.stringify(point)}`);

  const dataset = this.chart.data.datasets[seriesIndex];
  if(!dataset) return;

  // Punkt hinzufügen
  this.chart.data.labels.push(point.x);
  dataset.data.push(point.y);
  dataset.backgroundColor.push(point.color);

  // Begrenzung der maximalen Punkte
  if (this.maxPoints > 0 && this.chart.data.labels.length > this.maxPoints) 
    { 
      console.log(`Oszi-Mode: ${this.chart.data.labels.length} > ${this.maxPoints}`);
      this.chart.data.labels.shift();
      dataset.data.shift();
      dataset.backgroundColor.shift(); // Entferne die älteste Farbe
  }
}

addPoint(aSeries, point ) 
{
  if (aSeries) 
  {
      const index = this.chart.data.datasets.indexOf(aSeries);
      if(index < 0 ) return;
       
      if (Array.isArray(point)) point.forEach((p , i) => {
                                                            p.color = p.color || aSeries.seriesColor; 
                                                           this._addSinglePoint(index,p);
                                                         });  
      else 
          {
            point.color = point.color || aSeries.seriesColor;
            this._addSinglePoint(index, point); 
          } 

      this.chart.update('none');
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

//---------------------------------------------------------------------------

export class TForm
{
  constructor( aParent , aData , aLabels , aAppendix , aExclude , aInpType , URLForm )
  // aParent:  TFObject
  // aData:    JSON-Objekt mit den Daten
  // aLabels:  JSON-Objekt mit den Labels
  // aAppendix:JSON-Objekt mit den Appendix
  // aExclude: Array mit den auszuschließenden Feldern
  // URLForm:  URL zur Form-Definition (optional) Falls dieses nicht definiert wird buildFormGeneric() aufgerufen
  { 
    this.objName            = this.constructor.name;
    this.isTFObject         = false;
    this.parent             = aParent;
    this.data               = aData;
    this.htmlForm           = "";  // String Representanz eines ggf. übergebenen HTML-Formulars
    this.htmlElements       = null; // Array mit den HTML-Elementen des Formulars 
    this.error              = false;
    this.errMsg             = '';
    
    this.objName            = this.constructor.name;
    this.controls           = [];

    this.callBack_onOKBtn   = null;
    this.callBack_onESCBtn  = null;
  
    console.log("TForm.constructor(...) URLForm: " + URLForm );

    if(URLForm)  // falls URL für ein Formular übergeben wurde, dieses laden
    {
      var response  = utils.loadContent(URLForm);

      if(response.error)
      {
        dialogs.showMessage('Fehler beim Versuch, eine Ressource zu laden in:  TForm.constructor("'+URLForm+'")   => ' + response.errMsg);
        this.error = true;
        return false;
      }
      this.htmlForm = response.body; 
    }  
    
    else 
    {
      if(!aExclude) aExclude  = [];

      for(var key in this.data)
      {
       if(utils.indexOfIgnoreCase(aExclude , key) < 0)   // nicht in exclude - List  ...
       {
        var lbl  = key;
        var apx  = '';
        var type = '';

        if(aLabels)  // existieren Labels zur besseren Lesbarkeit ?                
        {
         // Variante1: [{var1:"1"} , {var2:"2"} , {var3:"3"} , .... , {varn:"n"}]
         if (Array.isArray(aLabels)) 
         { 
           var jsnHelp = utils.findEntryByKey(aLabels,key);
           if(jsnHelp) lbl = jsnHelp[key];
         }
         else // Variante2: {var1:"1" , var2:"2" , var3:"3" , .... , varn:"n"}
         {
            if(aLabels.hasOwnProperty(key)) lbl = aLabels[key];
         }
        }
        
        if(aAppendix)
        var jsnHelp     = utils.findEntryByKey( aAppendix ,key);
        if(jsnHelp) apx = jsnHelp[key];

        if(aInpType)
          var jsnHelp      = utils.findEntryByKey( aInpType ,key);
          if(jsnHelp) type = jsnHelp[key];

        this.controls.push({fieldName:key, value:this.data[key], label:lbl, appendix:apx, type: type || "TEXT", enabled:true,  visible:true, editControl:null, params:{} })

      } // else  this.controls.push({fieldName:key, value:this.data[key], label:"" , appendix:"" , type:"TEXT", enabled:false, visible:false , params:{} })
    }
  }   // else  

}
  
  getControlByName( key )
  {
    for(var i=0; i<this.controls.length; i++)
      {
        var ctrl = this.controls[i];
        if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) return ctrl;
      }
    return null;  
  }

  getHtmlById( ID )
  {
    if(this.htmlElements)
    {  
      for(var i=0; i<this.htmlElements.length; i++)
      {
        var el = this.htmlElements[i];
        if (el.id==ID) return el;
      }
    } 
    return null;
  }

  
  disable( key )
  {
    var ctrl = this.getControlByName(key);
    if (ctrl!=null)
    {
      ctrl.enabled=false;
      if(ctrl.editControl) ctrl.editControl.enabled=false;
    }  
  }


  enable( key )
  {
    var ctrl = this.getControlByName(key);
    if (ctrl!=null)
    {  
      ctrl.enabled=true;
      if(ctrl.editControl) ctrl.editControl.enabled=true;
    }  
  }

  
  setLabel(key , aLabel)
  {
      var ctrl = this.getControlByName(key);
      if (ctrl!=null)
      {
        ctrl.label = aLabel;
         if(ctrl.editControl) ctrl.editControl.caption.text=aLabel;
      }   
  }


  setValue(key , aValue)
  {
    var ctrl = this.getControlByName(key);
    if (ctrl!=null)
    {
      ctrl.value = aValue;
      if(ctrl.editControl) ctrl.editControl.value = aValue;
    }  
  }


  setInputType(key , type , params )
  {
    var ctrl = this.getControlByName(key);
    if (ctrl!=null)
    {
      ctrl.type = type;
      ctrl.params = params;
    }  
  }

  setInputLength(key , length)
  {
    var ctrl = this.getControlByName(key);
    if (ctrl!=null)
    {
      // {fieldName:key, value:this.data[key], label:null, appendix:null, type:"null", enabled:true,  visible:true, lblControl:null, editControl:el, apxControl:null}
      ctrl.editControl.input.style.width = length;
    }
  }


  render( withCtrlButton )
  {
    if(this.htmlForm == '' ) this.renderGeneric( withCtrlButton );
    else                     this.renderForm();
  }


  renderForm()  
  {
    this.parent.innerHTML = this.htmlForm ;

    // nun die HTML-Elemente mit den Daten verbinden ...
    // dazu werden die Daten durchlaufen und vie key das passende Element gesucht. Falls erfolgreich, wird das HTML-Element. value gesetzt...
    this.controls = [];

    this.htmlElements = this.parent.DOMelement.querySelectorAll('*');

    for(var key in this.data)
    {
      var el = null;
      this.htmlElements.forEach(htmlElent => { if (htmlElent.id === key) el = htmlElent; });
    
      if (el) 
      {
        this.controls.push( {fieldName:key, value:this.data[key], label:null, appendix:null, type:"null", enabled:true,  visible:true, lblControl:null, editControl:el, apxControl:null})
       
        if (el.tagName === 'INPUT' && el.type === 'text') el.value     = this.data[key];
        if (el.tagName === 'LABEL')                       el.text      = this.data[key];
        if (el.tagName === 'SELECT') 
        { 
          for (var i = 0; i < el.options.length; i++) 
          if (el.options[i].value === this.data[key]) el.selectedIndex = i; 
        }
      }
    }  
    
  }  



  renderGeneric( withCtrlButton )
  {  
    var inpContainer = null;
    var btnContainer = null;

    if(withCtrlButton)
    {
      this.parent.buildGridLayout_templateColumns("1fr");
      this.parent.buildGridLayout_templateRows("1fr 4em"); 
      inpContainer = new TFPanel(this.parent,1,1,1,1,{css:"cssContainerPanel"});
      btnContainer = new TFPanel(this.parent,1,2,1,1,{css:"cssGrayPanel"});
      btnContainer.overflow = 'hidden'; 
    } else inpContainer = this.parent;  

    // maximale label-länge finden, um rechtsbündige Eingabezellen zu haben....
    var maxLabel = 0;
    for(var i=0; i<this.controls.length; i++) if(this.controls[i].visible && (this.controls[i].label.length>maxLabel)) maxLabel = this.controls[i].label.length;

    // maximale Länge des ggf. vorh. Appendix finden ....
    var maxAppendix = 2;
    for(var i=0; i<this.controls.length; i++) if(this.controls[i].visible && (this.controls[i].appendix.length>maxAppendix)) maxAppendix = this.controls[i].appendix.length;

    //build.....
    inpContainer.buildBlockLayout();  

    for(var i=0; i<this.controls.length; i++)
    { 
      var ctrl = this.controls[i];
      if (ctrl.visible)
      {
        if(ctrl.type.toUpperCase()=='TEXT')
           ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
       

        if(ctrl.type.toUpperCase()=='PASSWORD')
        {
          ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{lookUp:true,items:ctrl.params.items,caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
          ctrl.editControl.input.type = 'password';
        }
       
        if(ctrl.type.toUpperCase()=='LOOKUP')
          ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{lookUp:true,items:ctrl.params.items,caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
      
        if(ctrl.type.toUpperCase()=='DATE')
          ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{type:"date",caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
      
        if(ctrl.type.toUpperCase()=='TIME')
          ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{type:"time",caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
      
        if(ctrl.type.toUpperCase()=='DATETIME')
          ctrl.editControl = new TFEdit(inpContainer,1,1,'99%','3em',{type:"datetime-local",caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});  
      
        if(ctrl.type.toUpperCase()=='SELECT')
         { ctrl.editControl = new TFComboBox(inpContainer,1,1,'99%','3em',{caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value, items:ctrl.params.items,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left", items:ctrl.params.items});  }
      
        if(ctrl.type.toUpperCase()=='RANGE')
          ctrl.editControl = new TFSlider(inpContainer,1,1,'99%','3em',{caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,justifyEdit:"left"});

        if(ctrl.type.toUpperCase()=='CHECKBOX')
          ctrl.editControl = new TFCheckBox(inpContainer,1,1,'99%','3em',{caption:ctrl.label,appendix:ctrl.appendix,value:ctrl.value,captionLength:maxLabel,appendixLength:maxAppendix,checkboxLeft:false,captionLength:maxLabel});
      }
    }  
       
    
    if(withCtrlButton)
    {
      btnContainer.buildGridLayout_templateColumns("repeat(5,1fr)  ");
      btnContainer.buildGridLayout_templateRows   ( "0.5em 1fr 0.5em");
  
      this.btnOk    = new TFButton( btnContainer ,2,2,1,1,{caption:"OK",glyph:"circle-check"});
      this.btnOk.callBack_onClick = function() {if(this.callBack_onOKBtn) { this.callBack_onOKBtn( this.getInputFormValues() )};}.bind(this);

      this.btnAbort = new TFButton( btnContainer,4,2,1,1,{caption:"Abbruch",glyph:'circle-xmark'});
      this.btnAbort.backgroundColor = 'red';
      this.btnAbort.callBack_onClick = function(){if(this.callBack_onESCBtn) this.callBack_onESCBtn();}.bind(this);
    }

    
  }

  getInputFormValues()
  {
    var result = [];

    if( this.htmlForm != '' )
    {
      for(var i=0; i<this.controls.length; i++)
      {
        var element = this.controls[i].editControl;
        if(element) result.push( { field:element.id, value:element.value } ) 
      };
    } 
    else
        for(var i=0; i<this.controls.length; i++) 
        {
          var ctrl = this.controls[i]; 
          if(ctrl.visible) result.push({field:ctrl.fieldName, value:ctrl.editControl.value}) 
          else             result.push({field:ctrl.fieldName, value:ctrl.value}) 
    } 
    
    return result;
  }



}  

//---------------------------------------------------------------------------


export class TPropertyEditor
//  properties = [{level:1, label:"Beschriftung" , value:"Wert" , type:"text" , items:["item1" , "item2" , ... , "itemx"] } , {} , {} ]
{
  constructor( aParent , aProperties , aBtnSave , aCallBack_onSave )
  {
    this.parent           = aParent;
    this.properties       = aProperties;
    this.btnSave          = aBtnSave;
    this.callBack_onSave  = aCallBack_onSave;  
    this.callBack_onDialog= null;
    this._level           = 999;

    if(this.btnSave)
    this.btnSave.callBack_onClick = function() { this.save() }.bind(this);
  }  

  set level( aLevel )
  {
    this._level = aLevel;
    this.render();
  }

  get level()
  {
    return this._level;
  }


  setProperties( properties )
  {
    this.properties = properties;
    this.render();
  }

  set visible( value)
  {
    this.parent.visible = value;
  }

  get visible()
  {
    return this.parent.visible;
  }
  
  
  render()
  { 
    this.parent.DOMelement.innerHTML           = '';
    this.parent.DOMelement.style.display       = 'block';
    this.parent.DOMelement.style.flexDirection = 'column';
  
   for (var i=0; i<this.properties.length; i++ )
  {
     var item   = this.properties[i];
     var select = item.items || [];   // falls Select - oder Combobox vorliegt...
     var dlg    = item.dialog;
     var w      = 2;
     if(dlg) w=1;

     
     if(item.level > this._level) continue;  // nur die Items rendern, die auf der aktuellen Ebene liegen
   
     var p = new TFPanel( this.parent , 0 , 0 , '99%' , '2.4em' , {css:"cssValueListPanel"});   // Dimension sind bereits im css definiert
         p.isGridLayout    = true;  // kommt vom css
         p.backgroundColor = (i % 2) != 0 ? "RGB(240,240,240)" : "RGB(255,255,255)"; 
         
     var l = new TFLabel( p , 2 , 2 , 1, 1 , {css:"cssBoldLabel" , caption:item.label} );
         l.textAlign = 'left';

     if((item.type.toUpperCase()=='TEXT') || (item.type.toUpperCase()=='INPUT'))
     { 
        if(select.length > 0) item.control = new TFComboBox( p , 3 , 2 , w , 1 , {value:item.value , items:item.items} )
        else                  item.control = new TFEdit    ( p , 3 , 2 , w , 1 , {value:item.value} );
     }  

     if(item.type.toUpperCase()=='SELECT')
      item.control = new TFSelectBox( p , 3 , 2 , w , 1 , {value:item.value , items:item.items} )
   
     
     if(item.type.toUpperCase()=='LOOKUP')
      item.control = new TFComboBox(p , 3, 2 , w , 1 ,   {lookUp:true,items:item.items,value:item.value});  
      


   if(item.type.toUpperCase()=='DATE')
    item.control = new TFEdit(p ,3,2,w,1,{type:"date",value:item.value});  
 
   if(item.type.toUpperCase()=='TIME')
    item.control = new TFEdit(p ,3,2,w,1,{type:"time",value:item.value});  
   
   if(item.type.toUpperCase()=='DATETIME')
    item.control = new TFEdit(p ,3,2,w,1,{type:"datetime-local",value:item.value});  
   
   
   if(item.type.toUpperCase()=='RANGE')
    item.control = new TFSlider(p ,3,2,w,1,{value:item.value});


   if((item.type.toUpperCase()=='CHECKBOX') || (item.type.toUpperCase()=='BOOLEAN'))
    item.control = new TFCheckBox(p,3,2,w,1,{value:item.value});

  // falls das Element mit einem Dialog verknüpft ist ....
  if(dlg)
  {
    var btn = new TFButton(p,4,2,1,1,{glyph:"whmcs"});
        btn.backgroundColor = "rgba(0,0,0,0.5)";
        btn.height          = '1.7em';
        btn.margin          = '2px';
        btn.borderRadius    = '2px';

        btn.dataBinding = {item:item}
        btn.callBack_onClick = function (e,d) {if ( this.callBack_onDialog) this.callBack_onDialog(d.item) }.bind(this)
  }



 }

 }


propertyControlByName( name )
{
  for (var i=0; i<this.properties.length; i++ )
  {
    var item = this.properties[i];
    if (item.label.toUpperCase() == name.toUpperCase()) return item.control;
  }  
  return null;
} 



save()
{
  var p=[];

  for (var i=0; i<this.properties.length; i++ )
  {
    var item = this.properties[i];
    if(item.level > this._level) continue;  // nur die Items auf der aktuellen Ebene speichern
      if (item.control) 
      {
        item.value = item.control.value;
           p.push({label:item.label , value:item.value});
      }   
  }  
    if(this.callBack_onSave) this.callBack_onSave(p)
}    


}  // end of class TPropertyEditor



export class TFileDialog
{
  constructor( params )
  {
    this.mask             = params.mask || '*.*';
    this.showHiddenFiles  = params.showHiddenFiles || false;  
    this.multiple         = params.multiple || false;
    this.callBackOnSelect = params.callBackOnSelect || null;
    this.onSelectionChanged = params.onSelectionChanged || null;
    this.width            = params.width || '50%';
    this.height           = params.height || '70%';
    this.caption          = params.caption || 'Dateiauswahl';
    this.root             = params.root || './';
    this.thumbView        = false;
    this.fullPath         = '';
    this.dir              = '';
    this.file             = '';
    this.node             = null;
    this.files            = [];
    this.fileGrid         = null;
    this.wnd              = new TFWindow( null , this.caption , this.width , this.height , 'CENTER' );
    this.wnd.buildGridLayout_templateColumns('1fr');
    this.wnd.buildGridLayout_templateRows('4.2em 1fr 4em');
    
    var hlp1               = new TFPanel( this.wnd.hWnd , 1 , 1 , 1 , 1 , {css:'cssContainerPanel'} );
        hlp1.buildGridLayout_templateColumns('1fr 1fr 4em 3em');
        hlp1.buildGridLayout_templateRows('1fr');
    this.editFilePath     = new TFEdit    ( hlp1 , 1 , 1  , 1 , 1 , {caption:"Filename",labelPosition:"TOP" } );
    this.cbBookmarks      = new TFComboBox( hlp1 , 2 , 1  , 1 , 1 , {caption:"Lesezeichen", items:[], labelPosition:"TOP"  } );   
    this.editFileExt      = new TFEdit    ( hlp1 , 3 , 1  , 1 , 1 , {caption:"Typ",value:this.mask,labelPosition:"TOP"} );
    this.editFileExt.callBack_onChange = function() { this.renderFiles() }.bind(this);
    
    var hlp2              = new TFPanel( hlp1 , 4 , 1 , 1 , 1 , {css:'cssContainerPanel'} );
    hlp2.padding          = 0;
    hlp2.margin           = '4px';

    hlp2.backgroundColor  = "gray";
    hlp2.buildFlexBoxLayout();
    this.thumbViewBtn     = new TFButton( hlp2 , 0 , 0  , "100%" , '100%' , {caption:"."} );
    this.thumbViewBtn.margin = 0;
    this.thumbViewBtn.alignItems = 'center';
    this.thumbViewBtn.callBack_onClick = function() { this.thumbView = !this.thumbView; this.renderFiles() }.bind(this);
  
    

    var btbPanel = new TFPanel( this.wnd.hWnd , 1 , 3 , 1 , 1 , {} );
        btbPanel.backgroundColor = "gray";
        btbPanel.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr 1fr');
        btbPanel.buildGridLayout_templateRows('1fr');
    var cbHiddenFiles = new TFCheckBox( btbPanel , 1 , 1 , 1 , 1 , {caption:'hidden'} );
        cbHiddenFiles.callBack_onChange = function(checked) { this.showHiddenFiles = checked; this.scanDir( this.dir ) }.bind(this);

    var btnOk = new TFButton( btbPanel , 2 , 1 , 1 , 1 , {caption:'OK'} );
        btnOk.height = 27;
        btnOk.callBack_onClick = function() { this.callBackOnSelect( this.dir , this.editFilePath.value , this.files ) }.bind(this);

    var btnCancel = new TFButton( btbPanel , 4 , 1 , 1 , 1 , {caption:'Abbruch'} );
        btnCancel.height = 27;
        btnCancel.callBack_onClick = function() { this.wnd.destroy() }.bind(this);      


    var p = new TFPanel( this.wnd.hWnd , 1 , 2 , 1 , 1 , {css:'cssContainerPanel'} );
        p.buildGridLayout_templateColumns('1fr 1fr');
        p.buildGridLayout_templateRows('1fr');

    this.panelPath       = new TFPanel( p , 1 , 1 , 1 , 1 );
    this.panelFiles      = new TFPanel( p , 2 , 1 , 1 , 1 );

    this.pathTree        = new TFTreeView( this.panelPath , {} );

    this.scanDir( this.root );
  } 


  scanDir( node_or_dir )
  {
    
    this.files = [];

    // String ?
    if( typeof node_or_dir === 'string') {this.node=null; this.dir=node_or_dir}
    else
        {
          if (node_or_dir.constructor.name=="TFTreeNode") 
            {
              var s =[];
              this.node  = node_or_dir;
              var p=this.node.getNodePath();
              p.forEach((aNode,i)=>{s.push(aNode.content.name)});
              this.dir = utils.pathJoin(this.root , s.join('/') );
           }
      }    
  
    var response=utils.webApiRequest('scanDir', {dir:this.dir , fileExt:this.editFileExt.value} );

    if(response.error) return false;
    
    for(var i=0; i<response.result.length; i++)
    {
      var f = response.result[i];
      if(f.name.startsWith('.') && !this.showHiddenFiles) continue;
      if(f.isDir) 
      {
        if(this.node) var n = this.pathTree.addSubNode( this.node , f.name , f );
        else          var n = this.pathTree.addNode( f.name , f );
        n.callBack_onClick = function(selectedNode){ this.scanDir( selectedNode ) }.bind(this);
      }  
      if(f.isFile) this.files.push(f);
    } 
  
    this.pathTree.render(); 
    this.renderFiles();
    
  }

  renderFiles()
  {
    if(this.thumbView) this.#renderFiles_ThumbView();
    else               this.#renderFiles_GridView();
  } 


  #renderFiles_ThumbView()
  {
    this.panelFiles.innerHTML = '';
    this.panelFiles.backgroundColor = 'white';
    this.panelFiles.buildFlexBoxLayout();
   
    for (var i=0; i<this.files.length; i++) 
    {
      var filePath      = utils.pathJoin(this.dir , this.files[i].name ) 
      var ext           = this.files[i].ext.toLowerCase();
      var t             = new TFPanel( this.panelFiles , 1 , 1 , "77px" , "77px" , {dragable:true,draggingData:this.files[i]} );
          t.dataBinding = {name:this.files[i].name, ext:this.files[i].ext, formatedSize:utils.formatFileSize(this.files[i].size)  ,size:this.files[i].size, path:this.dir};
               
          t.margin      = '4px';
          t.callBack_onClick = function (e, d) 
          { 
            this.handleFileSelection( d ) 
          }.bind(this);


      if (utils.isImageFile(ext))
      {
       //var img=new TFImage( t, 0,0,'100%','100%');
      t.imgURL = utils.buildURL('GETIMAGEFILE',{fileName:filePath } );
      }     
      else t.innerHTML = '<div style="width:100%;height:100%;background-color:white;">' + this.files[i].name + '</div>'; 
    }
  }

  #renderFiles_GridView()
  {
    this.panelFiles.innerHTML = '';
    this.panelFiles.backgroundColor = 'white';
    this.fileGrid             = null;
    
    var f=[];
    for (var i=0; i<this.files.length; i++) 
        f.push({name:this.files[i].name, ext:this.files[i].ext, formatedSize:utils.formatFileSize(this.files[i].size)  ,size:this.files[i].size, path:this.dir})
         
    if( this.files.length==0) f.push({name:'empty', ext:'', formatedSize:'', size:0 , path:''});

    this.fileGrid  = new THTMLTable( f , ['path','ext','size'] );
    this.fileGrid.fieldByName('name').caption = 'Dateiname';
    this.fileGrid.fieldByName('formatedSize').caption = 'Größe';
    this.fileGrid.fieldByName('formatedSize').columnWidth = '7em';
    this.fileGrid.onRowClick = function(row , i , jsn )
                               {
                                this.handleFileSelection( jsn )
                              }.bind(this);

    this.fileGrid.build( this.panelFiles  );
  
 }


 handleFileSelection( file )
 {
  var f = utils.pathJoin(file.path , file.name );
  this.editFilePath.value = f;
   if(this.onSelectionChanged) this.onSelectionChanged(f);
 }


     
}


export function addComponent(parent , component , callBackOnCreate )
{ 
  var compType = (component.objName || '').toUpperCase();
  var c = null;
 
  if(compType === 'TFPANEL') 
  { 
    c = new TFPanel(parent, component.left, component.top, component.width, component.height, {} );
    c.buildGridLayout(component.gridLayout)
    c.setProperties(component);
    if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFBUTTON') 
  { 
    c = new TFButton(parent, component.left, component.top, component.width, component.height, {} );
    c.setProperties(component);
    if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFLABEL') 
  { 
    c = new TFLabel(parent, component.left, component.top, component.width, component.height, {} );
    c.setProperties(component);
    if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFEDIT') 
  { 
    var t = 'text';
    if(component.hasOwnProperty('typ')) t = component.typ;
    c = new TFEdit(parent, component.left, component.top, component.width, component.height, {type:t} );
    c.setProperties(component);
    if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFCHECKBOX') 
  { 
     c = new TFCheckBox(parent, component.left, component.top, component.width, component.height, {} );
    c.setProperties(component);
    if(callBackOnCreate) callBackOnCreate(c);
  } 

  if(compType === 'TFSLIDER') 
  { 
     c = new TFSlider(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFANALOGCLOCK') 
  { 
     c = new TFAnalogClock(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFCOMBOBOX') 
  { 
     c = new TFComboBox(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }

    if(compType === 'TFSELECTBOX') 
  { 
     c = new TFSelectBox(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }

  if(compType === 'TFLISTBOX') 
  { 
     c = new TFListBox(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }


  if(compType === 'TFLISTCHECKBOX') 
  { 
     c = new TFListCheckbox(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }


  if(compType === 'TFIMAGE') 
  { 
     c = new TFImage(parent, component.left, component.top, component.width, component.height, {} );
     c.setProperties(component);
     if(callBackOnCreate) callBackOnCreate(c);
  }




  if(c!=null)
    if(component.hasOwnProperty('children') && Array.isArray(component.children))
      {
        component.children.forEach(child => {addComponent(c, child , callBackOnCreate || null );})
      }
}





export class TFColorDialog 
{
  constructor(initialColor = '#000000', onSelect = null) 
  { 
    this.onSelect = onSelect;

    this.colors = [
    // Grauabstufungen
    "#000000", "#333333", "#444444", "#666666", "#888888", "#999999", "#cccccc", "#e6e6e6", "#f2f2f2", "#ffffff",

    // Rottöne
    "#800000", "#ff0000", "#ff3300", "#ff6600", "#ff9999", "#ffcc00", "#ffccff", "#ff0033",

    // Grüntöne
    "#008000", "#00ff00", "#33ff00", "#66ff00", "#99ff99", "#ccff00", "#00ff33",

    // Blautöne
    "#000080", "#0033ff", "#0000ff", "#0066ff", "#9999ff", "#00ccff", "#00ffff",

    // Gelb-/Orangetöne
    "#808000", "#999900", "#ccff00", "#ffff00",

    // Pink-/Violetttöne
    "#800080", "#990099", "#cc00ff", "#ff00ff", "#ff00cc", "#3300ff", "#6600ff",

    // Türkis-/Cyan-/Mischfarben
    "#008080", "#009999", "#00ffcc", "#00ff66"];
    
    this.colorPanels = []; 
    this.dlgWnd      = createWindow(null,"colorPicker","20%","25%","CENTER");
    this.dlgWnd.buildGridLayout_templateColumns('1fr');
    this.dlgWnd.buildGridLayout_templateRows('1fr 3.5em');

    var body                 = addPanel(this.dlgWnd.hWnd,'cssContainerPanel',1,1,1,1);
        body.backgroundColor = "rgba(0,0,0,0.07)"
      
    var footer    = addPanel(this.dlgWnd.hWnd,'cssContainerPanel',1,2,1,1);
        footer.buildGridLayout_templateColumns("1fr 1fr 1fr 1fr 1fr 1fr");
        footer.buildGridLayout_templateRows('1fr');
        footer.marginLeft   = '4px';
        footer.marginRight  = '4px';
        footer.marginBottom = '4px'; 

    this.currentColor = addPanel(footer,"",6,1,2,1);
    this.currentColor.backgroundColor = initialColor;

    this.currentRGB       = addLabel(footer,"",4,1,2,2,"");
    this.currentRGB.color = 'gray';
    this.currentRGB.size  = '0.77em';


    var btnOk        = addButton(footer,'',1,1,1,1,{glyph:"circle-check"});
        btnOk.height = '2em';
        btnOk.width  = '3em';
        btnOk.callBack_onClick =  function(){if(onSelect) onSelect(this.currentColor.backgroundColor) ; this.dlgWnd.close() }.bind(this);

    var btnAbort  = addButton(footer,'cssAbortBtn01',2,1,1,1,{glyph:"circle-xmark"});
        btnAbort.height = '2em';
        btnAbort.width  = '3em';
        btnAbort.callBack_onClick = function(){this.dlgWnd.close()}.bind(this);


    var btnPicker = addButton(footer,'',3,1,1,1,{glyph:"magnifying-glass"});
        btnPicker.height           = '2em';
        btnPicker.width            = '3em';
        btnPicker.backgroundColor  = 'gray';
        btnPicker.callBack_onClick = function(){ 
                                                 this.input.value = utils.rgbStringToHex(this.currentColor.backgroundColor);
                                                 this.input.click();
                                               }.bind(this); 

    
    body.buildGridLayout("7x7");
    var gx=0; 
    var gy=1;
    for(var c=0; c<this.colors.length;c++)
    {
      gx++;
      if(gx>7){gx=1;gy++}
      var cp = new TFPanel(body,gx,gy,1,1,{css:'csContainerPanel'});
          this.colorPanels.push(cp);
          
          cp.shadow          = '4';
          cp.margin          = '2px';
          cp.borderColor     = 'rgba(0,0,0,0.77)';
          cp.borderWidth     = '1px';
          cp.borderRadius    = '2px';
          cp.backgroundColor = this.colors[c];
          cp.callBack_onClick = function()
                                          { 
                                            this.self.colorPanels.forEach((p)=>{p.borderWidth='1px'}) 
                                            this.cp.borderWidth='3px'
                                            this.self.currentColor.backgroundColor = this.cp.backgroundColor;
                                            this.self.currentRGB.caption           = this.cp.backgroundColor; 
                                          }.bind({self:this,cp:cp})

    }  
     
     this.input                     = document.createElement('input');
     this.input.type                = 'color';
     this.input.style.position      = 'fixed';
     this.input.style.opacity       = '0';        // bleibt unsichtbar
     this.input.style.pointerEvents = 'auto';
     this.input.value               = utils.rgbStringToHex(initialColor);

    // Event für Auswahl
    this.input.addEventListener('input', function() {
                                                      this.currentColor.backgroundColor = this.input.value;
                                                      this.currentRGB.caption           = utils.hexToRgbString(this.input.value);
                                                    }.bind(this));
    this.dlgWnd.hWnd.appendChild(this.input);
  }  

}



export class TFLoader 
{
  constructor( params )
  {
    params      = params || {}
    this.title  = params.title || "Lade Daten …";
    this.note   = params.note || "Bitte einen Moment Geduld.";
    this.parent = params.parent || document.body;
    this.overlay = null;
  }

  show() 
  {
    if (this.overlay) return;
    const overlay = document.createElement('div');
    overlay.className = 'tf-loader';
    overlay.innerHTML = `
      <div class="tf-loader-card">
        <svg class="tf-spinner" viewBox="0 0 50 50">
          <g class="ring">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
          </g>
        </svg>
        <div class="tf-loader-title">${this.title}</div>
        <div class="tf-loader-note">${this.note}</div>
      </div>`;
    this.parent.appendChild(overlay);
    this.overlay = overlay;
  }

  hide() 
  {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
  }

  /** Loader sichtbar, solange Promise läuft */
 async while(promise, { minMs = 0 } = {}) 
 {
    this.show();
    const start = Date.now();
    try {
         const value      = await promise;                           // warte auf Promise
         const elapsed    = Date.now() - start;
         const remaining  = Math.max(0, minMs - elapsed);
      if (remaining > 0) { await TFLoader.wait(remaining); }         // ggf. Mindestzeit auffüllen
      
      return value;
    } finally {
      this.hide();
    }
  }

  /** Kleine Helferfunktion: Promise, das nach ms auflöst */
  static wait(ms) 
  {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
