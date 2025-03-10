
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
    this.parent       = parent; 
    this.params       = params;

    this.thumbID      = params.thumbID;  
    
    var response      = utils.webApiRequest('THUMB' , {thumbID:this.thumbID} );
    if(!response.error) this.mediaFile = response.result
     //result:{thumb:this.thumb, file:response.result, thumbPath:fn} };

    this.mediaFile    = response.result.file;
    this.thumb        = response.result.thumb;
    this.thumbPath    = response.result.thumbPath;
    this.thumbURL     = utils.buildURL('GETIMAGEFILE' , {fileName:thumbPath} );

    this.thumb        = dialogs.addImage( parent , "" , 1 , 1 , "77px" , "77px" , this.thumbURL );
    this.thumb.callBack_onClick = function(e, d ) {alert(this.file.FILENAME)}.bind(this);                         };
    
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
   this.btnAddLibrary.callBack_onClick = function(){this.addMediaFile()}.bind(this);

   this.updateThumbs(); 
 };

   


  addMediaFile( dir , file , allMediaFiles )
  {
    dialogs.fileDialog( "*.*" , true ,function(d,f,ff)
                                              {
                                                utils.webApiRequest('REGISTERMEDIA' , {mediaFile:f} );
                                                this.updateThumbs()
                                              }.bind(this));
   
 }  


 updateThumbs()
  {
    this.dashboardPanel.innerHTML = "";

    var response = utils.webApiRequest('LSTHUMBS' , {} );
    if(response.error) return;

    for(var i=0; i<response.result.length; i++)
        var t = new Tthumbnail( this.dashboardPanel , {thumbID:response.result[i].ID} );
    
    
    

  }

} 