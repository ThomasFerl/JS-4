import * as dialogs  from "./tfDialogs.js";
import * as utils    from "./utils.js";


export class TFTreeNode 
{
  
  constructor( aTreeView , aParentNode , aCaption , aContent )
  {
  this.whoAmI                 = this.constructor.name;  
   // console.log("TFTreeNode.Constructor( parentNode="+aParentNode+" ,  Caption=" +aCaption+" , content="+aContent );
  this.treeView               = aTreeView;
  this.dept                   = 0;
  this.parentNode             = aParentNode;
  this.items                  = [];
  this.fcaption               = aCaption;
  this.DOMelement             = null;
  this.DOMElement_switch      = null;
  this.enableNodeOptions      = false;
  this.collabsed              = false;
  this.visible                = true;
  this.callBack_onClick       = null;
  this.callBack_onOptionClick = null;
  this.selected               = false;
  this.savedStyle             = {};
  this.backgroundColor        = 'rgba(0, 0, 0, 0.01)';  
  this.selectedBackgroundColor= 'rgba(0, 0, 0, 0.07)';  
  this.__toggleFlag           = false;
  
  // falls kein Datenobjekt übergeben wurde, dummyObj mit dummyContent erzeugen ...
  if (aContent) this.content = aContent;
  else          this.content = { dummyContent:42 };

  if(this.parentNode)
  {     
    this.dept = this.parentNode.dept + 1;
    this.parentNode.items.push( this ); 
  }
 }
//---end of Constructor----------------------------------------------------------
 

addNode(  aCaption , aContent )
 { 
    return new TFTreeNode( this.treeView ,  this , aCaption , aContent );
 }


isRootNode() { return this.parentNode==null }


collabse(yesOrNo)
{
    console.log('collabse '+this.caption+' -> ' + yesOrNo)
    this.collabsed = yesOrNo;
    this.visible   = this.collabsed;

   // if( this.items.length>0 ) this.visible = true;  // Elemente mit subItems werden nicht ausgeblendet ...

    this.printContent();

    if(this.collabsed)
    {
      this.DOMelement_switch.innerHTML =  '-';
      if(this.items.length>0) 
      {
        for(var i=0; i<this.items.length; i++)
        {
         var n           = this.items[i];
             console.log(n.caption + ' collabsed:true -> visible:true -> printContent() ')
             n.collabsed = true;
             n.visible   = true;
             n.printContent();
        } 
      } 
    }
    else
        if(this.items.length>0)
        {
          this.DOMelement_switch.innerHTML = '+';
          this.treeView.forEachNode( this , function(aNode){ console.log(aNode.caption + ' -> set collabse:false'); aNode.collabse(false) } , true );
        }  
  }

  onClickHandler(event)
  { 
    event.stopPropagation();
    var node = this; // wegen .bind(this)

    console.log("onClickHandler ->"+node.caption)

    node.treeView.forEachNode( null , function(n){ n.selected=false ; n.printContent() } , true );

    node.selected = true;
    node.printContent();

    if (node.callBack_onClick) node.callBack_onClick( node );
  } 

  onOptionClickHandler(event)
  {
    if (this.callBack_onOptionClick) this.callBack_onOptionClick(this)
  }
 
  onToggleCollabse(event)
  {
    event.stopPropagation();
    var node = this;
    node.collabse(!node.collabsed);
    node.visible = true;
    node.printContent();
  }  
    
  printContent()
  {
    if(!this.DOMelement_text) return;

    console.log('printContent ' + this.caption + ' selected:' + this.selected );

    if (this.selected) this.DOMelement_text.style.backgroundColor = this.selectedBackgroundColor;
    else               this.DOMelement_text.style.backgroundColor = this.backgroundColor;

    this.DOMelement_text.innerHTML = this.caption;

    if(this.visible){ this.DOMelement.style.display = 'grid'; } 
    else            { this.DOMelement.style.display = 'none'; return }
  }


  buildNode( aDOMcontainer )
  {
    //console.log('BuildNode['+this.caption+']')
    this.DOMelement                    = document.createElement('DIV'); 
    this.DOMelement.className          = "treeNodePanel";
    this.DOMelement.style.paddingLeft  = this.dept+"em";
    this.DOMelement.value              = this;
    this.DOMelement.onclick            = this.onClickHandler.bind(this);
    aDOMcontainer.appendChild( this.DOMelement );
          
    this.DOMelement_switch             = document.createElement('DIV'); 
    this.DOMelement_switch.className   = "treeNodeSwitch";
    this.DOMelement_switch.onclick     = this.onToggleCollabse.bind(this);
    this.DOMelement_switch.value       = this;
    this.DOMelement.appendChild(this.DOMelement_switch);
  
    this.DOMelement_text               = document.createElement("DIV");
    this.DOMelement_text.className     = "treeNode";
    this.DOMelement_text.onclick       = this.onClickHandler.bind(this);
    this.DOMelement_text.value         = this;
    this.DOMelement_text.innerHTML     = this.fcaption;
    this.DOMelement.appendChild(this.DOMelement_text);
    
    if (this.enableNodeOptions)
    {
     this.DOMelement_opt               = document.createElement("DIV");
     this.DOMelement_opt.className     = "treeNodeOption";
     this.DOMelement_opt.onclick       = this.onOptionClickHandler.bind(this);
     this.DOMelement_opt.innerHTML     = '<i class="fa-solid fa-screwdriver-wrench"></i>';
     this.DOMelement.appendChild(this.DOMelement_opt);
    } 
   
   
    this.savedStyle                    = this.DOMelement_text.style;

    this.printContent();
   
    // falls subNodes existieren.....
    if(this.items.length > 0) 
    {
      this.DOMelement_switch.innerHTML = '+';  
      //console.log('insertSubNodes');
      for (var i=0 ; i<this.items.length; i++)
      {
        var node = this.items[i];
        node.buildNode(aDOMcontainer);
      }
    }  
  }   

  set caption( aCaption )
  {
    this.fcaption = aCaption;
    this.DOMelement_text.innerHTML = this.fcaption;
  }

  get caption()
  {
    return this.fcaption;
  }


  debugLog = function()
  {
   if (this.parentNode) console.log(utils.tab(this.dept*3)+this.dept+": "+this.caption+"(collapsed:"+this.collabsed+")" ); //->  Content:"+JSON.stringify(this.content)+"   my parent is: "+ this.parentNode.caption);
   else                 console.log(utils.tab(this.dept*3)+this.dept+": "+this.caption+"   Content:"+JSON.stringify(this.content)+"   my parent is: NULL");

   this.items.forEach( function(node) {node.debugLog();} ) 
  }         

} 

export class TFTreeView
{
constructor( aParent , params )
{
  this.className         = this.constructor.name;  
  this.parent            = aParent;
  if(!this.parent) this.parent=document.body;

  this.rootNodes = [];
  this.items     = [];

  utils.buildFlexBoxLayout(this.parent);
  this.treeViewPanel = dialogs.addPanel( this.parent , "cssTreeViewContainer" , 1 , 1 , '97%' , '97%' , true );
  this.treeViewPanel.backgroundColor = this.parent.backgroundColor;
  this.content = { dummyContent:42 };
 }  
   

 addNode( aCaption , aContent )
 { 
    var n = new TFTreeNode( this , null , aCaption , aContent );
    this.rootNodes.push( n );
    this.items = this.rootNodes;
    return n;
 }
 

  addSubNode( aParentNode , aCaption , aContent )
  { 
    if(!aParentNode) return this.addNode( aCaption , aContent )
    else
    {
      var n = new TFTreeNode( this , aParentNode , aCaption , aContent );
      return n;
    }
  }


  buildNodeList()
  {
    var DOM = this.treeViewPanel.DOMelement;
        DOM.innerHTML='';
        for(var i=0; i<this.rootNodes.length; i++)
        { var node = this.rootNodes[i]; 
              node.collabsed = false; 
              node.buildNode(DOM);
        }
   }  
      

  clearItems()
  {
    for(var i=0; i<this.rootNodes.length; i++) this.rootNodes[i] = [];
    this.rootNodes = [];
  }




  clearItems()
  {
    for(var i=0; i<this.rootNodes.length; i++) this.rootNodes[i] = [];
    this.rootNodes = [];
  }


  debugLog()
  {
    console.log("");
    console.log("---------------TFTreeView-------------------------");
    this.forEachNode( null , function(rootNode) {rootNode.debugLog();} , true )
  }

  collabseAll(yesOrNo)
  {
    this.__toggleFlag = yesOrNo;
    this.forEachNode(  this.rootNodes[0] , function (node){ if(node.parentNode!=null) node.collabse(this)}.bind(yesOrNo) , true );
  }

  toggleCollapse()
  {
    this.__toggleFlag = !this.__toggleFlag;
    this.collabseAll(this.__toggleFlag);
  }


  forEachNode( entryPoint , callback ,recursive)
  {
    if(recursive==undefined) recursive = true;

    if(entryPoint==null)
    {
      console.log('forEachNode() entryPoint:null ; recursive:'+recursive);
      for (var i=0; i<this.rootNodes.length; i++)
      { 
        callback(this.rootNodes[i])    
        if(recursive) this.forEachNode( this.rootNodes[i] , callback , true);
      }  
    }
    else  
    {
       console.log('forEachNode() entryPoint:'+entryPoint.caption+' recursive:' + recursive);
       for(var i=0; i<entryPoint.items.length;i++)
       {
         callback(entryPoint.items[i])
         if(recursive) this.forEachNode( entryPoint.items[i] , callback , true);
       }  
    }
  }
  
  
  set callBack_onClick( aCallBack )
  {
    this.forEachNode( null , function(node){node.callBack_onClick = aCallBack} , true );
  }
  
  get callBack_onClick()
  {
    return this.rootNodes[0].callBack_onClick;
  }
  

  destroy()
  {
    this.rootNodes = [];
    this.items     = [];
    this.treeViewPanel.DOMelement.innerHTML = '';
  } 

}
