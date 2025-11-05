
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as forms        from "./forms.js";

import { TFgui }         from "./tfWebApp/tfGUI.js";
import { TFDataObject }  from "./tfWebApp/tfDbObjects.js";



export class setup_DefineResultGrid
{

  constructor ( tableName )
  {
    this.tableName      = tableName;
    this.gridContainer  = null;

    var gui = new TFgui( null , forms.defResult);
        gui.btnNew.callBack_onClick    = function(){ this.addNewRecord() }.bind(this);
        gui.btnEdit.callBack_onClick   = function(){ this.editRecord() }.bind(this);
        gui.btnDelete.callBack_onClick = function(){ this.deleteRecord()}.bind(this);
        gui.btnClose.callBack_onClick  = function(){ this.gui.close()}.bind({gui:gui});

        this.gridContainer = gui.gridContainer;

        this.updateView();    
   }

 
 updateView()
 {

 }
 


   addNewRecord()
  {
    var gui = new TFgui( null , forms.defResultDlg);
 
  } 


  editRecord()
  {
    var gui = new TFgui( null , forms.defResultDlg);
 
  } 

  deleteRecord()
  {

  }


}
