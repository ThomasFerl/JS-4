import * as utils    from "./utils.js";
import * as objects  from "./tfObjects.js";
import * as dialogs  from "./tfDialogs.js";





export class TFgui 
{ 
   dataBinding( dataObject )
  { debugger;
    this.dataObject = dataObject;
    this.dataBindings = [];
    for(var key in dataObject)  // durchlaufe alle Datenfelder des DataRecords bzw Datenobjekts
    {
      var element = this.getElementByFieldName(key);  // suche nach einem gui-Element, das mit diesem Feldnamen übereinstimmt
      if (element) this.dataBindings.push( {key:key, guiElement:element} );  // bei Treffer wird Databinding-Container gefüllt... 
    }
  }


  update(direction)
  { 
    if (direction.toUpperCase() == 'GUI') 
     {
       this.dataBindings.forEach(binding => {
        this.translateForGUI( binding.key , this.dataObject[binding.key] , binding.guiElement );
      });
    } 
    
    if (direction.toUpperCase() == 'DATA') 
     {
       this.dataBindings.forEach(binding => {
        this.dataObject[binding.key] = this.translateForData(binding.key, binding.guiElement.value);
      });
    }
  }


   constructor ( aParent , guiNameOrguiObject , params )
  { 
      this.params              = params || {};
      this.dataBindings        = [];
      this.dataObject          = {};

      
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

 // wird überschrieben, wenn ein Datenfeld abgeleitet, umgerechnet oder getypCastet werden soll...
 this.translateForGUI  = function ( fieldName , value , guiElement ) { guiElement.value = value; return value };
 this.translateForData = function ( fieldName , value , guiElement ) { return value };

      
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

  getElementByFieldName(fieldName)
  { 
    // alle guiElemente durchlaufen und nach übereinstimmenden Feldnamen suchen...
    for (var key in this.guiObjects) 
      {
        var guiObj = this.guiObjects[key];
        // besitzt das obj das Property "dataFieldName" ?
        if(guiObj.hasOwnProperty('dataFieldName'))
           if (guiObj.dataFieldName.toUpperCase() == fieldName.toUpperCase()) return this.guiObjects[key];
    }

    return null;
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

