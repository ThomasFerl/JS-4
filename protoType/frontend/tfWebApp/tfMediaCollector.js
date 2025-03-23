
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


const videoExtensions = [
  'mp4', 'm4v', 'mov', 'avi', 'wmv', 'flv',
  'f4v', 'mkv', 'webm', 'ts', 'mpeg', 'mpg',
  '3gp', 'ogv'
];

const imageExtensions = [
  'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg'
];



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

   this.btnAddVideo = dialogs.addButton(this.menuPanel , '' , 1 , 1 , 1 , 1 , 'Videoclip hinzufügen');
   this.btnAddVideo.backgroundColor='gray';
   this.btnAddVideo.height='2em';
   this.btnAddVideo.callBack_onClick = function(){this.addMediaFile('VIDEO')}.bind(this);

   this.btnAddImage = dialogs.addButton(this.menuPanel , '' , 2 , 1 , 1 , 1 , 'Bild hinzufügen');
   this.btnAddImage.backgroundColor='gray';
   this.btnAddImage.height='2em';
   this.btnAddImage.callBack_onClick = function(){this.addMediaFile('IMAGE')}.bind(this);

   this.btnAddImage = dialogs.addButton(this.menuPanel , '' , 3 , 1 , 1 , 1 , 'Bild-Verzeichnis hinzufügen');
   this.btnAddImage.height='2em';
   this.btnAddImage.callBack_onClick = function(){this.addMediaFile('DIR')}.bind(this);

   this.updateThumbs(); 
 };

   


  addMediaFile(kind)
  {
    var ext = ['*.*'];
    if (kind == 'IMAGE') ext = imageExtensions;
    if (kind == 'DIR')   ext = imageExtensions;
    if (kind == 'VIDEO') ext = videoExtensions;
    dialogs.fileDialog( '/home/tferl/Downloads', ext , true ,function(d,f,ff)
                                              {
                                                if(this.kind == 'DIR') 
                                                {
                                                  for(var i=0; i<ff.length; i++)
                                                  {
                                                    var fi=utils.pathJoin(d,ff[i].name);
                                                    utils.webApiRequest('REGISTERMEDIA' , {mediaFile:fi} );
                                                    this.self.updateThumbs()
                                                  }  
                                                } else {
                                                         utils.webApiRequest('REGISTERMEDIA' , {mediaFile:f} );
                                                         this.self.updateThumbs()
                                                }   
                                              }.bind({self:this,kind:kind}) );
   
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