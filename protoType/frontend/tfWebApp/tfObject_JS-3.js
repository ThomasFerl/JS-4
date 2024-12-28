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
    this.params       = params;
    this.params.left  = left  || 1;
    this.params.top   = top   || 1;
    this.params.width = width || 1;
    this.params.height= height|| 1;

    this.isTFObject   = true;
    this.objName      = this.constructor.name;  
    this.ID           = this.objName + Date.now()+Math.round(Math.random()*100);
    this.dataBinding  = {};
    this.childList    = [];
    this.DOMelement   = null;
    this.layout       = ()=>{return window.getComputedStyle(this.DOMelement).getPropertyValue("display").toUpperCase()};
    
    this.hasGridLayout= ()=> { return this.layout == 'GRID'; }; 
        
    this.grid         = {left:0, top:0, width:0, height:0};
    this.shadow       = {dept:0}
    
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

    if (params) this.params = params; 
    else        this.params = {stretch:true};

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
     
    this.callBack_onKeypress   = undefined;
    this.callBack_onKeyDown    = undefined;
    this.callBack_onKeyUp      = undefined;
    this.callBack_onClick      = undefined;
    this.callBack_onDblClick   = undefined;
    this.callBack_onMouseDown  = undefined;
    this.callBack_onMouseUp    = undefined;
    this.callBack_onWheel      = undefined;
    this.callBack_onMouseMove  = undefined;
    this.callBack_onMouseOut   = undefined;
  }

  render()
  {
    this.DOMelement = document.createElement('DIV'); 
     
    if(this.params.css) this.DOMelement.className =  this.params.css;
    else                this.DOMelement.className = "cssObject";
    this.DOMelement.setAttribute('ID'   ,  this.ID );
      
        this.DOMelement.data         =  this;
        this.DOMelement.onclick      =  function(e){ if(callBack_onClick)     callBack_onClick    (e,this.dataBinding)}.bind(this);
        this.DOMelement.ondblclick   =  function(e){ if(callBack_onDblClick)  callBack_onDblClick (e,this.dataBinding)}.bind(this);
        this.DOMelement.onKeydown    =  function(e){ if(callBack_onKeyDown)   callBack_onKeyDown  (e,this.dataBinding)}.bind(this);
        this.DOMelement.onKeyup      =  function(e){ if(callBack_onKeyUp)     callBack_onKeyUp    (e,this.dataBinding)}.bind(this);
        this.DOMelement.onwheel      =  function(e){ if(callBack_onWheel)     callBack_onWheel    (e,this.dataBinding)}.bind(this);
        this.DOMelement.onmousemove  =  function(e){ if(callBack_onMouseMove) callBack_onMouseMove(e,this.dataBinding)}.bind(this);
        this.DOMelement.onmouseout   =  function(e){ if(callBack_onMouseOut)  callBack_onMouseOut (e,this.dataBinding)}.bind(this);
        this.DOMelement.onmousedown  =  function(e){ if(callBack_onMouseDown) callBack_onMouseDown(e,this.dataBinding)}.bind(this);
        this.DOMelement.onmouseup    =  function(e){ if(callBack_onMouseUp)   callBack_onMouseUp  (e,this.dataBinding)}.bind(this);

    this.parent.appendChild( this.DOMelement );    
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
    this.DOMelement.style.justifyContent = value;  
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

  
  set width( value )
  {
    utils.log(this.objName+" set width -> "+value)

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.width = value;
    else              if(this.DOMelement) this.DOMelement.style.width = value+'px';
    
  } 

  get width()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.clientWidth;
    return r;
  } 


  set height( value )
  {
    utils.log(this.objName+" set height -> "+value)

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.height = value;
    else              if(this.DOMelement) this.DOMelement.style.height = value+'px';
    
  } 

  get height()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.clientHeight;
    return r;
  } 
  
  set left( value )
  { 
    utils.log(this.objName+" set Left -> "+value)
    this.DOMelement.style.position = 'relative';

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.left = value;
    else              if(this.DOMelement) this.DOMelement.style.left = value+'px';
    
  } 

  get left()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.left;
  } 


  set right( value )
  { 
    utils.log(this.objName+" set Right -> "+value)
    this.DOMelement.style.position = 'relative';

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.width = value - this.left;
    else              if(this.DOMelement) this.DOMelement.style.width = (value - this.left)+'px';
    
  } 

  get right()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.left + rect.width;
  } 


  set top( value )
  {
      utils.log(this.objName+" set top -> "+value)
      this.DOMelement.style.position = 'relative';
      
      if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.top = value;
      else              if(this.DOMelement) this.DOMelement.style.top = value+'px';
  } 

  get bottom()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.top + rect.height;
  } 

  
  set bottom( value )
  {
      utils.log(this.objName+" set top -> "+value)
      this.DOMelement.style.position = 'relative';
      
      if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.height = value - this.top;
      else              if(this.DOMelement) this.DOMelement.style.height = (value - this.top)+'px';
  } 


  get top()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.top;
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

  set borderRadius( value )
  {
    if(this.DOMelement) this.DOMelement.style.borderRadius = value;
  }

  get borderRadius()
  {
    return this.DOMelement.style.borderRadius;
  }



  set shadow( value )
  {
   this._shadowDepth = value; 
    if(this.DOMelement) this.DOMelement.style.boxShadow = value+"px "+value+"px "+(value*2)-1+"px rgba(0,0,0,0.7)";
  }


  get shadow()
  { 
    return this._shadowDepth; 
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





//////////////////////////////////////////////////////////////////////////



export class Screen
{
  constructor()
  {
    this.backgroundImage            = document.createElement('DIV');
    this.backgroundImage.className  = "cssBackgroundImage";
    window.document.body.appendChild(this.backgroundImage);
    
    this.objName                 = "SCREEN"  
    this.isTFObject              = true;
    this.isGridLayout            = true;
    this.left                    = 0;
    this.top                     = 0;
    this.width                   = window.innerWidth;
    this.height                  = window.innerHeight;
    
    this.DOMelement              = document.createElement('DIV');
    this.DOMelement.className    = "cssScreen";
    window.document.body.appendChild(this.DOMelement);
    this.DOMelement.data         = this;
    
    this.DOMelement.onclick      = _internHandle_onClick.bind(this);
    this.DOMelement.ondblclick   = _internHandle_onDblclick.bind(this);
    this.DOMelement.onkeypress   = _internHandle_onKeypress.bind(this);
    this.DOMelement.onkeydown    = _internHandle_onKeyDown.bind(this);
    this.DOMelement.onkeyup      = _internHandle_onKeyUp.bind(this);
    this.DOMelement.onwheel      = _internHandle_onWheel.bind(this);
    this.DOMelement.onmousemove  = _internHandle_onmousemove.bind(this);
    this.DOMelement.onmouseout   = _internHandle_onmouseout.bind(this);
    this.DOMelement.onmousedown  = _internHandle_onmousedown.bind(this);
    this.DOMelement.onmouseup    = _internHandle_onmouseup.bind(this);
   
    this.childList               = [];
    this.mouse                   = {clientX:0 , 
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



    
    this.callBack_onKeypress     = undefined;
    this.callBack_onKeyDown      = undefined;
    this.callBack_onKeyUp        = undefined;
    this.callBack_onClick        = undefined;
    this.callBack_onDblClick     = undefined;
    this.callBack_onMouseDown    = undefined;
    this.callBack_onMouseUp      = undefined;
    this.callBack_onWheel        = undefined;
    this.callBack_onMouseMove    = undefined;
    this.callBack_onMouseOut     = undefined;
 
    window.addEventListener('resize',  function() 
                                       {  
                                         this.width  = window.innerWidth;
                                         this.height = window.innerHeight;
                                         utils.log("update ScreenSize: Height=" + this.height + " / Width="+this.width);
                                       } );
                                       

         
  } 
  
  appendChild(aDOMelement) 
  {
    this.DOMelement.appendChild(aDOMelement); 
    this.childList.push(aDOMelement);
  }

  setBackgroundImage( path )
  {
    this.backgroundImage.style.backgroundImage = "url('"+path+"')";
  }


  set HTML( st ) {this.DOMelement.innerHTML = st;}
  get HTML() { return this.DOMelement.innerHTML;}

}


export class TFObject
{
  constructor (parent , left , top , width , height , params ) // aParent ist entweder ein TFObject oder ein DOMelement // aParams : JSONStruct
  {
    utils.log('[ TFObject ] -> ' + this.constructor.name + '-> left:'+left+'  top:'+top+'  width:'+width+'  height:'+height)
    
    this._gridWidth   = 0;
    this._gridHeight  = 0;
    this._shadowDepth = 0;

    this.isTFObject   = true;
    this.objName      = this.constructor.name;  
    this.dataBinding  = {};
    this.layout       = '';
    this.isGridLayout = false;
    this.attachment   = null;
    
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


    var parentWidth   = 0;
    var parentHeight  = 0;

    if (params) this.params = params; 
    else        this.params = {stretch:true};

    if (parent) 
    {
      if(utils.isHTMLElement(parent)) 
      {
        this.parent             = {isTFObject:false};
        this.parent.objName     = 'HTMLelement';
        this.parent.isGridLayout= window.getComputedStyle(parent).getPropertyValue("display")=='grid';
        this.parent.DOMelement  = parent;
        parentWidth             = parent.clientWidth;
        parentHeight            = parent.clientHeight;
        this.parent.appendChild = function (child) {this.parent.DOMelement.appendChild(child)}.bind(this);
      }
      else {
             this.parent  = parent; 
             parentWidth  = parent.DOMelement.clientWidth
             parentHeight = parent.DOMelement.clientHeight;
      }  
    }  
    else
        {
          if(globals.webApp) 
          {
            if(globals.webApp.activeWorkspace) this.parent  = globals.webApp.activeWorkspace;  
                                               this.parent  = globals.Screen;
            utils.log("TFObject.constructor() ... parent ermittelt aus Workspace:"+this.parent);
          }
          else
          { 
            this.parent = globals.Screen;
            utils.log("TFObject.constructor() ... parent ermittelt aus screen:"+this.parent);
          }  

          parentWidth  = this.parent.DOMelement.clientWidth
          parentHeight = this.parent.DOMelement.clientHeight;
    }  

    utils.log("-parent----------> " + this.parent.objName);
    utils.log("-parentWidth-----> " + parentWidth + " / parentHeight-----> " +parentHeight);
    
    
  utils.log(this.objName+".constructor() aParent:"+this.parent.constructor.name+"  left:"+left+"  top:"+top+"  width:"+width+ "  height:"+height );
 
  if(!this.params.dontRegister)
    { 
      // nur wenn das Parent ein TFObj. ist wird das akt. Obj. in die Childlist des Parents eingefügt
      if(this.parent.isTFObject) 
      {
        utils.log("TFObject.constructor() ... parent ist ein tfObject -> this in parent.childList pushen");
        utils.log("--------> " + this.parent.constructor.name )
        if(this.parent) 
           if(this.parent.childList) this.parent.childList.push(this);
      }
      else utils.log("TFObject.constructor() ... parent ist KEIN tfObject -> keine Registrierung innerhalb der tfObjekt-Hirachie ");
    }  
    else utils.log("TFObject.constructor() ... dotRegister=true -> keine Registrierung innerhalb der tfObjekt-Hirachie ");

    this.childList             = [];
    this.callBack_onKeypress   = undefined;
    this.callBack_onKeyDown    = undefined;
    this.callBack_onKeyUp      = undefined;
    this.callBack_onClick      = undefined;
    this.callBack_onDblClick   = undefined;
    this.callBack_onMouseDown  = undefined;
    this.callBack_onMouseUp    = undefined;
    this.callBack_onWheel      = undefined;
    this.callBack_onMouseMove  = undefined;
    this.callBack_onMouseOut   = undefined;

    if(this.params.object) 
    {
        utils.log("TFObject.constructor() ..."+this.params.object+" mit className: "+this.params.css+" wird als DOMelement erzeugt");
       
        this.DOMelement = document.createElement(this.params.object); 
        if(this.params.css) this.DOMelement.className =  this.params.css;
        else                this.DOMelement.className = "cssObject";
            
        var hID = Math.round(Math.random()*1000000000);
        this.name = this.params.object + "_" + hID
         this.DOMelement.setAttribute('ID'   ,  'ID_'+hID);
                
        //===========================================================================================
        // Überprüfen, ob das Grid-Layout angewendet wird, indem die "display" CSS-Eigenschaft ermittelt wird ...
        // dieser Wert ist NUR für die Childs von Interesse, die dann jeweils über if(parent.isGridLayout) jeweils reagieren ...
        this.layout       = window.getComputedStyle(this.DOMelement).getPropertyValue("display");
        this.isGridLayout = this.layout == 'grid';
        //==========================================================================================
  
        if(this.parent.isGridLayout)
        {
          var gridDim = utils.getGridLayoutDimension( this.parent );
          utils.log("Das Parent-Objekt besitzt ein Grid-Layout ->");
          utils.log(JSON.stringify(gridDim));

          // ggf. dafür sorgen, dass das Client-Item sich ausdeht
          if(params.stretch==true) this.parent.DOMelement.style.alignItems='stretch';

          // in einem Grid-Layout ergeben Pixelangaben keinen Sinn, daher werden solche Parameter im Sinne eines robusten Verhaltens umgewandelt...
          var h = ""+left;
          if(h.indexOf("px")>-1) left = h.slice(0,h.indexOf("px"));
          if(h.indexOf("%")>-1)  left = h.slice(0,h.indexOf("%"));
          if(h.indexOf("em")>-1) left = h.slice(0,h.indexOf("em"));
          if(h.indexOf("max")>-1) 
          {
            var ev = utils.evaluate(h)
            if(ev.strVal=='max') left = Math.floor(utils.calculate( gridDim.gridColumnCount , ev.operator , ev.numVal));  
            utils.log("C A L C U L A T E  left: " + left );       
          }  
            
          var h = ""+top;
          if(h.indexOf("px")>-1) top = h.slice(0,h.indexOf("px"));
          if(h.indexOf("%")>-1)  top = h.slice(0,h.indexOf("%"));
          if(h.indexOf("em")>-1) top = h.slice(0,h.indexOf("em"));
          if(h.indexOf("max")>-1) 
          {
            var ev = utils.evaluate(h)
            if(ev.strVal=='max') top = Math.floor(utils.calculate(gridDim.gridRowCount , ev.operator , ev.numVal));  
            utils.log("C A L C U L A T E :  top:" + top );       
          }  

          var h = ""+width;
          if(h.indexOf("px")>-1) width = h.slice(0,h.indexOf("px"));
          if(h.indexOf("%")>-1)  width = h.slice(0,h.indexOf("%"));
          if(h.indexOf("em")>-1) width = h.slice(0,h.indexOf("em"));
          if(h.indexOf("max")>-1) 
          {
            var ev = utils.evaluate(h)
            if(ev.strVal=='max') width = Math.floor(utils.calculate( gridDim.gridColumnCount , ev.operator , ev.numVal));  
            utils.log("C A L C U L A T E :  width:" + width );       
          }  
          
          var h = ""+height;
          if(h.indexOf("px")>-1) height = h.slice(0,h.indexOf("px"));
          if(h.indexOf("%")>-1)  height = h.slice(0,h.indexOf("%"));
          if(h.indexOf("em")>-1) height = h.slice(0,h.indexOf("em"));
          if(h.indexOf("max")>-1) 
          {
            var ev = utils.evaluate(h)
            if(ev.strVal=='max') height = Math.floor(utils.calculate( gridDim.gridRowCount , ev.operator , ev.numVal));  
            utils.log("C A L C U L A T E  height:" + height );       
          }  


          // wenn jetzt immer noch ein nicht numerischer Wert vorliegt, wird davon ausgegangen,
          // dass es sich um eine gridAerea-Zuordnung handelt.
          if (isNaN(left)) { utils.log("Set gridArea -> "+left);   this.DOMelement.style.gridArea = left;  }
          else
                {
                  utils.log("left="+left+"  top="+top+"   width="+width+"  height="+height );
                  var ce = parseInt(left) + parseInt(width);
                  var re = parseInt(top)  + parseInt(height);
                  utils.log("gridColumnStart="+left+"  gridRowStart="+top+"   gridColumnEnd="+ce+"  gridRowsEnd="+re );
                  this.DOMelement.style.gridColumnStart = left;
                  this.DOMelement.style.gridRowStart    = top;
                  this.DOMelement.style.gridColumnEnd   = ce;
                  this.DOMelement.style.gridRowEnd      = re;

                  this.gridLeft   = left;
                  this.gridTop    = top;
                  this.gridWidth  = parseInt(width); 
                  this.gridHeight = parseInt(height);
                  
                }
        }
        else  
            { 
              utils.log("Das Parent-Objekt besitzt kein Grid-Layout");
              //this.DOMelement.style.display       = "flex";
              //this.DOMelement.style.flexFlow      = "wrap";

              this.gridLeft   = 0;
              this.gridTop    = 0;
              this.gridWidth  = 0;
              this.gridWeight = 0;

              // prüfen auf metaPositionierung....
              var h = ""+left;
              if(h.indexOf("max")>-1) 
              {
                var ev = utils.evaluate(h)
                utils.log(JSON.stringify(ev));
                if(ev.strVal=='max') left = Math.floor(utils.calculate( parentWidth  , ev.operator , ev.numVal) );  
                utils.log("C A L C U L A T E  left: " + left );       
              }  


              var h = ""+top;
              if(h.indexOf("max")>-1) 
              {
                var ev = utils.evaluate(h)
                utils.log("evaluate: " + JSON.stringify(ev));
                if(ev.strVal=='max') top = Math.floor(utils.calculate( parentHeight  , ev.operator , ev.numVal) );  
                utils.log("C A L C U L A T E  top: " + top );       
              }  


              var h = ""+width;
              if(h.indexOf("max")>-1) 
              {
                var ev = utils.evaluate(h)
                if(ev.strVal=='max') width = Math.floor(utils.calculate( parentWidth  , ev.operator , ev.numVal) );  
                utils.log("C A L C U L A T E  width: " + width );       
              }  

              var h = ""+height;
              if(h.indexOf("max")>-1) 
              {
                var ev = utils.evaluate(h)
                if(ev.strVal=='max') height = Math.floor(utils.calculate( parentHeight  , ev.operator , ev.numVal) );  
                utils.log("C A L C U L A T E  height: " + height );       
              }  

              if(left==0)     this.left    = '1px';
              if(top==0)      this.top     = '1px';
              if(width==0)    this.width   = '1px';
              if(height==0)   this.height   = '1px';


              if(left)
                 if(isNaN(left)) this.left    = left;
                 else            this.left    = left + 'px';

              if(top)
                 if(isNaN(top))  this.top     = top;
                 else            this.top     = top + 'px';
              
              if(width)
                 if(isNaN(width))this.width   = width;
                 else            this.width   = width + 'px';
                 
              if(height)
                 if(isNaN(height)) this.height  = height;
                 else              this.height  = height + 'px';
            }  
      
        this.DOMelement.data         = this;
        this.DOMelement.onclick      = _internHandle_onClick.bind(this);
        this.DOMelement.ondblclick   = _internHandle_onDblclick.bind(this);
        this.DOMelement.onkeypress   = _internHandle_onKeypress.bind(this);
        this.DOMelement.onKeydown    = _internHandle_onKeyDown.bind(this);
        this.DOMelement.onKeyup      = _internHandle_onKeyUp.bind(this);
        this.DOMelement.onwheel      = _internHandle_onWheel.bind(this);
        this.DOMelement.onmousemove  = _internHandle_onmousemove.bind(this);
        this.DOMelement.onmouseout   = _internHandle_onmouseout.bind(this);
        this.DOMelement.onmousedown  = _internHandle_onmousedown.bind(this);
        this.DOMelement.onmouseup    = _internHandle_onmouseup.bind(this);

        if(this.parent.isTFObject)
        {
          utils.log("Variante1 parent==TFObject -> erzeugtes DOMelement "+this.params.object+" wird in "+this.parent.objName+" eingefügt");
          this.parent.DOMelement.appendChild( this.DOMelement );  
        }   
        else 
             {
              utils.log("Variante2 parent<>TFObject -> erzeugtes DOMelement "+this.params.object+" wird in parent -> "+this.DOMelement+" eingefügt");
              if(utils.isHTMLElement(this.parent)) this.parent.appendChild( this.DOMelement );
              else                                 this.parent.DOMelement.appendChild( this.DOMelement );
             }                                      
    }
    else this.DOMelement = null;

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



  set gridLeft( g )
  {
     console.log("set grid.left -> "+ g);
     this.DOMelement.display = 'grid'; 
     this.DOMelement.style.gridColumnStart = parseInt(g, 10);
     this.DOMelement.style.gridColumnEnd   = parseInt(g, 10) +  parseInt(this._gridWidth, 10);
  }           

  get gridLeft()
  {
    return parseInt(this.DOMelement.style.gridColumnStart,10); 
  }           


  set gridTop( g )
  {
     console.log("set grid.top -> "+ g);
     this.DOMelement.display = 'grid'; 
     this.DOMelement.style.gridRowStart = parseInt(g, 10);
     this.DOMelement.style.gridRowEnd   = parseInt(g, 10) + parseInt(this._gridHeight, 10);
  }           

  get gridTop()
  {
    return parseInt(this.DOMelement.style.gridRowStart,10); 
  }           



  set gridWidth( g )
  {
     console.log("set grid.width -> "+ g);
     this._gridWidth = g;
     this.DOMelement.display = 'grid'; 
     this.DOMelement.style.gridColumnEnd = parseInt(this.DOMelement.style.gridColumnStart,10) + parseInt(g,10);
  }           


  get gridWidth()
  {
    return  this._gridWidth;
  }           


  set gridHeight( g )
  {
     console.log("set grid.height -> "+ g);
     this._gridHeight        = g
     this.DOMelement.display = 'grid'; 
     this.DOMelement.style.gridRowEnd = parseInt(this.DOMelement.style.gridRowStart,10) + parseInt(g,10);
  }           

  get gridHeight()
  {
    return  this._gridHeight
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
    this.DOMelement.style.justifyContent = value;  
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

  
  set width( value )
  {
    utils.log(this.objName+" set width -> "+value)

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.width = value;
    else              if(this.DOMelement) this.DOMelement.style.width = value+'px';
    
  } 

  get width()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.clientWidth;
    return r;
  } 


  set height( value )
  {
    utils.log(this.objName+" set height -> "+value)

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.height = value;
    else              if(this.DOMelement) this.DOMelement.style.height = value+'px';
    
  } 

  get height()
  {
    var r=undefined;
    if(this.DOMelement)  r = this.DOMelement.clientHeight;
    return r;
  } 
  
  set left( value )
  { 
    utils.log(this.objName+" set Left -> "+value)
    this.DOMelement.style.position = 'relative';

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.left = value;
    else              if(this.DOMelement) this.DOMelement.style.left = value+'px';
    
  } 

  get left()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.left;
  } 


  set right( value )
  { 
    utils.log(this.objName+" set Right -> "+value)
    this.DOMelement.style.position = 'relative';

    if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.width = value - this.left;
    else              if(this.DOMelement) this.DOMelement.style.width = (value - this.left)+'px';
    
  } 

  get right()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.left + rect.width;
  } 


  set top( value )
  {
      utils.log(this.objName+" set top -> "+value)
      this.DOMelement.style.position = 'relative';
      
      if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.top = value;
      else              if(this.DOMelement) this.DOMelement.style.top = value+'px';
  } 

  get bottom()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.top + rect.height;
  } 

  
  set bottom( value )
  {
      utils.log(this.objName+" set top -> "+value)
      this.DOMelement.style.position = 'relative';
      
      if (isNaN(value)) if(this.DOMelement) this.DOMelement.style.height = value - this.top;
      else              if(this.DOMelement) this.DOMelement.style.height = (value - this.top)+'px';
  } 


  get top()
  {
    var rect = this.DOMelement.getBoundingClientRect();
    return rect.top;
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

  set borderRadius( value )
  {
    if(this.DOMelement) this.DOMelement.style.borderRadius = value;
  }

  get borderRadius()
  {
    return this.DOMelement.style.borderRadius;
  }



  set shadow( value )
  {
    this._shadowDepth = value; 
    if(this.DOMelement) this.DOMelement.style.boxShadow = value+"px "+value+"px "+(value*2)-1+"px rgba(0,0,0,0.7)";
  }


  get shadow()
  { 
    return this._shadowDepth; 
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



export class TFSlider
{
  constructor( aParent )
  {
    this.onChange = null;
    this.parent = aParent;
    this.parent.display = 'flex';
    this.parent.alignItems = 'center';
    this.parent.justifyContent = 'center'; 
    this.parent.DOMelement.style.overflow = 'hidden';

    this.slider = document.createElement('INPUT');
    this.slider.type = 'range';
    this.slider.min = 0;
    this.slider.max = 100;
    this.slider.value = 50;
    this.slider.step = 1;
    this.slider.style.width = '90%';
    this.slider.style.height = '90%';
    this.slider.style.backgroundColor  = this.parent.backgroundColor;
    this.slider.addEventListener("input", () => { if(this.onChange!=null) this.onChange(this.slider.value)});
    this.parent.appendChild(this.slider);

  } 

  set value( v )
  {
    this.slider.value = v;
  }

  get value()
  {
    return this.slider.value;
  }

  destroy()
  {
    this.parent.removeChild(this.slider);
  } 
}




export class TFLabel extends TFObject 
{
  
  constructor( aParent , left , top , aParams ) 
  {
    
    utils.log("TFLabel.constructor("+aParent+" , "+left+" , "+top+" , param: " + JSON.stringify(aParams) +")" );
  
    aParams.object               = "LABEL";
    if(!aParams.css) aParams.css = "cssLabel";

    super(aParent , left , top , "" , "1.2em" , aParams );
    
    this.caption    = aParams.caption;
    this.objName    = "TFLabel";
  } 
  
  set caption( value )
  {
    if(this.DOMelement) this.DOMelement.textContent = value;
  } 

  get caption()
  {
    return this.DOMelement.textContent;
  } 
}   //end class ...




export class TFPanel extends TFObject 
{
  constructor( aParent , left , top , width , height , aParams ) 
  {
    aParams.object               = "DIV";
    if(!aParams.css) aParams.css = "cssPanel";
    
    super( aParent , left , top , width , height , aParams);  

    this.objName    = "TFPanel";
  } 
  
  set caption( value )
  {
    if(this.DOMelement) this.DOMelement.textContent = value;
  } 

  get caption()
  {
    return this.DOMelement.textContent;
  } 

  setBackgroundImage( path )
  {
    this.DOMelement.style.backgroundSize    = "cover";
    this.DOMelement.style.backgroundRepeat  = "no-repeat";
    this.DOMelement.style.backgroundImage   = "url('"+path+"')";
  }



}   //end class ...



export class TFButton extends TFObject
{
  constructor( aParent , left , top , width , height , params )
  {
     params.object = "DIV";
     
     if (!params.css) params.css = "cssButton01";
  
      super( aParent , left , top , width , height , params);

      this.buttonText           = document.createElement('P');
      this.buttonText.className = "cssButtonText";

      if(params.css = 'cssButton01') this.buttonText.className = "cssButtonText";
      if(params.css = 'cssButton02') this.buttonText.className = "cssButtonText02";
      if(params.css = 'cssButton03') this.buttonText.className = "cssButtonText03";
      if(params.css = 'cssButton04') this.buttonText.className = "cssButtonText04";

      this.DOMelement.appendChild( this.buttonText );

      if(params.caption) this.caption = params.caption;
  
      this.objName    = "TFButton";
      this.callBack_onClick = () => {utils.log('unassigned button');};
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



export class TFileUploader
{
  constructor ( button , fileTyp , multiple , onChange )
 {
  this.uploader               = document.createElement("input");
  this.uploader.type          = 'file';
  this.uploader.multiple      = multiple;
  this.uploader.accept        = fileTyp;
  this.uploader.style.display = 'none';
      button.callBack_onClick = ()=>{this.uploader.click()}
      document.body.appendChild(this.uploader);
      
      // Event Listener hinzufügen, um die ausgewählten Dateien zu ggf verarbeiten / vorschauen / ...
      this.uploader.addEventListener('change', function() { if(onChange) onChange( this.files ); } ); 
}


async upload( pathName )
{
  const files    = this.uploader.files;

  for (let i = 0; i < files.length; i++) utils.uploadFileToServer(files[i], globals.session.userName+'_' + utils.buildRandomID(1), ()=>{console.log('uploaded ... ' + files[i] )} ) 



  /*
  const formData = new FormData();
    
  for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
    
  const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    const result = await response.text();
    console.log(result);
  */

}



}


export class TFCheckBox
{
  constructor ( aParent , params )  
  {
    this.objName                = this.constructor.name;  
    this.callBack_onChange      = undefined;
    this.callBack_onClick       = undefined;
    this.container              = undefined;
    this.left                   = params.left || 0
    this.top                    = params.top || 0;
    this.width                  = params.width || 1;
    this.height                 = params.height || 1;
        
    if (aParent) this.parent    = aParent; 
    else
        {
          if(globals.webApp) 
          {
            if(globals.webApp.activeWorkspace) this.parent = globals.webApp.activeWorkspace; 
            utils.log("TFObject.constructor() ... parent ermittelt aus Workspace:"+this.parent);
          }
          else
          { 
            this.parent = Screen;
            utils.log("TFObject.constructor() ... parent ermittelt aus screen:"+this.parent);
          }  
    } 
    
    
    this.container = new TFPanel(this.parent , this.left , this.top , this.width , this.height ,   {css:"cssPanelForInput" ,  dontRegister:false } );
   
    if(params.checkboxLeft) this.container.DOMelement.style.gridTemplateColumns  = '2em 1fr';
    else                    this.container.DOMelement.style.gridTemplateColumns  = '1fr 2em';
    this.container.DOMelement.style.gridTemplateRows                             = '1fr';

    if(params.checkboxLeft) this.container.DOMelement.style.gridTemplateAreas    = ' "checkbox editLabel" ';
    else this.container.DOMelement.style.gridTemplateAreas                       = ' "editLabel checkbox" ';

    this.label = document.createElement("LABEL");
    this.label.className = "cssLabelForInput";
    this.label.textContent = params.labelText || "";
    this.container.DOMelement.appendChild( this.label );  
     
    this.input             = document.createElement("INPUT");
    this.input.className   = "cssCheckBox";
    this.input.setAttribute('type' , 'checkbox');
    this.container.DOMelement.appendChild(  this.input ); 
    
    if(this.callBack_onChange) this.input.onchange = this.callBack_onChange;
    if(this.callBack_onClick)  this.input.onclick  = this.callBack_onClick;
    
  } 


  set DOMelement( value ) 
  {}

  get DOMelement()  
  {
    return this.container;
  }

  get checked()
  {
    utils.log(this.objName+'.get_checked: '+this.input.checked);
    return this.input.checked;
  }

  set checked( value )  
  {
    utils.log(this.objName+'.set_checked: '+value);
    this.input.checked = value;
  }


  onChange()
  {
    // callBack() 
  }

  set grid( g )
  {
     this.container.display = 'grid'; 
     this.container.style.gridColumnStart = g.left;
     this.container.style.gridRowStart    = g.top;  
     this.container.style.gridColumnEnd   = g.left + g.width; 
     this.container.style.gridRowEnd      = g.top  + g.height;  
  }           


  get grid()
  {
     var g = {left:0 , top:0 , width:0 , height:0};

      g.left   = this.container.style.gridColumnStart;
      g.top    = this.container.style.gridRowStart;
      g.width  = this.container.style.gridColumnEnd - this.container.style.gridColumnStart;
      g.height = this.container.style.gridRowEnd   - this.container.style.gridRowStart;

      return g;
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

  set borderRadius( value )
  {
    if(this.DOMelement) this.DOMelement.style.borderRadius = value;
  }

  get borderRadius()
  {
    return this.DOMelement.style.borderRadius;
  }



  set shadow( value )
  {
    this._shadowDepth = value; 
    if(this.DOMelement) this.DOMelement.style.boxShadow = value+"px "+value+"px "+(value*2)-1+"px rgba(0,0,0,0.7)";
  }


  get shadow()
  { 
    return this._shadowDepth; 
  }  





}   //end class ...



export class TFListCheckbox
{
 constructor ( aParent , items )  
 {
  this.objName                = this.constructor.name;  
  this.callBack_onChange      = undefined;
  this.callBack_onClick       = undefined;
  this.items                  = items;
  
  if (aParent) this.parent = aParent; 
  else
      {
        if(globals.webApp) 
        {
          if(globals.webApp.activeWorkspace) this.parent = globals.webApp.activeWorkspace; 
          utils.log("TFObject.constructor() ... parent ermittelt aus Workspace:"+this.parent);
        }
        else
        { 
          this.parent = Screen;
          utils.log("TFObject.constructor() ... parent ermittelt aus screen:"+this.parent);
        }  
  }         

  // vorsichtshalber 
  utils.buildBlockLayout( aParent );

  for(var i=0; i<this.items.length; i++)
  {
    var cbID            = 'lcb'+utils.buildRandomID(i);
    var item            = this.items[i];
    var container       = document.createElement("DIV");
    container.className = "cssPanelForCbListBox";
    this.parent.appendChild(container);

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
    label.textContent = item.text;
    
    container.appendChild( label );  
   
    
  } 
 }

 setCheckBox( ndx , state )
 {
   if (ndx<0) return;

   if(ndx<this.items.length)
   {
    var item                  = items[ndx];
        item.checked          = state;
        item.checkBox.checked = state;
   }
 }

 getCheckBox( ndx )
 {
   if (ndx<0) return null;
   
   if(ndx<this.items.length)
   {
    var item    = items[ndx];
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



 invert()
 {
  for(var i=0; i<this.items.length; i++)
  {
    var item = this.items[i];
        item.checked = !item.checked;
        item.checkBox.checked = item.checked;
  } 
} 


} //end class




export class TFEdit 
{
  constructor ( aParent , left , top , params )  
  {
    this.objName                = "TFEdit";
    this.callBack_onChange      = undefined;
    this.callBack_onClick       = undefined;
    this.container              = undefined;
    this.savedStyle             = {};

    this._gridWidth             = params.gridWidth || 0;
    this._gridHeight            = params.gridHeight || 0;
        
    if (aParent) this.parent = aParent; 
    else
        {
          if(globals.webApp) 
          {
            if(globals.webApp.activeWorkspace) this.parent = globals.webApp.activeWorkspace; 
            utils.log("TFObject.constructor() ... parent ermittelt aus Workspace:"+this.parent);
          }
          else
          { 
            this.parent = globals.Screen;
            utils.log("TFObject.constructor() ... parent ermittelt aus screen:"+this.parent);
          }  
    }         

    // ein Edit-Objekt befindet sich immer in einer Tabellen-Zeile mit 2 oder 3 Spalten.
    // ist das Label der Eingabezelle vorangestellt (labelPosition=left) werden 3TD's  mit label / edit / appendix erstellt
    // ist das Label der Eingabezelle übergestellt (labelPosition=top) werden 2TD's mit label+edit / appendix erstellt.
    
    var prompt      = params.labelText || "";

    var promptWidth = 0;
    if(params.promptWidth) promptWidth = params.promptWidth+'em';
    else                   promptWidth = prompt.length+'em';

        var apx         = params.appendix || "";
    var apxWidth    = apx.length +'em';

    this.container             = document.createElement("DIV");
    this.container.className   =  "cssPanelForInput";
    var hID   = Math.round(Math.random()*1000000000);
    this.name = "EDIT_"+hID
    this.container.data        = this;
    this.container.setAttribute('ID'   ,  'ID_'+hID);
            
    this.parent.appendChild(this.container);
    
    if(aParent.isGridLayout)
      {
        this.container.style.gridColumnStart = left;
        this.container.style.gridColumnEnd   = this._gridWidth + left;
        this.container.style.gridRowStart    = top;
        this.container.style.gridRowEnd      = this._gridHeight + top;
      }
      else 
      {
        this.container.style.left  = left;
        this.container.style.top   = top;
        this.container.style.width = (prompt.length+ params.width +apx.length+2)+'em';
      }

      
    if(params.labelPosition.toUpperCase() == "TOP") this.container.style.height = '3em';
    else                                            this.container.style.height = '2em';  
    
    if (params.backgroundColor) this.container.style.backgroundColor = params.backgroundColor;

    // JE nach Konstellation das GRID aufteilen ....
 // VARIANT1: Kein Label, kein Appendix
 // JE nach Konstellation das GRID aufteilen ....
 // VARIANT1: Kein Label, kein Appendix
 if((apx=='') && (prompt==''))
  {
    this.container.style.gridTemplateRows     = '1fr';
    this.container.style.gridTemplateColumns  = '1fr';
    this.container.style.gridTemplateAreas    = '"editField"';
  }  

// VARIANT2: Kein Label, aber Appendix  
if((apx!='') && (prompt==''))
  {
    this.container.style.gridTemplateRows     = '1px'
    this.container.style.gridTemplateColumns  = '1fr ' + apxWidth;
    this.container.style.gridTemplateAreas    = '"editField" "editAppendix"';
  }  


  // VARIANTE 3 Label , kein Appendix  
  if((apx=='') && (prompt!=''))
    {
      // VARIANTE 3.1 Label on Top
      if(params.labelPosition.toUpperCase() == "TOP")
        {
          this.container.style.gridTemplateRows     = '1fr';
          this.container.style.gridTemplateColumns  = '1fr';

          this.container.style.gridTemplateAreas    = ` "editLabel"
                                                        "editField" `;
        } // Label on Top 
        
        // VARIANTE 3.2 Label left
        else
      { 
          this.container.style.gridTemplateColumns  = promptWidth + ' 1fr';
          this.container.style.gridTemplateRows     = '1fr'
          this.container.style.gridTemplateAreas    = `
                                                       "editLabel editField"
                                                      `;
      } // left Lanel
    } // Label, kein Appendix


  // VARIANTE 4 Label UND Appendix  
  if((apx!='') && (prompt!=''))
  {  
     // VARIANTE 4.1 Label on Top  
    if(params.labelPosition.toUpperCase() == "TOP")
    {
      this.container.style.gridTemplateColumns  = '1fr '+apxWidth;
      this.container.style.gridTemplateRows     = '1fr 1fr';
      this.container.style.gridTemplateAreas = `
                                               "editLabel editLabel"
                                               "editField editAppendix"
                                              `;
    } 
    
    // VARIANTE 4.2 Label left
    else  // labelPosition = LEFT
        { 
          this.container.style.gridTemplateColumns  = promptWidth + ' 1fr '+apxWidth
          this.container.style.gridTemplateRows     = '1fr';
          this.container.style.gridTemplateAreas    = `
                                                      "editLabel editField editAppendix"
                                                      `;
    }
  }

     // GRID-Gerüst steht, nun werden Label, Edit und ggf der Apendix eingefügt
      if(prompt!='')
      {  
       this.label = document.createElement("LABEL");
       this.label.className = "cssLabelForInput";
       this.label.textContent = params.labelText || "";
       this.container.appendChild( this.label );  
      }

       this.input             = document.createElement("INPUT");
       this.input.className   = "cssEditField";
       if (params.type)  this.input.type = params.type;
       this.input.addEventListener('change',  function() { 
                                                          if(this.callBack_onChange) this.callBack_onChange( this.input.value )
                                                         }.bind(this));  
       this.container.appendChild(  this.input ); 

    if( apx!='' ) 
    {
        this.appendix = document.createElement("LABEL");
        this.appendix.className = "cssLabelAppendix";
        this.appendix.textContent = apx;
        this.container.appendChild( this.appendix );     
    }
  
  } 


  setParent( aParent )
  {
    if(aParent != this.parent)
    {
      this.parent = aParent;
      this.parent.appendChild( this.container );
    }  
  } 
  


  set id(value)
  {
    this.container.setAttribute('ID'   ,  value);
  }
  
  
  get id()
  {
    return this.container.getAttribute('ID');
  }
        
  
set css( value )  
{
  this.container.className = value;
}

get css()  
{
  return this.container.className;
}


set gridLeft( g )
{
   this.container.display = 'grid'; 
   this.container.style.gridColumnStart = parseInt(g, 10);
   this.container.style.gridColumnEnd   = parseInt(g, 10) +  parseInt(this._gridWidth, 10);
}           

get gridLeft()
{
  return parseInt(this.container.style.gridColumnStart,10); 
}           


set gridTop( g )
{
   this.container.display = 'grid'; 
   this.container.style.gridRowStart = parseInt(g, 10);
   this.container.style.gridRowEnd   = parseInt(g, 10) + parseInt(this._gridHeight, 10);
}           

get gridTop()
{
  return parseInt(this.container.style.gridRowStart,10); 
}           



set gridWidth( g )
{
   this._gridWidth = g;
   this.container.display = 'grid'; 
   this.container.style.gridColumnEnd = parseInt(this.container.style.gridColumnStart,10) + parseInt(g,10);
}           


get gridWidth()
{
  return  this._gridWidth;
}           


set gridHeight( g )
{
   this._gridHeight        = g
   this.container.display = 'grid'; 
   this.container.style.gridRowEnd = parseInt(this.container.style.gridRowStart,10) + parseInt(g,10);
}           

get gridHeight()
{
  return  this._gridHeight
}     


set width( value )
  {
    if (isNaN(value)) if(this.container) this.container.style.width = value;
    else              if(this.container) this.container.style.width = value+'px';
    
  } 

  get width()
  {
    var r=undefined;
    if(this.container)  r = this.container.clientWidth;
    return r;
  } 


  set height( value )
  {
    if (isNaN(value)) if(this.container) this.container.style.height = value;
    else              if(this.container) this.container.style.height = value+'px';
  } 

  get height()
  {
    var r=undefined;
    if(this.container)  r = this.container.clientHeight;
    return r;
  } 
  
  set left( value )
  { 
    this.container.style.position = 'relative';

    if (isNaN(value)) if(this.container) this.container.style.left = value;
    else              if(this.container) this.container.style.left = value+'px';
    
  } 

  get left()
  {
    var rect = this.container.getBoundingClientRect();
    return rect.left;
  } 


  set right( value )
  { 
    this.container.style.position = 'relative';

    if (isNaN(value)) if(this.container) this.container.style.width = value - this.left;
    else              if(this.container) this.container.style.width = (value - this.left)+'px';
    
  } 

  get right()
  {
    var rect = this.container.getBoundingClientRect();
    return rect.left + rect.width;
  } 


  set top( value )
  {
      this.container.style.position = 'relative';
      
      if (isNaN(value)) if(this.container) this.container.style.top = value;
      else              if(this.container) this.container.style.top = value+'px';
  } 

  get bottom()
  {
    var rect = this.container.getBoundingClientRect();
    return rect.top + rect.height;
  } 

  
  set bottom( value )
  {
      this.container.style.position = 'relative';
      
      if (isNaN(value)) if(this.container) this.container.style.height = value - this.top;
      else              if(this.container) this.container.style.height = (value - this.top)+'px';
  } 


  get top()
  {
    var rect = this.container.getBoundingClientRect();
    return rect.top;
  } 



set DOMelement( value ) 
{}  


get DOMelement()
{
    return this.container;
}

  addOkButton(caption)
  {
    var btn        = dialogs.addButton( this.container ,"",4,1,1,1,caption,true);
        btn.width  = (caption.length+1) + 'em';
        btn.height = '35px';
    return btn;
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

    var st  = tfDT.formatDateTime('yyyy-mm-ddThh:mn');

    console.log('setDateTime('+ dt + ') -> ' + st );
    this.input.value = st;
  }

  getDateTime()
  {
    var st   = this.input.value;
    var tfdt = new utils.TFDateTime(st);
    return tfdt.unixDateTime();
  }

  set grid( g )
  {
     this.container.display = 'grid'; 
     this.container.style.gridColumnStart = g.left;
     this.container.style.gridRowStart    = g.top;  
     this.container.style.gridColumnEnd   = g.left + g.width; 
     this.container.style.gridRowEnd      = g.top  + g.height;  
  }           


  get grid()
  {
     var g = {left:0 , top:0 , width:0 , height:0};

      g.left   = this.container.style.gridColumnStart;
      g.top    = this.container.style.gridRowStart;
      g.width  = this.container.style.gridColumnEnd - this.container.style.gridColumnStart;
      g.height = this.container.style.gridRowEnd   - this.container.style.gridRowStart;

      return g;
  }           

  set enabled( value )
  {
    this.input.disabled = !value;
  }
  
  get enabled() 
  {
    return !this.input.disabled;
  }
  
  
hide()
{
  this.container.style.visibility = 'hidden';
}


show()
{
  this.container.style.visibility = 'visible';
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

set borderRadius( value )
{
  if(this.DOMelement) this.DOMelement.style.borderRadius = value;
}

get borderRadius()
{
  return this.DOMelement.style.borderRadius;
}



set shadow( value )
{
  this._shadowDepth = value; 
  if(this.DOMelement) this.DOMelement.style.boxShadow = value+"px "+value+"px "+(value*2)-1+"px rgba(0,0,0,0.7)";
}


get shadow()
{ 
  return this._shadowDepth; 
}  




}  //end class ...


export class TFCombobox 
{
  constructor ( aParent , left , top , params )   
  {
    this.objName                = "COMBOBOX";
    this.items                  = [];
    this.combobox               = undefined;
    this.callBack_onChange      = undefined;
    this.callBack_onClick       = undefined;
    this.container              = undefined;
  
     utils.log(" TFCombobox.constructor() aPparent:"+aParent+"  ,  params:"+JSON.stringify(params));

    if (aParent) this.parent = aParent; 
    else
        {
          if(globals.webApp) 
          {
            if(globals.webApp.activeWorkspace) this.parent = globals.webApp.activeWorkspace; 
            utils.log("TFObject.constructor() ... parent ermittelt aus Workspace:"+this.parent);
          }
          else
          { 
            this.parent = Screen;
            utils.log("TFObject.constructor() ... parent ermittelt aus screen:"+this.parent);
          }  
    }         

     // ein Edit-Objekt befindet sich immer in einer Tabellen-Zeile mit 2 oder 3 Spalten.
    // ist das Label der Eingabezelle vorangestellt (labelPosition=left) werden 3TD's  mit label / edit / appendix erstellt
    // ist das Label der Eingabezelle übergestellt (labelPosition=top) werden 2TD's mit label+edit / appendix erstellt.
    var prompt      = params.labelText || "";
    var promptWidth = prompt.length+'em';

    var apx         = params.appendix || "";
    var apxWidth    = apx.length +'em';

    this.container  = document.createElement("DIV");
    this.container.className   =  "cssPanelForInput";
    this.parent.appendChild(this.container);
    
    if(aParent.isGridLayout)
    {
      this.container.style.gridColumnStart = left;
      this.container.style.gridColumnEnd   = left+1;
      this.container.style.gridRowStart    = top;
      this.container.style.gridRowEnd      = top+1;
    }
    else 
    {
      this.container.style.left  = left;
      this.container.style.top   = top;
      this.container.style.width = (prompt.length+ params.width +apx.length)+'em';

      if(params.labelPosition.toUpperCase() == "TOP") this.container.style.height = '3em';
      else                                            this.container.style.height = '2em';
    }
    
    if (params.backgroundColor) this.container.style.backgroundColor = params.backgroundColor;

 // JE nach Konstellation das GRID aufteilen ....
 // VARIANT1: Kein Label, kein Appendix
    if((apx=='') && (prompt==''))
    {
      this.container.style.gridTemplateRows     = '1fr';
      this.container.style.gridTemplateColumns  = '1fr';
      this.container.style.gridTemplateAreas    = '"editField"';
    }  

  // VARIANT2: Kein Label, aber Appendix  
  if((apx!='') && (prompt==''))
    {
      this.container.style.gridTemplateRows     = '1px'
      this.container.style.gridTemplateColumns  = '1fr ' + apxWidth;
      this.container.style.gridTemplateAreas    = '"editField" "editAppendix"';
    }  


    // VARIANTE 3 Label , kein Appendix  
    if((apx=='') && (prompt!=''))
      {
        // VARIANTE 3.1 Label on Top
        if(params.labelPosition.toUpperCase() == "TOP")
          {
            this.container.style.gridTemplateRows     = '1fr';
            this.container.style.gridTemplateColumns  = '1fr';
  
            this.container.style.gridTemplateAreas    = ` "editLabel"
                                                          "editField" `;
          } // Label on Top 
          
          // VARIANTE 3.2 Label left
          else
        { 
            this.container.style.gridTemplateColumns  = promptWidth + ' 1fr';
            this.container.style.gridTemplateRows     = '1fr'
            this.container.style.gridTemplateAreas    = `
                                                         "editLabel editField"
                                                        `;
        } // left Lanel
      } // Label, kein Appendix

  
    // VARIANTE 4 Label UND Appendix  
    if((apx!='') && (prompt!=''))
    {  
       // VARIANTE 4.1 Label on Top  
      if(params.labelPosition.toUpperCase() == "TOP")
      {
        this.container.style.gridTemplateColumns  = '1fr '+apxWidth;
        this.container.style.gridTemplateRows     = '1fr 1fr';
        this.container.style.gridTemplateAreas = `
                                                 "editLabel editLabel"
                                                 "editField editAppendix"
                                                `;
      } 
      
      // VARIANTE 4.2 Label left
      else  // labelPosition = LEFT
          { 
            this.container.style.gridTemplateColumns  = promptWidth + ' 1fr '+apxWidth
            this.container.style.gridTemplateRows     = '1fr';
            this.container.style.gridTemplateAreas    = `
                                                        "editLabel editField editAppendix"
                                                        `;
      }
    }
      
    // GRID-Layout steht, nun werden Label, Edit und ggf der Apendix eingefügt
    if (prompt!='')
    {
      this.label = document.createElement("LABEL");
      this.label.className = "cssLabelForInput";
      this.label.textContent = prompt;
      this.container.appendChild( this.label );  
    }

    this.combobox             = document.createElement("SELECT");
    this.combobox.className   = "cssComboBox";
    this.combobox.name        = "combobox"+Math.round(Math.random()*100000);

    this.combobox.addEventListener('change',  function() { 
                                                           if(this.callBack_onChange)
                                                           {
                                                            var v = this.combobox.value;
                                                            var c = this.items[v];
                                                            this.callBack_onChange( v , c )
                                                           }
                                                          }.bind(this));  
      
    this.container.appendChild( this.combobox ); 

    if( apx!='' ) 
    {
        this.appendix = document.createElement("LABEL");
        this.appendix.className = "cssLabelAppendix";
        this.appendix.textContent = apx;
        this.container.appendChild( this.appendix );     
    }

    this.setItems( params.items );

}

setParent( aParent )
  {
    if(aParent != this.parent)
    {
      this.parent = aParent;
      this.parent.appendChild( this.container );
    }  
  } 
  


  set id(value)
  {
    this.container.setAttribute('ID'   ,  value);
  }
  
  
  get id()
  {
    return this.container.getAttribute('ID');
  }
   
  
 set css( value )  
  {
    this.container.className = value;
  }
  
 get css()  
  {
    return this.container.className;
  }
   

set DOMelement( value ) 
{}  

get DOMelement()
{
  return this.container;
}


 set text( txt )
 {
  utils.log("Combobox setter TEXT:" + txt)
  this.combobox.value = txt;
 }

 get text()
 {
  var ndx = this.combobox.selectedIndex;
  return this.combobox.options[ndx].text;
 }

 setItems( items )
 {
  if(items==null)
  {
    utils.log("COMBOBOX Items löschen()"); 
    this.items = [];
    return 
  }
  
  utils.log("COMBOBOX.setItems(" + items.join(", ") + ")");

  // alles löschen ...
  while(this.items.length>0) {this.items.splice(0,1)}
  while (this.combobox.options.length > 0) this.combobox.remove(0);

   for(var i=0; i<items.length;i++) this.addItem( items[i] );
 } 

getItems()
{
  return this.items;
} 

addItem( txt )
{
  this.items.push( txt );
  var  newItem = new Option( txt , this.items.length-1);
  utils.log("add Item : " + newItem + " text:" + txt );
  this.combobox.add( newItem , undefined);

  /*

  var item = document.createElement('OPTION');
      item.name = "option"+this.items.length;
      item.value = this.items.length-1;    
      item.innerHTML = txt;
     utils.log("add Item : " + item + " text:" + txt );
     this.input.appendChild(item);
  */   
}

set itemIndex(ndx) { utils.log("TCOMOBOX-Setter for ItemIndex:"+ndx); this.combobox.selectedIndex=ndx; utils.log("TCOMOBOX-Setter for ItemIndex:"+this.combobox.selectedIndex)}
get itemIndex()    { return this.combobox.selectedIndex; }


set value( txt )  
{
  // ist value in der Items-Liste ?
  var ndx = this.items.indexOf(txt);
  if (ndx<0) 
    {
      this.addItem( txt );
      ndx = this.items.indexOf(txt);
    }  

  this.itemIndex = ndx;
}

get value() 
{
  var ndx = this.itemIndex;
  return this.items[ndx]; 
}





hide()
{
  this.container.style.visibility = 'hidden';
}


show()
{
  this.container.style.visibility = 'visible';
}


set grid( g )
{
   this.container.display = 'grid'; 
   this.container.style.gridColumnStart = g.left;
   this.container.style.gridRowStart    = g.top;  
   this.container.style.gridColumnEnd   = g.left + g.width; 
   this.container.style.gridRowEnd      = g.top  + g.height;  
}           


get grid()
{
   var g = {left:0 , top:0 , width:0 , height:0};

    g.left   = this.container.style.gridColumnStart;
    g.top    = this.container.style.gridRowStart;
    g.width  = this.container.style.gridColumnEnd - this.container.style.gridColumnStart;
    g.height = this.container.style.gridRowEnd   - this.container.style.gridRowStart;

    return g;
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

set borderRadius( value )
{
  if(this.DOMelement) this.DOMelement.style.borderRadius = value;
}

get borderRadius()
{
  return this.DOMelement.style.borderRadius;
}



set shadow( value )
{
  this._shadowDepth = value; 
  if(this.DOMelement) this.DOMelement.style.boxShadow = value+"px "+value+"px "+(value*2)-1+"px rgba(0,0,0,0.7)";
}


get shadow()
{ 
  return this._shadowDepth; 
}  


set margin( value ) 
{
  this.container.style.margin = value;
}


get margin()
{
  return this.container.style.margin;
}


set marginTop( value ) 
{
  this.container.style.marginTop = value;
}


get marginTop()
{
  return this.container.style.marginTop;
}

set marginLeft( value ) 
{
  this.container.style.marginLeft = value;
}


get marginLeft()
{
  return this.container.style.marginLeft;
}


set marginRight( value ) 
{
  this.container.style.marginRight = value;
}


get marginRight()
{
  return this.container.style.marginRight;
}


set marginBottom( value ) 
{
  this.container.style.marginBottom = value;
}


get marginBottom()
{
  return this.container.style.marginBottom;
}

set padding( value ) 
{
  this.container.style.padding = value;
}

get padding()
{
  return this.container.style.padding;
}

set enabled( value )
{
  this.combobox.disabled = !value;
}

get enabled() 
{
  return !this.combobox.disabled;
}






} // end class


export class TFWorkSpace
{
  constructor( ID , caption1 , caption2 )  
  {
    this.isWorkspace        = true;
    this.isTFObject         = true;
    this.objName            = this.constructor.name;
    this.className          = 'cssWorkSpace';  
    this.wsID               = ID;
    this.handle             = null;
    this.isGridLayout       = true;
    
    // vorsichtshalber ...
    if (!globals.Screen) globals.setScreen(new Screen() );

    this.container            = document.createElement('DIV');  
    this.container.className  = "cssWorkSpaceContainer";  
    this.container.id         = ID;
    globals.Screen.DOMelement.appendChild(this.container);

    utils.log("caption1="+caption1+"   caption2="+caption2);

    if(caption1 || caption2)
    {
      utils.log("erzeuge Panel für Caption"); 
      this.caption                = document.createElement('DIV');  
      this.caption.id             = ID+"_caption";
      this.caption.className      = "cssWorkSpaceCaption";  
      this.container.appendChild(this.caption);
           
       if(caption1) 
       { 
         var l1            = document.createElement('P');  
             l1.className  = "cssCaption1";  
             this.caption.appendChild(l1);
             l1.textContent  = caption1;
       }       
      
       if(caption2) 
       { 
         var l2            = document.createElement('P');  
             l2.className  = "cssCaption2";  
             this.caption.appendChild(l2);
             l2.textContent  = caption2;
       } 
       
       this.sysMenu                            = dialogs.addPanel(this.caption , "sysMenu" , 2 , 1 , 1 , 1 );
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
    else {
          utils.log("erzeuge Null-Panel, da kein Caption angezeigt werden soll"); 

          // um keine freien Zellen im Grid-Layout anzuzeigen, wird dieses neu gestaltet....
          var gd=utils.getGridLayoutDimension(this.container);
          var template = '';
          for(var i=0; i<gd.gridRowCount; i++)
          {
            template = template + '"';
            for(var j=0; j<gd.gridColumnCount; j++) template = template + 'w ';
            template = template + '"\n';
          }
          
          this.container.style.gridTemplateAreas = template;
          
          this.caption             = document.createElement('DIV');  
          this.caption.id          = ID+"_caption";
          this.caption.className   = "cssHiddenPanel";  
          this.container.appendChild(this.caption); 
        } 
    
    utils.log("Erzeuge Workspace ");
    this.handle                        = dialogs.addPanel(this.container,"cssWorkSpace",'w','','','',true);
    this.handle.DOMelement.id          = ID+"_dashBoard";
  }
  
  get childList()
  {
    utils.log("get Workspace.childList this:"+this.objName );
    return this.handle.childList;
  }

  get DOMelement()
  {
    if(this.handle)
    {
       utils.log("get Workspace.DOMelement this:"+this.objName+"  this.handle:"+this.handle.objName );
       return this.handle.DOMelement;
    } 
    else {
          utils.log("get Workspace.DOMelement (das erste Element bekommt dn Container als DOMelent präsentiert) container:"+this.container.id);
          return this.container;
     }
  } 

  appendChild (aDOMelement) {this.DOMelement.appendChild(aDOMelement); }

  removeChild (aDOMelement) {this.DOMelement.appendChild(aDOMelement); }   
  
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

  set width( value )
  {
    utils.log("setter Workspace.width: " + value +" ignored ");
  } 

  get width()
  {
    var r = this.handle.DOMelement.clientWidth;
    utils.log("getter Workspace.width: " + r ); 
    return r;
  } 


  set height( value )
  {
    utils.log("setter Workspace.height: " + value +" ignored ");
  } 

  get height()
  {
    var r = this.handle.DOMelement.clientHeight;
    utils.log("getter Workspace.height: " + r ); 
    return r;
  } 


  buildGridLayout( gridSizeOrTemplate )
  {
     utils.buildGridLayout( this , gridSizeOrTemplate );
  }

  buildGridLayout_templateColumns( template )
 {
   utils.buildGridLayout_templateColumns( this , template )
 }  

  buildGridLayout_templateRows( template )
 {
   utils.buildGridLayout_templateRows (this , template ) 
 }  

  buildBlockLayout() 
  {
    utils.buildBlockLayout( this );
  }

  buildFlexBoxLayout() 
  {
    utils.buildBlockLayout( this );
  }


}  //end class ...




/* eigenständiges Pop-Up-Menü außerhalb des tfwebApp-Zoo - Basis: ChatGPT4.0 */
export class ContextMenu 
{
  constructor(menuItems) 
  {
      this.menuItems = menuItems;
      this.popup = null;
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
          menuItem.addEventListener('mouseup', item.onClick);
          popupContent.appendChild(menuItem);
      });
      // Append content to popup
      this.popup.appendChild(popupContent);
      document.body.appendChild(this.popup);
  }

  addEventListeners() {
      // Show popup on right click
      document.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          this.show(event.pageX, event.pageY);
      });

      // Hide popup on mouse up
      document.addEventListener('mouseup', () => {
          this.hide();
      });

      // Prevent popup from closing when clicking inside
      this.popup.addEventListener('mousedown', (event) => {
          event.stopPropagation();
      });
  }

  show(x, y) {
      this.popup.style.display = 'block';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;
  }

  hide() {
      this.popup.style.display = 'none';
  }
}

/* ***********************************************************************************************************************  */






export class TFImage
{
  constructor( aParent , imgURL , captionPanel , infos )
  {
       // Image-Container erstellen (wg. position=relative wg. crossFade() ...  )
       this.parent              = dialogs.addPanel( aParent , 'cssImageContainer',0,0,"100%","100%");

        this.objName            = "TFImage";
        this.imgIndex           = 0;
        this.url                = [];
        this.currentURL         = 'notSet';
        this.captionPanel       = captionPanel;
        this.infos              = infos;
        this.htmlImage          = null;
        this.htmlCrossFadeImage = null;
        this.isCrossFade        = true;
        this.zoomFactor         = 1.0;
    
       if (Array.isArray(imgURL)) for(var i=0; i<imgURL.length; i++) this.url.push(imgURL[i]);
       else this.url.push(imgURL);     
  } 


  delete(ndx)
  {
    if(ndx==null) ndx = this.imgIndex;
    if(ndx < this.url.length) this.url.splice(ndx,1);
    if(this.infos && this.infos.length > ndx) this.infos.splice(ndx,1);
    this.paint();
  }

  next()
  {
    if(this.imgIndex<(this.url.length-1)) this.imgIndex++;
    else this.imgIndex = 0;

    var img =  this.url[this.imgIndex];
    this.zoomFactor = 1.0; 
    this.paint(img);
  }

  prev()
  {
    if(this.imgIndex>0) this.imgIndex--;
    else this.imgIndex = this.url.length-1;
    
    var img =  this.url[this.imgIndex];
    this.zoomFactor = 1.0;  
    this.paint(img);
  }

  zoom(factor) 
  {
    this.zoomFactor = this.zoomFactor * factor;
    console.log("Zoom aufgerufen mit Faktor:", this.zoomFactor);
    if (this.htmlImage) this.htmlImage.style.transform = 'scale(' + this.zoomFactor + ')';
    else console.warn("htmlImage ist nicht definiert");
  }

  clear()
  {
    // html-Image entfernen ...
    if(this.htmlImage) this.htmlImage.remove();
    this.htmlImage = null;
  }

  paint( URL )
  {
    var crossFade = this.isCrossFade;

    if(!URL) URL = this.url[this.imgIndex]; 

    this.currentURL = URL;

    if(this.captionPanel) 
    {
      if(this.infos)
      {
        if (this.infos.length>this.imgIndex) this.captionPanel.textContent = this.infos[this.imgIndex];
      }
    }
    
    if(!this.htmlImage)
    {
      crossFade                = false;
      this.htmlImage           = document.createElement('img');
      this.htmlImage.className = 'cssImageContainerImg';
      this.parent.DOMelement.appendChild(this.htmlImage);

      this.htmlCrossFadeImage               = document.createElement('img');
      this.htmlCrossFadeImage.className     = 'cssImageContainerImg';
      this.htmlCrossFadeImage.style.opacity = 0;
      this.parent.DOMelement.appendChild(this.htmlCrossFadeImage);
    }                                                

    if(crossFade) this.crossFade( URL )
    else          this.htmlImage.src = URL;
  } 

crossFade(newImageUrl) 
{
  // Neues Bild im Hintergrundbild laden
  this.htmlCrossFadeImage.src = newImageUrl;

  // wenn Bild geladen ist
  this.htmlCrossFadeImage.onload = function()
                                   {
                                      // Überblendeffekt durch Ändern der Opazität
                                      this.htmlCrossFadeImage.style.opacity = 1;
          
                                      // Nachdem der Überblendeffekt abgeschlossen ist, das untere Bild austauschen und die Opazität zurücksetzen
                                      this.htmlCrossFadeImage.addEventListener('transitionend', function onTransitionEnd() {
                                                                                                                           this.htmlCrossFadeImage.removeEventListener('transitionend', onTransitionEnd);
                                                                                                                           this.htmlImage.src = this.htmlCrossFadeImage.src;
                                                                                                                           this.htmlCrossFadeImage.style.opacity = 0;
                                                                                                                           }.bind(this) );        
                                     }.bind(this);
 };

 set grid( g )
 {
    this.parent.DOMelement.display = 'grid'; 
    this.parent.DOMelement.style.gridColumnStart = g.left;
    this.parent.DOMelement.style.gridRowStart    = g.top;  
    this.parent.DOMelement.style.gridColumnEnd   = g.left + g.width; 
    this.parent.DOMelement.style.gridRowEnd      = g.top  + g.height;  
 }           


 get grid()
 {
    var g = {left:0 , top:0 , width:0 , height:0};

     g.left   = this.parent.DOMelement.style.gridColumnStart;
     g.top    = this.parent.DOMelement.style.gridRowStart;
     g.width  = this.parent.DOMelement.style.gridColumnEnd - this.parent.DOMelement.style.gridColumnStart;
     g.height = this.parent.DOMelement.style.gridRowEnd   - this.parent.DOMelement.style.gridRowStart;

     return g;
 }           


 destroy()
 {
  this.parent.destroy()
 }


 
}   //end class ...








export class TFNavigationBar
{
  constructor( aParent , params )
  {
    this.objName          = this.constructor.name;  
    this.DOMelement_Panel = dialogs.addPanel( aParent , "cssNavigationBar" , '0','0',"100%" , "35px" )
  } 
}  





export class TForm
{
  constructor( aParent , aData , aLabels , aAppendix , aExclude , URLForm )
  {
    this.objName   = "TFORM";  
    this.parentWnd = null;
    
    if(utils.isHTMLElement(aParent)) this.parent = aParent;
    else {                           this.parent = aParent.DOMelement; this.parentWnd = aParent; }
 
    this.htmlForm           = '';
    this.error              = false;
    this.errMsg             = '';
    this.data               = aData;
    this.Container          = null; 
    this.isTFObject         = false;
    this.objName            = this.constructor.name;
    this.controls           = [];
    this.callBack_onOKBtn   = null;
    this.callBack_onESCBtn  = null;
  
    console.log("TForm.constructor(...) URLForm: " + URLForm );

    if(URLForm)
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
    else {
    
    if(!aExclude) aExclude  = [];

    for(var key in this.data)
    {
      if(utils.indexOfIgnoreCase(aExclude , key) < 0)   // nicht in exclude - List  ...
      {
        var lbl = key;
        var apx = '';

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

        this.controls.push({fieldName:key, value:this.data[key], label:lbl, appendix:apx, type:"TEXT", enabled:true,  visible:true, lblControl:null, editControl:null, apxControl:null})

      } else  this.controls.push({fieldName:key, value:this.data[key], label:"" , appendix:"" , type:"TEXT", enabled:false, visible:false})
    }
  }   // else  

}
  
  
  disable( key )
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      console.log('compare key:'+key+'   vs.   '+ctrl.fieldName);
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()){console.log('----------------> hit'); ctrl.enabled = false; }
      console.log('compare key:'+key+'   vs.   '+ctrl.fieldName);
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()){console.log('----------------> hit'); ctrl.enabled = false; }
    }
  }


  enable( key )
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) ctrl.enabled = true;
    }
  }

  
  setLabel(key , aLabel)
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase())
      {
        ctrl.label = aLabel;
        if(ctrl.lblControl) ctrl.lblControl.caption = aLabel;
      } 
    }
  }


  setValue(key , aValue)
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) 
      {
        alert("setValue(key: "+ctrl.fieldName+" -> ctrl.value: "+aValue);
        ctrl.value = aValue;
      }  
    }
  }


  setInputType(key , type , items )
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) 
      {
        ctrl.type = type;
        if(items) ctrl.items = items;
        if(ctrl.editControl) ctrl.editControl.type = type;

        if(type.toUpperCase()=='RANGE')
           if(ctrl.editControl) 
           {
            ctrl.editControl.min     = 0;
            ctrl.editControl.max     = 11
            ctrl.editControl.oninput = function(){if (this.apxControl) this.apxControl.caption = this.editControl.value;}.bind(ctrl)

          }
      }  
    }
  } 


  setInputLength(key , length)
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) 
      {
        if(ctrl.editControl) ctrl.editControl.style.width = length;
      }  
    }
  }



  setAppendex(key , aAppendix)
  {
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.fieldName.toUpperCase()==key.toUpperCase()) 
      {
        ctrl.appendix = aAppendix;
        if (ctrl.apxControl) ctrl.apxControl.caption = aAppendix;
      }  
    }
  }

  render( withCtrlButton )
  {
    if(this.htmlForm == '' ) this.renderGeneric( withCtrlButton );
    else                     this.renderForm();
  }


  renderForm()  
  {
    if(!this.parentWnd) 
    {
      dialogs.showMessage('Es wird versucht ein Formular in einem Parent zu rendern, das KEIN TFWindow ist. Aktuell ist dies für TFWindows möglich... ');
      return;
    }

    this.parentWnd.HTML( this.htmlForm );

    // nun die HTML-Elemente mit den Daten verbinden ...
    // dazu werden die Daten durchlaufen und vie key das passende Element gesucht. Falls erfolgreich, wird das HTML-Element. value gesetzt...
    this.controls = [];

    for(var key in this.data)
    {
      console.log('suche '+key);
      var el = this.parentWnd.getElementById( key );
      console.log('Element '+ el );
      if (el) 
      {
        this.controls.push( {fieldName:key, value:this.data[key], label:null, appendix:null, type:"null", enabled:true,  visible:true, lblControl:null, editControl:el, apxControl:null})
       
        if (el.tagName === 'INPUT' && el.type === 'text') el.value     = this.data[key];
        if (el.tagName === 'LABEL')                       el.innerHTML = this.data[key];
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
    // maximale label-länge finden, um rechtsbündige Eingabezellen zu haben....
    var maxLabel = 0;
    for(var i=0; i<this.controls.length; i++) if(this.controls[i].visible && (this.controls[i].label.length>maxLabel)) maxLabel = this.controls[i].label.length;

    // maximale label-länge des ggf. vorh. Appendix finden ....
    var maxAppendix = 2;
    for(var i=0; i<this.controls.length; i++) if(this.controls[i].visible && (this.controls[i].appendix.length>maxAppendix)) maxAppendix = this.controls[i].appendix.length;

   if(this.Container ) this.Container .innerHTML = '';
   else {
          //build.....
          utils.buildGridLayout_templateColumns( this.parent , '1fr' );
   if(this.Container ) this.Container .innerHTML = '';
   else {
          //build.....
          utils.buildGridLayout_templateColumns( this.parent , '1fr' );

          if(withCtrlButton) utils.buildGridLayout_templateRows   ( this.parent , '1fr 4em 1px')
          else               utils.buildGridLayout_templateRows   ( this.parent , '1fr')
          if(withCtrlButton) utils.buildGridLayout_templateRows   ( this.parent , '1fr 4em 1px')
          else               utils.buildGridLayout_templateRows   ( this.parent , '1fr')

          this.Container                          = document.createElement("DIV");
          this.Container.className                = 'cssHidePanel';
          this.Container.style.gridColumnStart    = 1;
          this.Container.style.gridColumnEnd      = 2;
          this.Container.style.gridRowStart       = 1;
          this.Container.style.gridRowEnd         = 2;
    
         this.parent.appendChild( this.Container );
          this.Container                          = document.createElement("DIV");
          this.Container.className                = 'cssHidePanel';
          this.Container.style.gridColumnStart    = 1;
          this.Container.style.gridColumnEnd      = 2;
          this.Container.style.gridRowStart       = 1;
          this.Container.style.gridRowEnd         = 2;
    
         this.parent.appendChild( this.Container );

         this.Container.style.flexDirection = 'column';
         this.Container.style.alignItems     = 'center'
     }     
         this.Container.style.flexDirection = 'column';
         this.Container.style.alignItems     = 'center'
     }     
           
    for(var i=0; i<this.controls.length; i++)
    {
      var ctrl = this.controls[i];
      if (ctrl.visible)
      {
        var inpContainer = dialogs.addPanel( this.Container,"cssPanelForInput",0,0,'97%','3em');
        var inpContainer = dialogs.addPanel( this.Container,"cssPanelForInput",0,0,'97%','3em');
            inpContainer.DOMelement.style.marginLeft  = "auto";
            inpContainer.DOMelement.style.marginRight = "auto";

            utils.buildGridLayout_templateColumns(inpContainer , maxLabel+'em 1fr '+maxAppendix+'em');
            utils.buildGridLayout_templateRows   (inpContainer , '0.5em 1fr 0.5em');

            ctrl.lblControl = dialogs.addLabel(inpContainer,"cssLabelForInput",1,2,ctrl.label);
            ctrl.lblControl.marginTop = '0.5em';
            
            if(ctrl.type.toUpperCase()=='RANGE') ctrl.apxControl = dialogs.addLabel(inpContainer,"",3,2,ctrl.appendix || '5' );
            else                                 ctrl.apxControl = dialogs.addLabel(inpContainer,"",3,2,ctrl.appendix);
            
            if(['TEXT','DATE','TIME','EMAIL','NUMBER','RANGE','PASSWORD'].indexOf(ctrl.type.toUpperCase())>-1)  // Statt ODER ;-)
            {
              ctrl.editControl= document.createElement("INPUT");
              ctrl.editControl.setAttribute('id',ctrl.fieldName);
              ctrl.editControl.type                  = ctrl.type;
              ctrl.editControl.value                 = ctrl.value;
              ctrl.editControl.className             = "cssEditField";
              ctrl.editControl.style.gridColumnStart = 2;
              ctrl.editControl.style.gridColumnEnd   = 3;
              ctrl.editControl.style.gridRowStart    = 2;
              ctrl.editControl.style.gridRowEnd      = 3;
              inpContainer.appendChild( ctrl.editControl ); 
            }

            if(ctrl.type.toUpperCase()=="SELECT")
            {
              ctrl.editControl= document.createElement("SELECT");
              ctrl.editControl.setAttribute('id',ctrl.fieldName);
              ctrl.editControl.value                 = ctrl.value;
              ctrl.editControl.className             = "cssEditField";
              ctrl.editControl.style.gridColumnStart = 2;
              ctrl.editControl.style.gridColumnEnd   = 3;
              ctrl.editControl.style.gridRowStart    = 2;
              ctrl.editControl.style.gridRowEnd      = 3;
             
              if(ctrl.items)
              if(ctrl.items.length>0)
              for(var j=0; j<ctrl.items.length; j++)  ctrl.editControl.add( new Option( ctrl.items[j] , j ) )

              inpContainer.appendChild( ctrl.editControl ); 
            }

            if(ctrl.type.toUpperCase()=='CHECKBOX')
            {
              var p                       = document.createElement("DIV");
                  p.className             = "cssHidePanel";
                  p.style.gridColumnStart = 2;
                  p.style.gridColumnEnd   = 3;
                  p.style.gridRowStart    = 2;
                  p.style.gridRowEnd      = 3;
                  inpContainer.appendChild( p );
               
                  ctrl.editControl= document.createElement("INPUT");
                  ctrl.editControl.setAttribute('id',ctrl.fieldName);
                  ctrl.editControl.type              = 'CHECKBOX';
                  ctrl.editControl.checked           = ctrl.value;
                  ctrl.editControl.style.width       = '1.5em';
                  ctrl.editControl.style.height      = '1.5em';

                  p.appendChild( ctrl.editControl ); 
            }  

            if(!ctrl.enabled) 
            {
                ctrl.editControl.readOnly = true;
                ctrl.editControl.style.backgroundColor = 'rgb(200,200,200)';
                ctrl.editControl.style.color           = 'rgb(70,70,70)';
            }  
       }
    }
    
    if(withCtrlButton)
    {
      var btnContainer  = dialogs.addPanel(this.parent,"cssRibbon",1,2,1,1);
          btnContainer.backgroundColor = "gray"; 
      utils.buildGridLayout_templateColumns( btnContainer , "repeat(4,1fr)  ");
      utils.buildGridLayout_templateRows   ( btnContainer , "0.5em 1fr 0.5em");
  
      this.btnOk    = dialogs.addButton( btnContainer ,""             ,2,2,1,1,"OK");
      this.btnOk.callBack_onClick = function() {if(this.callBack_onOKBtn) { this.callBack_onOKBtn( this.getInputFormValues() )};}.bind(this);

      this.btnAbort = dialogs.addButton( btnContainer ,"cssAbortBtn01",3,2,1,1,"Abbruch");
      this.btnAbort.callBack_onClick = function(){if(this.callBack_onESCBtn) this.callBack_onESCBtn();}.bind(this);
    }  
  } 


  getInpElement(id)
  {
   if( this.parentWnd ) return this.parentWnd.getElementById(id)
    else
       {
        for(var i=0; i<this.controls.length; i++)
        {
            var ctrl = this.controls[i];
            if (ctrl.fieldName.toUpperCase()==id.toUpperCase()) return ctrl;
         }
         return null;   
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





  __getInputFormValues(searchByName)
  {
    var result = [];

    if( this.parentWnd )
    {
      var childList = [];
      if(searchByName) childList =             this.parentWnd.getChildListByName(searchByName);
      else             childList =  Array.from(this.parentWnd.querySelectorAll('*'));

      childList.forEach(function(element) 
      {
        console.log(element.id + ' -> ' + element.value); 
        result.push( { field:element.id, value:element.value } ) 
      });
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





export class TPropertyEditor
//  properties = [{label:"Beschriftung" , value:"Wert" , type:"text" , items:["item1" , "item2" , ... , "itemx"] } , {} , {} ]
{
  constructor( aParent , aProperties , aBtnSave , aCallBack_onSave )
  {
    this.parent           = aParent;
    this.properties       = aProperties;
    this.btnSave          = aBtnSave;
    this.callBack_onSave  = aCallBack_onSave;  

    this.btnSave.callBack_onClick = function() { this.save() }.bind(this);
  }  


  setProperties( properties )
  {
    this.properties = properties;
    this.render();
  }
  
  
  render()
  { 
    this.parent.DOMelement.innerHTML           = '';
    this.parent.DOMelement.style.display       = 'block';
    this.parent.DOMelement.style.flexDirection = 'column';
  
   for (var i=0; i<this.properties.length; i++ )
  {
     var item = this.properties[i];

     if(item.type.toUpperCase()=='INPUT')
     { 
       var p = dialogs.addPanel( this.parent , 'cssvalueListPanel' , 0 , 0 , '99%' , '2.4em' );   // Dimension sind bereits im css definiert
           p.isGridLayout = true;  // kommt vom css
           p.backgroundColor = (i % 2) != 0 ? "RGB(240,240,240)" : "RGB(255,255,255)"; 
           dialogs.addLabel( p ,'cssBoldLabel',2,2, item.label);
           item.control = dialogs.addInputGrid( p , 3 , 2 , 1  , '' , '' , item.value  );
     }      
     
     if(item.type.toUpperCase()=='COMBOBOX')
     {      
       var p = dialogs.addPanel( this.parent , 'cssvalueListPanel' , 0 , 0 , '99%' , '2.4em' );   // Dimension sind bereits im css definiert
           p.isGridLayout = true;  // kommt vom css
           p.backgroundColor = (i % 2) != 0 ? "RGB(240,240,240)" : "RGB(255,255,255)"; 
           dialogs.addLabel( p ,'cssBoldLabel',2,2, item.label );
           item.control = dialogs.addComboboxGrid( p , 3 , 2 , 4  , '' , '' , item.value , item.items )
      }      
    }
  }


save()
{
  var p=[];

  for (var i=0; i<this.properties.length; i++ )
  {
    var item = this.properties[i];
        if (item.control) 
           if((item.type.toUpperCase()=='INPUT') || (item.type.toUpperCase()=='COMBOBOX'))  
           {
             item.value = item.control.value;
             p.push({label:item.label , value:item.value});
             {console.log('item.label -> '+item.label+'  item.value -> ' + item.value)}
           }   
  }  
  
  if(this.callBack_onSave) this.callBack_onSave(p)
}    

}



