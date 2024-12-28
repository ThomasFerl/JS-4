import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import { TFObject }      from "./tfWebApp/tfObjects.js"; 
         

export function main(capt1,capt2)
{
  console.log('main() called ...');
  var rows = 21;
  var cols = 21;
  var gridContainer = document.body;
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridContainer.style.gap = '2px'; // Abstand zwischen den Zellen
  

    var obj = new TFObject(gridContainer ,4,4,14,14, {} );

    obj.backgroundColor = 'gray';
    obj.color = 'black';
    obj.margin = '1em'
    obj.innerHTML  = '<H1>Hello World</H1>';
    obj.fontSize = '4em';
    obj.fontWeight = 'bold';
    
    obj.callBack_onMouseMove   = function() { this.obj.borderRadius=14}.bind({obj:obj});
    obj.callBack_onMouseOut    = function() { this.obj.borderRadius=0}.bind({obj:obj});
    obj.callBack_onMouseDown   = function() { this.obj.shadow=0}.bind({obj:obj});
    obj.callBack_onMouseUp     = function() { this.obj.shadow=21}.bind({obj:obj});
    
    
    
}  
