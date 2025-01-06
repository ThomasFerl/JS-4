
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



