
import * as globals         from "./globals.js";
import * as utils           from "./utils.js";    
import * as dialogs         from "./tfDialogs.js";

import { TFgui }            from "./tfGUI.js";
import { TFCatalogObject }  from "./tfDbObjects.js";


// Formular aus GUI-Builder
export const Katalog = {
  objName: "TFPanel",
  name: "dashBoard",
  dataFieldName: "",
  css: "cssPanel",
  backgroundColor: "rgb(204, 204, 204)",
  color: "rgb(0, 0, 0)",
  borderColor: "rgb(87, 86, 86)",
  borderWidth: "1.11111px",
  borderRadius: "2px",
  shadow: "",
  opacity: "1",
  blur: 0,
  placeItems: "stretch normal",
  justifyContent: "left",
  alignItems: "stretch",
  gridLeft: null,
  gridTop: null,
  gridWidth: null,
  gridHeight: null,
  gap: "",
  left: 685,
  top: 382,
  width: "20%",
  height: "40%",
  zIndex: "auto",
  margin: "0px",
  marginLeft: "0px",
  marginRight: "0px",
  marginTop: "0px",
  marginBottom: "0px",
  padding: "0px",
  paddingTop: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  overflow: "hidden",
  visible: true,
  display: "grid",
  position: "relative",
  flexDirection: "row",
  gridLayout: "20x20",
  children: [
    {
      objName: "TFPanel",
      name: "TFPanel169",
      dataFieldName: "",
      css: "cssPanel",
      backgroundColor: "rgb(68, 68, 68)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(87, 86, 86)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "left",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 1,
      gridWidth: 20,
      gridHeight: 2,
      gap: "",
      left: 1,
      top: 1,
      width: 20,
      height: 2,
      zIndex: "auto",
      margin: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      padding: "0px 0px 0px 7px",
      paddingTop: "0px",
      paddingLeft: "7px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "10x2",
      children: [
        {
          objName: "TFLabel",
          name: "caption1",
          dataFieldName: "",
          css: "cssLabel",
          backgroundColor: "rgba(0, 0, 0, 0)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "0px",
          borderRadius: "0px",
          shadow: "",
          opacity: "1",
          blur: 0,
          placeItems: "center",
          justifyContent: "start",
          alignItems: "center",
          gridLeft: 1,
          gridTop: 1,
          gridWidth: 8,
          gridHeight: 1,
          gap: "",
          left: 1,
          top: 1,
          width: 8,
          height: 2,
          zIndex: "auto",
          margin: "0px",
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "hidden",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "1x1",
          caption: "Caption 1",
          textAlign: "left",
          font: "Arial",
          fontWeight: "bold",
          fontSize: "1em",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnClose",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(95, 138, 35)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          shadow: "",
          opacity: "1",
          blur: 0,
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 9,
          gridTop: 1,
          gridWidth: 3,
          gridHeight: 2,
          gap: "",
          left: 9,
          top: 1,
          width: 3,
          height: 2,
          zIndex: "auto",
          margin: "0px",
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "",
          glyph: "circle-check",
          glyphColor: "",
          children: []
        }
      ]
    },
    {
      objName: "TFEdit",
      name: "editName",
      dataFieldName: "",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 2,
      gridTop: 4,
      gridWidth: 18,
      gridHeight: 3,
      gap: "",
      left: 2,
      top: 4,
      width: 18,
      height: 3,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "1x4",
      caption: "Eingabe",
      captionLength: "4.5",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFButton",
      name: "btnPlus",
      dataFieldName: "",
      css: "cssButton01",
      backgroundColor: "rgb(136, 136, 136)",
      color: "rgb(255, 255, 255)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "center",
      alignItems: "stretch",
      gridLeft: 7,
      gridTop: 7,
      gridWidth: 2,
      gridHeight: 2,
      gap: "",
      left: 7,
      top: 7,
      width: 2,
      height: 2,
      zIndex: "auto",
      margin: "0px 0px 0px 4px",
      marginLeft: "4px",
      marginRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "visible",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "",
      glyph: "circle-plus",
      glyphColor: "",
      children: []
    },
    {
      objName: "TFButton",
      name: "btnMinus",
      dataFieldName: "",
      css: "cssButton01",
      backgroundColor: "rgb(128, 0, 0)",
      color: "rgb(255, 255, 255)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "center",
      alignItems: "stretch",
      gridLeft: 14,
      gridTop: 7,
      gridWidth: 2,
      gridHeight: 2,
      gap: "",
      left: 14,
      top: 7,
      width: 2,
      height: 2,
      zIndex: "auto",
      margin: "0px 0px 0px 4px",
      marginLeft: "4px",
      marginRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "visible",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "",
      glyph: "circle-minus",
      glyphColor: "",
      children: []
    },
    {
      objName: "TFListBox",
      name: "listBox",
      dataFieldName: "",
      css: "cssObject",
      backgroundColor: "rgba(4, 4, 4, 0.32)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 9,
      gridWidth: 20,
      gridHeight: 12,
      gap: "",
      left: 1,
      top: 9,
      width: 20,
      height: 12,
      zIndex: "auto",
      margin: "10px 7px 7px",
      marginLeft: "7px",
      marginRight: "7px",
      marginTop: "10px",
      marginBottom: "7px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "flex",
      position: "static",
      flexDirection: "column",
      gridLayout: "0x0",
      children: []
    }
  ]
}




export class TFCatalog
{
  // aCaption: ist das Datenfeld, welches den in der Select-Box den Text anzeigt
  // ID      : ist das dazugehörige ID-Feld, welches intern weitergegeben wird
  // Manchmal kann es sinnvoll sein, nur mit Caption zu arbeiten.
  // In diesem Fall wird das ID-Feld einfach leer gelassen....
 constructor( aParent , tableName , fieldName , ID , aCaption )  
 {
   this.selected = '';  
   this.parent   = aParent || globals.webApp.activeWorkspace;
   this.caption  = aCaption || tableName;
   this.catalog  = new TFCatalogObject( tableName , fieldName , ID );
   
   // falls das Laden nicht funktioniert - ABSPRUNG 
   if(!this.catalog.load()) { return false;}
 }

asStringList()
{
  return this.catalog.stringList();
}

asListBoxItems()
{
   return this.catalog.listBoxitems();
}


async show() 
{ // async Keyword für die Methode
  return new Promise((resolve) => 
       {
         const gui = new TFgui(null, Katalog, { caption: 'Katalog' });

        gui.listBox.addItems(this.catalog.listBoxitems());
        gui.caption1.caption = this.caption;
        gui.caption2.caption = '';

        gui.btnPlus.callBack_onClick = function() {
            this.self.catalog.addItem(this.gui.editName.value);
            this.self.catalog.update();
            this.gui.listBox.clear();
            this.gui.listBox.addItems(this.self.catalog.listBoxitems());
        }.bind({ self: this, gui: gui });

        gui.btnMinus.callBack_onClick = function() {
            var items = this.gui.listBox.selectedItems;
            this.self.catalog.removeItem(items, true);
            this.self.catalog.update();
            this.gui.listBox.clear();
            this.gui.listBox.addItems(this.self.catalog.listBoxitems());
        }.bind({ self: this, gui: gui });

        // Das Herzstück: resolve() beim Schließen aufrufen
        gui.btnClose.callBack_onClick = function() 
        { 
          var lb             = this.gui.listBox;
          var ndx            = lb.itemIndex;
          this.self.selected = lb.getItemByIndex(ndx).caption;
          this.gui.close();
          resolve(); // Hier wird das await beendet
        }.bind({ self:this, gui: gui });
      });
}

 






  show_notModal()
  { 
    var gui = new TFgui( null , Katalog, {caption:'Katalog'});

     gui.listBox.addItems(this.catalog.listBoxitems());
     gui.caption1.caption   = this.caption;
     gui.caption2.caption   = '';
    
     
     
     gui.btnPlus.callBack_onClick = function(){
                                               this.self.catalog.addItem( this.gui.editName.value);
                                               this.self.catalog.update();
                                               this.gui.listBox.clear();
                                               this.gui.listBox.addItems(this.self.catalog.listBoxitems());
                                            }.bind({self:this, gui:gui})
 
     gui.btnMinus.callBack_onClick = function(){ 
                                                var items = this.gui.listBox.selectedItems; 
                                                this.self.catalog.removeItem( items , true );
                                                this.self.catalog.update();
                                                this.gui.listBox.clear();
                                                this.gui.listBox.addItems(this.self.catalog.listBoxitems());
                                              }.bind({self:this, gui:gui})

     
      gui.btnClose.callBack_onClick = function(){ this.gui.close(); }.bind({gui:gui})
  }   
    
    

}  // end Class









