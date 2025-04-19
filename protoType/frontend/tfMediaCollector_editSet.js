
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
  { debugger;
      this.mediaFiles        = [];
      this.newMediaFiles     = [];
      this.mediaSet          = mediaSet || null;
      this.callback_if_ready = null;

      var caption = this.mediaSet?.ID ? 'Set bearbeiten' : 'neues Set anlegen';
      var w       =    dialogs.createWindow( null,caption,"50%","50%","CENTER");  
      this.wnd    =    w.hWnd;
      
      w.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr');
      w.buildGridLayout_templateRows   ('1fr 1fr 1fr 1fr');
      
      this.formPanel = dialogs.addPanel(this.wnd,'',1,1,2,4); 
     
      var hlpContainer  = new TFPanel( this.wnd  , 3 , 1 , 2 , 4  ); 
          hlpContainer.buildGridLayout_templateColumns('1fr');
          hlpContainer.buildGridLayout_templateRows   ('2em 1fr');
      
      var  c = dialogs.addPanel(hlpContainer,'cssRibbon',1,1,1,1);
           c.backgroundColor = 'darkgray';
      
      var  clpBtn = dialogs.addButton(c,'',1,1,'3em','1.5em','add');
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

      this.edit();
       
    }
    
    
    __updateThumbs()
    {
        this.mediaListPanel.innerHTML = "";
        this.mediaListPanel.buildBlockLayout();
            
        for(var i=0; i<this.mediaFiles.length; i++) 
        { 
          var f   = this.mediaFiles[i];
          var url = utils.buildURL('GETIMAGEFILE',{fileName:f.path + f.name });

          var p= dialogs.addPanel(this.mediaListPanel , '' , 1 , 1 , '97%' , '97%' ); 
              p.buildGridLayout_templateColumns('4em 1fr');
              p.buildGridLayout_templateRows   ('1fr 1fr');
            
          var t   = dialogs.addImage( p , "" , 0 , 0 , "100%" , "100%" );
              t.imgURL = imgs[i];
              t.dataBinding = {imgURL:url, index:i};
        }
    }  
          
      
  
load(id) 
{
  return true;
}
  

save() 
{ 
    var response = {};
    
    if(this.mediaSet.ID==0)
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

    utils.webApiRequest('REGISTERMEDIA_IN_SET' , {mediaFiles:f , mediaSet:this.mediaSet.ID} , 'POST');
}
   

edit()
{
  this.__updateThumbs();

  // aParent      , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( this.formPanel      , this.mediaSet , {}      , {}        , ['ID']       , {}       , '' );    
      inp.setLabel('TYPE','Typ/Art');
      inp.setLabel('NAME','Bezeichnung');
      inp.setLabel('KATEGORIE','Kategorie');
      inp.setLabel('DESCRIPTION','Beschreibung');
      
      inp.render( true);  
      
      inp.callBack_onOKBtn = function(values) {
                                               for(var i=0; i<values.length; i++) 
                                               { this.self.mediaSet[values[i].field] = values[i].value }
                                               this.self.save();  
                                               this.self.wnd.close(); 
                                               if(this.callback) this.callback(this.self.mediaSet);
                                             }.bind( {self:this, callback:this.callback_if_ready} )

      inp.callBack_onESCBtn = function(values) {
                                               this.wnd.close(); 
                                              }.bind( this )
}


dropImage( e , data )  // onDrop ( event , data )
{ 
  if (data.localFile) 
    {/*
     const f = (globals.session.userName || 'developer') + '_' + utils.buildRandomID();
     utils.uploadFileToServer(data.localFile, f, 
           function(result)
           { 
             this.self.PORTRAIT=result.result.savedName; ; 
             this.self.portraitPanel.imgURL=this.self.portraitURL() 
            }.bind({self:this,destDir:this.#destDir}) , {destDir:this.#destDir} );
    */}

 
    if (data.json) 
    {
      debugger
      
    }
      

    if (data.url) {
                   alert("Web-Image gedroppt:"+ data.url);
                  }
      
    if (data.plainText) {
                          alert("Plain Text:"+ data.plainText);
                        }

   this.__updateThumbs();                      
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
