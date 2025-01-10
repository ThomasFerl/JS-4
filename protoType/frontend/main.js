import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    

import { TFLabel, 
         TFPanel , 
         TFImage,
         TFSlider,
         TFButton,
         TFCheckBox,
         TFListCheckbox,
         TFEdit,
         TFComboBox,
         TFPopUpMenu,
         Screen,
         TFWorkSpace, }      from "./tfWebApp/tfObjects.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js";

const svgPath = '/GIT/JS-3/tfWebApp/fontAwsome/svgs/';

var svgContainer = null;


export function main(capt1,capt2)
{
  var ws = new TFWorkSpace('mainWS' , 'Test' , 'Hallo Welt' );
      ws.buildGridLayout( '10x10' );

  var menuContainer = new TFPanel( ws.handle , 1 , 1 , 10 , 1 , {css:"cssWhitePanel"} );
      menuContainer.backgroundColor = 'gray';
      menuContainer.buildGridLayout_templateColumns('10em 10em 10em 1fr ');

  var btn1 = new TFButton( menuContainer , 1 , 1 , 1 , 1 , {caption:"regular"} );
      btn1.callBack_onClick = function() { showSVGs('regular') };
  
  var btn2 = new TFButton( menuContainer , 2 , 1 , 1 , 1 , {caption:"solid"} );
      btn2.callBack_onClick = function() { showSVGs('solid') };

  var btn3 = new TFButton( menuContainer , 3 , 1 , 1 , 1 , {caption:"brands"} );
      btn3.callBack_onClick = function() { showSVGs('brands') };

      svgContainer = new TFPanel( ws.handle , 1 , 2 , 10 , 9 , {css:"cssWhitePanel"});
      svgContainer.backgroundColor = 'white';
    }
    
     
async function showSVGs(type)
{ 
   //load all SVG's
   svgContainer.innerHTML = '';
   svgContainer.buildFlexBoxLayout();

   var progress = new TFLabel( svgContainer , 1 , 1 , '100%' , '100%' , {caption:"loading ..."} );
       progress.backgroundColor = 'rgba(0,0,0,0.25)';
       progress.color = 'white';

   var response = utils.webApiRequest('SCANDIR' , {dir:svgPath+type} )
   var svgs     = [];

   for (var i=0; i<response.result.length; i++)
       if(response.result[i].isFile) svgs.push( response.result[i].name );

   for(var i=0; i<svgs.length; i++)
   { 
    progress.caption = 'loading ' + i + ' of ' + svgs.length + '  (' + Math.round(i/svgs.length*100) + '%)';

    // Warte kurz, damit der Browser aktualisieren kann
    await new Promise(resolve => setTimeout(resolve, 0));


     var p = new TFImage( svgContainer , 1 , 1 , "77px" , "77px" );
         p.overflow = 'hidden';
     var svg = utils.webApiRequest('GETFILE',{fileName:svgPath + type + '/' + svgs[i]} ); 
        if (!svg.error) 
          {
            p.innerHTML = svg.result;
            p.dataBinding = {svg:svg.result};
            p.callBack_onClick = function(e, d ) { var wnd = new TFWindow( svgContainer , 'TEST' , '400px' , '400px' , 'CENTER' ); 
                                                       wnd.innerHTML = d.svg;
                                                 };
          }
    }         
    progress.destroy();
 }