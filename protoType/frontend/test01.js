import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import { TFWindow }      from "./tfWebApp/tfWindows.js";

import { TFLabel, 
         TFPanel , 
         TFImage,
         TFSlider,
         TFButton,
         TFCheckBox,
         TFListCheckbox,
         TFEdit,
         TFComboBox,
         TFWorkSpace,
         TFPopUpMenu }      from "./tfWebApp/tfObjects.js"; 


var response = utils.httpRequest('http://localhost:4000/lsPix');

var body = null;
var pix  = [];
pix      = JSON.parse(response.result).result;  

var diaShow =[];

var images  = [];  
for(var i=0;i<pix.length;i++) images.push({caption: './pix/'+pix[i],checked:false});

var cb1     = null;
var cb2     = null;
var combo   = null;
var slider  = null;
var label   = null;
var btn     = null;


var popup = new TFPopUpMenu([{caption:'view',value:1} , {caption:'selelect',value:2 } , {caption:'deselect',value:3}]);
    popup.onClick = (sender , item )=>{ 
                                        if(item.value==1) showImage(sender.imgURL);
                                          
                                        if(item.value==2)
                                        {
                                          var fi = cb2.findItemByText(sender.imgURL);
                                            if(fi.index>-1) { cb2.setCheckBox(fi.index , true) ; cb2.focus(fi.index); }
                                        }

                                        if(item.value==3)
                                        {
                                            var fi = cb2.findItemByText(sender.imgURL);
                                                if(fi.index>-1) { cb2.setCheckBox(fi.index , false) ; cb2.focus(fi.index); }  
                                        }
                                    }  ;



 function showImage(imgURL)
 {
  var largeImg = new TFWindow( body , imgURL , '50%' , '70%' , 'CENTER' );
  new TFImage(largeImg.hWnd,1,1,1,1, {imgURL:imgURL} );
      
  if(slider.value<99) setTimeout(() => {if(largeImg) {largeImg.fadeOut(1000); diaShow= []}} , slider.value*100); 
  combo.value = imgURL;
 } 

                                   

export function main(capt1,capt2)
{
  body = new TFWorkSpace('mainWS' , capt1 , capt2 );
  body.buildGridLayout('10x10');

    console.log('main() called ...');
  var rows = 10;
  var cols = 10;
  
      
 var testContainer     = new TFPanel(body.handle,8,1,3,rows, {backgroundColor:'gray'} );   
     utils.buildGridLayout(testContainer,'1x10');

     slider = new TFSlider(testContainer,1,1,1,1, {position:30} );  
   
     label = new TFLabel(testContainer,1,2,1,1, {caption:capt1} );   
     label.fontSize = '1em';
     label.fontWeight = 'bold';

     btn = new TFButton(testContainer,1,3,1,1, {caption:"Diashow der selektierten Bilder"} );   
     btn.heightPx = '40px';
     btn.callBack_onClick = ()=>
       {
         var largeImg = null;
         var selected = cb2.getSelectedItems();
         if(selected.length==0) {alert('nichts ausgewählt !');return};
            diaShow = [];   
            for(var i=0;i<selected.length;i++) diaShow.push(selected[i].caption);
            var i=0;
            var showNext = function()
            {
              if(i<diaShow.length)
              {
                largeImg = new TFWindow( body , imgURL , '50%' , '70%' , 'CENTER' );
                largeImg.imgURL = imgURL;
                largeImg.imgURL = diaShow[i];
                setTimeout(() => {if(largeImg) {largeImg.fadeOut(1000,()=>{largeImg=null; i++; showNext()});}}, slider.value*100);    
              }
              else if(cb1.checked) {i=0; showNext();}
            }
            showNext();
        }
    

     cb1 = new TFCheckBox(testContainer , 1,4,1,1, {caption:'Diashau - loop'} );

     combo = new TFComboBox(testContainer,1,5,1,1, {caption:'Bild',appendix:'', labelPosition:'TOP' } );
     combo.callBack_onClick = ()=>{window.open(combo.value, '_blank');} ;
    
     cb2 = new TFListCheckbox(testContainer , 1,6,1,5 );    

//------------------------------------------------------------
//-------------GRID-------------------------------------------
 var gridContainer     = new TFPanel(body.handle,1,1,7,10, {backgroundColor:'gray'} );   
     gridContainer.buildGridLayout(''+rows+'x'+cols);  
     gridContainer.gap = '2px'; // Abstand zwischen den Zellen
 
 var blur = 2;
 for(var row=1;row<=rows;row++)
    for(var col=1;col<=cols;col++)
    {
      var obj = new TFImage(gridContainer ,col,row,1,1, {popupMenu:popup , imgURL:'./pix/'+pix[Math.floor(Math.random()*pix.length)]} );
      obj.backgroundColor = 'black';
      cb2.addItem({caption:obj.imgURL,checked:false});
      combo.addItem(obj.imgURL , obj.imgURL);
      obj.blur   = blur;
      obj.callBack_onMouseMove   = function() { this.label.caption = this.obj.imgURL;  this.obj.blur=0 }.bind({obj:obj, label:label});
      obj.callBack_onMouseOut    = function() { this.label.caption = '' ;              this.obj.blur=this.blur }.bind({obj:obj, label:label, blur:blur});
      obj.callBack_onClick       = function() { showImage(this.imgURL); }.bind({imgURL:obj.imgURL});  
     

    } 
     
    }
    
    
     