import * as globals         from "./globals.js";
import * as utils           from "./utils.js";
import * as dialogs         from "./tfDialogs.js";
import * as objects         from "./tfObjects.js";
import {TFgui}              from "./tfGUI.js";

import {TFTreeView,
        TFTreeNode }        from "./tfTreeView.js";

import {TFAnalogClock,
        TFListCheckbox,
        TFComboBox,
        TFSelectBox,
        TFSlider
 }     from "./tfObjects.js";

const placeHolderImageURL = '/tfWebApp/res/placeHolder.jpg'; // URL für Platzhalter-Bild


export class TFGuiBuilder
{
  constructor()
  { 
    this.builderObjects                          = [];
    this.selected                                = {element:null , border:""};
    this.propertyEditor                          = null;	
    this.dashBoard                               = null;
    this.menuPanel                               = null;
    this.treeViewVisible                         = false;
    this.treeView                                = null;

    var w = dialogs.createWindow(null, 'tfGuiBuilder', '100%', '100%', 'CENTER').hWnd;

    var layout = dialogs.setLayout(  w , {gridCount:10,right:2});
    
    var dashBoardContainer                       = layout.dashBoard;
        dashBoardContainer.overflow              = 'hidden';
        dashBoardContainer.className             = 'ccContainerPanel';
        dashBoardContainer.padding               = '0px';
        dashBoardContainer.margin                = '0px';

    this.dashBoard                               = dialogs.addPanel(dashBoardContainer , '' , 0 , 0 , '100%' , '100%' , {dropTarget:true} );
    this.dashBoard.name                          = 'dashBoard';
    this.dashBoard.overflow                      = 'hidden';
    this.dashBoard.backgroundColor               = 'white';
    this.dashBoard.DOMelement.style.borderRadius = '2px';
    this.dashBoard.callBack_onDragOver           = function(e){  this.onDragover(e) }.bind(this);
    this.dashBoard.callBack_onDrop               = function(e , dropResult){ this.onDrop(e , dropResult) }.bind(this);
    this.dashBoard.callBack_onClick              = function(e){this.selectComponent(this.dashBoard)}.bind(this);
    this.dashBoard.callBack_onKeyDown            = function(event) { if(event.key=='Delete') this.deleteSeletedObject()}.bind(this);
   
    this.menuPanel                               = layout.right;
    this.menuPanel.padding                       = '2px';
    this.menuPanel.buildGridLayout( '4x17' );

    var fileOps                   = dialogs.addPanel(this.menuPanel , 'cssContainerPanel',1,1,4,2,{backgroundColor:"rgba(0,0,0,0.14"})     
        fileOps.buildGridLayout( '5x2' );

    this.formNameInp              = new TFComboBox( fileOps,1,1,5,1, { items: utils.lsForms() }) ;

 var newBtn                        = dialogs.addButton(fileOps , '' , 1 , 2 , 1 , 1 , 'new');
     newBtn.height                 = '2em';
     newBtn.marginTop              = '0.5em';
     newBtn.callBack_onClick       = function()
                                     { 
                                       this.newProject(); 
                                     }.bind(this);

var saveBtn                        = dialogs.addButton(fileOps , '' , 2 , 2 , 1 , 1 , 'save');
    saveBtn.height                 = '2em';
    saveBtn.marginTop              = '0.5em';
    saveBtn.callBack_onClick       = function()
                                     { 
                                       this.save(); 
                                     }.bind(this);

var loadBtn                        = dialogs.addButton(fileOps , '' , 3 , 2 , 1 , 1 , 'load');
    loadBtn.height                 = '2em';
    loadBtn.marginTop              = '0.5em';
    loadBtn.callBack_onClick       = function()
                                     { 
                                       this.load(); 
                                     }.bind(this);


 var testBtn                       = dialogs.addButton(fileOps , '' , 4 , 2 , 1 , 1 , 'test');
     testBtn.height                = '2em';
     testBtn.marginTop             = '0.5em';
     testBtn.backgroundColor       = 'gray';
     testBtn.callBack_onClick      = function()
                                     { 
                                       this.test(); 
                                     }.bind(this);

  // Panel für Eingabe der Dimensionierung des Grids:
 var gridCtrlPanel = dialogs.addPanel(  this.menuPanel , '' , 1 , 3 , 4 , 1);   
          gridCtrlPanel.backgroundColor                  = 'lightgray';
          gridCtrlPanel.margin                           = 0;
          gridCtrlPanel.padding                          = 0;
          gridCtrlPanel.DOMelement.style.overflow        = 'hidden';
          
          gridCtrlPanel.buildGridLayout_templateColumns(  '1fr 1fr 4em' );
          gridCtrlPanel.buildGridLayout_templateRows   (  '1em 1fr' );

     var p = dialogs.addPanel(gridCtrlPanel , 'cssContainerPanel' , 1 , 1 , 3 , 1 );
         p.backgroundColor = 'rgba(0,0,0,0.47)';
         p.padding = 0;
         p.margin = 0;
         p.marginBottom = '1px';
         p.overflow = 'hidden';

     var h=dialogs.addLabel( p , '' , 1 , 1 , '100%','1em','Gridlayout definieren' );
         h.color = 'white';
         h.fontSize = '0.77em';

     this.gridCtrlRows       = dialogs.addInput ( gridCtrlPanel    , 1 , 2 , 4  , 'row' , '' , '-' , {margin:0}) ;
     this.gridCtrlCols       = dialogs.addInput ( gridCtrlPanel    , 2 , 2 , 4  , 'col' , '' , '-' , {margin:0} );

     var gridCtrlBtn        = dialogs.addButton( gridCtrlPanel ,'', 3 , 2 , 1 , 1 , '...' );
         gridCtrlBtn.height = '1.7em';
         gridCtrlBtn.width  = '2em';
         gridCtrlBtn.margin = 0;
         gridCtrlBtn.marginTop='7px';
         gridCtrlBtn.backgroundColor = 'gray';
         gridCtrlBtn.callBack_onClick = function() 
                                        { 
                                          this.setGridLayout( this.gridCtrlCols.value , this.gridCtrlRows.value ) 
                                        }.bind(this);


     var propToollDiv = dialogs.addPanel( this.menuPanel , 'cssContainerPanel' , 1 , 8 , 4 , 2);                                    
         propToollDiv.buildGridLayout_templateRows( '1fr 1fr' );
         propToollDiv.buildGridLayout_templateColumns( '1fr 4em' );
         propToollDiv.backgroundColor = 'rgba(0,0,0,0.14)';
         propToollDiv.margin  = 0;
         propToollDiv.padding = 0;
         
       //  propToollDiv.paddingLeft = '0.5em';
       //  propToollDiv.paddingRight = '0.5em';
         
     this.propLevelSelector = dialogs.addSelectBox(propToollDiv , 1 , 2 , 'auto' , 'Anzeigelevel:' , '' , 'essential', [{caption:'essential',value:1},{caption:'useful',value:2},{caption:'all',value:3}] );    
     this.propLevelSelector.callBack_onChange = function(v)
                                            { 
                                              if(this.propertyEditor)
                                              this.propertyEditor.level = v;
                                            }.bind(this);

     var treeBtn = dialogs.addButton( propToollDiv , '' , 2 , 2 , 1 , 1 , '...' );
         treeBtn.height = '2em';
         treeBtn.marginTop = '4px';
         treeBtn.callBack_onClick = function() { this.handleTreeView() }.bind(this);                                     
  
    this.propCaption = dialogs.addPanel(propToollDiv , 'cssContainerPanel' , 1 , 1 , 1 , 1 );
    this.propCaption.backgroundColor = 'rgba(0,0,0,0.77)';
    this.propCaption.height          = '2em';
    this.propCaption.color           = 'white';

     var propertiesDiv = dialogs.addPanel( this.menuPanel , '' , 1 , 10 , 4 , 8);
         propertiesDiv.backgroundColor               = 'white';
         propertiesDiv.DOMelement.style.borderRadius = '0px';
    // saveButton für Property-Editor
     var b = dialogs.addButton( propToollDiv , '' , 2 , 1 , 1 , 1 , 'ok' );
         b.height = '2em';
         b.marginTop = '4px'

    this.propertyEditor = dialogs.newPropertyEditor(propertiesDiv , [] , b );
    this.propertyEditor.callBack_onSave = function(p){this.saveProperties(p)}.bind(this); 
   
         
     // toolbox
      this.___createToolboxItem( 'div'     , 'DIV'     , 1,4)
      this.___createToolboxItem( 'button'  , 'BTN'     , 2,4)
      this.___createToolboxItem( 'label'   , 'LABEL'   , 3,4)
      this.___createToolboxItem( 'clock'   , 'CLOCK'   , 4,4)
      this.___createToolboxItem( 'edit'    , 'INPUT'         , 1,5)
      this.___createToolboxItem( 'datetime', 'INPUT_DATETIME', 2,5)
      this.___createToolboxItem( 'date'    , 'INPUT_DATE'    , 3,5)
      this.___createToolboxItem( 'time'    , 'INPUT_TIME'    , 4,5)


      this.___createToolboxItem( 'combo'   , 'COMBOBOX', 1,6)
      this.___createToolboxItem( 'listbox' , 'LISTBOX' , 2,6)
      this.___createToolboxItem( 'select'  , 'SELECT'  , 3,6)
      this.___createToolboxItem( 'checkbox', 'CHECKBOX', 4,6)

      this.___createToolboxItem('checklist', 'CHECKLISTBOX' , 1,7)
      this.___createToolboxItem('image'    , 'IMAGE'  , 2,7)
      this.___createToolboxItem('slider'   , 'SLIDER' , 3,7)
      this.___createToolboxItem('*' , '*'  , 4,7)

      this.setGridLayout( 4 , 21 );

    return 
}


setGridLayout( numCols , numRows )
{
  var dest = this.selected.element || this.dashBoard;
  
  dest.buildGridLayout( `${numCols}x${numRows}` , {stretch:true});

  this.showGridLines( dest );
}


addComponent( parent , left , top , elementName ) 
{ 
  if (utils.isHTMLElement(parent)) parent = parent.data || null; 

  if (parent == null) parent = this.dashBoard; // wenn kein Parent angegeben, dann auf dem Dashboard
      
      var e = null;

    if(elementName == 'BTN')           e = dialogs.addButton        ( parent , '' , left , top , 1 , 1 , {caption:'Button'} , {dragable:true} );
    if(elementName == 'DIV')           e = dialogs.addPanel         ( parent , '' , left , top , 1 , 1 , {dragable:true});
    if(elementName == 'INPUT')         e = dialogs.addInput         ( parent , left , top ,'auto', 'Eingabe'   , '' , ''    , {dragable:true});
    if(elementName == 'INPUT_DATETIME')e = dialogs.addDateTimePicker( parent , left , top ,'Datum/Urhrzeit' , Date.now() , {dragable:true});
    if(elementName == 'INPUT_DATE')    e = dialogs.addDatePicker    ( parent , left , top ,'Datum'          , Date.now() , {dragable:true});
    if(elementName == 'INPUT_TIME')    e = dialogs.addTimePicker    ( parent , left , top ,'Uhrzeit'        , Date.now() , {dragable:true});
    if(elementName == 'COMBOBOX')      e = dialogs.addCombobox      ( parent , left , top , 'auto' , 'Combobox' , '' , '', ['Option1','Option2','Option3'] , {dragable:true}); 
    if(elementName == 'SELECT')        e = dialogs.addSelectBox     ( parent , left , top , 'auto' , 'SelectBox' , '' , '', {dragable:true,lookUp:true,items:['Option1','Option2','Option3']}); 
    if(elementName == 'LISTBOX')       e = dialogs.addListBox       ( parent , left , top , 1 , 1 , [{caption:'Option1',value:1},{caption:'Option2',value:2},{caption:'Option3',value:3}] , {dragable:true}); 
    if(elementName == 'CHECKBOX')      e = dialogs.addCheckBox      ( parent , left , top , 'CheckBox' , true , {dragable:true} )

    if(elementName == 'CHECKLISTBOX')  e = new TFListCheckbox       ( parent , left , top , 1 , 1 , {dragable:true, items:[{caption:'Option1',value:1},{caption:'Option2',value:2},{caption:'Option3',value:3}]} );
  
    if(elementName == 'LABEL')         e = dialogs.addLabel         ( parent , '' , left , top , 1 , 1 , 'Label' , {dragable:true});
    if(elementName == 'CLOCK')         e = new TFAnalogClock        ( parent      , left , top , 1 , 1 , {dragable:true} );
    if(elementName == 'IMAGE')         e = dialogs.addImage         ( parent      , left , top , 1 , 1 , placeHolderImageURL , {dragable:true} );
    if(elementName == 'SLIDER')        e = new TFSlider             ( parent      , left , top , 1 , 1 , {dragable:true} );



    // anklick- und ziehbar machen...
    if (e != null)
    {
       if(elementName == 'DIV')  
       {  
         e.buildGridLayout_templateColumns( '1fr' );
         e.buildGridLayout_templateRows   ( '1fr' );
         e.overflow = 'hidden';
       }  

      this.builderObjects.push(e);

      e.draggingData         = { id:e.ID };
      e.dataBinding          = e.draggingData;
      e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
      e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
      e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
      e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);
      e.callBack_onKeyDown   = function(event) { if(event.key=='Delete') this.deleteSeletedObject()}.bind(this);
   }   

  this.updateTreeView();
  this.selectComponent(e); // das neu erzeugte Element gleich selektieren

  }

newProject()
{

}


save()
{ 
  if(this.formNameInp.value=="")
  {
    dialogs.showMessage('Bitte zuvor einen EINDEUTIGEN Namen eingeben, unter dem das Formular zukünftig referenziert werden soll !');
    return;
  }
  var board = this.dashBoard.getConstructionProperties();
  utils.saveForm(this.formNameInp.value , board );

  this.formNameInp.items = utils.lsForms() ;
  
} 


load()
{ 
  if(this.formNameInp.value=="")
  {
    dialogs.showMessage('Bitte zuvor den Namen des Formulars eingeben !');
    return;
  }

  var formData = utils.loadForm(this.formNameInp.value);
  
  this.dashBoard.innerHTML = '';
  this.builderObjects      = [];

  this.dashBoard.backgroundColor = formData.backgroundColor;
  this.dashBoard.buildGridLayout( formData.gridLayout );
  this.showGridLines(this.dashBoard);

  for(var i=0; i<formData.children.length; i++)
  {
    var c = formData.children[i];
    objects.addComponent( this.dashBoard , c , function(e){   // CallBack on Ready
                                                         console.log('callback: '+ e.objName);
                                                         this.builderObjects.push(e);
                                                         e.setDragable();
                                                         e.draggingData         = { id:e.ID };
                                                         e.dataBinding          = e.draggingData;
                                                         e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
                                                         e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
                                                         e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
                                                         e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);
                                                         e.callBack_onKeyDown   = function(event) { if(event.key=='Delete') this.deleteSeletedObject()}.bind(this);
                                                     }.bind(this) )
 }  




} 





test()
{ 
  // das dashBoard ist das einzige zentrale parent-Element
  // durch das Sektieren, werdeen alle Elemente "deselektiert" und die (rote) Markierung deaktiviert ..."
  this.selectComponent(this.dashBoard);

  var board = this.dashBoard.getConstructionProperties();
  
  // ein Fenster erzeugen, welches die Dimension und das Gridlayout des Dashboards übernimmt:
  var w = dialogs.createWindow(null, 'tfGuiBuilderTest', board.width+'px', board.height+'px', 'CENTER');

  var gui = new TFgui( w.hWnd , board );
  
  gui.editFirstName.value     = 'Thomas';
  gui.editLastName.value      = 'Ferl';
  gui.selectFamilyState.setItems([{caption:'ledig',value:0},{caption:'verheiratet',value:2},{caption:'getrennt lebend',value:3},{caption:'geschieden',value:4},{caption:'verwitwet',value:-1}]) 

 
} 

 handleTreeView()
 {  
   if(this.treeViewVisible) return;
   
   this.treeView = dialogs.createWindow(null, 'tfGuiBuilderTreeView', '25%', '90%', 'CENTER');
   this.treeView.hWnd.zIndex = 1000000; // ganz oben
   this.treeViewVisible = true;
   this.treeView.callBack_onClose = function() {this.treeViewVisible=false;}.bind(this);

  this.updateTreeView();
}


updateTreeView()
{
  if(!this.treeViewVisible) return;
  if(this.treeView==null) return; 

  this.treeView.hWnd.innerHTML = ''; // Baum leeren
  

 // rekursive scanFunktion zur Erzeugung der Baumstruktur:
   var __scanNodes = function( tree , treeNode , obj )
  {
    var n = null;

    if(treeNode==null) n=  tree.addNode   (            obj.name , obj );
    else               n = tree.addSubNode( treeNode , obj.name , obj );   

    if(obj.childList.length>0)
       for (var j=0; j<obj.childList.length; j++)  __scanNodes( tree , n , obj.childList[j] ); 
  }

  var t = new TFTreeView(  this.treeView.hWnd , {} );
   for(var i=0; i<this.dashBoard.childList.length; i++) __scanNodes( t , null , this.dashBoard.childList[i] );
      
  t.buildNodeList(); 
  t.collabseAll(false);
  t.callBack_onClick = function(node)
  {
    if(node.content) 
    { // wenn ein Datenobjekt vorhanden ist, dann dieses selektieren
      var obj = node.content;
      if(obj instanceof objects.TFObject) this.selectComponent(obj);
    }       
  }.bind(this);
}  



selectComponent(element) 
{
    // letztes Element abwählen
    if (this.selected.element != null)
    { 
       if(this.selected.element == element) return false;  // tue nix
       this.selected.element.DOMelement.style.border = this.selected.border;
    } 
  
    // neues Element auswählen und opt. hervorheben
    this.selected.element = element;
    this.selected.border  = element.DOMelement.style.border;
    this.selected.element.DOMelement.style.border = "3px solid red";

    if(element == this.dashBoard)
    { 
      this.propertyEditor.visible = false;
      return;
    }

    // PropertyEditor anzeigen
    var p = dialogs.getProperties( element );
    this.propertyEditor.visible = true;
    this.propertyEditor.setProperties( p );
    this.propertyEditor.level = this.propLevelSelector.value;

    this.propCaption.innerHTML = `<center>${element.objName}</center>`;

    this.showGridLines( element );
    
    return false;
      
  }



deleteSeletedObject()
{
  if(this.selected.element)
  {
    var idx = this.builderObjects.indexOf(this.selected.element);
    if (idx > -1)
    {
      this.builderObjects.splice(idx, 1); // Element aus dem Array entfernen
      this.selected.element.DOMelement.remove(); // Element aus dem DOM entfernen
      this.selected.element = null; // Selektion zurücksetzen
      this.selected.border  = '';
      this.propCaption.innerHTML = '';
      this.propertyEditor.visible = false; // PropertyEditor ausblenden
      this.updateTreeView();
    }
  }
}       

saveProperties( p )
  {
    console.log('Setze Properties: ' + utils.JSONstringify(p) );

    if(this.selected.element) dialogs.setProperties( this.selected.element , p );  

  }


___createToolboxItem( glyph , type , left , top)
{
  var item                       = dialogs.addPanel( this.menuPanel , '' , left , top , 1 , 1 , {dragable:true , draggingData: { newObject:type } });
      item.overflow              = 'hidden';
      item.margin                = '0.4em';
      item.innerHTML             = "<center>"+glyph+"</center>"
   // item.innerHTML             = `<img src=/tfWebApp/GUIsymbols/${glyph}.png style="width: 100%; height: 100%;">`;
      item.type                  = type;
  return item;  
}


___findComponentByID( id )
{
  for (var i = 0; i < this.builderObjects.length; i++)
  {
    var objId = this.builderObjects[i].ID;
    if (objId == id) return this.builderObjects[i];
  }
  return null; // Element nicht gefunden
}


onMouseClick(event , objId)
{ 
   event.stopPropagation(); 
   const clickedObject = this.___findComponentByID(objId);
   if (!clickedObject) return;
   if(this.selected.element != clickedObject) this.selectComponent(clickedObject);
}


onDragstart(event , dragHTMLObject ) 
{ 
  if (dragHTMLObject.children && dragHTMLObject.children.length > 0) 
  {
    // Koordinaten des Mouse-Events verwenden, um das Kind-Element zu finden
    var child = document.elementFromPoint(event.clientX, event.clientY);

    // Überprüfen, ob das gefundene Element ein Child von `dragObject` ist
    if (dragHTMLObject.contains(child) && child !== dragHTMLObject) {
      dragHTMLObject = child; // `dragObject` auf das spezifische Child setzen
    }
  }
  var dragObject = dragHTMLObject.data || null
 
  if (!dragObject) return;
  
  event.stopPropagation();
  event.dataTransfer.setData('text', {objectId:dragObject.ID} ); // Setzt die ID des gezogenen Elements
  console.log('dragStart:  ID=' + dragObject.ID + ' type=' + dragObject.type );
}


onDragover(event) 
{
  var dropTarget = event.target;
  event.stopPropagation()
  event.preventDefault(); // Erlaubt das Droppen

    // Mausposition relativ zum Container berechnen
    const rect = dropTarget.getBoundingClientRect();
    const x    = event.clientX - rect.left;
    const y    = event.clientY - rect.top;
   
    const gInfo = utils.getGridLayoutDimension( dropTarget );
    var gridPosition_left = Math.floor(x / (rect.width  / gInfo.gridColumnCount)) +1 ;    
    var gridPosition_top  = Math.floor(y / (rect.height / gInfo.gridRowCount)) +1 ; 

    var obj = '';
    if(this.selected)
      if(this.selected.element) obj = this.selected.element.objName || ""; 

    // Optional: visuelles Feedback geben, z.B. eine Linie oder einen Platzhalter anzeigen
    this.propCaption.innerHTML = `<center>${obj} (X:${gridPosition_left} Y:${gridPosition_top})</center>`;
};


onDrop(event , dropResult ) 
{ 
  event.stopPropagation();
  event.preventDefault(); 

  var dropTarget = event.target;
  var rect       = dropTarget.getBoundingClientRect();

  if (dropTarget.tfObjInstance) dropTarget = dropTarget.tfObjInstance; // falls das Target ein Drag-Objekt ist, dann auf das Daten-Objekt wechseln
  else return

  // Mausposition relativ zum Container berechnen
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const gInfo = utils.getGridLayoutDimension( dropTarget );

  var gridPosition_left = Math.floor(x / (rect.width  / gInfo.gridColumnCount)) +1 ;    
  var gridPosition_top  = Math.floor(y / (rect.height / gInfo.gridRowCount)) +1 ; 

  if (dropResult.json.newObject)
  {
    // Neues Element erstellen
    this.addComponent( dropTarget , gridPosition_left , gridPosition_top , dropResult.json.newObject );
    return;
  }
 
  const droppedObject = this.___findComponentByID(dropResult.json.id); 
    
  if(droppedObject)
  { //  wurde Objekt auf ein anderes Element gedroppt ?
    droppedObject.setParent(dropTarget);
    droppedObject.gridLeft = gridPosition_left;
    droppedObject.gridTop  = gridPosition_top;
    this.updateTreeView();
  }

  // neue Position PropertyEditor aktualisieren.
  // Es sollen aber nicht ALLE Properties aktualisiert werden, sondern nur die beiten Positionsangaben....
   var p = droppedObject.getConstructionProperties();
  
   // im property-Editor die beiden Positionen aktualisieren:
   var c1 = this.propertyEditor.propertyControlByName('gridLeft');
   if(c1!=null) c1.value = droppedObject.gridLeft;
   
   var c2 = this.propertyEditor.propertyControlByName('gridTop');
    if(c2!=null) c2.value = droppedObject.gridTop;

    this.propCaption.innerHTML = `<center>${droppedObject.objName}</center>`;

    if(droppedObject.objName=='TFPanel')this.showGridLines( droppedObject );
   
};



showGridLines(div) 
{
  if(div.objName != 'TFPanel') 
  {
    this.gridCtrlRows.value = '-';
    this.gridCtrlCols.value = '-';
    return;
   } 
 

  if (div.layout().toUpperCase() !== 'GRID') 
  {
    this.gridCtrlRows.value = '-';
    this.gridCtrlCols.value = '-';
    return;
  }

  // Grid-Infos holen
  const dim = utils.getGridLayoutDimension(div);
  const numColumns = dim.gridColumnCount;
  const numRows = dim.gridRowCount;

  this.gridCtrlRows.value = numRows;
  this.gridCtrlCols.value = numColumns;

  // Größe des DIVs bestimmen
  const rect = div.DOMelement.getBoundingClientRect();
  const divWidth = rect.width;
  const divHeight = rect.height;

  // Vorheriges Canvas-Raster entfernen
  div.DOMelement.querySelectorAll('canvas.grid-overlay').forEach(c => c.remove());

  // Neues Canvas erzeugen
  const canvas = document.createElement('canvas');
  canvas.classList.add('grid-overlay');
  canvas.width    = divWidth;
  canvas.height   = divHeight;
  canvas.overflow = 'hidden';

  // Canvas stylen
  Object.assign(canvas.style, {
    position: 'absolute',
    inset : '0',
    top: '0',
    left: '0',
    zIndex: '100000',
    pointerEvents: 'none'
  });

  // Eltern-Container muss relativ positioniert sein
  div.DOMelement.style.position = 'relative';
  div.DOMelement.style.overflow = 'hidden'; // Verhindert Überlauf
  div.DOMelement.appendChild(canvas);

  // Zeichnen
  const ctx = canvas.getContext('2d');
  if (!ctx) {
  console.warn("Canvas-Kontext konnte nicht erzeugt werden.");
  return;
}

  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]); // gestrichelte Linien

  const cellWidth = divWidth / numColumns;
  const cellHeight = divHeight / numRows;

  // senkrechte Linien
  for (let i = 1; i < numColumns; i++) {
    const x = Math.round(i * cellWidth);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, divHeight);
    ctx.stroke();
  }

  // Horizontale Linien
  for (let i = 1; i < numRows; i++) {
    const y = Math.round(i * cellHeight);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(divWidth, y);
    ctx.stroke();
  }
}





}





   


