
import * as globals      from "./tfWebApp/globals.js";
import * as mcGlobals    from "./tfMediaCollector_globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TFImage,
         TPropertyEditor,
         TFAnalogClock,
         TFPopUpMenu}    from "./tfWebApp/tfObjects.js";

import { TFMediaCollector_mediaSetViewer } from "./tfMediaCollector_mediaSetViewer.js";         


const videoExtensions = mcGlobals.videoExtensions;
const imageExtensions = mcGlobals.imageExtensions;


export class TFMediaCollector_thumb
{
  constructor( parent , params )
  { 
    this.parent       = parent; 
    this.params       = params;
    this.mediaSet     = params.mediaSet || null;
    this.mediaFile    = params.file || params.mediaFile || null;
    this.thumb        = params.thumb || null;
    this.thumbID      = params.thumbID || null;

    if(this.thumb==null) this.thumb



    // temporär - wird später ausgelagert ....
    this.popup = new TFPopUpMenu([{caption:'view',value:1} , 
                                  {caption:'diashow',value:2 } ,
                                  {caption:'Metadaten bearbeiten',value:3},
                                  {caption:'Person zuordnen',value:4} ,]);
      
    this.popup.onClick = (sender , item )=>{ 
                                             if(item.value==1) {this.handleMediaFile();}
              
                                             if(item.value==2) {}
            
                                             if(item.value==3) {}

                                             if(item.value==4) {}
                                              
                                          }  ;






    if(params.thumbID)
    { 
      this.thumbID      = params.thumbID;  
      var response      = utils.webApiRequest('THUMB' , {ID:this.thumbID} );
      if(response.error) return response;
      this.mediaFile    = response.result.file;
      this.thumb        = response.result.thumb;
    }
   

    this.thumbURL     = utils.buildURL('GETIMAGEFILE' , {fileName:this.thumb.fullPath} );
    this.thumbImg     = new TFImage(this.parent ,1,1,"150px" , "150px" , {popupMenu:this.popup , imgURL:this.thumbURL , dragable:true } );
    
    this.thumbImg.callBack_onDragStart = function (e)
                  { 
                    e.dataTransfer.setData('application/json', JSON.stringify(this.thumb));
                  }.bind(this);
   
    this.thumbImg.callBack_onClick = function (e, d) 
                  { 
                    this.handleMediaFile(); 
                  }.bind(this);
    
    //this.sec = 0;
    //setInterval(() =>{this.sec++; console.log("MediaFile nach "+this.sec+" Sekunde(n):", JSON.stringify(this.mediaFile))}, 1000);
                                
    }

   

handleMediaFile()
{ 
  if(this.mediaFile)
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
 
  if(this.mediaSet) new TFMediaCollector_mediaSetViewer( this.mediaSet );

}


}

