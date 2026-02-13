
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel }       from "./tfWebApp/tfObjects.js";


export class TBanfHead 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();

    
    constructor(dbBanfHead = {}) 
    { 
     // Prüfung: enthält dbBanf **nur** das Feld "ID"
     const keys = Object.keys(dbBanfHead);

     if (keys.length === 1 && keys[0] === "ID") 
     {
      const response = this.load_from_dB(dbBanfHead.ID);
      if (!response.error) dbBanf = response.result;
     }
       
     for (const field in dbBanfHead) 
     {
             const value = dbBanfHead[field];
             this.#defineField(field, value || '');
             console.log("THIS->" + utils.JSONstringify(this));
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
      return  utils.webApiRequest('BANFHEAD',{ID:id} );
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
      var response = utils.webApiRequest('SAVEBANFHEAD',{banfHead:this.#data} );
      if(response.error)
      {
        dialogs.showMessage(response.errMsg);
        return false;
      }
                        
      if(!this.#data.ID) this.#data.ID = response.result.lastInsertRowid;                                   
      this.markClean();
      return true;
    }
   

edit( callback_if_ready )
{
  var caption = this.ID ? 'Banf-Vorlage bearbeiten' : 'Banf-Vorlage anlegen';
  var w       =    dialogs.createWindow( null,caption,"50%","30%","CENTER");  
  var _w      =    w.hWnd;
  
              // aParent      , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( _w     , this.#data , {}      , {}        , ['ID','OWNER']       , {}       , '' );    
      inp.setLabel('NAME','Name');
      inp.setLabel('BESCHREIBUNG','Beschreibung');
      inp.setLabel('DATUM','Datum');
      inp.setInputType('DATUM','DATE' );

      inp.render( true ); 

      //Eigenschaften, die das Control--Element betreffen können erst nach dem Rendern aufgerufen werden...
      inp.setInputLength('NAME', '20em');
      inp.setInputLength('DATUM', '10em');

      inp.callBack_onESCBtn = function() { this.wnd.close(); }.bind( {self:this, wnd:w} )
      inp.callBack_onOKBtn  = function(values) {
                                               for(var i=0; i<values.length; i++) 
                                               { this.self.#data[values[i].field] = values[i].value }
                                               this.self.save();  
                                               this.wnd.close(); 
                                               if(this.callback) this.callback();
                                             }.bind( {self:this, wnd:w, inp:inp , callback:callback_if_ready} )
 }
}

