
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
    this.ndx              = params.ndx;
    this.___selected      = false;

    this.callBack_onClick = params.callBack_onClick || null;
    this.callBack_onDrop  = params.callBack_onDrop || function(){};

    if(this.thumb==null) this.thumb = {ID:0, DIR:'', FILENAME:'', FILETYPE:'', FILESIZE:0, THUMBNAIL:'', THUMBNAILFILETYPE:'', THUMBNAILFILESIZE:0, THUMBNAILDIR:''};

    if(params.thumbID)
    { 
      this.thumbID      = params.thumbID;  
      var response      = utils.webApiRequest('THUMB' , {ID:this.thumbID} );
      if(response.error) return response;
      this.mediaFile    = response.result.file;
      this.thumb        = response.result.thumb;
    }
   
    if(params.thumbURL) this.thumbURL = params.thumbURL;
    else{
          if(this.thumb.ID) this.thumbURL     = utils.buildURL('GETIMAGEFILE' , {fileName:this.thumb.fullPath} );
          else
              {
               if(this.mediaFile)
                {
                  this.thumbURL = utils.buildURL('GETIMAGEFILE' , {fileName:this.mediaFile.fullPath} );
                }
             }
    }

    this.thumbImg     = new TFPanel(this.parent ,1,1,"150px" , "150px" , {popupMenu:this.popupMenu , dragable:true , dropTarget:true } );
    //this.thumbImg.DOMelement.setStyle({backgroundImage: `url(${this.thumbURL})`, backgroundSize: "cover"});
    this.thumbImg.imgURL = this.thumbURL ;

    this.thumbImg.callBack_onDrop = function(e,d){this.callBack_onDrop(e,d);}.bind(this);

    
    this.thumbImg.callBack_onDragStart = function (e)
                  {
                    e.dataTransfer.setData('application/json', JSON.stringify({thumb:this.thumb, mediaFile:this.mediaFile || {notSet:true} ,mediaSet:this.mediaSet || {notSet:true}}));
                  }.bind(this);
   
    this.thumbImg.callBack_onClick = function (e, d) 
                  { 
                    this.handleClickOnMediaFile(e,d); 
                  }.bind(this);
  }

  
  set selected(v)
  { 
    this.___selected = v;
    if(v) {this.thumbImg.borderWidth = '7px';this.thumbImg.borderColor = 'blue';}
    else  {this.thumbImg.borderWidth = '1px';this.thumbImg.borderColor = 'gray';}
  }

  get selected()
  { 
    return this.___selected;
  }




  handleClickOnMediaFile(e,d)
{
  if(this.callBack_onClick) this.callBack_onClick(e,d,{self     :this , 
                                                       mediaFile:this.mediaFile || {notSet:true} , 
                                                       mediaSet :this.mediaSet || {notSet:true} , 
                                                       thumb    :this.thumb || {notSet:true} , 
                                                       ndx      :this.ndx });
}

destroy()
{ 
  this.thumbImg.destroy();
  this.thumbImg = null;
  this.parent   = null;
  this.params   = null;
  this.mediaSet = null;
  this.mediaFile= null;
  this.thumb    = null;
  this.thumbID  = null;

}

}

