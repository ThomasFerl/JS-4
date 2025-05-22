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

// ein ganz wilder Hack, um die Drop-Kollision von Thumb und Container zu verhindern
// e.stopPropagation() klappt in meiner tfObject-Architektur leider nicht
// das zuerst getriggerte Event gewinnt. Um zu verhindern, dass das Container-Event auch triggert
// wird eine "Drop_Event-Refraktärzeit" gesetzt, in der Drops ignoriert werden
const dropEventRefractoryTime = 1000; // in ms
let lastDropEventTime         = 0;


export class TFMediaCollector_mediaSetViewer
{
  constructor( mediaSet , callBack_onChanged )
  {
    this.mediaFiles              = [];
    this.mediaThumbs             = [];
    this.callBack_onChanged      = callBack_onChanged
    this.selectedImgNdx          = 0;
    this.diaShowWindow           = null;
    this.diaShowWindow_is_closed = false;
   
   
    // wird kein mediaSet übergeben, dann wird ein neues angelegt 
    if(!mediaSet)
    {
      this.mediaSet = { ID:0 , TYPE:'' , NAME:'' , KATEGORIE:'' , DESCRIPTION:'' };
      var es = new TFMediaCollector_editSet(); 
          es.callback_if_ready = function(mediaSet){
                                                    this.mediaSet = mediaSet; 
                                                    this.__init__(); 
                                                    if(this.callBack_onChanged) this.callBack_onChanged();
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
    this.wnd = new TFWindow( null , this.mediaSet.NAME || 'fileManager' , "45%" , "77%" , "CENTER" );
    
    this.workSpace         = this.wnd.hWnd; 
    this.mediaViewer       = null;
    
    this.workSpace.backgroundColor = 'darkgray';
    this.workSpace.buildGridLayout('21x21');
        
     this.menuPanel        = dialogs.addPanel ( this.workSpace , '' , 1 , 1 , 21 , 2 );
     this.menuPanel.buildGridLayout_templateColumns('3em 3em 3em 3em 3em 3em 1fr 3em');
     this.menuPanel.buildGridLayout_templateRows('1fr');
     this.menuPanel.overflow = 'hidden';
     this.menuPanel.margin = '4px';

     utils.drawSymbol('image',dialogs.addPanel(this.menuPanel , 'cssContainerPanel' , 8 , 1 , 1 , 1 ),'black');

     var  b=dialogs.addButton( this.menuPanel ,'', 1 , 1 , 1 , 1 , {glyph:'circle-plus'} );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.height = '1.7em';
          b.callBack_onClick = function(){this.add2MediaSet()}.bind(this);
          
          b=dialogs.addButton( this.menuPanel ,'', 2 , 1 , 1 , 1 ,{glyph:'circle-minus'} );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.height = '1.7em';
          b.callBack_onClick = function(){this.removeMediaFile()}.bind(this);

          b=dialogs.addButton( this.menuPanel ,'', 4 , 1 , 1 , 1 ,{glyph:'circle-play'} );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.height = '1.7em';
          b.callBack_onClick = function(){this.diaShow()}.bind(this);

          b=dialogs.addButton( this.menuPanel ,'', 3 , 1 , 1 , 1 ,{glyph:'pencil'} );
          b.backgroundColor = 'gray';
          b.margin = '7px';
          b.height = '1.7em';
          b.callBack_onClick = function(){
                                           var es = new TFMediaCollector_editSet(this.mediaSet); 
                                               es.callback_if_ready = function(mediaSet){ 
                                                    this.mediaSet = mediaSet; 
                                                    this.__init__(); 
                                                    if(this.callBack_onChanged) this.callBack_onChanged();
                                                   }.bind(this);
        }.bind(this);

     this.dashboardPanel   = new TFPanel( this.workSpace ,  1 , 3 , 21 , 19 ,{css:'cssContainerPanel',dropTarget:true} );
     this.dashboardPanel.callBack_onDrop = function (e , data)
                                           { 
                                              if (data.json)
                                              {
                                                // Wenn die Drop-Ereignis-Refraktärzeit abgelaufen ist
                                                if (Date.now() - lastDropEventTime > dropEventRefractoryTime) {
                                                  // Setze die Zeit des letzten Drop-Ereignisses
                                                  lastDropEventTime = Date.now();
                                                  // Führe die Drop-Operation aus
                                                  this.___dropImage( e , data ); 
                                                }
                                              } 
                                           }.bind(this);
       
   this.updateThumbs();  
  }

    
handleThumbClick( e , d , thumbParams )
{
  var mediaThumb      = thumbParams.self;
  this.selectedImgNdx = thumbParams.ndx;
 
     if(mediaThumb.selected)
     {
      this.showMediaFile();
      mediaThumb.selected = false;
      return;
     }
     
     if (!globals.KeyboardManager.isKeyPressed("Control")) 
       { // Mehrfachauswahl mit gedrückter Ctrl-Taste
         for(var i=0; i<this.mediaThumbs.length; i++) this.mediaThumbs[i].selected = false;
       }  
 
  mediaThumb.selected = true;
  
}


showMediaFile()
{ 
  var mediaFile = this.mediaFiles[this.selectedImgNdx];
  if(mediaFile)
  { 
    // File zusammenbauen
    var fn = utils.pathJoin(mediaFile.DIR , mediaFile.FILENAME );

    if(mediaFile.TYPE == "MOVIE") dialogs.playMovieFile( null , utils.buildURL('GETMOVIEFILE',{fileName:fn} ));
    if(mediaFile.TYPE == "IMAGE") dialogs.showImage    (        utils.buildURL('GETIMAGEFILE',{fileName:fn} ) , mediaFile.NAME);
  }
}


/*
    if((this.mediaWindow==null) || (this.mediaWindow_is_closed))
    {
      this.mediaWindow = new TFWindow( null , mediaFile.FILENAME , "80%" , "80%" , "CENTER" );
      this.mediaWindow.backgroundColor = 'darkgray';
      this.mediaWindow_is_closed = false;
      this.mediaWindow.callBack_onClose = function (e)
      { 
        this.mediaWindow_is_closed = true;
      }.bind(this);

      // Taste nach Rechts: Cursor rechts
      // Taste nach Links: Cursor links
      this.mediaWindow.callBack_onMouseDown = function (e) 
      { 
        if (e.button == 0) 
        {
          this.selectedImgNdx++;
          if(this.selectedImgNdx>=this.mediaFiles.length) this.selectedImgNdx = 0;
          this.showMediaFile();
        }
        if (e.button == 2) 
        {
          this.selectedImgNdx--;
          if(this.selectedImgNdx<0) this.selectedImgNdx = this.mediaFiles.length-1;
          this.showMediaFile();
        }
      }.bind(this)

      this.mediaWindow.callBack_onKeyDown = function (e)  
      { debugger;
        globals.KeyboardManager.showKeys();
       
        if (e.key === "ArrowRight")
        {
          this.selectedImgNdx++;
          if(this.selectedImgNdx>=this.mediaFiles.length) this.selectedImgNdx = 0;
          this.showMediaFile();
        }

        if (e.key === "ArrowLeft")
        {
          this.selectedImgNdx--;
          if(this.selectedImgNdx<0) this.selectedImgNdx = this.mediaFiles.length-1;
          this.showMediaFile();
        }
       
        if (e.key === " ")
          {debugger;
            setInterval( function() {
                                      this.selectedImgNdx++;
                                      if(this.selectedImgNdx>=this.mediaFiles.length) this.selectedImgNdx = 0;
                                      this.showMediaFile();
                                    }.bind(this) , 4000);
          }

      }.bind(this)





    }
    else this.mediaWindow.innerHTML = "";

    if (mediaFile.TYPE == "MOVIE")
    {
      var url = utils.buildURL('GETMOVIEFILE',{fileName:fn} );
      dialogs.playMovieFile( this.mediaWindow.hWnd , url );
      return;
    }

    if (mediaFile.TYPE == "IMAGE")
    {
      var url = utils.buildURL('GETIMAGEFILE',{fileName:fn} );
      dialogs.addImage( this.mediaWindow.hWnd , '' , 1 , 1 , '100%' , '100%' , url ); 
      return;
    }
  } 
} 

*/


updateThumbs()
{ 
      this.mediaFiles = [];
      this.mediaThumbs  = [];
      this.dashboardPanel.innerHTML = "";
      this.dashboardPanel.buildFlexBoxLayout();
      this.dashboardPanel.alignItems='flex-start';
      this.dashboardPanel.justifyContent='flex-start';

      var response = utils.webApiRequest('LSTHUMBS' , {mediaSet:this.mediaSet.ID} );
      if(response.error) {dialogs.showMessage(response.errMsg); return; }
  
      for(var i=0; i<response.result.length; i++) 
      { 
        this.mediaFiles.push(response.result[i].file);
        var t=new TFMediaCollector_thumb( this.dashboardPanel , {thumb:response.result[i].thumb , mediaFile:response.result[i].file , mediaSet:this.mediaSet , ndx:i} )
        t.callBack_onClick = this.handleThumbClick.bind(this)
        t.callBack_onDrop = function (e , data)
        { 
          if(data.json)
          {
            // Wenn der Drop-Ereignis-Refraktärzeit abgelaufen ist
            if (Date.now() - lastDropEventTime > dropEventRefractoryTime) {
              // Setze die Zeit des letzten Drop-Ereignisses
              lastDropEventTime = Date.now();
              // Führe die Drop-Operation aus
             this.self.moveMediaFile(data.json.mediaFile.ID , this.thumb.ndx+1 );
          }
         } 
        }.bind({self:this,thumb:t});
        this.mediaThumbs.push(t);
      }
}
     
moveMediaFile(ID_File , newPOSITION )
{
      console.log('moveMediaFile: ' + ID_File + ' to ' + newPOSITION);

      var params = {ID_MEDIASET:this.mediaSet.ID , ID_FILE:ID_File , POSITION:newPOSITION};   
      
      var response = utils.webApiRequest('MEDIA_POSITION' , params );
      if(response.error) {dialogs.showMessage(response.errMsg); return; }
      this.updateThumbs();
}


containingMediafile(mediaFile)
{ 
      var found = false;
      if(mediaFile.ID || mediaFile.id)
        {
            for(var i=0; i<this.mediaFiles.length; i++)
            if(this.mediaFiles[i].ID == (mediaFile.ID || mediaFile.id))
            {
            found = true;
            break;
            }
      }
      else{
            for(var i=0; i<this.mediaFiles.length; i++)
            if((this.mediaFiles[i].NAME == (mediaFile.NAME || mediaFile.name)) && (this.mediaFiles[i].PATH == (mediaFile.PATH || mediaFile.path)))
            {
             found = true;
             break;
            }  
     }  
      return found;       
}      


  ___addMediaFiles(files)
  { 
      if (!files) return;
      if (files.length == 0) return;
  
      var setID = this.mediaSet.ID;
  
      // füge NUR diese Dateien hinzu, die noch NICHT in this.mediaFiles[] enthalten sind
      for(var i=0; i<files.length; i++)
      {
        if(!this.containingMediafile(files[i])) this.mediaFiles.push(files[i]);
      }
  }
 
  ___addMediaFilesDirect(_files)
  { 
      var f = [];
      // füge NUR diese Dateien hinzu, die noch NICHT in this.mediaFiles[] enthalten sind
      for(var i=0; i<_files.length; i++)
         if(!this.containingMediafile(_files[i]))
          f.push( utils.pathJoin(_files[i].path , _files[i].name) );

    if(f.length>0)
    {
      utils.webApiRequest('REGISTERMEDIA_IN_SET' , {mediaFiles:f , mediaSet:this.mediaSet.ID} , 'POST');
      this.updateThumbs();
    }  
}


 ___dropImage( e , data )  // onDrop ( event , data )
   {  
     if (data.json) 
     {
       var _thumb = data.json.thumb;
       var _file  = data.json.mediaFile;   
       var _setID = data.json.mediaSet.ID || 0;

       // wurde ein thumb des "eigenen Sets" gedroppt, wird es ganz nach hinten verschoben
       if(_setID == this.mediaSet.ID)
        {
            //this.moveMediaFile(_file.ID , -1);
            console('this.moveMediaFile hätte nicht feuern dürfen');
            return;
        }

       if(_file) 
          if(!this.containingMediafile(_file)) 
          {
              this.mediaFiles.push(_file);
              utils.webApiRequest('MOVEMEDIA_IN_SET' , {mediaFiles:[_file] , destination:this.mediaSet.ID , source:_setID} );
              new TFMediaCollector_thumb( this.dashboardPanel , {thumb:_thumb , mediaFile:_file , mediaSet:_setID} )
          }    
     }  
    }

     
add2MediaSet()
{ 
  // der Pfad des des ersten Files im mediaSet, wird der Startpunkt (root) des FileManagers
  // wenn kein File im mediaSet, dann wird der root des FileManagers auf den aktuellen Pfad gesetzt
  var dir = '';
  if(this.mediaFiles.length>0) dir = this.mediaFiles[0].DIR;
  
  new TFMediaCollector_fileManager( null, {root:dir } , function(files){this.___addMediaFilesDirect(files)}.bind(this)).run();
}

 
removeMediaFile() 
{ 
   // zuerst das oder die selektierten MediaFiles ermitteln...
   var found           = [];
   var deletedThumbs   = [];
   for(var i=0; i<this.mediaThumbs.length; i++)
   {
     if(this.mediaThumbs[i].selected) 
      {
        found.push(this.mediaThumbs[i].mediaFile.ID);
        deletedThumbs.push({mediaThumb:this.mediaThumbs[i],index:i});
      }  
   }

    if(found.length==0) { dialogs.showMessage('kein Media-File selektiert'); return; } 

    if(found.length>0) { dialogs.ask('Media löschen ...','Sollen die selektierten Media-Files gelöscht werden ? (Die Datei selber bleibt unberührt)', 
      // falls JA
      function()
      {
        utils.webApiRequest( 'DELMEDIAFILE_FROM_SET' , {ID_FILE:found, ID_MEDIASET:this.self.mediaSet.ID} );
        for(var j=0; j<this.deletedThumbs.length; j++)
        {
          this.self.mediaFiles.splice(this.deletedThumbs[j].index,1);
          this.deletedThumbs[j].mediaThumb.destroy();
        }
        
      }.bind({self:this,deletedThumbs:deletedThumbs}));
      return; 
    }
}


diaShow(selected)
{ 
    var imgURLs = [];

    for(var i=0; i<this.mediaFiles.length; i++)
    {
      var mediaFile = this.mediaFiles[i];  
      var fn        = utils.pathJoin(mediaFile.DIR , mediaFile.FILENAME );

      if (mediaFile.TYPE == "MOVIE")
        imgURLs.push( utils.buildURL('GETMOVIEFILE',{fileName:fn} ));
        
    if (mediaFile.TYPE == "IMAGE")
        imgURLs.push( utils.buildURL('GETIMAGEFILE',{fileName:fn} ));
    
    }

    if(imgURLs.length==0) return;
    const slideShowWindow = window.open( 'tfMediaCollector_diashow.html' , '_blank', 'fullscreen=no')
 
   // Warte, bis das neue Fenster geladen ist, und übertrage die Daten
   slideShowWindow.onload = () => {
                                   // Übertrage die Daten an das neue Fenster                                
                                    slideShowWindow.postMessage({ currentIndex:this.selectedImgNdx, slideInterval:4000, imgURLs:imgURLs } , '*' );
                                  };
}

}







