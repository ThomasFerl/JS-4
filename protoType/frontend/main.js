import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/TFDialogs.js";

import { TFEdit, TFWorkSpace }   from "./tfWebApp/tfObjects.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js";

const svgPath = '/home/tferl/GIT/JS-3/tfWebApp/fontAwsome/svgs/'; //'/GIT/JS-3/tfWebApp/fontAwsome/svgs/';

var svgContainer  = null;
var testContainer = null;
var panels        = [];
var menuContainer = null;



export function main(capt1,capt2)
{
    var ws = new TFWorkSpace('mainWS' , capt1,capt2 );

    var l  = dialogs.setLayout( ws.handle , {gridCount:21,head:1,left:7} )
  
      menuContainer = l.head;
      testContainer = l.left;
      svgContainer  = l.dashBoard; 

      menuContainer.backgroundColor = 'gray';
      menuContainer.buildGridLayout_templateColumns('10em 10em 10em 1fr ');
      menuContainer.buildGridLayout_templateRows('1px 1fr');


  var btn1 = dialogs.addButton( menuContainer , "" , 1 , 2 , 1 , 1 , "regular"  )
      btn1.callBack_onClick = function() { showSVGs('regular') };
      btn1.heightPx = 27;

  var btn2 = dialogs.addButton( menuContainer , "" , 2 , 2 , 1 , 1 , "solid"  )
      btn2.callBack_onClick = function() { showSVGs('solid') };
      btn2.heightPx = 27;

  var btn3 = dialogs.addButton( menuContainer , "" , 3 , 2 , 1 , 1 , "brands"  )
      btn3.callBack_onClick = function() { showSVGs('brands') };
      btn3.heightPx = 27;


      testContainer.buildGridLayout_templateRows('repeat(10,1fr)');
      testContainer.buildGridLayout_templateColumns('1fr');

      for(var i=0; i<10; i++)
      {
        var p = dialogs.addPanel( testContainer , "" , 1 , i+1 , 1 , 1 );
            p.margin = '0.1em';
            p.buildGridLayout('1x1');
            p.overflow = 'hidden';  
            panels.push(p);
      } 

      dialogs.addLabel( panels[0] , '' , 1 , 1 , 1 , 1 , 'Test - Label' );

      dialogs.addInput( panels[1] , 1 , 1 , 10 , 'Test' , 'pix' , '42' , {} );

      dialogs.addDatePicker( panels[2] , 1 , 1 , 'DT-Picker' , '01.01.2000 17:35' , null , {} );
   
                   
      



      
      
}
    
     
async function showSVGs(type)
{ 
   //load all SVG's
   svgContainer.innerHTML = '';
   svgContainer.buildFlexBoxLayout();

   var progress = dialogs.addLabel( svgContainer , "" , 1 , 1 , '100%' , '100%' , "loading ..." );
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
    await utils.processMessages();

     var p = dialogs.addImage( svgContainer , "" , 1 , 1 , "77px" , "77px" );
     
     var svg = utils.webApiRequest('GETFILE',{fileName:svgPath + type + '/' + svgs[i]} ); 

        if (!svg.error) 
          {
            p.svgContent = svg.result;
            p.dataBinding = {svg:svg.result};
            p.callBack_onClick = function(e, d ) { var wnd = new TFWindow( svgContainer , 'TEST' , '50%' , '70%' , 'CENTER' ); 
                                                   var img = dialogs.addImage( wnd.hWnd ,  '' , 1, 1, '100%' , '100%' );                                       
                                                       img.svgContent = d.svg;
                                                 };
          }
    }      

    progress.destroy();

 }