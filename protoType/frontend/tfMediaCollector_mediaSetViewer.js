import * as globals     from "./tfWebApp/globals.js";
import * as mcGlobals   from "./tfMediaCollector_globals.js";
import * as utils       from "./tfWebApp/utils.js";
import * as dialogs     from "./tfWebApp/tfDialogs.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js";

import { TFMediaCollector_thumb }          from "./tfMediaCollector_thumb.js";

const validExtensions = mcGlobals.videoExtensions.concat(mcGlobals.imageExtensions);


export class TFMediaCollector_mediaSetViewer
{
  constructor( mediaSet )
  { 
    this.mediaSet = mediaSet;
    this.mediaSet.ID = mediaSet.ID || 0;

    dialogs.showMessage('mediaSetViewer: ' + JSON.stringify(this.mediaSet));

    this.wnd = new TFWindow( null , mediaSet.NAME || 'fileManager' , "77%" , "77%" , "CENTER" );
    
    this.workSpace         = this.wnd.hWnd; 
    this.mediaViewer       = null;
    
    this.workSpace.backgroundColor = 'darkgray';
    this.workSpace.buildGridLayout('10x10');
        
     this.menuPanel        = dialogs.addPanel ( this.workSpace , '' , 1 , 1 , 10 , 1 );
     this.dashboardPanel   = dialogs.addPanel ( this.workSpace , 'cssContainerPanel' , 1 , 2 , 10 , 9 );
       
   this.updateThumbs();  
  }

    
  viewMedia(fn , ext)
  {
        if(this.mediaViewer==null) this.mediaViewer = new TFWindow( null , fn , '44%' , '44%' , 'CENTER' );
        else                       this.mediaViewer.innerHTML = '';     
      
        if(utils.isImageFile(ext))
        {
         var url = utils.buildURL('GETIMAGEFILE',{fileName:fn} );
         dialogs.addImage( this.mediaViewer.hWnd , '' , 1 , 1 , '100%' , '100%' , url );
        }
     
        if(utils.isMovieFile(ext))
        {
          var url = utils.buildURL('GETMOVIEFILE',{fileName:fn} );
          dialogs.playMovieFile( this.mediaViewer.hWnd , url );
        }    
  }

  updateThumbs()
    { 
      this.dashboardPanel.innerHTML = "";
      this.dashboardPanel.buildFlexBoxLayout();
      this.dashboardPanel.alignItems='flex-start';
      this.dashboardPanel.justifyContent='flex-start';
  
      var response = utils.webApiRequest('LSTHUMBS' , {mediaSet:this.mediaSet.ID} );
      if(response.error) {dialogs.showMessage(response.errMsg); return; }
  
      for(var i=0; i<response.result.length; i++) 
      { 
        new TFMediaCollector_thumb( this.dashboardPanel , {thumb:response.result[i].thumb , mediaFile:response.result[i].file} );
      }
    }  
  
  
  
 
}