
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
   this.joblistWnd      = null;
   this.mediaSetThumbs  = [];

   this.mainWindow = new TFWindow(globals.webApp.activeWorkspace , 'media' , width , height , 'CENTER' );
   this.mainWindow.buildGridLayout_templateColumns('1fr');
   this.mainWindow.buildGridLayout_templateRows('4em 1fr');

   this.menuPanel= dialogs.addPanel(this.mainWindow.hWnd , '' ,1 ,1 ,1 ,1); 
   this.dashboardPanel= dialogs.addPanel(this.mainWindow.hWnd , 'cssContainerPanel' ,1 ,2 ,1 ,1);
   this.dashboardPanel.buildFlexBoxLayout();

   // Menu-Buttons
   this.menuPanel.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr 1fr 1fr 1fr');
    this.menuPanel.buildGridLayout_templateRows('1fr');

   this.btnAddImage = dialogs.addButton(this.menuPanel , '' , 1 , 1 , 1 , 1 , {caption:'neues Media-Set',glyph:'circle-plus'});
   this.btnAddImage.height='3em';
   this.btnAddImage.callBack_onClick = function(){this.addMediaSet()}.bind(this);

   this.btnAddImage = dialogs.addButton(this.menuPanel , 'cssAbortBtn01' , 2 , 1 , 1 , 1 , {caption:'Media-Set löschen',glyph:'circle-minus'});
   this.btnAddImage.height='3em';
   this.btnAddImage.callBack_onClick = function(){this.delMediaSet()}.bind(this);


   this.btnPersonen = dialogs.addButton(this.menuPanel , '' , 3 , 1 , 1 , 1 , {caption:'Personen',glyph:'children'});
   this.btnPersonen.height='3em';
   this.btnPersonen.callBack_onClick = function(){ new TPersonList(); }.bind(this);

  // temporär - wird später ausgelagert ....
  this.popup = new TFPopUpMenu([{caption:'view',value:1} , 
                                {caption:'diashow',value:2 } ,
                                {caption:'Metadaten bearbeiten',value:3},
                                {caption:'Person zuordnen',value:4} ,]);

  this.popup.onClick = (sender , item )=>
    { 
               if(item.value==1) {}

               if(item.value==2) {}

               if(item.value==3) {}

               if(item.value==4) {}
                
    }  ;

   this.updateThumbs(); 
 };


 updateThumbs()
  {  
    this.dashboardPanel.innerHTML = "";
    this.mediaSetThumbs = [];
    this.dashboardPanel.buildFlexBoxLayout();
    this.dashboardPanel.alignItems='flex-start';
    this.dashboardPanel.justifyContent='flex-start';

    var response = utils.webApiRequest('LSMEDIASET' , {} );
    if(response.error) {dialogs.showMessage(response.errMsg); return; }

    for(var i=0; i<response.result.length; i++)
    {
      var t = new TFMediaCollector_thumb( this.dashboardPanel , {thumb:response.result[i].thumb , mediaSet:response.result[i] , popupMenu:this.popup } )
          t.callBack_onClick = function( e , d , thumbParams){this.handleThumbClick( e , d , thumbParams)}.bind(this);
      this.mediaSetThumbs.push(t);
    }  
  }



  handleThumbClick( e , d , thumbParams )
  { 
    var mediaSetThumb = thumbParams.self;

    if(mediaSetThumb.selected)
    {
      if(mediaSetThumb.mediaSet.notSet) return;
      new TFMediaCollector_mediaSetViewer( mediaSetThumb.mediaSet );
    }
    
    if (!globals.KeyboardManager.isKeyPressed("Control")) 
      { // Mehrfachauswahl mit gedrückter Ctrl-Taste
        for(var i=0; i<this.mediaSetThumbs.length; i++) this.mediaSetThumbs[i].selected = false;
      }  

    mediaSetThumb.selected = true;
    
  }


  addMediaSet()
  {
   new TFMediaCollector_mediaSetViewer( null , function(){this.updateThumbs()}.bind(this) );

  }

 
  delMediaSet()
  { debugger;
   // zuerst das oder die selektierten MediaSets ermitteln...
   var found = [];
   for(var i=0; i<this.mediaSetThumbs.length; i++)
   {
     if(this.mediaSetThumbs[i].selected) found.push(this.mediaSetThumbs[i].mediaSet.ID);
   }

    if(found.length==0) { dialogs.showMessage('kein Media-Set selektiert'); return; } 

    if(found.length>0) { dialogs.ask('mediaSet löschen ...','Sollen die selektierten Media-Sets gelöscht werden ?', 
      // falls JA
      function()
      {
        utils.webApiRequest('DELMEDIASET' , {mediaSet:found} );
        this.updateThumbs();   
      }
    ); return; }


  }


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
  
} 