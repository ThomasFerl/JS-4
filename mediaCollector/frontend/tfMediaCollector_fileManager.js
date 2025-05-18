import * as globals     from "./tfWebApp/globals.js";
import * as mcGlobals   from "./tfMediaCollector_globals.js";
import * as utils       from "./tfWebApp/utils.js";
import * as dialogs     from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 

import { TFTreeView }    from "./tfWebApp/tfTreeView.js";
import { THTMLTable }    from "./tfWebApp/tfGrid.js";

const validExtensions = mcGlobals.videoExtensions.concat(mcGlobals.imageExtensions);


export class TFMediaCollector_fileManager
{
  constructor( parent ,  params , callBack_if_ready )
  { 
    this.wnd = new TFWindow( null , params.caption || 'fileManager' , "77%" , "77%" , "CENTER" );
    
    this.workSpace         = this.wnd.hWnd; 
    this.rootDir           = params.root || '/';
    this.fileExt           = params.fileExt || validExtensions;
    this.mediaViewer       = null;
    this.mediaViewerClosed = true;
    this.fileGrid          = null;
    this.callBack_if_ready = callBack_if_ready;
    
    this.workSpace.backgroundColor = 'darkgray';
    this.workSpace.buildGridLayout('10x10');
   
     // Tree ....
     this.pathPanel        = dialogs.addPanel ( this.workSpace , '' , 1 , 1 , 2 , 10  );
     this.pathTree         = new TFTreeView   ( this.pathPanel.DOMelement , {width:'100%',height:'100%'} );
     this.pathTree.content = {path:this.rootDir};

     this.fileMenuPanel    = dialogs.addPanel ( this.workSpace , '' , 3 , 1 , 9 , 1 );
     utils.buildGridLayout_templateColumns    ( this.fileMenuPanel  , '1fr 1fr 1fr 1fr 1fr 1fr 1fr' );
     utils.buildGridLayout_templateRows       ( this.fileMenuPanel  , '1fr');
     this.fileMenuPanel.padding = '0px';

     this.filterFilename    = dialogs.addInput( this.fileMenuPanel , 1 , 1 , 'auto' , 'Filter' , '' , '' , {labelPosition:"TOP"} );
     
     var sortOrderItems = [ {caption:'Name',value:'name'},
                            {caption:'Datum',value:'date'},
                            {caption:'Größe',value:'size'},
                            {caption:'Endung',value:'ext'} ];
     this.sortOrderFilename = dialogs.addCombobox( this.fileMenuPanel , 2 , 1 , 'auto' , 'Sortierung' , '' , 'Name' , sortOrderItems , {labelPosition:"TOP"} );
     
     var b=dialogs.addButton( this.fileMenuPanel ,'', 3 , 1 , 1 , 1 ,'alles auswählen' );
         b.backgroundColor = 'gray';
         b.marginLeft = '10px';
         b.height = '2em';
         b.callBack_onClick = function(){if(this.fileGrid) this.fileGrid.selectAll()}.bind(this);


         b=dialogs.addButton( this.fileMenuPanel ,'', 4 , 1 , 1 , 1 ,'nichts auswählen' );
         b.backgroundColor = 'gray';
         b.marginLeft = '10px';
         b.height = '2em';
         b.callBack_onClick = function(){if(this.fileGrid) this.fileGrid.selectNothing()}.bind(this);
         
         b=dialogs.addButton( this.fileMenuPanel ,'', 5 , 1 , 1 , 1 ,'Auswahl umkehren' );
         b.backgroundColor = 'gray';
         b.marginLeft = '10px';
         b.height = '2em';
         b.callBack_onClick = function(){if(this.fileGrid) this.fileGrid.selectReverse()}.bind(this);

         b=dialogs.addButton( this.fileMenuPanel ,'cssAbortBtn01', 6 , 1 , 1 , 1 ,'schließen' );
         b.marginLeft = '10px';
         b.callBack_onClick = function(){this.wnd.close()}.bind(this);

         b=dialogs.addButton( this.fileMenuPanel ,'', 7 , 1 , 1 , 1 ,'hinzufügen' );
         b.marginLeft = '10px';
         b.marginRight = '4px';
         b.callBack_onClick = function(){if(this.callBack_if_ready) this.callBack_if_ready(this.getSelectedFiles())}.bind(this);


     this.filePanel        = dialogs.addPanel ( this.workSpace , 'cssContainerPanel' , 3 , 2 , 9 , 9 );
       
     this.onFileAction     = null;
     this.fileSelection    = '';
     this.files            = [];
     this.fileGrid         = null;
  }

  scanDirectory( selectedNode , aPath )   
  {  
      // falls kein Parent (selectedNode) übergeben wird, ist TREEView selber der parent.
      // sämtliche addNode() landen somit in der rootList....
      if(!selectedNode) selectedNode = this.pathTree;
      
    var response = utils.webApiRequest('scanDir', {dir:aPath , fileExt:'*.*'} );

    if(!response.error)
    {
      var pathEntryList = response.result;
      console.log("scanDirectory no Error " + JSON.stringify(pathEntryList));
      this.distributeDirs ( selectedNode , pathEntryList );
      this.distributeFiles( aPath        , pathEntryList);
    
      this.pathTree.buildNodeList();
    }  
  }
  
  distributeDirs( selectedNode , pathEntryList )
  {
    console.log('distributeDirs() -> START: ' + selectedNode.constructor.name )
    
    var xPathFound = false;

    for (var i=0; i<pathEntryList.length; i++)
    {
        console.log("pathEntry: " + pathEntryList[i].name );
       
        var fn     = pathEntryList[i].name;
        var isDir  = pathEntryList[i].isDir;

        if( isDir && (fn[0]!='.')) 
        {
         // zuerst prüfen, ob dieses Verzeichns bereits im Baum ist ...
         xPathFound     = false;
         var xPath      = utils.pathJoin( selectedNode.content.path , pathEntryList[i].name , '');
         for(var j=0; j<selectedNode.items.length; j++) xPathFound = xPathFound || (selectedNode.items[j].content.path == xPath);
                  
         if(!xPathFound)
         {  
          console.log('add Node : ' + xPath );     
          var n = selectedNode.addNode( fn , {path:xPath, entry:pathEntryList[i] } );
              n.callBack_onClick = function(_selectedNode) { this.scanDirectory( _selectedNode ,  _selectedNode.content.path ); }.bind(this);
        }
      }    
    }
  }
  

   distributeFiles( dir ,  pathEntryList )
   { 
    this.files    = [];
    this.fileGrid = null;
    this.filePanel.innerHTML = '';

    for (var i=0; i<pathEntryList.length; i++) 
    if(pathEntryList[i].isFile)
     {  
      var f=pathEntryList[i];
      if(f.name.startsWith('.')) continue;
      if(mcGlobals.isValidVideoExtension(f.name ) || mcGlobals.isValidImageExtension(f.name))
         this.files.push({name:pathEntryList[i].name, ext:pathEntryList[i].ext, size:pathEntryList[i].size, path:dir})
     }  
         
    if( this.files.length==0) this.filePanel.innerHTML = '<h3><center>no media content found</h3>';
    else {
          this.fileGrid = dialogs.createTable( this.filePanel , this.files , '' , ''); 
          this.fileGrid.fieldByName('name').caption = 'Dateiname';
          this.fileGrid.onRowClick = function(row , i , jsn ){this.prepareFileAction( jsn.path,jsn.name,jsn.ext )}.bind(this);
        } 

    }           
  
  

    
    viewMedia(fn , ext)
    {
        if(this.mediaViewer==null  || this.mediaViewerClosed)
         {
            this.mediaViewer = new TFWindow( null , fn , '44%' , '44%' , 'CENTER' );
            this.mediaViewerClosed = false;
            this.mediaViewer.callBack_onClose = function(){this.mediaViewerClosed = true}.bind(this);
         }
        else this.mediaViewer.innerHTML = '';     
      
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
  
  


   prepareFileAction(path,fileName,ext )
    { 
      if(ext=='.') ext=ext.slice(1);
      var f = utils.pathJoin( path , fileName , '' ); 
      this.fileSelection = f;

      if(this.fileSelection) this.viewMedia(f , ext);

      if(this.onFileAction) this.onFileAction( f , fileName , ext  );
    }
   
  
    getSelectedFiles() 
    { 
      console.log('getSelectedFiles()');
      var selRows = this.fileGrid.getSelectedRows();
      var result  = [];
    
      for (var i = 0; i < selRows.length; i++) {
        result.push(selRows[i]); // selRows[i] enthält bereits das JSON-Objekt
      }
    
      return result;
    }


  run()
  {
    this.scanDirectory( null , this.rootDir );
  } 

 
  
}