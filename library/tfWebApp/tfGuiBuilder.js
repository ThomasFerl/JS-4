import * as globals         from "./globals.js";
import * as utils           from "./utils.js";
import * as dialogs         from "./tfDialogs.js";
import { Screen       }     from "./tfObjects.js";
import { TFTreeNode   }     from "./tftreeView.js";
import { TFTreeView   }     from "./tftreeView.js";
import { THTMLTable   }     from "./tfgrid.js";


import * as builderLib      from "./tfGuiBuilderLib.js";


function run()
{
  var webApp = new tfWebApp(caption01,caption02);
  globals.initWebApp( webApp );
  
  globals.setSysMenu([
                     {text:"Benutzer"       ,callBack:sysAdmin.adminUser },
                     {text:"Berechtigungen" ,callBack:sysAdmin.adminGrants },
                     {text:"Info"           ,callBack:sysInfo},
                     {text:"schließen"      ,callBack:logout}
                    ]);
  console.log('Start Main() ...  webApp.activeWorkspace.caption ->' + webApp.activeWorkspace.objName);

  buildGUI(webApp);

}  

function createToolboxItem( label , type , left , top)
{
  var item = document.createElement('div');
      item.className = 'toolboxItem';
      item.textContent = label;
      item.type        = type;
      item.style.gridRowStart = top;
      item.style.gridColumnStart = left;
      menuPanel.DOMelement.appendChild(item);

      item.addEventListener('mousedown', (e) => { builderLib.addComponent( 1 , 1 , item.type.toUpperCase() ) } );
       
      return item;
}

function buildGUI( webApp )
{
  var layout = dialogs.setLayout(  webApp.activeWorkspace , {gridCount:10,right:2});
      dashBoard                               = layout.dashBoard;
      dashBoard.backgroundColor               = 'white';
      dashBoard.DOMelement.style.borderRadius = '0px';
      menuPanel                               = layout.right;
      menuPanel.padding                       = '2px';
      utils.buildGridLayout( menuPanel , '4x14' );

      mouseInfo = dialogs.addPanel( menuPanel , 'cssBlackPanel' , 1 , 1 , 4 , 1);
      mouseInfo.color = 'white';
     
      // Panel für Eingabe der Dimensionierung des Grids:
     var gridCtrlPanel = dialogs.addPanel( menuPanel , '' , 1 , 2 , 4 , 2);   
          gridCtrlPanel.backgroundColor                  = 'lightgray';
          gridCtrlPanel.margin                           = '0.5em';
          gridCtrlPanel.padding                          = '0;';
          gridCtrlPanel.DOMelement.style.overflow        = 'hidden';
          
          utils.buildGridLayout_templateColumns( gridCtrlPanel , '1fr 1fr 4em' );
          utils.buildGridLayout_templateRows   ( gridCtrlPanel , '1em 1fr 1em' );

     var p = dialogs.addRibbon(gridCtrlPanel , 1 , 'gray');
         p.padding = 0;
         p.margin = 0;
         p.overflow = 'hidden';
         dialogs.addLabel( p , '' , 1 , 1 ,'Gridlayout_definieren' ).color = 'white';

     var gridCtrlRows            = dialogs.addInputGrid( gridCtrlPanel    , 1 , 2 , 1  , 'row' , '' , gridLayout.numRows , {labelPosition:'LEFT'}) ;
         gridCtrlRows.marginLeft = '1em';
         gridCtrlRows.marginTop  = '1em';

     var gridCtrlCols            = dialogs.addInputGrid( gridCtrlPanel    , 2 , 2 , 1  , 'col' , '' , gridLayout.numCols , {labelPosition:'LEFT'} );
         gridCtrlCols.marginLeft = '1em';
         gridCtrlCols.marginTop  = '1em';
         
     var gridCtrlBtn        = dialogs. addButton   ( gridCtrlPanel ,'', 3 , 2 , 1 , 1 ,{caption:'',glyph:"fa-solid fa-check"} );
         gridCtrlBtn.margin = '0.5em';
         gridCtrlBtn.callBack_onClick = function() { builderLib.setGridLayout( this.numCols.value , this.numRows.value ) }.bind({numCols:gridCtrlCols , numRows:gridCtrlRows});
        
     var propertiesDiv = dialogs.addPanel( menuPanel , '' , 1 , 9 , 4 , 5);
         propertiesDiv.backgroundColor               = 'white';
         propertiesDiv.DOMelement.style.borderRadius = '0px';

     // Property-Editor vorbereiten ...    
     var b = dialogs.addButton( menuPanel , '' , 2 , 14 , 2 , 1 , {caption:'  anwenden' , glyph:"fa-solid fa-check"} );
         b.margin = '0.7em';
         propertyEditor = dialogs.newPropertyEditor(propertiesDiv , [] , b );

            // Builder-Library initialisieren.....
  builderLib.init( dashBoard , propertyEditor , mouseInfo , "21x21" );    

         
     // toolbox
      createToolboxItem( 'Div' , 'DIV' , 1,4)
      createToolboxItem( 'Edit' , 'INPUT' , 2,4)
      createToolboxItem( 'Combo' , 'COMBOBOX' , 3,4)
      createToolboxItem( 'Listbox' , 'LISTBOX' , 4,4)

      createToolboxItem( 'Button' , 'BTN' , 1,5)
      createToolboxItem( 'Button' , 'BTN' , 2,5)
      createToolboxItem( 'Button' , 'BTN' , 3,5)
      createToolboxItem( 'Button' , 'BTN' , 4,5)

      createToolboxItem('*' , '*' , 1,6)
      createToolboxItem('*' , '*' , 2,6)
      createToolboxItem('*' , '*' , 3,6)
      createToolboxItem('*' , '*' , 4,6)

      createToolboxItem('*' , '*' , 1,7)
      createToolboxItem('*' , '*' , 2,7)
      createToolboxItem('*' , '*' , 3,7)
      createToolboxItem('*' , '*' , 4,7)

    return 
}

   


