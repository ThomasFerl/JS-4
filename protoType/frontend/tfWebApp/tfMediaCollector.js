
import * as globals      from "./globals.js";
import * as utils        from "./utils.js";    
import * as dialogs      from "./tfDialogs.js";
import * as graphics     from "./tfGrafics.js";

import { TFEdit, 
         TForm,
         TFPopUpMenu,
         TPropertyEditor,
         TFAnalogClock}  from "./tfObjects.js";

import { TFWindow }      from "./tfWindows.js"; 
import { TFChart }       from "./tfObjects.js";
import { TFDateTime }    from "./utils.js";

class Tthumbnail
{
  constructor( parent , params )
  {
    this.parent = parent; 
    this.params = params;
    this.image  = null;

    


    this.thumbnail = new graphics.TFImage(parent , mediaFile , 0 , 0 , 100 , 100);
  }
}


export class TFMediaCollector
{
  constructor ( width , height , params ) 
  {
   this.mainWindow = new TFWindow(globals.webApp.activeWorkspace , 'media' , width , height , 'CENTER' );
   this.mainWindow.buildGridLayout_templateColumns('1fr');
   this.mainWindow.buildGridLayout_templateRows('3em 1fr');

   this.menuPanel= dialogs.addPanel(this.mainWindow.hWnd , '' ,1 ,1 ,1 ,1); 
   this.dashboardPanel= dialogs.addPanel(this.mainWindow.hWnd , 'cssContainerPanel' ,1 ,2 ,1 ,1);
   this.dashboardPanel.buildFlexBoxLayout();

   // Menu-Buttons
   this.menuPanel.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr 1fr 1fr 1fr');
    this.menuPanel.buildGridLayout_templateRows('1fr');
   this.btnAddLibrary = dialogs.addButton(this.menuPanel , '' , 1 , 1 , 1 , 1 , 'Medium hinzufügen');
   this.btnAddLibrary.backgroundColor='gray';
   this.btnAddLibrary.height='2em';
   this.btnAddLibrary.callBack_onClick = function(){ dialogs.fileDialog( "*.*" , true , function(d,f,ff){debugger; this.addMediaFile(d,f,ff)}.bind(this) )}.bind(this);
 };

   


  addMediaFile( dir , file , allMediaFiles )
  {
    dialogs.showMessage('addMediaFile: '+ file);
  } 
}  