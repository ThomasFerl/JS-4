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
      
      this.etc = false;
      if (tableName.includes(".")) 
        { 
          const parts     = tableName.split("."); 
          this.#tableName = parts[1]; // rechter Teil etc = true; }
          this.etc        = parts[0].toUpperCase()=='ETC';
        }
        else this.#tableName = tableName;  

      
      
      if(dataContainer)
      {
        for(var key in dataContainer) this.#defineField( key , dataContainer[key] || '' );
      }
      else{
           if(!ID) 
           {
             var response = utils.webApiRequest('STRUCTURE',{tableName:tableName, etc:this.etc});
             if(response.error) {dialogs.showMessage('Fehler beim Abfragen der Tabllenstruktur: '+response.errMsg); return; }
             for(var i=0; i<response.result.length; i++) this.#defineField( response.result[i]['NAME'] , '' );
           }
            else {
                   var response = this.load_from_dB( ID );
                   if(response.error) {dialogs.showMessage('Fehler beim Abfragen des Datensatzes mit der ID='+ID+' : '+response.errMsg); return; }
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
      return  utils.webApiRequest('FETCHRECORD',{ sql:"Select * from "+this.#tableName+" Where ID="+id , etc:this.etc } );
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
        var response = utils.webApiRequest('INSERTINTOTABLE',{tableName:this.#tableName, fields:this.#data  , etc:this.etc } );
        if(response.error){ dialogs.showMessage(response.errMsg); return false; }
        else this.#data.ID = response.result.lastInsertRowid;    
      }
      else {  
             var response = utils.webApiRequest('UPDATETABLE',{tableName:this.#tableName, ID_field:'ID', ID_value:this.ID, fields:this.#data ,  etc:this.etc } );
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
         var response = utils.webApiRequest('UPDATETABLE',{tableName:this.#tableName, ID_field:'ID', ID_value:this.ID, fields:fields,  etc:this.etc} );
         if(response.error){ dialogs.showMessage(response.errMsg); return false; }
      }
      else return false;   
    }



   
}




export class TFCatalogObject
{
    constructor( tableName , field, ID ) 
    {
      if(!tableName) {dialogs.showMessage("Ein 'TFDataObject' benötigt zwingend einen Tabellen-Namen ! "); return; }
      
      this.tableName  = tableName;
      this.field      = field;
      this.catalog    = [];
      this.ID         = ID || '';
    }  

    stringList() 
    {
      var i =[];
      for(var j=0; j<this.catalog.length; j++) i.push(this.catalog[j][this.field]);
      return i;
    }  


    listBoxitems()
    {
      var i =[];

      if(this.ID != '') for(var j=0; j<this.catalog.length; j++) i.push({value:this.catalog[j][this.ID]   , caption:this.catalog[j][this.field]});
      else              for(var j=0; j<this.catalog.length; j++) i.push({value:this.catalog[j][this.field], caption:this.catalog[j][this.field]});

      return i;
    }



    addItem( itemText )
    {
      var payload  = {[this.field]:itemText};
      utils.webApiRequest( 'INSERTINTOCATALOG' , {tableName:this.tableName, field:payload } );
    }


    async removeItem( items , askBeforeDelete ) 
    { 
      var msg = '';
      var ok  = false;

      if(items.length > 1) msg = 'Sollen die gewählten Einträge gelöscht werden ?';
      else                 msg = 'Soll dieser Eintrag gelöscht werden ?' 

      if(askBeforeDelete) ok = await dialogs.askModal("Katalogeintrag löschen" , msg );
      else                ok = true;   

      if(ok)
      {  
          if(this.ID != '')  for(var i=0; i<items.length; i++)  utils.webApiRequest( 'DROP' , {tableName:this.tableName , ID_field:this.ID    , ID_value:items[i].value} )
          else               for(var i=0; i<items.length; i++)  utils.webApiRequest( 'DROP' , {tableName:this.tableName , ID_field:this.field , ID_value:items[i].value} )
     }
   }


   
    load()
    {
      var response = {};
      if(this.ID != '') response = utils.webApiRequest('FETCHRECORDS',{sql:"Select "+this.ID+", "+this.field+" from "+this.tableName} ); 
      else              response = utils.webApiRequest('FETCHRECORDS',{sql:"Select "+this.field+" from "+this.tableName+" Order by " + this.field} ); 
      
      
      
      if(response.error) {
                           dialogs.showMessage('Fehler beim Abfragen des Kataloges "'+this.tableName+'" : '+response.errMsg ); 
                           return false; 
                         }
      this.catalog = response.result;
     
      return true;
    }   
  

    update(params)
    {
      this.catalog = [];
      this.load();
      return this.listBoxitems();
    }

}