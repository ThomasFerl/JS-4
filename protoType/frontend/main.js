import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import { TFLabel, TFPanel } from "./tfWebApp/tfObjects.js"; 
import { TFSlider }      from "./tfWebApp/tfObjects.js"; 
         


var pix=[
    './pix/21_1733947066104.jpeg' , 
    './pix/21_1733947075828.jpeg' , 
    './pix/21_1733947087021.jpeg' , 
    './pix/21_1733947099048.jpeg' , 
    './pix/21_1733947105455.jpeg' , 
    './pix/21_1733947112065.jpeg' , 
    './pix/21_1733947119823.jpeg' , 
    './pix/21_1733947127565.jpeg' , 
    './pix/21_1733947141947.jpeg' , 
    './pix/21_1733947156749.jpeg' , 
    './pix/21_1733947169309.jpeg' , 
    './pix/21_1733947175844.jpeg' , 
    './pix/21_1733947182061.jpeg' , 
    './pix/21_1733947190029.jpeg' , 
    './pix/21_1733947198034.jpeg' , 
    './pix/21_1733947210443.jpeg' , 
    './pix/21_1733947217776.jpeg' , 
    './pix/21_1733947225496.jpeg' , 
    './pix/21_1733947230324.jpeg' , 
    './pix/21_1733947238504.jpeg' , 
    './pix/21_1733947244694.jpeg' , 
    './pix/21_1733947251735.jpeg' , 
    './pix/21_1733947262316.jpeg' , 
    './pix/21_1733947274029.jpeg' , 
    './pix/21_1733947280556.jpeg' , 
    './pix/21_1733947288261.jpeg' , 
    './pix/21_1733947293781.jpeg' , 
    './pix/21_1733947300044.jpeg' , 
    './pix/21_1733947308896.jpeg' , 
    './pix/21_1733947316997.jpeg' , 
    './pix/21_1733947331155.jpeg' , 
    './pix/21_1733947343884.jpeg' , 
    './pix/21_1733947351255.jpeg' , 
    './pix/21_1733947358255.jpeg' , 
    './pix/21_1733947363523.jpeg' , 
    './pix/21_1733947372268.jpeg' , 
    './pix/21_1733947377828.jpeg' , 
    './pix/21_1733947384440.jpeg' , 
    './pix/21_1733947395581.jpeg' , 
    './pix/21_1733947406359.jpeg' , 
    './pix/21_1733947412843.jpeg' , 
    './pix/21_1733947420879.jpeg' , 
    './pix/21_1733947428164.jpeg' , 
    './pix/21_1733947434891.jpeg' , 
    './pix/21_1733947442183.jpeg' , 
    './pix/21_1733947447791.jpeg' , 
    './pix/21_1733947456298.jpeg' , 
    './pix/21_1733947462075.jpeg' , 
    './pix/21_1733947471982.jpeg' , 
    './pix/21_1733947484508.jpeg' , 
    './pix/21_1733947490196.jpeg' , 
    './pix/21_1733947498269.jpeg' , 
    './pix/21_1733947504973.jpeg' , 
    './pix/21_1733947533669.jpeg' , 
    './pix/21_1733947546079.jpeg' , 
    './pix/21_1733947554938.jpeg' , 
    './pix/21_1733947567014.jpeg' , 
    './pix/21_1733947573506.jpeg' , 
    './pix/21_1733947582564.jpeg' , 
    './pix/21_1733947590245.jpeg' , 
    './pix/21_1733947602099.jpeg' , 
    './pix/21_1733947610099.jpeg' , 
    './pix/21_1733947618813.jpeg' , 
    './pix/21_1733947629963.jpeg' ];

var largeImg = null;    




export function main(capt1,capt2)
{
  console.log('main() called ...');
  var rows = 7;
  var cols = 14;
  var gridContainer = document.body;
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridContainer.style.gap = '2px'; // Abstand zwischen den Zellen
 
 var slider = new TFSlider(gridContainer,1,1,4,1, {position:0} );  
     slider.onChange = ()=> {if(largeImg) largeImg.blur=slider.value; } 

 var label = new TFLabel(gridContainer,5,1,3,1, {caption:capt1} );   
     label.fontSize = '27px';
     label.fontWeight = 'bold';

     gridContainer.onmousemove = (event)=>{label.caption = `x:${event.clientX} y:${event.clientY}`;}    
     
     label.callBack_onMouseMove = ()=>{label.textAlign = 'right';}
     label.callBack_onMouseOut  = ()=>{label.textAlign = 'center';}
      
 for(var row=2;row<=rows;row++)
    for(var col=0;col<=cols;col++)
    {
      var obj = new TFPanel(gridContainer ,col,row,1,1, {} );
      obj.backgroundColor = 'black';
      obj.imgURL = pix[(row*cols+col) % pix.length];
      obj.dataBinding = {imgURL:obj.imgURL};
     // obj.borderRadius=14;
     // obj.shadow=14;

      obj.callBack_onMouseDown   = (event,dataBinding)=> 
                                   { 
                                    largeImg = new TFPanel(gridContainer ,5,1,7,7 );
                                    largeImg.imgURL = dataBinding.imgURL;
                                    setTimeout(() => {largeImg.fadeOut(2000);} , 2000);
                                   };

    } 
                                              
    
      /*
      obj.callBack_onMouseMove   = function() { this.obj.borderRadius=14}.bind({obj:obj});
      obj.callBack_onMouseOut    = function() { this.obj.borderRadius=0}.bind({obj:obj});
      
     */ 
    }
    
    
     
