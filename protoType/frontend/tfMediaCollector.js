
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TFImage,
         TPropertyEditor,
         TFAnalogClock,
         TFPopUpMenu}    from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";

import { TPerson }       from "./personen.js";


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

    this.popup = new TFPopUpMenu([{caption:'view',value:1} , 
                                  {caption:'diashow',value:2 } ,
                                  {caption:'Metadaten bearbeiten',value:3},
                                  {caption:'Person zuordnen',value:4} ,]);
      
    this.popup.onClick = (sender , item )=>{ 
                                             if(item.value==1) {this.handleMediaFile();}
              
                                             if(item.value==2) {}
            
                                             if(item.value==3) {}

                                             if(item.value==4) {this.newPerson()}
                                              
                                          }  ;






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

newPerson()
{
  var aPerson = {
    ID           : 0,
    NAME         : '',
    VORNAME      : '',
    ALIAS1       : '',
    ALIAS2       : '',
    ALIAS3       : '',
    GEBURTSJAHR  : null,
    HERKUNFT     : '',
    BUSINESSTART : null,
    BUSINESENDE  : null,
    RANKING      : 0,
    BEMERKUNGEN  : '' };
  
    var p = new TPerson({ID:1});
    p.edit();
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
   this.joblistWnd = null;

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

 __startPollingJoblist()
{
  this.pollingTimer = setInterval( this.__updateView_Joblist.bind(this) , 4000);
} 

__stopPollingJoblist()
{
  clearInterval(this.pollingTimer);
  this.pollingTimer = null;
  this.updateThumbs();
}  
 

 __updateView_Joblist()
{
  var response = utils.webApiRequest('GETJOBLIST', {} );
  if(response.error) 
  { 
    dialogs.showMessage(response.errMsg);
    this.__stopPollingJoblist();
    this.joblistWnd.destroy();
    this.joblistWnd = null;
    return; 
  }  

  if(response.result.length==0) 
  { 
    this.__stopPollingJoblist();
    this.joblistWnd.destroy();
    this.joblistWnd = null;
    return;
  }

  if(response.result.length>0) 
  { 
    if(this.joblistWnd==null) this.joblistWnd = dialogs.createWindow( null, 'Jobliste','50%','50%','CENTER');
    
    this.joblistWnd.innerHTML = 'leere Jobliste';
       
    var l='<h4 style="margin:0;padding:0;">pending jobs</h4><ul>';
    for(var i=0; i<response.result.length; i++) 
    {
        var job    = response.result[i].param;
        var state  = response.result[i].status;
        l = l + '<li> ' + job + ' ' + state + '</li>';
    }  
    var l=l+'</ul>';
    this.joblistWnd.innerHTML = l;
  }
}  



  addMediaFile(kind)
  {
    var ext = ['*.*'];
    if (kind == 'IMAGE') ext = imageExtensions;
    if (kind == 'DIR')   ext = imageExtensions;
    if (kind == 'VIDEO') ext = videoExtensions;

    dialogs.fileDialog( '/', ext , true ,function(d,f,ff)
                                              { 
                                                if(this.kind == 'DIR') 
                                                { 
                                                  utils.webApiRequest('REGISTERMEDIA' , {mediaFile:d} );
                                                  this.self.__startPollingJoblist();
                                                }  
                                                else {
                                                       utils.webApiRequest('REGISTERMEDIA' , {mediaFile:f} );
                                                       this.self.updateThumbs()
                                                }   
                                              }.bind({self:this,kind:kind}) );
   
 }  


 updateThumbs()
  {
    this.dashboardPanel.innerHTML = "";
    this.dashboardPanel.buildFlexBoxLayout();
    this.dashboardPanel.alignItems='flex-start';
    this.dashboardPanel.justifyContent='flex-start';

    //var response = utils.webApiRequest('LSTHUMBS' , {orderBy:"hash"} );
    var response = utils.webApiRequest('LSTHUMBS' , {} );
    if(response.error) return;

    for(var i=0; i<response.result.length; i++)
    new Tthumbnail( this.dashboardPanel , {thumb:response.result[i].thumb , file:response.result[i].file} );
    
  }

} 