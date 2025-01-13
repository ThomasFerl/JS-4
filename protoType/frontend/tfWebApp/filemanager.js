import * as globals     from "./tfWebApp/globals.js";
import * as utils       from "./tfWebApp/utils.js";
import * as dialogs     from "./tfWebApp/tfDialogs.js";

import { TFTreeView }    from "./tfWebApp/tftreeView.js";
import { THTMLTable }    from "./tfWebApp/tfgrid.js";


export class TFClipperFileManager
{
  constructor( workSpace , rootDir  )
  {
    this.rootDir   = rootDir;
    this.workSpace = dialogs.addPanel(workSpace,'',1,1,"max-1","max-1");
    this.workSpace.backgroundColor = 'darkgray';
    this.workSpace.buildGridLayout('10x10');
   
     // Tree ....
     this.pathPanel        = dialogs.addPanel ( this.workSpace , '' , 1 , 1 , 2 , 10  );
     this.pathTree         = new TFTreeView   ( this.pathPanel.DOMelement , {width:'100%',height:'100%'} );
     this.pathTree.content = {path:rootDir};

     this.fileMenuPanel    = dialogs.addPanel ( this.workSpace , '' , 3 , 1 , 9 , 1 );

     this.filePanel        = dialogs.addPanel ( this.workSpace , 'fileManagerPanel' , 3 , 2 , 9 , 9 );
       
     this.onFileAction     = (path,fn,ext,allFilesInThisDir)=>{dialogs.showMessage('no fileAction assigned for '+path+fn+'.'+ext)};
     this.fileSelection    = '';
     this.files            = [];
  
     this.cb_openNewBrowserWnd = dialogs.addCheckBox( this.fileMenuPanel , '' , "Video/Bild in externem Browser betrachten ...")
  }

  scanDirectory( selectedNode , aPath )   
  {  
      // falls kein Parent (selectedNode) übergeben wird, ist TREEView selber der parent.
      // sämtliche addNode() landen somit in der rootList....
      if(!selectedNode) selectedNode = this.pathTree;
      
    var response = utils.webApiRequest('scanDir' , JSON.stringify({dirName:aPath}) );

    if(!response.error)
    {
      var pathEntryList = response.result;
      console.log("scanDirectory no Error " + JSON.stringify(pathEntryList));
      this.distributeDirs ( selectedNode , pathEntryList );
      this.distributeFiles( aPath        , pathEntryList);
    
      this.pathTree.buildNodeList();
    }  
  }
  
  addButton( css , btnText , callBackFunction )
  {
    var b = dialogs.addButton( this.fileMenuPanel ,css, 1 , 1 , 100 , 35 ,btnText);
        b.callBack_onClick = callBackFunction;
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
    this.files = [];

    for (var i=0; i<pathEntryList.length; i++) 
    {
      console.log(i+".) pathEntryList:" + pathEntryList[i].name+ " isFile ? : "+pathEntryList[i].isFile);
      if(pathEntryList[i].isFile) this.files.push({name:pathEntryList[i].name, ext:pathEntryList[i].ext, size:pathEntryList[i].size, path:dir})
    }
    
     
    if( this.files.length==0) this.files.push({name:'empty'});

    var self     = this;
    var grid = new THTMLTable(  this.files , [] );  // 2. Parameter = excludeFields
        grid.fieldByName('name').caption = 'Dateiname';
        grid.build(this.filePanel.DOMelement);
        grid.onRowClick = (row , i , jsn )=>{self.prepareFileAction( jsn.path,jsn.name,jsn.ext )};
  }
  
  
  
   prepareFileAction(path,fileName,ext )
    {
      if(ext=='.') ext=ext.slice(1);
      var f = utils.pathJoin( path , fileName , '' ); 
      this.fileSelection = f;
      
      var fs = [];  // alle Nachbarn für Weitergabe sammeln...
      for(var i=0;i<this.files.length;i++) fs.push({file:utils.pathJoin( this.files[i].path , this.files[i].name , '' ) , ext:this.files[i].ext})
      console.log('vor cbChecked .......');
      var cbChecked = this.cb_openNewBrowserWnd.checked();
      console.log('cbChecked ---> ' + cbChecked );
      this.onFileAction( f , fileName , ext ,  {  // params
                                                    script:'foo',
                                                    newWnd:cbChecked,
                                                    neighbors: fs
                                               });
    }
   
  
  run()
  {
    this.scanDirectory( null , this.rootDir );
  } 

 
  
}