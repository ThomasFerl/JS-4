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
    
    this.dashBoard                               = layout.dashBoard;
    this.dashBoard.backgroundColor               = 'white';
    this.dashBoard.DOMelement.style.borderRadius = '0px';
    this.dashBoard.DOMelement.addEventListener('dragover', function(e){ this.onDragover(e).bind(this) } ); // Erlaubt das Fallenlassen
    this.dashBoard.DOMelement.addEventListener('drop'    , function(e){ this.onDrop(e) }.bind(this)     ); // Erlaubt das Fallenlassen    });

    this.menuPanel                               = layout.right;
    this.menuPanel.padding                       = '2px';
    this.menuPanel.buildGridLayout( '4x14' );

    this.mouseInfo              = dialogs.addPanel( this.menuPanel , 'cssBlackPanel' , 1 , 1 , 4 , 1);
    this.mouseInfo.marginBottom = '1em';
    this.mouseInfo.color        = 'white';
     
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

    if(elementName == 'BTN')           e = dialogs.addButton  ( this.dashBoard , '' , left , top , 1 , 1 , {caption:'Button'} );
    
    if(elementName == 'DIV')           e = dialogs.addPanel   ( this.dashBoard , '' , left , top , 1 , 1 );

    if(elementName == 'INPUT')         e = dialogs.addInput   ( this.dashBoard , left , top , 7 , 'Eingabe' , '');

    if(elementName == 'COMBOBOX')      e = dialogs.addCombobox( this.dashBoard , left , top , 7 , 'Eingabe' , '' , ['Option1','Option2','Option3'] ); 

    if(elementName == 'LABEL')         e = dialogs.addLabel   ( this.dashBoard , '' , left , top , 7 , 1 );



    // anklickbar machen...
    if (e != null)
    {
      // e.DOMelement.addEventListener('mousedown', onMouseButtonDown );
      // e.DOMelement.addEventListener('mousemove', onMouseMove );
      // e.DOMelement.addEventListener('mouseup', onMouseButtonUp );

        e.DOMelement.setAttribute    ('draggable', true);
        e.DOMelement.addEventListener('dragstart', function(event){this.onDragstart(event)}.bind(this)); 
        e.DOMelement.addEventListener('dragover' , function(event){this.onDragover(event)}.bind(this));  
        e.DOMelement.addEventListener('drop'     , function(event){this.onDrop(event)}.bind(this));     
        e.DOMelement.addEventListener('click'    , function(event){this.onMouseClick(event)}.bind(this)); 
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
    this.element.DOMelement.style.border = "3px solid red";

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
  var item                       = document.createElement('div');
      item.className             = 'toolboxItem';
      item.textContent           = label;
      item.type                  = type;
      item.style.gridRowStart    = top;
      item.style.gridColumnStart = left;
      this.menuPanel.DOMelement.appendChild(item);

      item.addEventListener('mousedown', function (e){ this.self.addComponent( 1 , 1 , this.item.type.toUpperCase() ) }.bind({self:this,item:item}) );
       
      return item;  
}


onMouseClick(event)
{
  var clickedObject = event.target;

  if(utils.isHTMLElement(clickedObject)) clickedObject = clickedObject.data; // falls es ein HTMLElement ist, dann auf das zugehörige Objekt zugreifen

  event.stopPropagation()
  if(this.selected.element != clickedObject) this.selectComponent(clickedObject);
}


onDragstart(event ) 
{ 
  var dragObject = event.target; // Das Element, das gezogen wird
  if (dragObject.children && dragObject.children.length > 0) 
  {
    // Koordinaten des Mouse-Events verwenden, um das Kind-Element zu finden
    var child = document.elementFromPoint(event.clientX, event.clientY);

    // Überprüfen, ob das gefundene Element ein Child von `dragObject` ist
    if (dragObject.contains(child) && child !== dragObject) {
      dragObject = child; // `dragObject` auf das spezifische Child setzen
    }
  }

  event.stopPropagation();
  event.dataTransfer.setData('text', dragObject.id); // Setzt die ID des gezogenen Elements
  console.log('dragStart:  ID=' + dragObject.id);
}


onDragover(event) 
{
  var dropTarget = event.target;
  event.stopPropagation()
  event.preventDefault(); // Erlaubt das Droppen

    // Mausposition relativ zum Container berechnen
    const rect = dropTarget.DOMelement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gInfo = utils.getGridLayoutDimension( dropTarget );
    var gridPosition_left = Math.floor(x / (dropTarget.width  / gInfo.gridColumnCount)) +1 ;    
    var gridPosition_top  = Math.floor(y / (dropTarget.height / gInfo.gridRowCount)) +1 ; 


    // Optional: visuelles Feedback geben, z.B. eine Linie oder einen Platzhalter anzeigen
    this.mouseInfo.innerHTML = `<center><p>X:${gridPosition_left} Y:${gridPosition_top} </p></center>`;
};


onDrop(event) 
{
  var dropTarget = event.target;
  event.stopPropagation()

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
{
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

  // Erstelle neues SVG-Element
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("style",`grid-area: 1 / 1 / ${numRows+1} / ${numColumns+1}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${divWidth} ${divHeight}`);

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





   


