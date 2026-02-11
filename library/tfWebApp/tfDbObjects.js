import * as utils        from "./utils.js";
import * as dialogs      from "./tfDialogs.js";


export class TFDataObject 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();
    #tableName     = '';
  

    callBack_onUpdate = null;

    constructor( tableName , ID , dataContainer) 
    {
      // Wird die ID übergben, wird der Datensatz geladen und gleichzeitig die Struktur ermittelt.
      // Wird nur der Tabellen-Name übergeben, wird NUR die Tabellenstruktur ermittelt - Die Daten müssen dan via "load(id)" nachgeladen werden...
      if(!tableName) {dialogs.showMessage("Ein 'TFDataObject' benötigt zwingend einen Tabellen-Namen ! "); return; }
      
      this.#tableName = tableName;
      
      if(dataContainer)
      {
        for(var key in dataContainer) this.#defineField( key , dataContainer[key] || '' );
      }
      else{
           if(!ID) 
           {
             var response = utils.webApiRequest('STRUCTURE',{tableName:tableName});
             if(response.error) {showMessage('Fehler beim Abfragen der Tabllenstruktur: '+response.errMsg); return; }
             for(var i=0; i<response.result.length; i++) this.#defineField( response.result[i]['name'] , '' );
           }
            else {
                   var response = this.load_from_dB( ID );
                   if(response.error) {showMessage('Fehler beim Abfragen des Datensatzes mit der ID='+ID+' : '+response.errMsg); return; }
                   for(var key in response.result) this.#defineField( key , response.result[key] || '' );
                 }
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
      return  utils.webApiRequest('FETCHRECORD',{sql:"Select * from "+this.#tableName+" Where ID="+id} );
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
      if((this.ID=='') || (this.ID=='0') )
      {  
        var response = utils.webApiRequest('INSERTINTOTABLE',{tableName:this.#tableName, fields:this.#data} );
        if(response.error){ dialogs.showMessage(response.errMsg); return false; }
        else this.#data.ID = response.result.lastInsertRowid;    
      }
      else {  
             var response = utils.webApiRequest('UPDATETABLE',{tableName:this.#tableName, ID_field:'ID', ID_value:this.ID, fields:this.#data} );
             if(response.error){ dialogs.showMessage(response.errMsg); return false; }
      }    
        
      this.markClean();
      return true;
    }

    update(params)
    {
      var fields = {};
      var flag   = false;
      var cnt    = 0;
      for(var key in this.#data) 
      {
          var content = this.#data[key];
          if(content == '')
          {  
             if(!params?.ignoreEmptyValues) fields[key] = '';  // Wenn leerfeldwr NICHT ignoriert werden sollen, wird das leere Feld angehängt....
          } 
          else {
                 if(key.toUpperCase()!='ID')
                 { 
                   cnt++; 
                   fields[key] = content;
                 }  
               }  
      }  
       
      if(cnt>0)
      {
         var response = utils.webApiRequest('UPDATETABLE',{tableName:this.#tableName, ID_field:'ID', ID_value:this.ID, fields:fields} );
         if(response.error){ dialogs.showMessage(response.errMsg); return false; }
      }
      else return false;   
    }



   
}