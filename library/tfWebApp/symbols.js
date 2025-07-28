import { webApiRequestAsync } from './utils.js'; 
import { webApiRequest }      from './utils.js'; 

import  * as globals   from "./globals.js";
import  * as dialogs   from "./tfDialogs.js";  
import  * as utils     from "./utils.js";

import { TFWindow   } from "./tfWindows.js";



var symbolsList      = [];
var symbolObjMapping = [];


export function symbolGroups()
{
  var groups=[];
  for(var i=0; i<symbolsList.length; i++) groups.push(symbolsList[i].groupName);
  return groups;
}


class TFSymbols 
{
  constructor ( group ) 
  {
    this.symbolIDs = [];
    this.groupName = group || '';
    this.loadSymbols( this.groupName );
  }

   
  async loadSymbols( group )
  {
    const listResponse = await webApiRequestAsync('LSSYMBOLS', {path:group});
    const svgs         = listResponse.result || [];

     this.symbolIDs  = []; // zurücksetzen
     this.symbolDefs = [];

   // 2. Parallel alle SVGs laden
    const loadTasks = svgs.map(async function(id) 
                      {
                        const res = await webApiRequestAsync('SYMBOL', {path:group , symbolName: id });

                        if (res.error || !res.result?.trim()) return null;

                        let svgText = res.result;
                        let viewBox = '0 0 24 24';
                        const match = svgText.match(/viewBox="([^"]+)"/);
                        if (match && match[1]) viewBox = match[1];

                        let content = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
                        this.symbolIDs.push(id);
                        
                        symbolObjMapping.push({group:group, obj:this, symbol:id})

                        return `<symbol id="icon-${id}" viewBox="${viewBox}">\n${content}\n</symbol>`;
                      }.bind(this));

  const symbolElements = await Promise.all(loadTasks);
  const spriteText = `<svg id="icon-sprite" xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbolElements.filter(Boolean).join('\n')}\n</svg>`;

  // 3. In den DOM einfügen
  const container = document.createElement('div');
  container.innerHTML = spriteText;
  document.body.prepend(container.firstElementChild);
  console.log("✅ Symbols ("+group+") initialized:", this.symbolIDs.length, "loaded.");
}


list() 
{
  return this.symbolIDs;
}


draw(container, symbolName, size = null) 
{
  const id = 'icon-' + symbolName;
  if (!this.symbolIDs.includes(symbolName)) {
    console.warn("Symbol nicht vorhanden:", symbolName);
    return false;
  }

  container.innerHTML = '';

  // SVG erstellen
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); // universelles Koordinatensystem

  // Feste Größe oder 100% (z. B. für Flex-Layouts)
  if (size) {
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    container.style.width = size + 'px';
    container.style.height = size + 'px';
  } else {
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    container.style.width = '48px';   // Beispielgröße
    container.style.height = '48px';
  }

  // Skalierungsverhalten
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Symbol einbinden
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  container.appendChild(svg);

  return true;
}

} // class TFSymbols



export async function init() 
{
    // symbol-Liste löschen
    symbolsList      = [];
    symbolObjMapping = [];
    
    // ermittle alle Symbol-gruppen
    const symbolGroups =  webApiRequest('LSSYMBOLGROUPS', {}).result;

    for(var i=0; i<symbolGroups.length; i++)
    {  
      var s = new TFSymbols(symbolGroups[i]); 
      symbolsList.push( s );
    }  
}


export function list(group)
{
  var sumList = [];

  for(var i=0; i<symbolObjMapping.length; i++)
  {  
     if(group) 
     {
       if(group==symbolObjMapping[i].group) sumList.push(symbolObjMapping[i].symbol) 
     }
     else sumList.push(symbolObjMapping[i].symbol);
  }  
  return sumList;

}


export function draw( container  , symbolName , size = null , symbolGroup=null ) 
{
  if(symbolGroup) 
    {
      for(var i=0; i<symbolsList.length; i++) 
      if(symbolsList[i].groupName==group) return symbolsList[i].draw( container , symbolName , size )
    }
    else
         for(var i=0; i<symbolObjMapping.length; i++) 
         {
           if(symbolObjMapping[i].symbol==symbolName) symbolObjMapping[i].obj.draw(container,symbolName,size);   
         }
}


export class TFSymbolBrowser
{
  constructor()
  {
      this.cache    = [];
      this.selected = [];
      this.callback_onOkClicked = null;
      this.wnd      = new TFWindow( null , 'Symbol-Browser' , '80%' , '80%' , 'CENTER' );
   
      this.wnd.hWnd.buildGridLayout_templateColumns('1fr '   );
      this.wnd.hWnd.buildGridLayout_templateRows   ('3em 1fr');

      var svgSelection = dialogs.addPanel(this.wnd.hWnd,'sccContainerPanel',1,1,1,1,{});
          svgSelection.buildGridLayout_templateColumns('1fr , 4em');
          svgSelection.buildGridLayout_templateRows('1fr');

          
     var btnSelectSymbol             = dialogs.addButton( svgSelection , '' , 2,1,1,1,{glyph:'check',caption:'OK'});
         btnSelectSymbol.height      = '2.2em';
         btnSelectSymbol.marginTop   = '4px';
         btnSelectSymbol.marginRight = '1em';
         btnSelectSymbol.callBack_onClick = function () { if(this.callback_onOkClicked) this.callback_onOkClicked(this.selected)}.bind(this);

     var svgCombobox                 = dialogs.addSelectBox(svgSelection,1,1,35,'Kategorie','','essentiall', symbolGroups(),{});    
         svgCombobox.callBack_onClick = async function( v , c ){if (typeof v === "string") this.updateSymbols(v) }.bind(this)

     this.updateSymbols('essential');     
  }


 async updateSymbols(path)
 {  
   var svgContainer = null;

   for(var i=0; i<this.cache.length; i++)
    {
      if(this.cache[i].groupName==path)
      {
        svgContainer = this.cache[i].container;
        svgContainer.show();
      }
      else this.cache[i].container.hide()
    } 

    if(svgContainer) return;

    svgContainer = dialogs.addPanel(this.wnd.hWnd,'' ,1,2,1,1,{});

    var svgs     = list( path );
    
    for(var i=0; i<svgs.length; i++)
    { 
      console.log('Symbol: ' + svgs[i]);
      var p = dialogs.addPanel( svgContainer , "" , 1 , 1 , "140px" , "120px" );
          p.padding = 0;
          p.buildGridLayout_templateColumns('1fr');
          p.buildGridLayout_templateRows('1.2em 1fr');
      var s = dialogs.addPanel(p,'cssContainerPanel',1,2,1,1)
      utils.drawSymbol(svgs[i], s , 'black' , '100%') 
      s.dataBinding = {obj:s,sym:svgs[i]};

      s.callBack_onClick = function(evt,dataBinding){ 
                                                     const ndx = this.selected.indexOf(dataBinding.sym);
                                                     if (ndx !== -1) { this.selected.splice(ndx, 1);
                                                                       dataBinding.obj.backgroundColor = 'gray';
                                                                     }  
                                                                else { this.selected.push(dataBinding.sym);
                                                                       dataBinding.obj.backgroundColor = 'white';
                                                                     } 
      }.bind(this);
    
     // Caption ..
     var c = dialogs.addPanel( p , 'cssContainerPanel' , 1,1,1,1);
         c.margin          = 0;
         c.ppadding        = 0;
         c.overflow        = 'hidden';
         c.backgroundColor = 'rgba(0,0,0,0.14)';
         c.innerHTML       = '<center>'+svgs[i]+'</center>';

    await utils.processMessages();   
   }   
    
   this.cache.push({groupName:path, container:svgContainer });
  }
  

}