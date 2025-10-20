
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

const validExtensions = mcGlobals.videoExtensions.concat(mcGlobals.imageExtensions);


export class TFMediaCollector_editSet
{
  constructor( mediaSet )
  { 
      this.mediaFiles        = [];
      this.newMediaFiles     = [];
      this.mediaSet          = mediaSet || null;
      this.callback_if_ready = null;

      var caption = this.mediaSet?.ID ? 'Set bearbeiten' : 'neues Set anlegen';
      this.wnd    = dialogs.createWindow( null,caption,"77%","77%","CENTER");  
      this.hWnd   = this.wnd.hWnd;
      
      this.wnd.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr');
      this.wnd.buildGridLayout_templateRows   ('1fr 1fr 1fr 1fr');

      var hlp = dialogs.addPanel(this.hWnd,'',1,1,2,4); 
      hlp.buildGridLayout_templateColumns('1fr');
      hlp.buildGridLayout_templateRows   ('1fr 1fr 1fr');

      var hlp2 = dialogs.addPanel(hlp,'cssContainerPanel',1,1,1,1);
      hlp2.buildGridLayout_templateColumns('1fr 1fr');
      hlp2.buildGridLayout_templateRows   ('1fr');
     
      this.thumbContainer = new TFPanel( hlp2  , 2 , 1 , 1 , 2 , {dropTarget:true} ); 
      this.thumbContainer.callBack_onDrop = function(e,d) { this.dropThumbImage(e,d) }.bind(this); 
          
      dialogs.addLabel( hlp2 , '' , 1 , 1 , 1, 1 , 'Vorschaubild' );                                      
      
      this.formPanel = dialogs.addPanel(hlp,'',1,2,1,42); 
     
      var hlpContainer  = new TFPanel( this.hWnd  , 3 , 1 , 2 , 4  ); 
          hlpContainer.buildGridLayout_templateColumns('1fr');
          hlpContainer.buildGridLayout_templateRows   ('2em 1fr');
      
      var  c = dialogs.addPanel(hlpContainer,'cssRibbon',1,1,1,1);
           c.backgroundColor = 'darkgray';
      
      var  clpBtn = dialogs.addButton(c,'',1,1,'3em','1.5em',{caption:'',glyph:'circle-plus'});
           clpBtn.backgroundColor = 'gray';
           clpBtn.marginLeft = '10px';
           clpBtn.callBack_onClick = function() { 
             var root = '/';
             if(this.mediaFiles.length>0) root = this.mediaFiles[0].path;
             new TFMediaCollector_fileManager( null , {root:root } , function(files){this.___addMediaFiles(files)}.bind(this)).run();
            }.bind(this);
      
      this.mediaListPanel = dialogs.addPanel( hlpContainer , 'cssContainerPanel', 1 , 2 , 1 , 1  ); 
      
      
      // wird kein mediaSet übergeben, dann wird ein neues angelegt 
      if(!this.mediaSet) this.mediaSet = { TYPE:'' , NAME:'' , KATEGORIE:'' , DESCRIPTION:'' };
      else
      {
        var response = utils.webApiRequest('LSTHUMBS' , {mediaSet:this.mediaSet.ID} );
        if(!response.error) { for(var i=0; i<response.result.length; i++) this.mediaFiles.push(response.result[i].file); }
      }
      //this.__updateThumbs();
      this.edit();
       
    }
    
    
    __updateThumbs()
    { 
        this.mediaListPanel.innerHTML = "";
        this.mediaListPanel.buildBlockLayout();

        var thumb = this.mediaSet.thumb || null;
            
        for(var i=0; i<this.mediaFiles.length; i++) 
        { 
          var f   = this.mediaFiles[i];
          if(f.ID==this.mediaSet.ID_thumb) thumb = f;
          
          var url = utils.buildURL('GETIMAGEFILE',{ fileName:utils.pathJoin(f.DIR , f.FILENAME) });

          var p= dialogs.addPanel(this.mediaListPanel , 'cssContainerPanel' , 1 , 1 , '97%' , '3em' ); 
              p.overflow = 'hidden';
              p.padding = '0px';
              p.backgroundColor = 'white';
              p.buildGridLayout_templateColumns('3.1em 1fr');
              p.buildGridLayout_templateRows   ('1fr 1fr');
            
            
           var t             = new TFImage(p ,1,1,1,2 , {dragable:true } );
               t.imgURL      = url;
               t.dataBinding = {mediaFile:f, imgURL:url, index:i};
               t.callBack_onDragStart = function (e)
                            { 
                              e.dataTransfer.setData('application/json', JSON.stringify({ID:this.ID,url:this.url}));
                            }.bind({ID:f.ID,url:url});
               
          var l   = dialogs.addLabel( p , '' , 2 , 1 , 1 , 1 , f.DIR );  
              l.color = 'gray';
              l.fontSize = '0.8em';

              l   = dialogs.addLabel( p , '' , 2 , 2 , 1 , 1 , f.FILENAME );         
              l.fontWeight = 'bold';
              l.fontSize = '0.8em';
              l.color = 'black';
        }

        if(thumb)
          { 
            url = utils.buildURL('GETIMAGEFILE',{ fileName:thumb.fullPath });
            this.thumbContainer.imgURL = url;          
          }
    }  
          
dropThumbImage(e,d)      
{ debugger;
   this.mediaSet.ID_THUMB = d.json.ID; 
   this.thumbContainer.imgURL = d.json.url;  
}
  
load(id) 
{
  return true;
}
  

save() 
{ 
    var response = {};
    if(!this.mediaSet.ID)
    {
      // neues Set anlegen
      response = utils.webApiRequest('CREATEMEDIASET' , this.mediaSet );
      if(response.error) { dialogs.showMessage(response.errMsg); return; }
      this.mediaSet.ID = response.result.lastInsertRowid;
    }
    else
    {
      // Set bearbeiten
      response = utils.webApiRequest('UPDATEMEDIASET' , this.mediaSet );
      if(response.error) { dialogs.showMessage(response.errMsg); return; }
    }
    
    // alle mediaFiles in der DB registrieren
    var f     = [];
    for(var i=0; i<this.newMediaFiles.length; i++) 
    f.push( utils.pathJoin(this.mediaFiles[i].path , this.mediaFiles[i].name) );

    if(f.length>0)
    utils.webApiRequest('REGISTERMEDIA_IN_SET' , {mediaFiles:f , mediaSet:this.mediaSet.ID} , 'POST');
}
   

edit()
{
  this.__updateThumbs();
  var mediaSetTypes      = [];
  var mediaSetCategories = [];

  var response = utils.fetchRecords("Select  distinct TYPE from mediasets order by TYPE");
  if(!response.error) for(var i=0; i<response.result.length; i++) mediaSetTypes.push(response.result[i].TYPE);

  response = utils.fetchRecords("Select  distinct KATEGORIE from mediasets order by KATEGORIE");
  if(!response.error) for(var i=0; i<response.result.length; i++) mediaSetCategories.push(response.result[i].KATEGORIE);

  //                   aParent             , aData         , aLabels , aAppendix , aExclude                        , aInpType , URLForm )
  var inp = new TForm( this.formPanel      , this.mediaSet , {}      , {}        , ['ID','ID_thumb','thumb']       , {}       , '' );    
      inp.setLabel('TYPE','Typ/Art');
      inp.setInputType('TYPE','lookup',{items:mediaSetTypes});
      inp.setLabel('NAME','Bezeichnung');
      inp.setLabel('KATEGORIE','Kategorie');
      inp.setInputType('KATEGORIE','lookup',{items:mediaSetCategories});
      inp.setLabel('DESCRIPTION','Beschreibung');
      
      inp.render( true);  
      
      inp.callBack_onOKBtn = function(values) { 
                                               for(var i=0; i<values.length; i++) 
                                               { this.mediaSet[values[i].field] = values[i].value }
                                               this.save();  
                                               this.wnd.close(); 
                                               if(this.callback_if_ready) this.callback_if_ready(this.mediaSet);
                                             }.bind( this )

      inp.callBack_onESCBtn = function(values) {
                                               this.wnd.close(); 
                                              }.bind( this )
        
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
      if(!found) { this.mediaFiles.push(f); this.newMediaFiles.push(f); }
    }
    this.__updateThumbs();
  }
  




}
