import { webApiRequestAsync } from './utils.js'; 
import { webApiRequest }      from './utils.js'; 


var symbolsList      = [];
var symbolObjMapping = [];


export function symbolGroups()
{
  var groups=[];
  for(var i=0; i<symbolsList.length; i++) groupCollapsed.push(symbolsList[i].groupName)
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

      for(var j=0; j<s.symbolIDs.length; j++) symbolObjMapping.push({group:symbolGroups[i], obj:s, symbol:s.symbolIDs[j]})
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