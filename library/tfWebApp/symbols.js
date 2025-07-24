import { webApiRequestAsync } from './utils.js'; 

let symbolIDs = [];

export async function init_old_asynchron() 
{
  const svgs = utils.webApiRequest('LSSYMBOLS', {path:'/unsorted'}).result;
  let spriteText = '<svg id="icon-sprite" xmlns="http://www.w3.org/2000/svg" style="display:none">\n';

  for (let i = 0; i < svgs.length; i++) 
  {
    const id = svgs[i];
    const svgText = utils.webApiRequest('SYMBOL', { symbolName: id }).result;
    if (!svgText || !svgText.trim()) continue;

    let viewBox = '0 0 24 24';
    const match = svgText.match(/viewBox="([^"]+)"/);
    if (match && match[1]) viewBox = match[1];

    let content = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

    spriteText += `<symbol id="icon-${id}" viewBox="${viewBox}">\n${content}\n</symbol>\n`;
    symbolIDs.push(id);
  }

  spriteText += '</svg>';

  const container     = document.createElement('div');
  container.innerHTML = spriteText;
  document.body.prepend(container.firstElementChild);

console.log("Symbols initialized:", symbolIDs.length, "symbols loaded.");
console.log("Available symbols:", symbolIDs.join(', '));
console.log("sprite-Text:"+spriteText);

}


export async function init() 
{
  // 1. Alle Symbolnamen laden
  const listResponse = await webApiRequestAsync('LSSYMBOLS', {path:'essential'});
  const svgs = listResponse.result || [];

  symbolIDs = []; // zurücksetzen
  let symbolDefs = [];

  // 2. Parallel alle SVGs laden
  const loadTasks = svgs.map(async (id) => {
    const res = await webApiRequestAsync('SYMBOL', {path:'essential' , symbolName: id });

    if (res.error || !res.result?.trim()) return null;

    let svgText = res.result;
    let viewBox = '0 0 24 24';
    const match = svgText.match(/viewBox="([^"]+)"/);
    if (match && match[1]) viewBox = match[1];

    let content = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    symbolIDs.push(id);

    return `<symbol id="icon-${id}" viewBox="${viewBox}">\n${content}\n</symbol>`;
  });

  const symbolElements = await Promise.all(loadTasks);
  const spriteText = `<svg id="icon-sprite" xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbolElements.filter(Boolean).join('\n')}\n</svg>`;

  // 3. In den DOM einfügen
  const container = document.createElement('div');
  container.innerHTML = spriteText;
  document.body.prepend(container.firstElementChild);

  console.log("✅ Symbols initialized:", symbolIDs.length, "loaded.");
}


export function list() 
{
  return symbolIDs;
}


export function draw(container, symbolName, size = null) 
{
  const id = 'icon-' + symbolName;
  if (!symbolIDs.includes(symbolName)) {
    console.warn("Symbol nicht vorhanden:", symbolName);
    return;
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
}
