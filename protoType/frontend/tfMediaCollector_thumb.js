
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
         TFPopUpMenu,
         TFPanel}    from "./tfWebApp/tfObjects.js";

import { TFMediaCollector_mediaSetViewer } from "./tfMediaCollector_mediaSetViewer.js";         


const videoExtensions = mcGlobals.videoExtensions;
const imageExtensions = mcGlobals.imageExtensions;


export class TFMediaCollector_thumb
{
  constructor( parent , params )
  { 
    this.parent           = parent; 
    this.params           = params;
    this.mediaSet         = params.mediaSet || null;
    this.mediaFile        = params.file || params.mediaFile || null;
    this.thumb            = params.thumb || null;
    this.thumbID          = params.thumbID || null;
    this.popupMenu        = params.popupMenu || null;
    this.callBack_onClick = params.callBack_onClick || null;

    if(this.thumb==null) this.thumb = {ID:0, DIR:'', FILENAME:'', FILETYPE:'', FILESIZE:0, THUMBNAIL:'', THUMBNAILFILETYPE:'', THUMBNAILFILESIZE:0, THUMBNAILDIR:''};

    if(params.thumbID)
    { 
      this.thumbID      = params.thumbID;  
      var response      = utils.webApiRequest('THUMB' , {ID:this.thumbID} );
      if(response.error) return response;
      this.mediaFile    = response.result.file;
      this.thumb        = response.result.thumb;
    }
   

    this.thumbURL     = utils.buildURL('GETIMAGEFILE' , {fileName:this.thumb.fullPath} );
    this.thumbImg     = new TFPanel(this.parent ,1,1,"150px" , "150px" , {popupMenu:this.popupMenu , dragable:true } );
    //this.thumbImg.DOMelement.setStyle({backgroundImage: `url(${this.thumbURL})`, backgroundSize: "cover"});
    this.thumbImg.imgURL = this.thumbURL ,


    this.thumbImg.callBack_onDragStart = function (e)
                  {
                    e.dataTransfer.setData('application/json', JSON.stringify({thumb:this.thumb, mediaFile:this.mediaFile || {notSet:true} ,mediaSet:this.mediaSet || {notSet:true}}));
                  }.bind(this);
   
    this.thumbImg.callBack_onClick = function (e, d) 
                  { 
                    this.handleMediaFile(e,d); 
                  }.bind(this);
  }

   

handleMediaFile(e,d)
{ 
  if(this.callBack_onClick) this.callBack_onClick(d,e,{mediaFile:this.mediaFile || {notSet:true} , 
                                                       mediaSet :this.mediaSet || {notSet:true} , 
                                                       thumb    :this.thumb || {notSet:true} });
}


}

