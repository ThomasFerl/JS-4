import * as globals         from "./globals.js";
import * as utils           from "./utils.js";
import * as dialogs         from "./tfDialogs.js";


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
    this.gridLayout                              = {numCols:21, numRows:21};
    
    var w = dialogs.createWindow(null, 'tfGuiBuilder', '100%', '100%', 'CENTER').hWnd;

    var layout = dialogs.setLayout(  w , {gridCount:10,right:2});
    
    var dashBoardContainer                       = layout.dashBoard;
        dashBoardContainer.className             = 'ccContainerPanel';
        dashBoardContainer.padding               = '0px';
        dashBoardContainer.margin                = '0px';

    this.dashBoard                               = dialogs.addPanel(dashBoardContainer , '' , 0 , 0 , '100%' , '100%' , {dropTarget:true} );
    this.dashBoard.backgroundColor               = 'white';
    this.dashBoard.DOMelement.style.borderRadius = '2px';
    this.dashBoard.callBack_onDragOver           = function(e){  this.onDragover(e) }.bind(this);
    this.dashBoard.callBack_onDrop               = function(e){  this.onDrop(e) }.bind(this);
   
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

     var gridCtrlRows       = dialogs.addInput ( gridCtrlPanel    , 1 , 2 , 4  , 'row' , '' , this.gridLayout.numRows , {}) ;
     var gridCtrlCols       = dialogs.addInput ( gridCtrlPanel    , 2 , 2 , 4  , 'col' , '' , this.gridLayout.numCols , {} );
     var gridCtrlBtn        = dialogs.addButton( gridCtrlPanel ,'', 3 , 2 , 1 , 1 , '...' );
         gridCtrlBtn.margin = '4px';
         gridCtrlBtn.marginLeft = '1em';
         gridCtrlBtn.height = '2em';
         gridCtrlBtn.width  = '2em';
         gridCtrlBtn.backgroundColor = 'gray';
         gridCtrlBtn.callBack_onClick = function() 
                                        { 
                                          this.self.setGridLayout( this.numCols.value , this.numRows.value ) 
                                        }.bind({self:this,numCols:gridCtrlCols , numRows:gridCtrlRows});
        
     var propertiesDiv = dialogs.addPanel( this.menuPanel , '' , 1 , 7 , 4 , 7);
         propertiesDiv.backgroundColor               = 'white';
         propertiesDiv.DOMelement.style.borderRadius = '0px';

     // Property-Editor vorbereiten ...    
     var b = dialogs.addButton( this.menuPanel , '' , 2 , 14 , 2 , 1 , 'ok' );
         b.margin = '0.7em';
         this.propertyEditor = dialogs.newPropertyEditor(propertiesDiv , [] , b );
         this.propertyEditor.callBack_onSave = this.saveProperties; 

         
     // toolbox
      this.___createToolboxItem( 'Div' , 'DIV' , 1,3)
      this.___createToolboxItem( 'Edit' , 'INPUT' , 2,3)
      this.___createToolboxItem( 'Combo' , 'COMBOBOX' , 3,3)
      this.___createToolboxItem( 'Listbox' , 'LISTBOX' , 4,3)

      this.___createToolboxItem( 'Button' , 'BTN' , 1,4)
      this.___createToolboxItem( 'Button' , 'BTN' , 2,4)
      this.___createToolboxItem( 'Button' , 'BTN' , 3,4)
      this.___createToolboxItem( 'Button' , 'BTN' , 4,4)

      this.___createToolboxItem('*' , '*' , 1,5)
      this.___createToolboxItem('*' , '*' , 2,5)
      this.___createToolboxItem('*' , '*' , 3,5)
      this.___createToolboxItem('*' , '*' , 4,5)

      this.___createToolboxItem('*' , '*' , 1,6)
      this.___createToolboxItem('*' , '*' , 2,6)
      this.___createToolboxItem('*' , '*' , 3,6)
      this.___createToolboxItem('*' , '*' , 4,6)

      this.setGridLayout( 21 , 21 );

    return 
}


setGridLayout( numCols , numRows )
{
  var dest = this.dashBoard;
  if (this.selected.element != null) dest = this.selected.element;  
  dest.buildGridLayout( `${numRows}x${numCols}` , {stretch:true});
  this.showGridLines( dest );
}


addComponent( left , top , elementName ) 
  {
    var e = null;

    if(elementName == 'BTN')           e = dialogs.addButton  ( this.dashBoard , '' , left , top , 1 , 1 , {caption:'Button', dragable:true} );
    
    if(elementName == 'DIV')           e = dialogs.addPanel   ( this.dashBoard , '' , left , top , 1 , 1 , {dragable:true});

    if(elementName == 'INPUT')         e = dialogs.addInput   ( this.dashBoard , left , top , 7 , 'Eingabe' , '' , {dragable:true});

    if(elementName == 'COMBOBOX')      e = dialogs.addCombobox( this.dashBoard , left , top , 7 , 'Eingabe' , '' , ['Option1','Option2','Option3'] , {dragable:true}); 

    if(elementName == 'LABEL')         e = dialogs.addLabel   ( this.dashBoard , '' , left , top , 7 , 1 , {dragable:true});



    // anklick- und ziehbar machen...
    if (e != null)
    {
      this.builderObjects.push(e);
      e.draggingData         = { id:e.ID , type:elementName , left:left , top:top };
      e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
      e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
      e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
      e.callBack_onClick     = function(event , dataBinding) { this.onMouseClick(event , dataBinding ) }.bind(this);
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
    
    return false;
      
  }


  saveProperties( p )
  {
    console.log('Setrze Properties: ' + utils.JSONstringify(p) );

    if(this.selected.element) dialogs.setProperties( this.selected.element , p );  

  }


___createToolboxItem( label , type , left , top)
{
  var item                       = dialogs.addPanel( this.menuPanel , '' , left , top , 1 , 1 , {dragable:true , draggingData: { newObject:type } });
      item.margin                = '0.4em';
      item.innerHTML             = '<center>'+label+'</center>';
      item.type                  = type;
      item.callBack_onDrop       = function(event , dropResult) { debugger; this.onDrop(event , dropResult) }.bind(this);
      return item;  
}


___findComponentByHTMLelement( htmlElement )
{
  var id = '';
  if(htmlElement.data && htmlElement.data instanceof Object) id = htmlElement.data.ID;
  else return null

  for (var i = 0; i < this.builderObjects.length; i++)
  {
    if (this.builderObjects[i].ID == id)
    {
      return this.builderObjects[i];
    }
  }
  return null; // Element nicht gefunden
}


onMouseClick(event , clickedObject)
{ 
   event.stopPropagation()
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

  if (dropResult) return;

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

  const draggableElement = document.getElementById(id); // Findet das gezogene Element
  const draggableObject  = draggableElement.data; 
  
  if(draggableObject)
  {
    draggableObject.setParent(dropTarget);
    draggableObject.gridLeft = gridPosition_left;
    draggableObject.gridTop  = gridPosition_top;
  }
  if(selected.element == draggableObject) 
  {
    // PropertyEditor anzeigen
    var p = dialogs.getProperties( draggableObject );
    propertyEditor.setProperties( p );
  }

  mouseInfo.DOMelement.textContent = '';  
};



showGridLines( div )
{ return;
 if (!div.isGridLayout) {console.log('Element ist kein Grid-Container'); return;}  

  var dim = utils.getGridLayoutDimension(div);

  var numColumns = dim.gridColumnCount;
  var numRows    = dim.gridRowCount;

  console.log('showGridLines() -> numColumns:'+numColumns+' numRows :'+numRows);

  // Berechne die Breite und Höhe der Zellen
  const divWidth   = div.width;
  const divHeight  = div.height;
  const divLeft    = div.left;
  const divTop     = div.top;
 
  const cellWidth  = Math.round(divWidth / numColumns);
  const cellHeight = Math.round(divHeight / numRows);

  // altes Raster entfernen
  const oldGrid = div.DOMelement.querySelector('svg');
  if (oldGrid) {
    oldGrid.remove();
  } 

  // Erstelle neues SVG-Element
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("style",`grid-area: 1 / 1 / ${numRows+1} / ${numColumns+1}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${divWidth} ${divHeight}`);
  svg.style.pointerEvents = 'none'; // Verhindert, dass das SVG-Element die Mausereignisse blockiert

  div.DOMelement.appendChild(svg);

 // Erstelle senkrechte Grid-Linien
 for (let i = 1; i < numColumns; i++) 
{
   const x = i * cellWidth;
   const line = document.createElementNS(svgNS, 'line');
   line.setAttribute('x1', x);
   line.setAttribute('y1', 0);
   line.setAttribute('x2', x);
   line.setAttribute('y2', divHeight);
   line.setAttribute('stroke', 'gray');
   line.setAttribute('stroke-width', '.5');
   // gestrichelte Linie
   line.setAttribute('stroke-dasharray', '0,4,0');
   svg.appendChild(line);
 }

 // Erstelle wagerechte Grid-Linien
 for (let i = 1; i < numRows; i++) 
 {
   const y = i * cellHeight;
   const line = document.createElementNS(svgNS, 'line');
   line.setAttribute('x1', 0);
   line.setAttribute('y1', y);
   line.setAttribute('x2', divWidth);
   line.setAttribute('y2', y);
   line.setAttribute('stroke', 'gray');
   line.setAttribute('stroke-width', '.5');
   // gestrichelte Linie
   line.setAttribute('stroke-dasharray', '0,4,0');
   svg.appendChild(line);
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





   


