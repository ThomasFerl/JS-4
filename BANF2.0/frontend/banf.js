
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel }       from "./tfWebApp/tfObjects.js";


export class TBanf 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();

    
    constructor(dbBanf = {}) 
    { 
     // Prüfung: enthält dbBanf **nur** das Feld "ID"
     const keys = Object.keys(dbBanf);

     if (keys.length === 1 && keys[0] === "ID") 
     {
      const response = this.load_from_dB(dbBanf.ID);
      if (!response.error) dbBanf = response.result;
     }
       
     for (const field in dbBanf) 
     {
             const value = dbBanf[field];
             this.#defineField(field, value || '');
             console.log("THIS->" + utils.JSONstringify(this));
     }

     this.banfHead = utils.webApiRequest('BANFHEAD' , {ID:this.ID_HEAD}).result;
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
      return  utils.webApiRequest('BANF',{ID:id} );
    }

    load_lookUpTables()
    {
      this.lookUp_mengenEinheit        = utils.webApiRequest('LOOKUPLIST',{tableName:'MENGENEINHEIT' , asStringList:true} ).result;
      this.lookUp_warenGruppe          = utils.webApiRequest('LOOKUPLIST',{tableName:'WARENGRUPPE' , asStringList:true} ).result;
      this.lookUp_einkaeuferGruppe     = utils.webApiRequest('LOOKUPLIST',{tableName:'EINKAUFSGRUPPE' , asStringList:true} ).result;    
      this.lookUp_einkaufsOrganisation = utils.webApiRequest('LOOKUPLIST',{tableName:'EINKAUFSORGANISATION' , asStringList:true} ).result;
      this.lookUp_werk                 = utils.webApiRequest('LOOKUPLIST',{tableName:'WERK' , asStringList:true} ).result;
      this.lookUp_lieferant            = utils.webApiRequest('LOOKUPLIST',{tableName:'LIEFERANT' , asStringList:true} ).result;
      this.lookUp_sachkonto            = utils.webApiRequest('LOOKUPLIST',{tableName:'SACHKONTO' , asStringList:true} ).result;
      this.lookUp_auftrag              = utils.webApiRequest('LOOKUPLIST',{tableName:'AUFTRAG' , asStringList:true} ).result;
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
      var response = utils.webApiRequest('SAVEBANF',{banf:this.#data} );
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
  this.load_lookUpTables();

  var caption = this.ID ? 'Banf-Position bearbeiten' : 'Banf-Position anlegen';
  var w       =    dialogs.createWindow( null,caption,"50%","94%","CENTER");  
  var _w      =    w.hWnd;

  _w.buildGridLayout_templateColumns('1fr');
  _w.buildGridLayout_templateRows   ('4em 1fr');

  var c = dialogs.addPanel( _w ,'',1,1,1,1 );
  c.buildGridLayout_templateColumns('1fr');
  c.buildGridLayout_templateRows   ('1fr 1fr 1fr');
  var l1 = dialogs.addLabel(c , '' , 1,1,1,2, this.banfHead.NAME );
  l1.fontSize = '1.5em';
  l1.fontWeight = 'bold';
  l1.justifyContent = 'left';

  var l2 = dialogs.addLabel(c , '' , 1,3,1,1, this.banfHead.BESCHREIBUNG );
  l2.fontSize = '0.77em';
  l2.justifyContent = 'left';
  

  var d = dialogs.addPanel( _w ,'cssContainerPanel',1,2,1,1 );

  
              // aParent     , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( d     , this.#data , {}      , {}        , ['ID','ID_HEAD','OWNER']       , {}       , '' );    
      inp.setLabel('POSITIONSTEXT','Position');
      inp.setLabel('MENGE','Menge');
      inp.setLabel('MENGENEINHEIT','Mengen-Einheit');
      inp.setLabel('PREIS','Preis[€]');
      inp.setLabel('WARENGRUPPE','Warengruppe');
      inp.setLabel('LIEFERDATUM','Lieferdatum');
      inp.setLabel('LIEFERANT','Lieferant');
      inp.setLabel('WERK','Werk');
      inp.setLabel('EINKAEUFERGRUPPE','Einkäufer-Gruppe');
      inp.setLabel('EINKAUFSORGANISATION','Einkaufs-Organisation');
      inp.setLabel('ANFORDERER','Anforder');
      inp.setLabel('BEMERKUNG','Bemerkungen/Kommentare');
      inp.setLabel('SACHKONTO','Sachkonto');  
      inp.setLabel('AUFTRAG','Auftrag'); 

      inp.setInputType('LIEFERDATUM','DATE' );

      inp.setInputType("MENGENEINHEIT"        , "lookup" ,{items:this.lookUp_mengenEinheit}   );        
      inp.setInputType("WARENGRUPPE"          , "lookup" ,{items:this.lookUp_warenGruppe}     );        
      inp.setInputType("LIEFERANT"            , "lookup" ,{items:this.lookUp_lieferant}       );        
      inp.setInputType("WERK"                 , "lookup" ,{items:this.lookUp_werk}            );        
      inp.setInputType("EINKAEUFERGRUPPE"     , "lookup" ,{items:this.lookUp_einkaeuferGruppe}); 
      inp.setInputType("EINKAUFSORGANISATION" , "lookup" ,{items:this.lookUp_einkaufsOrganisation}); 
      inp.setInputType("SACHKONTO"            , "lookup" ,{items:this.lookUp_sachkonto}       ); 
      inp.setInputType("AUFTRAG"              , "lookup" ,{items:this.lookUp_auftrag}         ); 
      
      inp.render( true ); 

      //Eigenschaften, die das Control--Element betreffen können erst nach dem Rendern aufgerufen werden...
      inp.setInputLength('POSITIONSTEXT', '4em');
      inp.setInputLength('MENGE', '4em');
      inp.setInputLength('MENGENEINHEIT', '21em');
      inp.setInputLength('PREIS', '10em');
      inp.setInputLength('LIEFERDATUM', '10em');
      inp.setInputLength('WERK', '20em');
      inp.setInputLength('EINKAEUFERGRUPPE', '20em');
      inp.setInputLength('EINKAUFSORGANISATION', '20em');
      inp.setInputLength('ANFORDERER', '20em');
            

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

