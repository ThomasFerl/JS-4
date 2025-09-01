import * as utils    from "./utils.js";
import * as objects  from "./tfObjects.js";
import * as dialogs  from "./tfDialogs.js";





export class TFgui 
{ 
   constructor ( aParent , guiNameOrguiObject , params )
  { 
      this.params              = params || {};
      
      var formData             = null; 
      if (typeof guiNameOrguiObject === 'string') formData  = utils.loadForm(guiNameOrguiObject);
      if (typeof guiNameOrguiObject === 'object') formData  = guiNameOrguiObject;

      if(aParent==null)
        { 
          this.window       = dialogs.createWindow(null, '' , formData.width, formData.height , 'CENTER');
          this.dashBoard    = this.window.hWnd;
          this.params.autoSizeWindow = false; // Fenster ist bereits in gewünschter Größe
      }
      else {
             if(aParent.constructor.name == 'TFWindow')
             {
               this.window    = aParent;
               this.dashBoard = aParent.hWnd;
             }
             else { 
                     this.dashBoard = aParent;
                     this.window    = utils.getParentWindow(aParent);
                 }   
      }       
      
      this.dashBoard.innerHTML = '';
      this.guiObjects          = {___ID:''};
    
      if(this.params.autoSizeWindow)
        {
          this.window.width  = formData.width;
          this.window.height = formData.height;
      }
      
      this.dashBoard.backgroundColor = formData.backgroundColor;
      this.dashBoard.buildGridLayout( formData.gridLayout );

    
      for(var i=0; i<formData.children.length; i++)
      {
        var c = formData.children[i];
         objects.addComponent( this.dashBoard , c , function(e){   // CallBack on Ready
                                                                 this.guiObjects[e.name] = e;
                                                               }.bind(this) )
      } 
      
      
 // proxy-Klasse für bequemen Zugriff einrichten ....
var proxy = new Proxy(this.guiObjects, {
  get: (target, prop) => { if (prop in target) return target[prop];
                           if (typeof this[prop] === 'function') return this[prop].bind(this); // Methode aus TFgui
                           return createDummyComponent(prop);
                         },
  set: (target, prop, value) => { if (prop in target) { target[prop] = value;
                                                        return true;
                                                      }
                                 console.warn(`⚠️ '${prop}' existiert nicht – 'set' wird ignoriert.`);
                                 return true;
                                }
  });

  return proxy;
  }





  close()
  {
    if(this.window!=null) this.window.close();
  }

}






function createDummyComponent(name = 'unbekannt') 
{
  return new Proxy({}, {
    get(target, prop) {
      console.warn(`⚠️ Zugriff auf Dummy-Komponente '${name}', Eigenschaft '${prop}'`);
      // Falls jemand .value oder .checked oder andere Props abfragt – gib neutrale Werte zurück
      if (prop === 'value') return '';
      if (prop === 'checked') return false;
      if (prop === 'focus') return () => {};
      if (prop === 'addEventListener') return () => {};
      return createDummyComponent(`${name}.${prop}`); // Für Kettenzugriffe: dummy.x.y.z
    },
    set(target, prop, value) {
      console.warn(`⚠️ Versuch, Dummy-Komponente: '${name}' -> ${prop} = "${value}" zu setzen`);
      return true; // Einfach akzeptieren
    }
  });
}

