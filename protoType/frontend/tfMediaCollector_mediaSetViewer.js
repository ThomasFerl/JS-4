import * as globals     from "./tfWebApp/globals.js";
import * as mcGlobals   from "./tfMediaCollector_globals.js";
import * as utils       from "./tfWebApp/utils.js";
import * as dialogs     from "./tfWebApp/tfDialogs.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js";

import { TFCheckBox, 
    TFileUploadPanel, 
    TFImage, 
    TFLabel,     
    TFPanel,
    TFEdit,
    TFComboBox,
    TFButton,
    TForm,
    TPropertyEditor,
    TFileDialog,
    TFListCheckbox } from "./tfWebApp/tfObjects.js";



import { TFMediaCollector_thumb }          from "./tfMediaCollector_thumb.js";
import { TFMediaCollector_fileManager }    from "./tfMediaCollector_fileManager.js";
import { TFMediaCollector_editSet }        from "./tfMediaCollector_editSet.js";

const validExtensions = mcGlobals.videoExtensions.concat(mcGlobals.imageExtensions);


export class TFMediaCollector_mediaSetViewer
{
  constructor( mediaSet )
  {
    this.mediaFiles = [];
   
    // wird kein mediaSet übergeben, dann wird ein neues angelegt 
    if(!mediaSet)
    {
      this.mediaSet = { ID:0 , TYPE:'' , NAME:'' , KATEGORIE:'' , DESCRIPTION:'' };
      var es = new TFMediaCollector_editSet(); 
          es.callback_if_ready = function(mediaSet){ 
                                                    this.mediaSet = mediaSet; 
                                                    this.__init__(); 
                                                   }.bind(this);
    }
    else
    {
      this.mediaSet = mediaSet;
      this.__init__(); 
    } 
     
  }  
    
__init__()
{    
    this.wnd = new TFWindow( null , this.mediaSet.NAME || 'fileManager' , "77%" , "77%" , "CENTER" );
    
    this.workSpace         = this.wnd.hWnd; 
    this.mediaViewer       = null;
    
    this.workSpace.backgroundColor = 'darkgray';
    this.workSpace.buildGridLayout('10x10');
        
     this.menuPanel        = dialogs.addPanel ( this.workSpace , '' , 1 , 1 , 10 , 1 );
     this.menuPanel.buildGridLayout_templateColumns('7em 7em 7em 1fr');
     this.menuPanel.buildGridLayout_templateRows('1fr');

     var  b=dialogs.addButton( this.menuPanel ,'', 1 , 1 , 1 , 1 ,'+' );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.callBack_onClick = function(){this.add2MediaSet()}.bind(this);
          
          b=dialogs.addButton( this.menuPanel ,'', 2 , 1 , 1 , 1 ,'-' );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.callBack_onClick = function(){this.removeMediaFile()}.bind(this);

          b=dialogs.addButton( this.menuPanel ,'', 3 , 1 , 1 , 1 ,'edit' );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.callBack_onClick = function(){
                                           var es = new TFMediaCollector_editSet(this.mediaSet); 
                                           es.callback_if_ready = function(mediaSet){ 
                                                    this.mediaSet = mediaSet; 
                                                    this.__init__(); 
                                                   }.bind(this);
        }.bind(this);

     this.dashboardPanel   = new TFPanel( this.workSpace ,  1 , 2 , 10 , 9 ,{css:'cssContainerPanel',dropTarget:true} );
     this.dashboardPanel.callBack_onDrop = function (e , data)
                                           { 
                                             this.___dropImage( e , data ); 
                                           }.bind(this);
       
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
      this.mediaFiles = [];
      this.dashboardPanel.innerHTML = "";
      this.dashboardPanel.buildFlexBoxLayout();
      this.dashboardPanel.alignItems='flex-start';
      this.dashboardPanel.justifyContent='flex-start';

      var response = utils.webApiRequest('LSTHUMBS' , {mediaSet:this.mediaSet.ID} );
      if(response.error) {dialogs.showMessage(response.errMsg); return; }
  
      for(var i=0; i<response.result.length; i++) 
      { 
        this.mediaFiles.push(response.result[i].file);
        new TFMediaCollector_thumb( this.dashboardPanel , {thumb:response.result[i].thumb , mediaFile:response.result[i].file} )
      }
    }  

  ___addMediaFiles(files)
  {
      if (!files) return;
      if (files.length == 0) return;
  
      var setID = this.mediaSet.ID;
  
      // füge NUR diese Dateien hinzu, die noch NICHT in this.mediaFiles[] enthalten sind
      for(var i=0; i<files.length; i++)
      {
        var f = files[i];
        var found = false;
        for(var j=0; j<this.mediaFiles.length; j++)
        if(this.mediaFiles[j].name == f.name && this.mediaFiles[j].path == f.path)
        {
          found = true;
          break;
        }
        if(!found) this.mediaFiles.push(f);
      }
    } 
    
    
 ___dropImage( e , data )  // onDrop ( event , data )
   {   
    if (data.json) 
    {
      debugger
    }  
      

    if (data.url) {
                   alert("Web-Image gedroppt:"+ data.url);
                  }
   }


  
    add2MediaSet()
    {
      new TFMediaCollector_fileManager( null, {root:this.mediaSet.DESCRIPTION } , function(files){debugger; this.___addMediaFiles(files)}.bind(this)).run();
    }

 
    removeMediaFile() 
    {}

}







