

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";

import { TFCatalog   }   from "./tfWebApp/tfCatalog.js";
import { TFDateTime  }   from "./tfWebApp/utils.js";  

import * as forms                from "./forms.js";
import { TFgui }                 from "./tfWebApp/tfGUI.js";
import { TFDataObject }          from "./tfWebApp/tfDbObjects.js";



export class TBanf 
{
    constructor(dbBanf = {}) 
    { 
      this.banf = {};
      
      if (!dbBanf) this.banf = new TFDataObject( "banf" );
      else    
          {// Prüfung: enthält dbBanf **nur** das Feld "ID"
           const keys = Object.keys(dbBanf);
           if (keys.length === 1 && keys[0] === "ID") this.banf = new TFDataObject( "banf" , dbBanf.ID );
           else                                       this.banf = new TFDataObject( "banf" , dbBanf.ID , dbBanf );
          }  
    }


    load_lookUpTables()
    { 
      this.lookUp_mengenEinheit        = new TFCatalog( null , 'MENGENEINHEIT'        , 'V' , 'ID' , 'Mengeneinheiten' );
      this.lookUp_warenGruppe          = new TFCatalog( null , 'WARENGRUPPE'          , 'V' , 'ID' , 'Warengruppen' );
      this.lookUp_einkaeuferGruppe     = new TFCatalog( null , 'EINKAUFSGRUPPE      ' , 'V' , 'ID' , 'Einkaufs-Gruppe' );
      this.lookUp_einkaufsOrganisation = new TFCatalog( null , 'EINKAUFSORGANISATION' , 'V' , 'ID' , 'Einkaufs-Organisation' );
      this.lookUp_werk                 = new TFCatalog( null , 'WERK'                 , 'V' , 'ID' , 'Werk' );

      this.lookUp_lieferant            = new TFCatalog( null , 'LIEFERANT'            , 'V' , 'ID' , 'Lieferanten' );
      this.lookUp_sachkonto            = new TFCatalog( null , 'SACHKONTO'            , 'V' , 'ID' , 'Sachkonten' );
      this.lookUp_auftrag              = new TFCatalog( null , 'AUFTRAG'              , 'V' , 'ID' , 'Auftrags-Nummern' );
    }
    

    load(id) 
    {
     return this.banf.load();
    }
  
    save() 
    { 
      return this.banf.save();
    }
   

edit( callback_if_ready )
{
  this.load_lookUpTables();

  var caption = this.ID ? 'Banf-Position bearbeiten' : 'Banf-Position anlegen';
  var gui     = new TFgui( null , forms.inpBANF , {caption:caption});

 gui.labelBanfBez.caption     = '';
 gui.labelBanfDetails.caption = '';


   // Vorbefüllung der Select-Felder mit den zugehörigen Katalogen und die Verbindung der Katalog-Schaltfläche mit dem Katalog-Dialog
   gui.selMengenEinheit.setItems(this.lookUp_mengenEinheit.asListBoxItems());
   gui.btnSelectEinheit.callBack_onClick = async function(){
                                                             await this.self.lookUp_mengenEinheit.show();
                                                             this.gui.selMengenEinheit.setItems(this.self.lookUp_mengenEinheit.asListBoxItems() );
                                                           }.bind({self:this, gui:gui});


  gui.editWarengruppe.setItems(this.lookUp_warenGruppe.asListBoxItems());
  gui.btnWarengrp.callBack_onClick =  async function(){
                                                        await this.self.lookUp_warenGruppe.show();
                                                        this.gui.editWarengruppe.setItems(this.self.lookUp_warenGruppe.asListBoxItems() );
                                                      }.bind({self:this, gui:gui});


 gui.selLieferant.setItems(this.lookUp_lieferant.asListBoxItems());
 gui.btnLieferant.callBack_onClick =  async function(){
                                                        await this.self.lookUp_lieferant.show();
                                                        this.gui.selLieferant.setItems(this.self.lookUp_lieferant.asListBoxItems() );
                                                      }.bind({self:this, gui:gui});


gui.selWerk.setItems(this.lookUp_werk.asListBoxItems());
gui.btnWerk.callBack_onClick =  async function(){
                                                  await this.self.lookUp_werk.show();
                                                  this.gui.selWerk.setItems(this.self.lookUp_werk.asListBoxItems() );
                                                }.bind({self:this, gui:gui});


gui.selEinkGrp.setItems(this.lookUp_einkaeuferGruppe.asListBoxItems());
gui.btnEinkGrp.callBack_onClick =  async function(){
                                                  await this.self.lookUp_einkaeuferGruppe.show();
                                                  this.gui.selEinkGrp.setItems(this.self.lookUp_einkaeuferGruppe.asListBoxItems() );
                                                }.bind({self:this, gui:gui});                                                


gui.selEinkOrg.setItems(this.lookUp_einkaufsOrganisation.asListBoxItems());
gui.btnEinkOrg.callBack_onClick =  async function(){
                                                      await this.self.lookUp_einkaufsOrganisation.show();
                                                      this.gui.selEinkOrg.setItems(this.self.lookUp_einkaufsOrganisation.asListBoxItems() );
                                                    }.bind({self:this, gui:gui});  


gui.selSachkonto.setItems(this.lookUp_sachkonto.asListBoxItems());
gui.btnSachkonto.callBack_onClick =  async function(){
                                                      await this.self.lookUp_sachkonto.show();
                                                      this.gui.selSachkonto.setItems(this.self.lookUp_sachkonto.asListBoxItems() );
                                                    }.bind({self:this, gui:gui});  


gui.selAuftrag.setItems(this.lookUp_auftrag.asListBoxItems());
gui.btnAuftrag.callBack_onClick =  async function(){
                                                      await this.self.lookUp_auftrag.show();
                                                      this.gui.selAuftrag.setItems(this.self.lookUp_auftrag.asListBoxItems() );
                                                    }.bind({self:this, gui:gui});  


   gui.dataBinding(  this.banf );
   //gui.translateForGUI = function(fieldName , value , guiElement ) { debugger; return value };
   gui.update('form');




   gui.btnOk.callBack_onClick = function()
                                { 
                                  this.gui.update('data');    
                                  this.banf.save();
                                  this.gui.close();  
                                  if(this.callBack) this.callBack() ;
                                }.bind({gui:gui,banf:this.banf,callBack:callback_if_ready})
 }                                

 




/*
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

      inp.setInputType("MENGENEINHEIT"        , "lookup" ,{items:this.lookUp_mengenEinheit.asStringList()}   );        
      inp.setInputType("WARENGRUPPE"          , "lookup" ,{items:this.lookUp_warenGruppe.asStringList()}     );        
      inp.setInputType("LIEFERANT"            , "lookup" ,{items:this.lookUp_lieferant.asStringList()}       );        
      inp.setInputType("WERK"                 , "lookup" ,{items:this.lookUp_werk.asStringList()}            );        
      inp.setInputType("EINKAEUFERGRUPPE"     , "lookup" ,{items:this.lookUp_einkaeuferGruppe.asStringList()}); 
      inp.setInputType("EINKAUFSORGANISATION" , "lookup" ,{items:this.lookUp_einkaufsOrganisation.asStringList()}); 
      inp.setInputType("SACHKONTO"            , "lookup" ,{items:this.lookUp_sachkonto.asStringList()}       ); 
      inp.setInputType("AUFTRAG"              , "lookup" ,{items:this.lookUp_auftrag.asStringList()}         ); 
      
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


*/

}
