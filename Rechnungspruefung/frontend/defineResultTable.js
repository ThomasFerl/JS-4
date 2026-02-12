
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
    this.dataObj        = {};
    this.gridContainer  = null;
    this.selectedRecord = {ID:''};

    var gui = new TFgui( null , forms.defResult);
        gui.btnNew.callBack_onClick    = function(){ this.editRecord('') }.bind(this);
        gui.btnEdit.callBack_onClick   = function(){ this.editRecord(this.selectedRecord.ID) }.bind(this);
        gui.btnDelete.callBack_onClick = function(){ this.deleteRecord()}.bind(this);
        gui.btnClose.callBack_onClick  = function(){ this.gui.close()}.bind({gui:gui});

        this.gridContainer = gui.gridContainer;

        this.updateView();    
   }

 
 updateView()
 {
   {
     this.gridContainer.innerHTML = '';
     // alle Archiv-Einträge lesen...
     var response = utils.webApiRequest('FETCHRECORDS',{sql:"Select * from resultDefinition order by ID"})
     
     var table    = dialogs.createTable( this.gridContainer , response.result ,["ID"]  , {}); 
         table.onRowClick = function( selectedRow , itemIndex , rowData ) 
                             {
                               if(this.selectedRecord.ID!=rowData.ID) this.selectedRecord=rowData;
                               else this.editRecord( rowData.ID )
                             }.bind(this);
   }
 }
 

___addSelectedItems( listBox , item , allItems )
{ 
  if(item.includes("alle"))
  {
     listBox.clear();
     for(var i=0; i<allItems.length; i++) listBox.addItem(allItems[i],true);
  }   
  else listBox.addItem  ( item , true);  
}


___removeSelectedItems( listBox )
{
  var selectedItems = listBox.selectedItems;
  for(var i=0; i<selectedItems.length; i++) listBox.removeItem( selectedItems[i] );
}


 editRecord( id )
  { 
    var gui     = new TFgui( null , forms.defResultDlg );
    
   
    //Listboxen im Dialog befüllen....
    // 1. Produkte:
    var response = utils.webApiRequest( 'FETCHRECORDS' , {sql:"Select Distinct PRODUKT From "+this.tableName+" order by PRODUKT"} );
      if(!response.error)
        {
          var items = ['alle Produkte'];
          for(var i=0; i<response.result.length;i++) items.push(response.result[i].PRODUKT)
          gui.selectProdukt.setItems(items);
        }
    
     // 1. Orte:
    var response = utils.webApiRequest( 'FETCHRECORDS' , {sql:"Select Distinct Ort,ORTSTEIL From "+this.tableName+" order by  Ort,ORTSTEIL"} );
      if(!response.error)
        {
          var items = ['alle Orte'];
          for(var i=0; i<response.result.length;i++)
          { 
            var h = response.result[i].ORT;
            if( (response.result[i].ORTSTEIL != '') && (response.result[i].ORTSTEIL != 'null') && (response.result[i].ORTSTEIL != null) ) h=h+' / ' + response.result[i].ORTSTEIL;

            items.push( h );
          }   

          items.push( 'sonstige Fix-Position' );

          gui.selectOrte.setItems( items );
        } 
        
    // Rechnungspositionen
     var response = utils.webApiRequest( 'FETCHRECORDS' , {sql:"Select BEZ From rechnungsPos order by BEZ"} );
      if(!response.error)
        {
          var items = ['alle Rechnungspositionen'];
          for(var i=0; i<response.result.length;i++) items.push(response.result[i].BEZ)
          gui.selectPosi.setItems( items );
        } 
    
    // gui - Schaltflächen mit Aktionen verbinden ...
    gui.btnAddProdukt.callBack_onClick    = function(){this.self.___addSelectedItems( this.gui.listBoxProdukte , this.gui.selectProdukt.value , this.gui.selectProdukt.getItems('value'))}.bind({gui:gui,self:this});
    gui.btnAddOrt.callBack_onClick        = function(){this.self.___addSelectedItems( this.gui.listBoxOrte     , this.gui.selectOrte.value    , this.gui.selectOrte.getItems('value'))   }.bind({gui:gui,self:this});
    gui.btnAddPosi.callBack_onClick       = function(){this.self.___addSelectedItems( this.gui.listBoxPosi     , this.gui.selectPosi.value    , this.gui.selectPosi.getItems('value'))   }.bind({gui:gui,self:this});

    gui.btnDeleteProdukt.callBack_onClick = function(){this.self.___removeSelectedItems(this.gui.listBoxProdukte)}.bind({gui:gui,self:this});
    gui.btnDeleteOrt.callBack_onClick     = function(){this.self.___removeSelectedItems(this.gui.listBoxOrte)}.bind({gui:gui,self:this});
    gui.btnDeletePosi.callBack_onClick    = function(){this.self.___removeSelectedItems(this.gui.listBoxPosi)}.bind({gui:gui,self:this});
 
    this.dataObj = new TFDataObject( "resultDefinition" , id );

    // Werte ins Form übertragen. Der hierfür gedachte Mechanismus binding / update() fuktioniert nur mit nativen Datentypen, 
    gui.editBezeichnung.value = this.dataObj.NAME;
    gui.editFixValue.value    = this.dataObj.FIXEDVALUE;
    gui.editEuro.value        = this.dataObj.EURO;

    if(this.dataObj.PRODUKTE != '')
    JSON.parse(this.dataObj.PRODUKTE     || {}).forEach(element => { gui.listBoxProdukte.addItem(element)});;

    if(this.dataObj.ORTE != '')
    JSON.parse(this.dataObj.ORTE         || {}).forEach(element => { gui.listBoxOrte.addItem(element)});

    if(this.dataObj.RECHNUNGSPOS != '')
    JSON.parse(this.dataObj.RECHNUNGSPOS || {}).forEach(element => { gui.listBoxPosi.addItem(element)});

    // Speicher-Button:
    gui.btnOk.callBack_onClick    = function(){ 
                                                this.dataObj.PRODUKTE     = JSON.stringify(this.gui.listBoxProdukte.getItems('value'));  // gibt Array von Strings zurück statt Array von JSONS's
                                                this.dataObj.ORTE         = JSON.stringify(this.gui.listBoxOrte.getItems('value'));
                                                this.dataObj.RECHNUNGSPOS = JSON.stringify(this.gui.listBoxPosi.getItems('value'));
                                                this.dataObj.NAME         = this.gui.editBezeichnung.value;
                                                this.dataObj.FIXEDVALUE   = this.gui.editFixValue.value;
                                                this.dataObj.EURO         = this.gui.editEuro.value;

                                                this.dataObj.save();
                                                this.self.updateView();
                                                this.gui.close();
                                              }.bind({gui:gui , dataObj:this.dataObj , self:this})

    gui.btnAbort.callBack_onClick = function(){ this.gui.close()}.bind({gui:gui})

  } 

  deleteRecord()
  {
    dialogs.showMessage('Sorry - die Funktion ist noch nicht implementiert. Diese Schaltfläche dient als Platzhalter !') 
  }


}
