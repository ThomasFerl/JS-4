
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel,
         TFImage,
         TPropertyEditor
       }                        from "./tfWebApp/tfObjects.js";  
       
import {TFMediaCollector_thumb} from "./tfMediaCollector_thumb.js";


export class TFDataObject 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();
    #dataBinding   = [];

    callBack_onUpdate = null;

    constructor( dbRecord = {} ) 
    { 
      const keys = Object.keys(dbRecord);

    // Prüfung: enthält dbRecord **nur** das Feld "ID" dann wird es aus der dB geladen. Dazu muss natürlich eine dB-Instanz mitgegeben werden
    if (keys.length === 1 && keys[0] === "ID") 
    {
      const response = this.load_from_dB(dbRecord.ID);
      if (!response.error) dbRecord = response.result;
    }

        for (const field in dbRecord) 
            {
             const value = dbRecord[field];
             this.#defineField(field, value || '');
         }
    }  
  
   
    #defineField(fieldName, defaultValue) 
    {
      // "ERZEUGEN" des Feldnamen innerhalb des lokalen "Data-Containers" 
      this.#data    [fieldName] = defaultValue || '';
      this.#original[fieldName] = defaultValue || '';
     
      Object.defineProperty(this, fieldName, {
                                               get: () => this.#data[fieldName],
                                               set: (val) => {
                                                               this.#data[fieldName] = val;
                                                               if (val !== this.#original[fieldName]) this.#dirtyFields.add(fieldName);
                                                               else                                   this.#dirtyFields.delete(fieldName);
                                                             },
                                              enumerable: true
                                            });
    }
  
    get isDirty() {return this.#dirtyFields.size > 0;}
    
  
    getChangedFields() {return Array.from(this.#dirtyFields);}
    
  
    markClean() 
    {
      this.#dirtyFields.clear();
      Object.assign(this.#original, this.#data);
    }
  
    load_from_dB(id) 
    {
      return  utils.webApiRequest('PERSON',{ID:id} );
    }

    load(id) 
    {
       var response = this.load_from_dB(id); 
       if(response.error){return false;}
               
      this.#data = response.result;                                    
      this.markClean();
      
      return true;
    }
  
    save() 
    { 
      var response = utils.webApiRequest('SAVEPERSON',{person:this.#data} );
      if(response.error){
         dialogs.showMessage(response.errMsg);
        return false;
      }
                        
      if(!this.#data.ID) this.#data.ID = response.result.lastInsertRowid;                                   
      this.markClean();
      return true;
    }
   

    bindToGUI( guiObject , fieldName )
    { // nur wenn fieldName in this.#data existiert ergibt ein Binding sinn
      if((fieldName in this.#data)) this.#dataBinding.push({guiObject, fieldName});
    }

    #updateGUI(fieldName)
    {
      if(fieldName==undefined) fieldName='*';

      for (const binding of this.#dataBinding) 
      {
        if ((binding.fieldName === fieldName)||(fieldName=='*'))  
        binding.guiObject.value = this.#data[fieldName];
      }
    }

    #loadFromGUI(fieldName)
    {
       if(fieldName===undefined) fieldName='*';
       for (const binding of this.#dataBinding) 
       {
        if ((binding.fieldName === fieldName)||(fieldName=='*'))  
        {
          if(this.callBack_onUpdate!=null) 
               this.#data[fieldName] = this.callBack_onUpdate(fieldName, binding.guiObject);
          else this.#data[fieldName] = binding.guiObject.value;
        }
      }
    }

}