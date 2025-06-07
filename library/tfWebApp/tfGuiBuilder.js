import * as globals         from "./globals.js";
import * as utils           from "./utils.js";
import * as dialogs         from "./tfDialogs.js";

import {TFAnalogClock }     from "./tfObjects.js";


export class TFGuiBuilder
{
  constructor()
  { 
    this.builderObjects                          = [];
    this.mouseInfo                               = null
    this.selected                                = {element:null , border:""};
    this.propertyEditor                          = null;	
    this.dashBoard                               = null
    this.menuPanel                               = null;
    

    var w = dialogs.createWindow(null, 'tfGuiBuilder', '100%', '100%', 'CENTER').hWnd;

    var layout = dialogs.setLayout(  w , {gridCount:10,right:2});
    
    var dashBoardContainer                       = layout.dashBoard;
        dashBoardContainer.overflow              = 'hidden';
        dashBoardContainer.className             = 'ccContainerPanel';
        dashBoardContainer.padding               = '0px';
        dashBoardContainer.margin                = '0px';

    this.dashBoard                               = dialogs.addPanel(dashBoardContainer , '' , 0 , 0 , '100%' , '100%' , {dropTarget:true} );
    this.dashBoard.overflow                      = 'hidden';
    this.dashBoard.backgroundColor               = 'white';
    this.dashBoard.DOMelement.style.borderRadius = '2px';
    this.dashBoard.callBack_onDragOver           = function(e){  this.onDragover(e) }.bind(this);
    this.dashBoard.callBack_onDrop               = function(e , dropResult){ this.onDrop(e , dropResult) }.bind(this);
    this.dashBoard.callBack_onClick              = function(e){this.selectComponent(this.dashBoard)}.bind(this);
   
    this.menuPanel                               = layout.right;
    this.menuPanel.padding                       = '2px';
    this.menuPanel.buildGridLayout( '4x14' );

    this.mouseInfo                 = dialogs.addPanel( this.menuPanel , 'cssBlackPanel' , 1 , 1 , 4 , 1);
    this.mouseInfo.backgroundColor = 'rgba(0,0,0,0.25)';
    this.mouseInfo.margin          = '0.4em';
    this.mouseInfo.color           = 'white';
     
      // Panel für Eingabe der Dimensionierung des Grids:
     var gridCtrlPanel = dialogs.addPanel(  this.menuPanel , '' , 1 , 2 , 4 , 1);   
          gridCtrlPanel.backgroundColor                  = 'lightgray';
          gridCtrlPanel.margin                           = 0;
          gridCtrlPanel.padding                          = 0;
          gridCtrlPanel.DOMelement.style.overflow        = 'hidden';
          
          gridCtrlPanel.buildGridLayout_templateColumns(  '1fr 1fr 4em' );
          gridCtrlPanel.buildGridLayout_templateRows   (  '1.5em 1fr 1em' );

     var p = dialogs.addPanel(gridCtrlPanel , 'cssContainerPanel' , 1 , 1 , 3 , 1 );
         p.backgroundColor = 'rgba(0,0,0,0.55)';
         p.padding = 0;
         p.margin = 0;
         p.marginBottom = '4px';

         p.overflow = 'hidden';
         dialogs.addLabel( p , '' , 1 , 1 , '100%','1em','Gridlayout_definieren' ).color = 'white';

     this.gridCtrlRows       = dialogs.addInput ( gridCtrlPanel    , 1 , 2 , 4  , 'row' , '' , '-' , {}) ;
     this.gridCtrlCols       = dialogs.addInput ( gridCtrlPanel    , 2 , 2 , 4  , 'col' , '' , '-' , {} );

     var gridCtrlBtn        = dialogs.addButton( gridCtrlPanel ,'', 3 , 2 , 1 , 1 , '...' );
         gridCtrlBtn.margin = '4px';
         gridCtrlBtn.marginLeft = '1em';
         gridCtrlBtn.height = '2em';
         gridCtrlBtn.width  = '2em';
         gridCtrlBtn.backgroundColor = 'gray';
         gridCtrlBtn.callBack_onClick = function() 
                                        { 
                                          this.setGridLayout( this.gridCtrlCols.value , this.gridCtrlRows.value ) 
                                        }.bind(this);
        
     var propertiesDiv = dialogs.addPanel( this.menuPanel , '' , 1 , 7 , 4 , 7);
         propertiesDiv.backgroundColor               = 'white';
         propertiesDiv.DOMelement.style.borderRadius = '0px';

     // Property-Editor vorbereiten ...    
     var b = dialogs.addButton( this.menuPanel , '' , 2 , 14 , 2 , 1 , 'ok' );
         b.margin = '0.7em';
         this.propertyEditor = dialogs.newPropertyEditor(propertiesDiv , [] , b );
         this.propertyEditor.callBack_onSave = this.saveProperties; 

         
     // toolbox
      this.___createToolboxItem( 'div'     , 'DIV'     , 1,3)
      this.___createToolboxItem( 'image'   , 'IMAGE'   , 2,3)
      this.___createToolboxItem( 'clock'   , 'CLOCK'   , 3,3)
      this.___createToolboxItem( 'label'   , 'LABEL'   , 4,3)

      this.___createToolboxItem( 'edit'    , 'INPUT'         , 1,4)
      this.___createToolboxItem( 'datetime', 'INPUT_DATETIME', 2,4)
      this.___createToolboxItem( 'date'    , 'INPUT_DATE'    , 3,4)
      this.___createToolboxItem( 'time'    , 'INPUT_TIME'    , 4,4)


      this.___createToolboxItem( 'combo'   , 'COMBOBOX', 1,5)
      this.___createToolboxItem( 'listbox' , 'LISTBOX' , 2,5)
      this.___createToolboxItem( 'select'  , 'SELECT'  , 3,5)
      this.___createToolboxItem( 'checkbox', 'CHECKBOX', 4,5)

      this.___createToolboxItem('checklist' , 'CHECKLISTBOX' , 1,6)
      this.___createToolboxItem('*' , '*' , 2,6)
      this.___createToolboxItem('*' , '*' , 3,6)
      this.___createToolboxItem('*' , '*' , 4,6)

      this.setGridLayout( 10 , 10 );

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

    if(elementName == 'BTN')           e = dialogs.addButton  ( parent , '' , left , top , 1 , 1 , {caption:'Button'} , {dragable:true} );
    
    if(elementName == 'DIV')           e = dialogs.addPanel   ( parent , '' , left , top , 1 , 1 , {dragable:true});

    if(elementName == 'INPUT')         e = dialogs.addInput   ( parent , left , top , 7 , 'Eingabe' , '' , '', {dragable:true});

    if(elementName == 'COMBOBOX')      e = dialogs.addCombobox( parent , left , top , 7 , 'Eingabe' , '' , '', ['Option1','Option2','Option3'] , {dragable:true}); 

    if(elementName == 'SELECT')        e = dialogs.addInput   ( parent , left , top , 7 , 'Eingabe' , '' , '', {dragable:true,lookUp:true,items:['Option1','Option2','Option3']}); 
    
    if(elementName == 'LISTBOX')      e = dialogs.addListBox  ( parent , left , top , 1 , 1 , [{caption:'Option1',value:1},{caption:'Option2',value:2},{caption:'Option3',value:3}] , {dragable:true}); 

    if(elementName == 'LABEL')        e = dialogs.addLabel    ( parent , '' , left , top , 7 , 1 , 'Label' , {dragable:true});

    if(elementName == 'CLOCK')        e = new TFAnalogClock   ( parent , 1 , 1 , '100%' , '100%' , {isDragable:true} );

    
/*
      this.___createToolboxItem( 'image'   , 'IMAGE'   , 2,3)
      this.___createToolboxItem( 'clock'   , 'CLOCK'   , 3,3)
      this.___createToolboxItem( 'label'   , 'LABEL'   , 4,3)

      this.___createToolboxItem( 'edit'    , 'INPUT'         , 1,4)
      this.___createToolboxItem( 'datetime', 'INPUT_DATETIME', 2,4)
      this.___createToolboxItem( 'date'    , 'INPUT_DATE'    , 3,4)
      this.___createToolboxItem( 'time'    , 'INPUT_TIME'    , 4,4)
      
      

      this.___createToolboxItem('checklist' , 'CHECKLISTBOX' , 1,6)
      
*/


    // anklick- und ziehbar machen...
    if (e != null)
    {
      this.builderObjects.push(e);
      e.draggingData         = { id:e.ID };
      e.dataBinding          = e.draggingData;
      e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
      e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
      e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
      e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);

      this.selectComponent(e); // neues Element auswählen
    }
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

    // PropertyEditor anzeigen
    var p = dialogs.getProperties( element );
    this.propertyEditor.setProperties( p );

    this.showGridLines( element );
    
    return false;
      
  }


  saveProperties( p )
  {
    console.log('Setrze Properties: ' + utils.JSONstringify(p) );

    if(this.selected.element) dialogs.setProperties( this.selected.element , p );  

  }


___createToolboxItem( glyph , type , left , top)
{
  var item                       = dialogs.addPanel( this.menuPanel , '' , left , top , 1 , 1 , {dragable:true , draggingData: { newObject:type } });
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


    // Optional: visuelles Feedback geben, z.B. eine Linie oder einen Platzhalter anzeigen
    this.mouseInfo.innerHTML = `<center><p>X:${gridPosition_left} Y:${gridPosition_top} </p></center>`;
};


onDrop(event , dropResult ) 
{
  var dropTarget = event.target;
  event.stopPropagation()
  this.mouseInfo.innerHTML = "" ;

  // Mausposition relativ zum Container berechnen
  var rect=null;

  if(utils.isHTMLElement(dropTarget))  rect = dropTarget.getBoundingClientRect();
  else                                 rect = dropTarget.DOMelement.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const gInfo = utils.getGridLayoutDimension( dropTarget );

  var gridPosition_left = Math.floor(x / (rect.width  / gInfo.gridColumnCount)) +1 ;    
  var gridPosition_top  = Math.floor(y / (rect.height / gInfo.gridRowCount)) +1 ; 

  event.preventDefault(); // Erlaubt das Droppen
  const id = event.dataTransfer.getData('text'); // Holt die ID des gezogenen Elements
  console.log('drop:  ID='+ id) ;

  if (dropResult.json.newObject)
  {
    // Neues Element erstellen
    this.addComponent( dropTarget , gridPosition_left , gridPosition_top , dropResult.json.newObject );
    return;
  }
 
  const droppedObject = this.___findComponentByID(dropResult.json.id); 
    
  if(droppedObject)
  { // Element wurde auf ein anderes Element gezogen
    droppedObject.setParent(dropTarget);
    droppedObject.gridLeft = gridPosition_left;
    droppedObject.gridTop  = gridPosition_top;
  }
 
  // PropertyEditor anzeigen
  this.selectComponent( droppedObject );
};



showGridLines(div) 
{
  if (div.layout().toUpperCase() !== 'GRID') {
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


showProperties()
{
  if(selected.element) 
  {
    selected.element.getProperties();
                 
  }
}





}





   


