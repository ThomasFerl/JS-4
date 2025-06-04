
import * as dialogs         from "./tfDialogs.js";
import * as utils           from "./utils.js";

  var builderObjects = [];
  var mouseInfo      = null
  var dashBoard      = null;
  var selected       = {element:null , border:""};
  var propertyEditor = null;	
  

function onMouseClick(event)
{
  var clickedObject = this;
  event.stopPropagation()
  if(selected.element != clickedObject) selectComponent(clickedObject);
}


function onDragstart(event) 
{
  var dragObject = this; // 'this' ist das Element, an das das Event gebunden ist

  //console.log('dragStart on DOMelement: ' + dragObject.constructor.name + ' ( ID=' + dragObject.id +' )');

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


function onDragover(event) 
{
  var dropTarget = this;
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
    mouseInfo.DOMelement.textContent = `X:${gridPosition_left} Y:${gridPosition_top}`;
};


function onDrop(event) 
{
  var dropTarget = this;
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



function showGridLines( div )
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
 for (let i = 1; i < numColumns; i++) {
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
 for (let i = 1; i < numRows; i++) {
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


export function showProperties()
{
  if(selected.element) 
  {
    selected.element.getProperties();
                 
  }
}

 
// ========================================================================================================

export function init( _dashBoard , _propertyEditor , _mouseInfo , _initialGridLayout ) 
{
    dashBoard      = _dashBoard;

    dashBoard.DOMelement.addEventListener('dragover', onDragover.bind(dashBoard)); // Erlaubt das Fallenlassen
    dashBoard.DOMelement.addEventListener('drop',     onDrop.bind(dashBoard));     // Erlaubt das Fallenlassen    });


    propertyEditor                 = _propertyEditor;
    propertyEditor.callBack_onSave = saveProperties; 
    mouseInfo                      = _mouseInfo;

    if(_initialGridLayout)
    {
      var [width, height] = _initialGridLayout.split('x').map(Number);
      setGridLayout( width , height );
    }  
}


export function setGridLayout( numCols , numRows )
{
  var dest = dashBoard;
  if (selected.element != null) dest = selected.element;  
  utils.buildGridLayout( dest , `${numRows}x${numCols}` , {stretch:true});
   showGridLines( dest );
}


 export function addComponent(left , top , elementName ) 
  {
    var e = null;

    if(elementName == 'BTN')           e = dialogs.addButton( dashBoard , '' , left , top , 1 , 1 , {caption:'Button'} );
    
    if(elementName == 'DIV')           e = dialogs.addPanel( dashBoard , '' , left , top , 1 , 1 );

    if(elementName == 'INPUT')         e = dialogs.addInputGrid( dashBoard , left , top , 14 , 'Eingabe' , '');

    if(elementName == 'COMBOBOX')      e = dialogs.addComboboxGrid( dashBoard , left , top , 14 , 'Eingabe' , '' , ['Option1','Option2','Option3'] ); 

    if(elementName == 'LABEL')         e = dialogs.addLabelGrid ( dashBoard ,  left , top , 2 , 1 );



    // anklickbar machen...
    if (e != null)
    {
      // e.DOMelement.addEventListener('mousedown', onMouseButtonDown );
      // e.DOMelement.addEventListener('mousemove', onMouseMove );
      // e.DOMelement.addEventListener('mouseup', onMouseButtonUp );
        e.DOMelement.setAttribute('draggable', true);
        e.DOMelement.addEventListener('dragstart', onDragstart.bind(e)); 
        e.DOMelement.addEventListener('dragover' , onDragover.bind(e));  
        e.DOMelement.addEventListener('drop'     , onDrop.bind(e));     
        e.DOMelement.addEventListener('click'    , onMouseClick.bind(e)); 
    }
  }   
  

  function selectComponent(element) 
  {
    // letztes Element abwählen
    if (selected.element != null)
    { 
       if(selected.element == element) return false;  // tue nix
       selected.element.DOMelement.style.border = selected.border;
    } 
    
    // neues Element auswählen und opt. hervorheben
    selected.element = element;
    selected.border  = element.DOMelement.style.border;
    element.DOMelement.style.border = "3px solid red";

    // PropertyEditor anzeigen
    var p = dialogs.getProperties( element );
    propertyEditor.setProperties( p );
    
    return false;
      
  }


  function saveProperties( p )
  {
    console.log('Setrze Properties: ' + utils.JSONstringify(p) );

    if(selected.element) dialogs.setProperties( selected.element , p );  

  }




