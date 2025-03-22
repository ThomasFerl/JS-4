
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
    this.mediaFile    = {};
    this.thumb        = {};
    
    if(params.thumbID)
    { 
      this.thumbID      = params.thumbID;  
      var response      = utils.webApiRequest('THUMB' , {ID:this.thumbID} );
      if(response.error) return response;
      this.mediaFile    = response.result.file;
      this.thumb        = response.result.thumb;
    }
    else
    {
     if(params.thumb) this.thumb     = params.thumb;
     if(params.file)  this.mediaFile = params.file;
    } 

    this.thumbURL     = utils.buildURL('GETIMAGEFILE' , {fileName:this.thumb.fullPath} );
    this.thumbImg     = dialogs.addImage( this.parent , "" , 1 , 1 , "100px" , "100px" , this.thumbURL );
    this.thumbImg.callBack_onClick = function (e, d) 
                  { 
                    this.handleMediaFile(); 
                  }.bind(this);
    
    //this.sec = 0;
    //setInterval(() =>{this.sec++; console.log("MediaFile nach "+this.sec+" Sekunde(n):", JSON.stringify(this.mediaFile))}, 1000);
                                
    }

handleMediaFile()
{
  // File zusammenbauen
  var fn = utils.pathJoin(this.mediaFile.DIR , this.mediaFile.FILENAME );

  if (this.mediaFile.TYPE == "MOVIE")
  {
    var w = dialogs.createWindow( null,fn,"80%","80%","CENTER");
    var url = utils.buildURL('GETMOVIEFILE',{fileName:fn} );
    dialogs.playMovieFile( w.hWnd , url );
  }


  if (this.mediaFile.TYPE == "IMAGE")
    {
      var w   = dialogs.createWindow( null,fn,"80%","80%","CENTER");
      var url = utils.buildURL('GETIMAGEFILE',{fileName:fn} );
      dialogs.addImage( w.hWnd , '' , 1 , 1 , '100%' , '100%' , url ); 
    }
 
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
    this.dashboardPanel.alignItems='flex-start';
    this.dashboardPanel.justifyContent='flex-start';
    this.dashboardPanel.buildFlexBoxLayout()

    var response = utils.webApiRequest('LSTHUMBS' , {} );
    if(response.error) return;

    for(var i=0; i<response.result.length; i++)
    new Tthumbnail( this.dashboardPanel , {thumb:response.result[i].thumb , file:response.result[i].file} );
    
  }

} 