
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

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";

import { TPerson, TPersonList } from "./personen.js";
import { TFMediaCollector_thumb }          from "./tfMediaCollector_thumb.js";
import { TFMediaCollector_fileManager }    from "./tfMediaCollector_fileManager.js";
import { TFMediaCollector_mediaSetViewer } from "./tfMediaCollector_mediaSetViewer.js";

const videoExtensions = mcGlobals.videoExtensions;
const imageExtensions = mcGlobals.imageExtensions;


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

   this.btnAddImage = dialogs.addButton(this.menuPanel , '' , 3 , 1 , 1 , 1 , 'Set hinzufügen');
   this.btnAddImage.height='2em';
   this.btnAddImage.callBack_onClick = function(){this.addMediaSet()}.bind(this);

   this.btnPersonen = dialogs.addButton(this.menuPanel , '' , 4 , 1 , 1 , 1 , 'Personen');
   this.btnPersonen.height='2em';
   this.btnPersonen.callBack_onClick = function(){ new TPersonList(); }.bind(this);

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

    var response = utils.webApiRequest('LSMEDIASET' , {} );
    if(response.error) {dialogs.showMessage(response.errMsg); return; }

    for(var i=0; i<response.result.length; i++)
    new TFMediaCollector_thumb( this.dashboardPanel , {thumb:response.result[i].thumb , mediaSet:response.result[i]} );
  }

  addMediaFiles(files)
  {
    /*
    if (!files) return;
    if (files.length == 0) return;

    // Order aus dem ersten File entnehmen ...
    var path = files[0].path;
    var pathParts = path.split('/');
    var setName = pathParts[pathParts.length-1];

    var mediaSet = {TYPE:'DIR' , NAME:setName , KATEGORIE:'DIR' , DESCRIPTION:path};

    // zuerst ein neues Set anlegen ...
    var response =  utils.webApiRequest('CREATEMEDIASET' , mediaSet );
    
    if(response.error) 
    { 
      dialogs.showMessage(response.errMsg);
      return;
    }
    var setID = response.result.lastInsertRowid;

    var f     = [];
    for(var i=0; i<files.length; i++) 
       f.push( utils.pathJoin(files[i].path , files[i].name) );

    utils.webApiRequest('REGISTERMEDIA_IN_SET' , {mediaFiles:f , mediaSet:setID} , 'POST');
    
    this.__startPollingJoblist();
    
    setTimeout( this.updateThumbs.bind(this) , 4000);  // mal etwas warten, bis die Thumbs da sind
   */ 
  }



  addMediaSet()
  {
    new TFMediaCollector_mediaSetViewer();
    //new TFMediaCollector_fileManager(this.mainWindow.hWnd , {root:'/' } , function(files){this.addMediaFiles(files)}.bind(this)).run();
  }




  

} 