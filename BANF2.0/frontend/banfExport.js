

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";

import * as forms                from "./forms.js";
import { TFgui }                 from "./tfWebApp/tfGUI.js";


const excludeFields = ['ID','ID_HEAD','OWNER','AUFTRAG','SACHKONTO','ANFORDERER'];

export class TBanfExport
{
    constructor( banfHead )
    { 
      this.allFields     = [];
      this.activeFields  = []; 
      this.banfList      = [];
      this.ok            = false;

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

       gui.listBoxSource.addItems( this.allFields );
       gui.listBoxDestination.addItems( this.activeFields );

       gui.btnPlus.callBack_onClick     = function() {this.self.___addSelectedItems( this.gui.listBoxDestination , this.gui.listBoxSource.selectedItems ) }.bind({gui:gui,self:this});
       gui.btnMinus.callBack_onClick    = function() { this.self.___removeSelectedItems( this.gui.listBoxDestination ) }.bind({gui:gui,self:this});
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

  this.activeFields  = [];
  for(var i=0; i<listBox.items.length; i++) this.activeFields.push( listBox.getItemByIndex(i).value );

}


___removeSelectedItems( listBox )
{
  var selectedItems = listBox.selectedItems;
  for(var i=0; i<selectedItems.length; i++) listBox.removeItem( selectedItems[i] );
}





}