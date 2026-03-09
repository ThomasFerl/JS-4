

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
      this.attachments = [];
      this.banf        = {};
      this.banfHead    = {};
      this.editKurztext= {value:""}; // brauchen wir global

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
      //this.lookUp_sachkonto            = new TFCatalog( null , 'SACHKONTO'            , 'V' , '' , 'Sachkonten' );
      //this.lookUp_auftrag              = new TFCatalog( null , 'AUFTRAG'              , 'V' , '' , 'Auftrags-Nummern' );
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
   

saveAttachements()
{ debugger;
  // prüfen, ob Attachements vorhanden sind
  if(this.attachments.length==0) return '';

  var attachIDs = [];

  // Die einzelnen Einträge vom temp. UploadPuffer ins Archiv verschieben und in dB registrieren ...
  for(var i=0; i<this.attachments.length; i++)
  {
    var attachment = this.attachments[i];
    var response   = utils.webApiRequest( 'ARCHIVEFILE' ,{filePath      :attachment.FILEPATH , 
                                                          orgFileName   :attachment.ORGFILENAME , 
                                                          arcFileName   :attachment.FILENAME ,
                                                          owner         :globals.session.userName,
                                                          description   :"Attachment zur BANF-Vorlage "
                                                        }) 

    if (!response.error) attachIDs.push(response.result.lastInsertRowid);

  }    
  
  if (attachIDs.length==0) return '';
  else                     return attachIDs.join('|');

}



showAttachment(id)
{
  var url = globals.getServer()+'/archiv/'+id;
  window.open( url , 'Attachment zur BANF-Vorlage', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no' );
}




edit( callback_if_ready )
{
  this.load_lookUpTables();

  var caption = this.banf.ID ? 'Banf-Position bearbeiten' : 'Banf-Position anlegen';
  var gui     = new TFgui( null , forms.inpBANF , {caption:caption});

 // Pflichtfelder - Die Anforderung kam erst nacgh dem Design -> daher Property im Code anpassen und nicht im GUI-Builder ...
 gui.editPos.require          = true;
 gui.editKurztext.require     = true;
 gui.editMenge.require        = true;
 gui.selMengenEinheit.require = true;
 gui.editPreis.require        = true;
 gui.editWarengruppe.require  = true;
 gui.editLiefertermin.require = true;
 gui.selLieferant.require     = true;
 gui.selWerk.require          = true;
 gui.selEinkGrp.require       = true;
 gui.selEinkOrg.require       = true;
 gui.editAnforderer.require   = true;
 gui.selSachkonto.require     = true;
 gui.selAuftrag.require       = true;
 
 // Alias...
  this.editKurztext           = gui.editKurztext;


  // Abhängigkeit: Wenn Feld_K == 'A'  -> Audftrags- und Sachkonto sind Pflichtfelder...
  //               Wenn Feld_K == 'F'  -> AuftragsNr ist KEIN Pflichtfeld und Sachkonto wird auf '759000' vorgegeben...
   gui.editFeld_K.setItems( [ 'A' ,'F' ] );
   gui.editFeld_K.callBack_onChange = function()
                                      {
                                        if(this.gui.editFeld_K.value=='F')
                                        {
                                          this.gui.selAuftrag.require    = true;
                                          this.gui.selSachkonto.require  = true;
                                          this.gui.selSachkonto.readOnly = false;
                                          this.gui.selSachkonto.value    = '';
                                        }  

                                        if(this.gui.editFeld_K.value=='A')
                                        {
                                          this.gui.selAuftrag.require   = false;
                                          this.gui.selSachkonto.require = false;
                                          this.gui.selSachkonto.value   = '759000';
                                          this.gui.selSachkonto.readOnly = true;
                                        }  


                                      }.bind({self:this, gui:gui});
  
/*

   gui.selAuftrag.require = true;


  


  gui.editFeld_P.setItems( [ ' ','B' ] );
  
*/

  gui.labelBanfBez.caption     = this.banfHead.NAME;
  gui.labelBanfDetails.caption = this.banfHead.BESCHREIBUNG;





// Container für Anlagen ....
//      addFileUploader( parent         , fileTyp , multiple , destDir         , onUpload )  
dialogs.addFileUploader( gui.dropBoxPanel , '*.*'   , true     , 'tmpUploads' , function (selectedFiles)
                                                                                { 
                                                                                  this.self.attachments.push({FILENAME   :selectedFiles.result.savedName,  
                                                                                                              FILEPATH   :selectedFiles.result.savedPath,             
                                                                                                              ORGFILENAME:selectedFiles.result.originalName,     
                                                                                                              DESCRIPTION: "Attachment zur BANF-Vorlage " + this.gui.editKurztext.value
                                                                                                            } );

                                                                                  this.gui.listboxAttachment.addItem(selectedFiles.result.originalName,true);

                                                                                }.bind({self:this, gui:gui})  );
    





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


//gui.selSachkonto.setItems(this.lookUp_sachkonto.asListBoxItems());
gui.btnSachkonto.callBack_onClick =  async function(){
                                                      var url = "https://intranet.e-ms.de/ZentraleDienste/US/_layouts/15/WopiFrame.aspx?sourcedoc=%7BEA33CE1B-6028-4B6C-9B4D-0CA075B88D59%7D&file=Kontierungshandbuch%20S4.xlsx&action=default";
                                                       window.open( url , 'Attachment zur BANF-Vorlage', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no' );
                                                     /*
                                                      await this.self.lookUp_sachkonto.show();
                                                      this.gui.selSachkonto.setItems(this.self.lookUp_sachkonto.asListBoxItems() );
                                                      this.gui.selSachkonto.value =  this.self.lookUp_sachkonto.selected;
                                                     */ 
                                                    }.bind({self:this, gui:gui});  


//gui.selAuftrag.setItems(this.lookUp_auftrag.asListBoxItems());
gui.btnAuftrag.callBack_onClick =  async function(){
                                                     var url = "https://intranet.e-ms.de/ZentraleDienste/US/_layouts/15/WopiFrame.aspx?sourcedoc=%7BEA33CE1B-6028-4B6C-9B4D-0CA075B88D59%7D&file=Kontierungshandbuch%20S4.xlsx&action=default";
                                                     window.open( url , 'Attachment zur BANF-Vorlage', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no' );
                                                     /*                                                   
                                                      await this.self.lookUp_auftrag.show();
                                                      this.gui.selAuftrag.setItems(this.self.lookUp_auftrag.asListBoxItems() );
                                                      this.gui.selAuftrag.value =  this.self.lookUp_auftrag.selected;
                                                     */ 
                                                    }.bind({self:this, gui:gui});  


  gui.dataBinding(  this.banf );

  gui.update('GUI');

// Listbox mit Attachments füllen falls vorhanden...
this.attachments = [];
if(this.banf.ATTACHMENTS)
{     
  var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from archive where ID in("+this.banf.ATTACHMENTS.replaceAll('|', ',')+")"});
  if (!response.error) for(var i=0; i<response.result.length; i++)
                       {
                         gui.listboxAttachment.addItem( {value:response.result[i].ID, caption:response.result[i].ORGFILENAME} )
                         this.attachments.push(response.result[i]);
                       }  
}                       

   // Doppelklick-Event hinzufügen ...
   gui.listboxAttachment.callBack_onDblClick = function ()
                                                     {
                                                        var ndx = this.gui.listboxAttachment.itemIndex;
                                                        if(ndx>=0) this.self.showAttachment(this.self.attachments[ndx].ID)
                                                     }.bind({gui:gui, self:this})

   gui.btnDeleteAttachment.callBack_onClick = function()
                                                     {
                                                        var ndx = this.gui.listboxAttachment.itemIndex;
                                                        if(ndx<0) {dialogs.showMessage('Nichts zum löschen ausgewählt !'); return }
                                                        this.gui.listboxAttachment.removeItem(ndx);
                                                        this.self.attachments.splice(ndx,1);
                                                      }.bind({gui:gui, self:this})

   gui.btnOk.callBack_onClick = function()
                                { 
                                  this.gui.update('data');    
                                  debugger;
                                  // alle Pflichtfelder befüllt ?
                                  var check = this.gui.checkRequireFields();
                                  if (check.missingFields.length>0){dialogs.showMessage("Bitte alle Pflichtfelder ausfüllen ! Aktuell fehlt: "+check.missingList); return;}
                                  
                                  this.banf.ATTACHMENTS = this.self.saveAttachements();
                                  this.banf.save();
                                  this.gui.close();  
                                  if(this.callBack) this.callBack() ;
                                }.bind({self:this, gui:gui, banf:this.banf, callBack:callback_if_ready })
    
 
   gui.btnAbort.callBack_onClick = function(){this.gui.close()}.bind({gui:gui})

  }
}
