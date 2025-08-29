import * as utils    from "./utils.js";
import * as objects  from "./tfObjects.js";

export class TFgui 
{ 
   constructor ( aParent , guiNameOrguiObject )
  {
      this.dashBoard           = aParent;
      this.dashBoard.innerHTML = '';
      this.guiObjects          = {___ID:''};
      
      var formData             = null; 
    
      if (typeof guiNameOrguiObject === 'string') formData  = utils.loadForm(guiNameOrguiObject);
      if (typeof guiNameOrguiObject === 'object') formData  = guiNameOrguiObject;

      if(formData==null) return;

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
    var proxy = new Proxy( this.guiObjects , {
                                            get(target, prop) {
                                                                return prop in target ? target[prop] : createDummyComponent(prop);
                                                              },

                                             set(target, prop, value) {
                                                                        if (prop in target) {
                                                                                              target[prop] = value;
                                                                                              return true;
                                                                                            }
                                                                         console.warn(`⚠️ '${prop}' existiert nicht – 'set' wird ignoriert.`);
                                                                         return true;
                                                                      }
                                         });
    return proxy;
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

