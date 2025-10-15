import * as globals         from "./globals.js";
import * as utils           from "./utils.js";
import * as dialogs         from "./tfDialogs.js";
import * as objects         from "./tfObjects.js";
import {TFgui}              from "./tfGUI.js";

import {TFTreeView,
        TFTreeNode }        from "./tfTreeView.js";

import {TFAnalogClock,
        TFListCheckbox,
        TFComboBox,
        TFSelectBox,
        TFSlider
 }     from "./tfObjects.js";

const placeHolderImageURL = '/tfWebApp/res/placeHolder.jpg'; // URL für Platzhalter-Bild







export class TFGuiBuilder
{
  constructor()
  { 
    this.hasChanged                              = false;
    this.lastFormName                            = '';
    this.builderObjects                          = [];
    this.selected                                = { element: null, outline: '', outlineOffset: '' };
    this.propertyEditor                          = null;	
    this.dashBoard                               = null;
    this.menuPanel                               = null;
    this.treeViewVisible                         = false;
    this.treeView                                = null;

    var w = dialogs.createWindow(null, 'tfGuiBuilder', '100%', '100%', 'CENTER').hWnd;

    var layout = dialogs.setLayout(  w , {gridCount:10,right:2});
    
    var dashBoardContainer                       = layout.dashBoard;
        dashBoardContainer.overflow              = 'hidden';
        dashBoardContainer.className             = 'ccContainerPanel';
        dashBoardContainer.padding               = '0px';
        dashBoardContainer.margin                = '0px';
        dashBoardContainer.backgroundColor       = 'darkgray';
        dashBoardContainer.buildFlexBoxLayout();
        dashBoardContainer.justifyContent        = 'center';
        dashBoardContainer.alignItems            = 'center';

    this.dashBoard                               = dialogs.addPanel(dashBoardContainer , '' , 0 , 0 , '100%' , '100%' , {dropTarget:true} );
    this.dashBoard.name                          = 'dashBoard';
    this.dashBoard.overflow                      = 'hidden';
    this.dashBoard.backgroundColor               = 'white';
    this.dashBoard.margin                        = '0px';
    this.dashBoard.padding                       = '0px';
    this.dashBoard.DOMelement.style.borderRadius = '2px';
    this.dashBoard.callBack_onDragOver           = function(e){  this.onDragover(e) }.bind(this);
    this.dashBoard.callBack_onDrop               = function(e , dropResult){ this.onDrop(e , dropResult) }.bind(this);
    this.dashBoard.callBack_onClick              = function(e){this.selectComponent(this.dashBoard)}.bind(this);
    this.dashBoard.callBack_onKeyDown            = function(event) {this.keyHandler(event)}.bind(this);
   
    this.menuPanel                               = layout.right;
    this.menuPanel.padding                       = '2px';
    this.menuPanel.buildGridLayout( '4x17' );

    var fileOps                   = dialogs.addPanel(this.menuPanel , 'cssContainerPanel',1,1,4,2,{backgroundColor:"rgba(0,0,0,0.14"})     
        fileOps.buildGridLayout( '7x2' );

    this.formNameInp              = new TFComboBox( fileOps,1,1,7,1, { items: utils.lsForms() }) ;


//-----------------------------------------------------------------------------------------------------------


 var newBtn                        = dialogs.addButton(fileOps , '' , 1 , 2 , 1 , 1 , {glyph:"file-circle-plus",caption:""});
     newBtn.height                 = '2em';
     newBtn.marginTop              = '0.5em';
     newBtn.DOMelement.setAttribute("title", 'neues Formular');
     newBtn.callBack_onClick       = function()
                                     { 
                                       this.newProject(); 
                                       this.abortBtn.visible = false;
                                     }.bind(this);

var saveBtn                        = dialogs.addButton(fileOps , '' , 2 , 2 , 1 , 1 , {glyph:"download",caption:""});
    saveBtn.height                 = '2em';
    saveBtn.marginTop              = '0.5em';
    saveBtn.DOMelement.setAttribute("title", 'Formular speichern')
    saveBtn.callBack_onClick       = function()
                                     { 
                                       this.save(); 
                                       this.abortBtn.visible = false;
                                     }.bind(this);

var loadBtn                        = dialogs.addButton(fileOps , '' , 3 , 2 , 1 , 1 , {glyph:"upload",caption:""});
    loadBtn.height                 = '2em';
    loadBtn.marginTop              = '0.5em';
    loadBtn.DOMelement.setAttribute("title", 'Formular laden');
    loadBtn.callBack_onClick       = function()
                                     { 
                                       this.load(); 
                                       this.abortBtn.visible = false;
                                     }.bind(this);


var loadBtn                        = dialogs.addButton(fileOps , '' , 4 , 2 , 1 , 1 , {glyph:"diagram-next",caption:""});
    loadBtn.height                 = '2em';
    loadBtn.marginTop              = '0.5em';
    loadBtn.DOMelement.setAttribute("title", 'Formular als PlugIn laden');
    loadBtn.callBack_onClick       = function()
                                     { 
                                       this.loadPlugin(); 
                                       this.abortBtn.visible = false;
                                     }.bind(this);                                     


 var testBtn                       = dialogs.addButton(fileOps , '' , 5 , 2 , 1 , 1 , {glyph:"desktop",caption:""});
     testBtn.height                = '2em';
     testBtn.marginTop             = '0.5em';
     testBtn.backgroundColor       = 'gray';
     testBtn.DOMelement.setAttribute("title", 'Formular testen')
     testBtn.callBack_onClick      = function()
                                     { 
                                       this.test(); 
                                     }.bind(this);


 this.abortBtn                      = dialogs.addButton(fileOps , '' , 6 , 2 , 1 , 1 , {glyph:"trash-can",caption:""});
 this.abortBtn.height                = '2em';
 this.abortBtn.marginTop             = '0.5em';
 this.abortBtn.backgroundColor       = 'red';
 this.abortBtn.DOMelement.setAttribute("title", 'Änderungen verwerfen ...');
 this.abortBtn.visible               = false;
 this.abortBtn.callBack_onClick      = function()
                                     { 
                                       this.abortBtn.visible = false;
                                       this.hasChanged = false;
                                     }.bind(this);

 this.saveToClipBoard_Btn                       = dialogs.addButton(fileOps , '' , 7 , 2 , 1 , 1 , {glyph:"vector-square",caption:""});
 this.saveToClipBoard_Btn.height                = '2em';
 this.saveToClipBoard_Btn.marginTop             = '0.5em';
 this.saveToClipBoard_Btn.backgroundColor       = 'orange';
 this.saveToClipBoard_Btn.DOMelement.setAttribute("title", 'Formular in Zwischenablage kopieren');
 this.saveToClipBoard_Btn.callBack_onClick      = function()
                                     { 
                                       var form = this.dashBoard.getConstructionProperties() || {empty:true};
                                       utils.copyObjToClipboard( form , this.formNameInp.value);
                                       dialogs.showMessage('Formular in die Zwischenablage kopiert!');
                                     }.bind(this);


//-----------------------------------------------------------------------------------------------------------                                        
     var propToollDiv = dialogs.addPanel( this.menuPanel , 'cssContainerPanel' , 1 , 8 , 4 , 2);                                    
         propToollDiv.buildGridLayout_templateRows( '1fr 1fr 1fr' );
         propToollDiv.buildGridLayout_templateColumns( '1fr 4em' );
         propToollDiv.backgroundColor = 'rgba(2, 31, 85, 0.14)';
         propToollDiv.overflow        = 'hidden';    
         propToollDiv.margin          = 0;
         propToollDiv.padding         = 0;
         
       //  propToollDiv.paddingLeft = '0.5em';
       //  propToollDiv.paddingRight = '0.5em';
         
     this.propLevelSelector = dialogs.addSelectBox(propToollDiv , 1 , 2 , 'auto' , 'Anzeigelevel:' , '' , {caption:'essential',value:1} , [{caption:'essential',value:1},{caption:'useful',value:2},{caption:'all',value:3}] );    
     this.propLevelSelector.callBack_onChange = function(v)
                                            { 
                                              if(this.propertyEditor)
                                              this.propertyEditor.level = v;
                                            }.bind(this);

    
    
    // saveButton für Property-Editor - Events werden im Property-Editor ausgewertet 
     var b = dialogs.addButton( propToollDiv , '' , 2 , 1 , 1 , 1 ,  {glyph:"check"} );
         b.height = '2em';
         b.margin = '2px'
         b.DOMelement.setAttribute("title", 'Änderungen anwenden');

    var treeBtn = dialogs.addButton( propToollDiv , '' , 2 , 2 , 1 , 1 , {glyph:"folder-tree"} );
         treeBtn.height = '2em';
         treeBtn.margin = '2px';
         treeBtn.backgroundColor = 'gray';
         treeBtn.DOMelement.setAttribute("title", 'Formular in hirarchischer Ansicht');
         treeBtn.callBack_onClick = function() { this.handleTreeView() }.bind(this);       

    var duplicateBtn = dialogs.addButton( propToollDiv , '' , 2 , 3 , 1 , 1 , {glyph:"paste"} );
         duplicateBtn.height = '2em';
         duplicateBtn.margin = '2px';
         duplicateBtn.backgroundColor = 'green';
         duplicateBtn.DOMelement.setAttribute("title", 'Element duplizieren');
         duplicateBtn.callBack_onClick = function() { this.handleDuplicate() }.bind(this);            
         
  
    this.propCaption = dialogs.addPanel(propToollDiv , 'cssContainerPanel' , 1 , 1 , 1 , 1 );
    this.propCaption.backgroundColor = 'rgba(0,0,0,0.77)';
    this.propCaption.height          = '2em';
    this.propCaption.color           = 'white';

     var propertiesDiv = dialogs.addPanel( this.menuPanel , '' , 1 , 10 , 4 , 8);
         propertiesDiv.backgroundColor               = 'white';
         propertiesDiv.DOMelement.style.borderRadius = '0px';
    
    this.propertyEditor = dialogs.newPropertyEditor(propertiesDiv , [] , b );
    this.propertyEditor.callBack_onSave   = function(p){ this.saveProperties(p) ; this.showGridLines( this.selected.element ); this.hasChanged = true; this.abortBtn.visible = true; }.bind(this); 
    this.propertyEditor.callBack_onDialog = function(item){ this.propertyEditorDialog(item)}.bind(this);
   

    
//-----------------------------------------------------------------------------------------------------------
// Panel für Eingabe der Dimensionierung des Grids:

var gridCtrlPanel = dialogs.addPanel(  this.menuPanel , 'cssContainerPanel' , 1 , 7 , 4 , 1);   
          gridCtrlPanel.backgroundColor                  = 'lightgray';
          gridCtrlPanel.margin                           = 0;
          gridCtrlPanel.padding                          = 0;
          gridCtrlPanel.DOMelement.style.overflow        = 'hidden';
          
          gridCtrlPanel.buildGridLayout_templateColumns(  '1fr 1fr 4em' );
          gridCtrlPanel.buildGridLayout_templateRows   (  '1em 1fr' );

     var p = dialogs.addPanel(gridCtrlPanel , 'cssContainerPanel' , 1 , 1 , 3 , 1 );
         p.backgroundColor = 'rgba(0,0,0,0.47)';
         p.padding = 0;
         p.margin = 0;
         p.marginBottom = '1px';
         p.overflow = 'hidden';

     var h=dialogs.addLabel( p , '' , 1 , 1 , '100%','1em','Gridlayout definieren' );
         h.backgroundColor = 'rgba(0,0,0,0.77)';
         h.color = 'white';
         h.fontSize = '0.77em';

     this.gridCtrlRows       = dialogs.addInput ( gridCtrlPanel    , 1 , 2 , 4  , 'row' , '' , '-' , {margin:0}) ;
     this.gridCtrlCols       = dialogs.addInput ( gridCtrlPanel    , 2 , 2 , 4  , 'col' , '' , '-' , {margin:0} );

     var gridCtrlBtn             = dialogs.addButton( gridCtrlPanel ,'', 3 , 2 , 1 , 1 ,  {glyph:"check",caption:""});
         gridCtrlBtn.height      = '2em';
         gridCtrlBtn.width       = '3.7em';

         //gridCtrlBtn.marginLeft  = '7px';
         //gridCtrlBtn.marginRight = '7px';
         //gridCtrlBtn.marginTop='7px';

         gridCtrlBtn.backgroundColor = 'gray';
         gridCtrlBtn.DOMelement.setAttribute("title", 'GRID anwenden');
         gridCtrlBtn.callBack_onClick = function() 
                                        { 
                                          this.setGridLayout( this.gridCtrlCols.value , this.gridCtrlRows.value ) 
                                        }.bind(this);

//-----------------------------------------------------------------------------------------------------------

     // toolbox
    this.toolbox = dialogs.addPanel(this.menuPanel, 'cssContainerPanel', 1, 3, 4, 4 );
    this.toolbox.backgroundColor = 'rgba(0,0,0,0.47)';
    this.toolbox.color = 'white';
    this.toolbox.buildFlexBoxLayout();

      this.___createToolboxItem( 'stop'             , 'DIV'     , 1,4)
      this.___createToolboxItem( 'square-check'     , 'BTN'     , 2,4)
      this.___createToolboxItem( 'font'             , 'LABEL'   , 3,4)
      this.___createToolboxItem( 'clock'            , 'CLOCK'   , 4,4)
      this.___createToolboxItem( 'pen-clip'         , 'INPUT'         , 1,5)
      this.___createToolboxItem( 'calendar-days'    , 'INPUT_DATETIME', 2,5)
      this.___createToolboxItem( 'calendar-days'    , 'INPUT_DATE'    , 3,5)
      this.___createToolboxItem( 'calendar-days'    , 'INPUT_TIME'    , 4,5)


      this.___createToolboxItem( 'indent'           , 'COMBOBOX', 1,6)
      this.___createToolboxItem( 'indent'           , 'SELECT'  , 2,6)
      this.___createToolboxItem( 'list'             , 'LISTBOX' , 3,6)
      
      this.___createToolboxItem( 'square-check'     , 'CHECKBOX', 4,6)

      this.___createToolboxItem('check-double'      , 'CHECKLISTBOX' , 1,7)
      this.___createToolboxItem('image'             , 'IMAGE'  , 2,7)
      this.___createToolboxItem('sliders'           , 'SLIDER' , 3,7)
      //this.___createToolboxItem('*'                 , '*'      , 4,7)
      
      this.setGridLayout( 21 , 21 );

      // globalen KeyHandler einhängen ....
      
      window.addEventListener('keydown', function(event) 
                                        {
                                          // Prüfe, ob das Ziel ein Eingabefeld ist
                                          const isInput = (
                                                              event.target.tagName === 'INPUT' ||
                                                              event.target.tagName === 'TEXTAREA' ||
                                                              event.target.isContentEditable
                                                          );

                                          if (isInput) return; // Eingabe aktiv – keyboardEvent ignorieren   
    
                                        console.log('window.eventListener -> Taste gedrückt:', event.key);
                                        if (event.ctrlKey || event.metaKey) this.keyHandler(event)
                                        else
                                              switch (event.key.toLowerCase()) 
                                              {
                                               case 'delete': this.keyHandler(event)
                                               break;

                                               case 'escape': this.keyHandler(event)
                                               break;  

                                               case 'tab':  this.keyHandler(event)
                                               break; 
        
                                               case 'backspace': this.keyHandler(event)
                                               break;  
                                             }   
                                        }.bind(this) , true); // ← wichtig: useCapture = true
}






keyHandler( event )
{//kleiner privater key-Handler ;-)
  if (event.ctrlKey || event.metaKey) 
     {
      switch (event.key.toLowerCase()) 
      {
         case 'c':
         console.log('CTRL+C erkannt');
        break;
      
         case 'd':
         console.log('CTRL+D erkannt');
        break;

        case 'v':
        console.log('CTRL+V erkannt');
       break;
     }
  }
  else
      switch (event.key.toLowerCase()) 
      {
         case 'delete':
         console.log('DELETE erkannt');
         this.deleteSeletedObject()
        break;

         case 'escape':
         console.log('ESCAPE erkannt');
         
        break;  

        case 'tab':
         console.log('TAB erkannt');
         this.___selectNextElement();
         
        break; 
        
        case 'backspace':
         console.log('BACKSPACE erkannt');
          this.deleteSeletedObject()
        break;  
      }  

}



setGridLayout( numCols , numRows )
{
  var dest = this.selected.element || this.dashBoard;
  
  dest.buildGridLayout( `${numCols}x${numRows}` , {stretch:true});

  this.showGridLines( dest );
}


addComponent( parent , left , top , elementName ) 
{ 
  if (utils.isHTMLElement(parent)) parent = parent.data || null; 

  if (parent == null) parent = this.dashBoard; // wenn kein Parent angegeben, dann auf dem Dashboard
      
      var e = null;

    if(elementName == 'BTN')           e = dialogs.addButton        ( parent , '' , left , top , 1 , 1 , {caption:'Button'} , {dragable:true} );
    if(elementName == 'DIV')           e = dialogs.addPanel         ( parent , '' , left , top , 1 , 1 , {dragable:true});
    if(elementName == 'INPUT')         e = dialogs.addInput         ( parent , left , top ,'auto', 'Eingabe'   , '' , ''    , {dragable:true});
    if(elementName == 'INPUT_DATETIME')e = dialogs.addDateTimePicker( parent , left , top ,'Datum/Urhrzeit' , Date.now() , {dragable:true});
    if(elementName == 'INPUT_DATE')    e = dialogs.addDatePicker    ( parent , left , top ,'Datum'          , Date.now() , {dragable:true});
    if(elementName == 'INPUT_TIME')    e = dialogs.addTimePicker    ( parent , left , top ,'Uhrzeit'        , Date.now() , {dragable:true});
    if(elementName == 'COMBOBOX')      e = dialogs.addCombobox      ( parent , left , top , 'auto' , 'Combobox' , '' , '', ['Option1','Option2','Option3'] , {dragable:true}); 
    if(elementName == 'SELECT')        e = dialogs.addSelectBox     ( parent , left , top , 'auto' , 'SelectBox' , '' , '', {dragable:true,lookUp:true,items:['Option1','Option2','Option3']}); 
    if(elementName == 'LISTBOX')       e = dialogs.addListBox       ( parent , left , top , 1 , 1 , [{caption:'Option1',value:1},{caption:'Option2',value:2},{caption:'Option3',value:3}] , {dragable:true}); 
    if(elementName == 'CHECKBOX')      e = dialogs.addCheckBox      ( parent , left , top , 'CheckBox' , true , {dragable:true} )

    if(elementName == 'CHECKLISTBOX')  e = new TFListCheckbox       ( parent , left , top , 1 , 1 , {dragable:true, items:[{caption:'Option1',value:1},{caption:'Option2',value:2},{caption:'Option3',value:3}]} );
  
    if(elementName == 'LABEL')         e = dialogs.addLabel         ( parent , '' , left , top , 1 , 1 , 'Label' , {dragable:true});
    if(elementName == 'CLOCK')         e = new TFAnalogClock        ( parent      , left , top , 1 , 1 , {dragable:true} );
    if(elementName == 'IMAGE')         e = dialogs.addImage         ( parent      , left , top , 1 , 1 , placeHolderImageURL , {dragable:true} );
    if(elementName == 'SLIDER')        e = new TFSlider             ( parent      , left , top , 1 , 1 , {dragable:true} );



    // anklick- und ziehbar machen...
    if (e != null)
    {
       if(elementName == 'DIV')  
       {  
         e.buildGridLayout_templateColumns( '1fr' );
         e.buildGridLayout_templateRows   ( '1fr' );
         e.overflow = 'hidden';
       }  

      this.builderObjects.push(e);

      e.draggingData         = { id:e.ID };
      e.dataBinding          = e.draggingData;
      e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
      e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
      e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
      e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);
      e.callBack_onKeyDown   = function(event) { this.keyHandler(event)}.bind(this);
   }   

  this.updateTreeView();
  this.selectComponent(e); // das neu erzeugte Element gleich selektieren
  this.hasChanged = true;
  this.abortBtn.visible = true;

}



___deepRename( obj )
{
  const renameObj=function(obj)
  {
    let newName = obj['name'];
     //enthält der name bereits ein "copy1" dann "copy2" erzeugen...

        const copyNumber = (newName.match(/copy(\d+)$/) || [])[1] || 0;
        const newCopyNumber = parseInt(copyNumber, 10) + 1;

        if(newCopyNumber==1) obj['name'] = newName + '_copy1';
        else                 obj['name'] = newName.replace(/copy\d*$/, `copy${newCopyNumber}`);
      
        if(obj.children.length>0)
        for(let i=0; i<obj.children.length; i++)  renameObj(obj.children[i]);
  }

  renameObj(obj);

}


handleDuplicate()
{ 
  if(!this.selected.element) return;

  // Bauplan vom selektierten Element besorgen ...
  var layout = this.selected.element.getConstructionProperties()  

  var copy = JSON.parse(JSON.stringify(layout));

  console.log('Duplizieren dieses Knoten ...');
  console.log('-----------------------------');
  console.log(JSON.stringify(copy));

  // alle Namen im Objekt umbenennen ...
  this.___deepRename(layout);

  // nun das duplizierte Objekt einfügen ...
  objects.addComponent( this.dashBoard , layout , function(e){ // CallBack on Ready
                                                               // anklick- und ziehbar machen...
                                                                this.builderObjects.push(e);
                                                                e.setDragable();
                                                                e.draggingData         = { id:e.ID };
                                                                e.dataBinding          = e.draggingData;
                                                                e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
                                                                e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
                                                                e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
                                                                e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);
                                                                e.callBack_onKeyDown   = function(event) { this.keyHandler(event)}.bind(this);
                                                            }.bind(this) );
  this.updateTreeView();
  this.hasChanged = true;
  this.abortBtn.visible = true
}                                                             


newProject()
{
  if(this.hasChanged)
  {
    dialogs.showMessage("Das aktuwelle Formular besitzt noch ungespeicherte Änderungen. Bitte speichern Sie diese zuvor !" );
    return;
  } 

 this.lastFormName        = '';
 this.hasChanged          = false;
 this.builderObjects      = []; 
 this.dashBoard.innerHTML = '';
 this.selected            = null;
 this.showGridLines(this.dashBoard);
}


___saveForm()
{
  this.hasChanged   = false;
  this.lastFormName = this.formNameInp.value;
  this.selectComponent(null);
  var form = this.dashBoard.getConstructionProperties();
  utils.saveForm(this.formNameInp.value , form );
  this.formNameInp.items = utils.lsForms() ;
}

save()
{ 
  if(!this.hasChanged) return;
  
  if(this.formNameInp.value=="")
  {
    dialogs.showMessage('Bitte zuvor einen EINDEUTIGEN Namen eingeben, unter dem das Formular zukünftig referenziert werden soll !');
    return;
  }

  if(this.formNameInp.value==this.lastFormName)
  {
    dialogs.ask('nachgefragt...','Soll das existierende Formular überschrieben bzw. aktualisiert werden ?' ,
                // YES:
                function() { this.___saveForm() }.bind(this) )
  }            
  else {  this.___saveForm() };

  return;
} 


load()
{ 
  if(this.formNameInp.value=="")
  {
    dialogs.showMessage('Bitte zuvor den Namen des Formulars eingeben !');
    return;
  }

 if(this.hasChanged)
 {
    dialogs.showMessage("Das aktuwelle Formular besitzt noch ungespeicherte Änderungen. Bitte speichern Sie diese bevor Sie ein neues Formular laden !" );
    return;
  } 
 
  var formData = utils.loadForm(this.formNameInp.value);
  this.lastFormName        = this.formNameInp.value;
  this.hasChanged          = false;  
  this.dashBoard.innerHTML = '';
  this.builderObjects      = [];

  this.dashBoard.backgroundColor = formData.backgroundColor;
  this.dashBoard.buildGridLayout( formData.gridLayout );
  this.showGridLines(this.dashBoard);

  for(var i=0; i<formData.children.length; i++)
  {
    var c = formData.children[i];
    objects.addComponent( this.dashBoard , c , function(e){   // CallBack on Ready
                                                         console.log('callback: '+ e.objName);
                                                         this.builderObjects.push(e);
                                                         e.setDragable();
                                                         e.draggingData         = { id:e.ID };
                                                         e.dataBinding          = e.draggingData;
                                                         e.callBack_onDragStart = function(event) { this.onDragstart(event , event.target ) }.bind(this);
                                                         e.callBack_onDragOver  = function(event) { this.onDragover(event) }.bind(this);
                                                         e.callBack_onDrop      = function(event , dropResult) { this.onDrop(event , dropResult) }.bind(this);
                                                         e.callBack_onClick     = function(event , dataBinding) {this.onMouseClick(event , dataBinding.id ) }.bind(this);
                                                         e.callBack_onKeyDown   = function(event) {this.keyHandler(event)}.bind(this);
                                                     }.bind(this) )
 }  



} 



loadPlugin()
{
 if(this.formNameInp.value=="")
  {
    dialogs.showMessage('Bitte zuvor den Namen des einzufügenden PlugIns eingeben !');
    return;
  }
 
  var formData = utils.loadForm(this.formNameInp.value);

  


} 

test()
{ 
  // das dashBoard ist das einzige zentrale parent-Element
  // durch das Sektieren, werdeen alle Elemente "deselektiert" und die (rote) Markierung deaktiviert ..."
  this.selectComponent(this.dashBoard);

  var board = this.dashBoard.getConstructionProperties();
  var gui = new TFgui( null , board , { autoSizeWindow: true });

} 

 handleTreeView()
 {  
   if(this.treeViewVisible) return;
   
   this.treeView = dialogs.createWindow(null, 'tfGuiBuilderTreeView', '25%', '90%', 'CENTER');
   this.treeView.hWnd.zIndex = 1000000; // ganz oben
   this.treeViewVisible = true;
   this.treeView.callBack_onClose   = function() {this.treeViewVisible=false;}.bind(this);
   this.treeView.callBack_onKeyDown = function(event) {this.keyHandler(event)}.bind(this);

  this.updateTreeView();
}

updateTreeView()
{
  if(!this.treeViewVisible) return;
  if(this.treeView==null) return; 

  this.treeView.hWnd.innerHTML = ''; // Baum leeren
  

 // rekursive scanFunktion zur Erzeugung der Baumstruktur:
   var __scanNodes = function( tree , treeNode , obj )
  {
    var n = null;

    if(treeNode==null) n=  tree.addNode   (            obj.name , obj );
    else               n = tree.addSubNode( treeNode , obj.name , obj );   

    if(obj.childList.length>0)
       for (var j=0; j<obj.childList.length; j++)  __scanNodes( tree , n , obj.childList[j] ); 
  }

  var t = new TFTreeView(  this.treeView.hWnd , {} );
   for(var i=0; i<this.dashBoard.childList.length; i++) __scanNodes( t , null , this.dashBoard.childList[i] );
      
  t.buildNodeList(); 
  t.collabseAll(false);
  t.callBack_onClick = function(node)
  {
    if(node.content) 
    { // wenn ein Datenobjekt vorhanden ist, dann dieses selektieren
      var obj = node.content;
      if(obj instanceof objects.TFObject) this.selectComponent(obj);
    }       
  }.bind(this);
}  


selectComponent(element) 
{
  const prev = this.selected.element;

  // 1) Abbruch: Gleiches Element erneut gewählt → nix tun
  if (prev && element === prev) return false;

  // 2) Vorher ausgewähltes Element sauber zurücksetzen
  if (prev && prev.DOMelement) 
  {
    prev.DOMelement.style.outline       = this.selected.outline || '';
    prev.DOMelement.style.outlineOffset = this.selected.outlineOffset || '';
  }

  // 3) Wenn "nichts wählen" übergeben wurde → Auswahl/Editor leeren
  if (!element) 
  {
    this.selected.element       = null;
    this.selected.outline       = '';
    this.selected.outlineOffset = '';
    this.propertyEditor.visible = false;  
    this.propCaption.innerHTML  = '';
    return false;
  }

  // 4) Neues Element merken + Originalwerte puffern
  this.selected.element       = element;
  this.selected.outline       = element.DOMelement.style.outline;
  this.selected.outlineOffset = element.DOMelement.style.outlineOffset;

  // 5) Visuelle Hervorhebung per outline (layout-neutral)
  element.DOMelement.style.outline       = '3px solid #e11';
  element.DOMelement.style.outlineOffset = '0px'; // ggf. z.B. '2px' für Abstand

  // 6) PropertyEditor anzeigen/füllen
  const p = dialogs.getProperties(element);
  this.propertyEditor.visible = true;
  this.propertyEditor.setProperties(p);
  this.propertyEditor.level = this.propLevelSelector.value;

  if (element == this.dashBoard) this.propCaption.innerHTML = `<center>Container</center>`;
  else                           this.propCaption.innerHTML = `<center>${element.objName} (${element.ID})</center>`;

  this.showGridLines(element);

  return false;
}

deleteSeletedObject()
{
  if(this.selected.element)
  { 
    var idx = this.builderObjects.indexOf(this.selected.element);
    if (idx > -1)
    {
      this.builderObjects.splice(idx, 1); // Element aus dem Array entfernen
      this.selected.element.remove(); // Element aus dem DOM entfernen

      this.selectComponent(null);

      this.updateTreeView();
    }
    this.abortBtn.visible = true;
    this.hasChanged = true;
  }
}       

saveProperties( p )
  {
    console.log('Setze Properties: ' + utils.JSONstringify(p) );

    if(this.selected.element) dialogs.setProperties( this.selected.element , p );  

  }

___createToolboxItem( glyph , type , left , top)
{
  if(!this.toolbox) return;
  var item                       = dialogs.addPanel( this.toolbox , '' , 1 , 1 , '4em' , '4em' , {dragable:true , draggingData: { newObject:type } });
      item.overflow              = 'hidden';
      item.margin                = '0.4em';
      utils.drawSymbol(  glyph , item , "90%" ); 
      item.type                  = type;
      item.DOMelement.setAttribute("title", type)
  return item;  
}


___findComponentByID( id )
{
  for (var i = 0; i < this.builderObjects.length; i++)
  {
    var objId = this.builderObjects[i].ID;
    if (objId == id) return this.builderObjects[i];
  }
  return null; // Element nicht gefunden
}


___selectNextElement()
{ 
  // wenn liste leer dann ist diese Funktion sinnlos ..
  if (this.builderObjects.length == 0) return;

  var ndx = -1;
  // aktuelles Element finden ...
  if(this.selected.element) ndx = this.builderObjects.indexOf(this.selected.element);
 
  ndx++;
  if( !(ndx < this.builderObjects.length) ) ndx=0;

  this.selectComponent(this.builderObjects[ndx]);

}


onMouseClick(event , objId)
{ 
   event.stopPropagation(); 
   const clickedObject = this.___findComponentByID(objId);
   if (!clickedObject) return;
   if(this.selected.element != clickedObject) this.selectComponent(clickedObject);
}


onDragstart(event , dragHTMLObject ) 
{ 
  if (dragHTMLObject.children && dragHTMLObject.children.length > 0) 
  {
    // Koordinaten des Mouse-Events verwenden, um das Kind-Element zu finden
    var child = document.elementFromPoint(event.clientX, event.clientY);

    // Überprüfen, ob das gefundene Element ein Child von `dragObject` ist
    if (dragHTMLObject.contains(child) && child !== dragHTMLObject) {
      dragHTMLObject = child; // `dragObject` auf das spezifische Child setzen
    }
  }
  var dragObject = dragHTMLObject.data || null
 
  if (!dragObject) return;
  
  event.stopPropagation();
  event.dataTransfer.setData('text', {objectId:dragObject.ID} ); // Setzt die ID des gezogenen Elements
  console.log('dragStart:  ID=' + dragObject.ID + ' type=' + dragObject.type );
}


onDragover(event) 
{
  var dropTarget = event.target;
  event.stopPropagation()
  event.preventDefault(); // Erlaubt das Droppen

    // Mausposition relativ zum Container berechnen
    const rect = dropTarget.getBoundingClientRect();
    const x    = event.clientX - rect.left;
    const y    = event.clientY - rect.top;
   
    const gInfo = utils.getGridLayoutDimension( dropTarget );
    var gridPosition_left = Math.floor(x / (rect.width  / gInfo.gridColumnCount)) +1 ;    
    var gridPosition_top  = Math.floor(y / (rect.height / gInfo.gridRowCount)) +1 ; 

    var obj = '';
    if(this.selected)
      if(this.selected.element) obj = this.selected.element.objName || ""; 

    // Optional: visuelles Feedback geben, z.B. eine Linie oder einen Platzhalter anzeigen
    this.propCaption.innerHTML = `<center>${obj} (X:${gridPosition_left} Y:${gridPosition_top})</center>`;
};


onDrop(event , dropResult ) 
{ 
  event.stopPropagation();
  event.preventDefault(); 

  var dropTarget = event.target;
  var rect       = dropTarget.getBoundingClientRect();

  if (dropTarget.tfObjInstance) dropTarget = dropTarget.tfObjInstance; // falls das Target ein Drag-Objekt ist, dann auf das Daten-Objekt wechseln
  else return

  // Mausposition relativ zum Container berechnen
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const gInfo = utils.getGridLayoutDimension( dropTarget );

  var gridPosition_left = Math.floor(x / (rect.width  / gInfo.gridColumnCount)) +1 ;    
  var gridPosition_top  = Math.floor(y / (rect.height / gInfo.gridRowCount)) +1 ; 

  if (dropResult.json.newObject)
  {
    // Neues Element erstellen
    this.addComponent( dropTarget , gridPosition_left , gridPosition_top , dropResult.json.newObject );
    return;
  }
 
  const droppedObject = this.___findComponentByID(dropResult.json.id); 
    
  if(droppedObject)
  { //  wurde Objekt auf ein anderes Element gedroppt ?
    droppedObject.setParent(dropTarget);
    droppedObject.gridLeft = gridPosition_left;
    droppedObject.gridTop  = gridPosition_top;
    this.updateTreeView();
  }

  // neue Position PropertyEditor aktualisieren.
  // Es sollen aber nicht ALLE Properties aktualisiert werden, sondern nur die beiten Positionsangaben....
   var p = droppedObject.getConstructionProperties();
  
   // im property-Editor die beiden Positionen aktualisieren:
   var c1 = this.propertyEditor.propertyControlByName('gridLeft');
   if(c1!=null) c1.value = droppedObject.gridLeft;
   
   var c2 = this.propertyEditor.propertyControlByName('gridTop');
    if(c2!=null) c2.value = droppedObject.gridTop;

    this.propCaption.innerHTML = `<center>${droppedObject.objName}</center>`;

    if(droppedObject.objName=='TFPanel')this.showGridLines( droppedObject );

    this.abortBtn.visible = true;
   
};


showGridLines(div) 
{
  if(div.objName != 'TFPanel') 
  {
    this.gridCtrlRows.value = '-';
    this.gridCtrlCols.value = '-';
    return;
   } 
 

  if (div.layout().toUpperCase() !== 'GRID') 
  {
    this.gridCtrlRows.value = '-';
    this.gridCtrlCols.value = '-';
    return;
  }

  // Grid-Infos holen
  const dim = utils.getGridLayoutDimension(div);
  const numColumns = dim.gridColumnCount;
  const numRows = dim.gridRowCount;

  this.gridCtrlRows.value = numRows;
  this.gridCtrlCols.value = numColumns;

  // Größe des DIVs bestimmen
  const rect = div.DOMelement.getBoundingClientRect();
  const divWidth = rect.width;
  const divHeight = rect.height;

  // Vorheriges Canvas-Raster entfernen
  div.DOMelement.querySelectorAll('canvas.grid-overlay').forEach(c => c.remove());

  // Neues Canvas erzeugen
  const canvas = document.createElement('canvas');
  canvas.classList.add('grid-overlay');
  canvas.width    = divWidth;
  canvas.height   = divHeight;
  canvas.overflow = 'hidden';

  // Canvas stylen
  Object.assign(canvas.style, {
    position: 'absolute',
    inset : '0',
    top: '0',
    left: '0',
    zIndex: '100000',
    pointerEvents: 'none'
  });

  // Eltern-Container muss relativ positioniert sein
  div.DOMelement.style.position = 'relative';
  div.DOMelement.style.overflow = 'hidden'; // Verhindert Überlauf
  div.DOMelement.appendChild(canvas);

  // Zeichnen
  const ctx = canvas.getContext('2d');
  if (!ctx) {
  console.warn("Canvas-Kontext konnte nicht erzeugt werden.");
  return;
}

  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]); // gestrichelte Linien

  const cellWidth = divWidth / numColumns;
  const cellHeight = divHeight / numRows;

  // senkrechte Linien
  for (let i = 1; i < numColumns; i++) {
    const x = Math.round(i * cellWidth);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, divHeight);
    ctx.stroke();
  }

  // Horizontale Linien
  for (let i = 1; i < numRows; i++) {
    const y = Math.round(i * cellHeight);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(divWidth, y);
    ctx.stroke();
  }
}


propertyEditorDialog(item)
{
  if (item.dialog=='SYMBOLPICKER')
  {
    dialogs.browseSymbols('', function (symbolName){ this.propertyItem.control.value = symbolName[0];
                                                     
                                                   }.bind({self:this,propertyItem:item}) )
  }  


if (item.dialog=='COLORPICKER')
  {
    dialogs.colorPicker( item.value , function (newColor){ this.propertyItem.control.value = newColor;
                                                     
                                                   }.bind({self:this,propertyItem:item}) )
  }  




}





}





   


