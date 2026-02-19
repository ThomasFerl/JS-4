

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";

import * as forms                from "./forms.js";
import { TFgui }                 from "./tfWebApp/tfGUI.js";


const excludeFields = ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO'];

export class TBanfExport
{
    constructor( banfHead )
    { 
      this.allFields      = [];
      this.activeFields   = []; 
      this.lbActiveFields = null; 
      this.banfList       = [];
      this.ok             = false;

      var response = utils.webApiRequest('LSBANF' , {ID_HEAD:banfHead.ID} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      this.banfList = response.result;

      var firstDataItem = this.banfList[0];
      for (var key in firstDataItem)
         if( excludeFields.indexOf(key)<0 ) this.allFields.push( key );
       

      response = utils.webApiRequest('LSEXPORTFIELDS' , {} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      for(var i=0; i<response.result.length; i++) this.activeFields.push( response.result[i].FIELDNAME );

      this.ok = true;
    }

    

     exportToClipboard()
     {
       var gui     = new TFgui( null , forms.banfExport , {caption:"BANF via Zwischenablage exportieren ..."} );
       this.lbActiveFields = gui.listBoxDestination;

       gui.listBoxSource.addItems( this.allFields );
       this.lbActiveFields.addItems( this.activeFields );
   
       this.lbActiveFields.callBack_onKeyDown = function(e){ 
                                                               if (e.altKey && e.key === "ArrowUp")   { this.self.lbActiveFields.moveUp()  ; e.preventDefault(); this.self.___updateDatabase()}
                                                               if (e.altKey && e.key === "ArrowDown") { this.self.lbActiveFields.moveDown(); e.preventDefault(); this.self.___updateDatabase()}
                                                            }.bind({self:this})

       gui.btnPlus.callBack_onClick     = function() { this.self.___addSelectedItems   ( this.self.lbActiveFields , this.gui.listBoxSource.selectedItems ) ;  this.self.___updateDatabase()}.bind({gui:gui,self:this});
       gui.btnMinus.callBack_onClick    = function() { this.self.___removeSelectedItems( this.self.lbActiveFields ) ;                                         this.self.___updateDatabase()}.bind({self:this});
       gui.btnAbort.callBack_onClick    = function() { this.gui.close() }.bind({gui:gui});
       
       gui.btnExport.callBack_onClick   = function()
       { 
         var exportData = [];
         for(var i=0; i< this.self.banfList.length; i++)
         {
           var banf = this.self.banfList[i];
           var exportItem = [];      
           for(var j=0; j<this.self.activeFields.length; j++)
             { var fieldName = this.self.activeFields[j];
                  exportItem.push( banf[fieldName] );
             }
           exportData.push( exportItem.join('\t') );
         }

         // Text in exportData -> Zwischenablage
         var exportText = exportData.join('\n');
         utils.copyStringToClipboard( exportText );
         dialogs.showMessage("Die BANF-Daten wurden in die Zwischenablage kopiert. Von dort können sie z.B. in Excel eingefügt werden.");   
       }.bind({self:this});
     }   




//helper functions
___addSelectedItems( listBox , selectedItems )
{ 
  for(var i=0; i<selectedItems.length; i++)  
  listBox.addItem  ( selectedItems[i]  , true );  
}


___removeSelectedItems( listBox )
{
  var selectedItems = listBox.selectedItems;
  for(var i=0; i<selectedItems.length; i++) listBox.removeItem( selectedItems[i] );
}


___updateDatabase()
{
  this.activeFields  = [];
  for(var i=0; i<this.lbActiveFields.items.length; i++) this.activeFields.push( this.lbActiveFields.items[i].value );
  
  utils.webApiRequest('SAVEEXPORTFIELDS' , {fieldList:this.activeFields} );
}


}