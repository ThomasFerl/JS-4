import * as globals         from "./globals.js";
import * as utils           from "./utils.js";    
import * as dialogs         from "./tfDialogs.js";

import * as forms           from "./forms.js";
import { TFgui }            from "./tfGUI.js";
import { TFCatalogObject }  from "./tfDbObjects.js";

export class TFCatalog
{
 constructor( aParent , tableName , fieldName , ID , aCaption )
 {
   this.parent  = aParent; 
   this.caption = aCaption || tableName;
   this.catalog = new TFCatalogObject( tableName , fieldName , ID );
   
   // falls das Laden nicht funktioniert - ABSPRUNG 
   if(!this.catalog.load()) { return false;}
 }

 
  show()
  { 
    var gui = new TFgui( null , forms.Katalog);

     gui.listbox.addItems(this.catalog.listtBoxitems());
         
     
     
    gui.btnPlus.callBack_onClick = function(){ this.gui.close(); }.bind({self:this, gui:gui})
 
    gui.btnMinus.callBack_onClick = function(){ this.gui.close(); }.bind({self:this, gui:gui})


     
     gui.btnClose.callBack_onClick = function(){ this.gui.close(); }.bind({gui:gui})
  }   
    
    

}  // end Class









