

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";

import { TFCatalog   }   from "./tfWebApp/tfCatalog.js";


import * as forms                from "./forms.js";
import { TFgui }                 from "./tfWebApp/tfGUI.js";
import { TFDataObject }          from "./tfWebApp/tfDbObjects.js";
import { TFComboBox }            from "./tfWebApp/tfObjects.js";



export class TBanf 
{
    constructor(dbBanf = {}) 
    { 
      this.banf     = {};
      this.banfHead = {};
      if (!dbBanf) this.banf = new TFDataObject( "banf" );
      else    
          {// Prüfung: enthält dbBanf **nur** das Feld "ID"
           const keys = Object.keys(dbBanf);
           if (keys.length === 1 && keys[0] === "ID") this.banf = new TFDataObject( "banf" , dbBanf.ID , null   );
           else                                       this.banf = new TFDataObject( "banf" , ''        , dbBanf );
          }  
    }


    load_lookUpTables()
    { 
      // Kataloge sind "eigentlich" in der Form ID, CAPTION gedacht. Wenn aber die ID keine Rolle spielt, da Katalog-Einträge nicht als Referenz via Fremdschlüssel gespeichert wird
      // sollte das ID-Feld leer bleiben - Andernfalls liefert die VALUE eine ID zurück, was bei "direkt" gespeicherten Datenfeldern kontraproduktiv ist.
      //                                                                                      ID  
      this.lookUp_mengenEinheit        = new TFCatalog( null , 'MENGENEINHEIT'        , 'V' , '' , 'Mengeneinheiten' );
      this.lookUp_warenGruppe          = new TFCatalog( null , 'WARENGRUPPE'          , 'V' , '' , 'Warengruppen' );
      this.lookUp_einkaeuferGruppe     = new TFCatalog( null , 'EINKAUFSGRUPPE      ' , 'V' , '' , 'Einkaufs-Gruppe' );
      this.lookUp_einkaufsOrganisation = new TFCatalog( null , 'EINKAUFSORGANISATION' , 'V' , '' , 'Einkaufs-Organisation' );
      this.lookUp_werk                 = new TFCatalog( null , 'WERK'                 , 'V' , '' , 'Werk' );

      this.lookUp_lieferant            = new TFCatalog( null , 'LIEFERANT'            , 'V' , '' , 'Lieferanten' );
      this.lookUp_sachkonto            = new TFCatalog( null , 'SACHKONTO'            , 'V' , '' , 'Sachkonten' );
      this.lookUp_auftrag              = new TFCatalog( null , 'AUFTRAG'              , 'V' , '' , 'Auftrags-Nummern' );
      this.lookUp_material             = new TFCatalog( null , 'MATERIAL'             , 'V' , '' , 'Material' );
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

  var caption = this.banf.ID ? 'Banf-Position bearbeiten' : 'Banf-Position anlegen';
  var gui     = new TFgui( null , forms.inpBANF , {caption:caption});

  gui.editFeld_K.setItems( [ 'X','Z','F' ] );
  gui.editFeld_P.setItems( [ 'B' ] );
  
  gui.labelBanfBez.caption     = this.banfHead.NAME;
  gui.labelBanfDetails.caption = this.banfHead.BESCHREIBUNG;


   // Vorbefüllung der Select-Felder mit den zugehörigen Katalogen und die Verbindung der Katalog-Schaltfläche mit dem Katalog-Dialog
 
   gui.selectMaterial.setItems(this.lookUp_material.asListBoxItems());
   gui.btnMaterial.callBack_onClick = async function(){
                                                             await this.self.lookUp_material.show();
                                                             this.gui.selectMaterial.setItems(this.self.lookUp_material.asListBoxItems() );
                                                             this.gui.selectMaterial.value =  this.self.lookUp_material.selected;
                                                           }.bind({self:this, gui:gui});



   gui.selMengenEinheit.setItems(this.lookUp_mengenEinheit.asListBoxItems());
   gui.btnSelectEinheit.callBack_onClick = async function(){
                                                             await this.self.lookUp_mengenEinheit.show();
                                                             this.gui.selMengenEinheit.setItems(this.self.lookUp_mengenEinheit.asListBoxItems() );
                                                             this.gui.selMengenEinheit.value =  this.self.lookUp_mengenEinheit.selected;
                                                           }.bind({self:this, gui:gui});


  gui.editWarengruppe.setItems(this.lookUp_warenGruppe.asListBoxItems());
  gui.btnWarengrp.callBack_onClick =  async function(){
                                                        await this.self.lookUp_warenGruppe.show();
                                                        this.gui.editWarengruppe.setItems(this.self.lookUp_warenGruppe.asListBoxItems() );
                                                        this.gui.editWarengruppe.value =  this.self.lookUp_warenGruppe.selected;
                                                      }.bind({self:this, gui:gui});


 gui.selLieferant.setItems(this.lookUp_lieferant.asListBoxItems());
 gui.btnLieferant.callBack_onClick =  async function(){
                                                        await this.self.lookUp_lieferant.show();
                                                        this.gui.selLieferant.setItems(this.self.lookUp_lieferant.asListBoxItems() );
                                                        this.gui.selLieferant.value =  this.self.lookUp_lieferant.selected;
                                                      }.bind({self:this, gui:gui});


gui.selWerk.setItems(this.lookUp_werk.asListBoxItems());
gui.btnWerk.callBack_onClick =  async function(){
                                                  await this.self.lookUp_werk.show();
                                                  this.gui.selWerk.setItems(this.self.lookUp_werk.asListBoxItems() );
                                                  this.gui.selWerk.value =  this.self.lookUp_werk.selected;
                                                }.bind({self:this, gui:gui});


gui.selEinkGrp.setItems(this.lookUp_einkaeuferGruppe.asListBoxItems());
gui.btnEinkGrp.callBack_onClick =  async function(){
                                                  await this.self.lookUp_einkaeuferGruppe.show();
                                                  this.gui.selEinkGrp.setItems(this.self.lookUp_einkaeuferGruppe.asListBoxItems() );
                                                  this.gui.selEinkGrp.value =  this.self.lookUp_einkaeuferGruppe.selected;
                                                }.bind({self:this, gui:gui});                                                


gui.selEinkOrg.setItems(this.lookUp_einkaufsOrganisation.asListBoxItems());
gui.btnEinkOrg.callBack_onClick =  async function(){
                                                      await this.self.lookUp_einkaufsOrganisation.show();
                                                      this.gui.selEinkOrg.setItems(this.self.lookUp_einkaufsOrganisation.asListBoxItems() );
                                                      this.gui.selEinkOrg.value =  this.self.lookUp_einkaufsOrganisation.selected;
                                                    }.bind({self:this, gui:gui});  


gui.selSachkonto.setItems(this.lookUp_sachkonto.asListBoxItems());
gui.btnSachkonto.callBack_onClick =  async function(){
                                                      await this.self.lookUp_sachkonto.show();
                                                      this.gui.selSachkonto.setItems(this.self.lookUp_sachkonto.asListBoxItems() );
                                                      this.gui.selSachkonto.value =  this.self.lookUp_sachkonto.selected;
                                                    }.bind({self:this, gui:gui});  


gui.selAuftrag.setItems(this.lookUp_auftrag.asListBoxItems());
gui.btnAuftrag.callBack_onClick =  async function(){
                                                      await this.self.lookUp_auftrag.show();
                                                      this.gui.selAuftrag.setItems(this.self.lookUp_auftrag.asListBoxItems() );
                                                      this.gui.selAuftrag.value =  this.self.lookUp_auftrag.selected;
                                                    }.bind({self:this, gui:gui});  


  gui.dataBinding(  this.banf );

  gui.update('GUI');

   gui.btnOk.callBack_onClick = function()
                                { 
                                  this.gui.update('data');    
                                  this.banf.save();
                                  this.gui.close();  
                                  if(this.callBack) this.callBack() ;
                                }.bind({gui:gui,banf:this.banf,callBack:callback_if_ready})
    
 
   gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})

  }
}
