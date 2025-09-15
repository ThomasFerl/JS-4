// pivot.js – ESM module
// TFPivotGrid: render-only pivot grid that consumes a *precomputed* pivot structure.
// No raw-data crunching here. You pass colPaths, flatRows, and a getCell() accessor.

export class TFPivotGrid 
{
  /**
   * @param {Object} opts
   * @param {Object} opts.pivot - precomputed pivot structure
   * @param {Array<Array<any>>} opts.pivot.colPaths - column key paths (e.g., [[2024],[2025]] or [[]] when no column axis)
   * @param {Array<Object>} opts.pivot.flatRows - flattened row axis entries produced by your pivot logic.
   *        Each item: { type:'member'|'subtotal'|'grand', depth:number, path:Array<any>, label:string, nodeId?:string }
   * @param {Function} opts.pivot.getCell - function(rowItem, colPath, valueDef) -> any (string/number already formatted OR raw). If raw, you can also pass valueDef.format.
   * @param {Array<Object>} opts.values - value definitions displayed per column path. Each: { caption:string, format?:(v:any)=>string, className?:string }
   * @param {boolean} [opts.showGrandTotals=true]
   * @param {boolean} [opts.showSubtotals=true]
   * @param {boolean} [opts.compact=false]
   * @param {boolean} [opts.stickyToolbar=true]
   * @param {string}  [opts.classPrefix='pg-'] - CSS class prefix to avoid collisions
   * @param {boolean} [opts.injectCSS=true] - injects the built-in stylesheet once per document
   */
  constructor(opts={}){
    this.options = Object.assign({
      values: [],
      showGrandTotals: true,
      showSubtotals: true,
      compact: false,
      stickyToolbar: true,
      classPrefix: 'pg-',
      injectCSS: true,
      pivot: { colPaths: [[]], flatRows: [], getCell: ()=>'' },
    }, opts);

    /** @type {HTMLElement|null} */
    this.container = null;
    this._open = new Set(); // stores JSON.stringify(path)
    this._childrenMap = null; // Map<stringified path -> child row items>
  }

  /** Replace pivot model */
  setPivot(pivot){
    this.options.pivot = pivot || { colPaths:[[]], flatRows:[], getCell:()=>'' };
    this._rebuildChildrenMap();
    return this;
  }

  /** Merge options and rerender */
  update(opts={}){
    Object.assign(this.options, opts);
    if(opts.pivot) this._rebuildChildrenMap();
    if(this.container) this.render(this.container);
    return this;
  }

  /** Destroy grid and cleanup */
  destroy(){
    if(this.container){ this.container.replaceChildren(); this.container = null; }
    this._open.clear();
    this._childrenMap = null;
  }

  /** Render into target container */
  render(container){
    this.container = container;
    const { classPrefix: P } = this.options;

    if(this.options.injectCSS) injectStylesOnce(P);

    const root = el('div', cls(P+'root') + (this.options.compact? ' '+P+'compact' : ''));

    // Toolbar
    const tb = el('div', cls(P+'toolbar'));
    if(!this.options.stickyToolbar) tb.style.position = 'static';

    const rowsBadge = el('span', cls(P+'badge')); rowsBadge.textContent = this._rowsCaption();
    const colsBadge = el('span', cls(P+'badge')); colsBadge.textContent = this._colsCaption();
    const valsBadge = el('span', cls(P+'badge')); valsBadge.textContent = this._valuesCaption();

    const expandBtn = el('button', cls(P+'btn')); expandBtn.textContent = 'Alle aufklappen';
    const collapseBtn = el('button', cls(P+'btn')); collapseBtn.textContent = 'Alle zuklappen';

    expandBtn.onclick = ()=>{ this.openAll(); this._drawBody(table); };
    collapseBtn.onclick = ()=>{ this.closeAll(); this._drawBody(table); };

    tb.append(rowsBadge, colsBadge, valsBadge, expandBtn, collapseBtn);

    // Table
    const wrap = el('div', cls(P+'table-wrap'));
    const table = el('table', cls(P+'table') + ' ' + cls(P+'card'));

    // Header row 1 (corner + axis title)
    const tr1 = el('tr');
    const thCorner = el('th', cls(P+'th')+' '+cls(P+'rowhdr'));
    thCorner.textContent = this._rowHeaderTitle() || 'Zeilen';
    tr1.appendChild(thCorner);

    const thCols = el('th', cls(P+'th'));
    const spanCount = Math.max(1, this._colCount() * Math.max(1, this.options.values.length));
    thCols.colSpan = spanCount;
    thCols.textContent = this._colHeaderTitle() || 'Spalten';
    tr1.appendChild(thCols);
    table.appendChild(tr1);

    // Header row 2 (actual column headers * value captions)
    const tr2 = el('tr');
    tr2.appendChild(el('th', cls(P+'th')+' '+cls(P+'rowhdr'))); // empty corner cell

    const colPaths = this.options.pivot.colPaths?.length ? this.options.pivot.colPaths : [[]];
    if(colPaths.length===1 && colPaths[0].length===0){
      // single phantom column
      const th = el('th', cls(P+'th'));
      th.textContent = this.options.values.map(v=>v.caption || '').filter(Boolean).join(' | ');
      th.colSpan = Math.max(1, this.options.values.length) || 1;
      tr2.appendChild(th);
    } else {
      for(const cPath of colPaths){
        for(const v of this.options.values){
          const th = el('th', cls(P+'th'));
          th.textContent = (cPath.join(' / ') || '') + (this.options.values.length>1 ? ` – ${v.caption||''}` : '');
          tr2.appendChild(th);
        }
      }
    }
    table.appendChild(tr2);

    // Compose
    wrap.appendChild(table);
    root.append(tb, wrap, this._footer());

    // Mount
    container.replaceChildren(root);

    // Open first level by default
    this._ensureDefaultOpen();
    this._drawBody(table);
  }

  /** Expand all first-level members */
  openAll(){
    const tops = this._topMembers();
    for(const it of tops) this._open.add(keyOf(it.path));
  }

  /** Collapse all */
  closeAll(){ this._open.clear(); }

  /* ----------------- internal helpers ----------------- */
  _rebuildChildrenMap(){
    const map = new Map();
    const stack = [];
    const rows = this.options.pivot.flatRows || [];
    for(const it of rows){
      if(it.type==='member'){
        while(stack.length && stack[stack.length-1].depth >= it.depth) stack.pop();
        if(stack.length){
          const pKey = keyOf(stack[stack.length-1].path);
          if(!map.has(pKey)) map.set(pKey, []);
          map.get(pKey).push(it);
        }
        stack.push(it);
      } else if(it.type==='subtotal'){
        if(stack.length){
          const pKey = keyOf(stack[stack.length-1].path);
          if(!map.has(pKey)) map.set(pKey, []);
          map.get(pKey).push(it);
        }
      } else if(it.type==='grand'){
        // attach first-level members to root "[]"
        for(const r of rows){ if(r.type==='member' && r.depth===1){
          const pKey = keyOf([]); if(!map.has(pKey)) map.set(pKey, []); map.get(pKey).push(r);
        }}
      }
    }
    this._childrenMap = map;
  }

  _rowsCaption(){
    const rows = (this.options.pivot.flatRows||[]).filter(r=>r.type==='member' && r.depth).map(r=>r.path[0]);
    const uniq = [...new Set(rows)];
    return `Zeilen: ${uniq.length? uniq.join(' › '): '—'}`;
  }
  _colsCaption(){
    const cp = this.options.pivot.colPaths||[];
    return `Spalten: ${cp.length? (cp[0].length? '…' : '—'): '—'}`;
  }
  _valuesCaption(){
    const vs = this.options.values||[];
    return `Werte: ${vs.map(v=>v.caption||'').filter(Boolean).join(', ')||'—'}`;
  }
  _rowHeaderTitle(){ return (this.options.rowTitle)||''; }
  _colHeaderTitle(){ return (this.options.colTitle)||''; }
  _colCount(){ return (this.options.pivot.colPaths && this.options.pivot.colPaths.length) || 1; }

  _footer(){
    const { classPrefix: P } = this.options;
    const ft = el('div', cls(P+'footer'));
    const left = el('div'); left.textContent = `${(this.options.pivot.flatRows||[]).length} Zeilen, ${(this.options.values||[]).length} Wert-Spalte(n)`;
    const right = el('div'); right.innerHTML = `<span class="${P}pill">Subtotals: ${this.options.showSubtotals?'an':'aus'}</span> <span class="${P}pill">Grand: ${this.options.showGrandTotals?'an':'aus'}</span>`;
    ft.append(left,right);
    return ft;
  }

  _ensureDefaultOpen(){
    const tops = this._topMembers();
    for(const m of tops) this._open.add(keyOf(m.path));
  }

  _topMembers(){
    const rows = this.options.pivot.flatRows||[];
    return rows.filter(r=>r.type==='member' && r.depth===1);
  }

  _collectVisible(){
    const out = [];
    const addBranch = (node)=>{
      out.push(node);
      if(node.type==='member'){
        const isOpen = this._open.has(keyOf(node.path));
        if(isOpen){
          const kids = (this._childrenMap && this._childrenMap.get(keyOf(node.path))) || [];
          for(const k of kids) addBranch(k);
        }
      }
    };

    const rows = this.options.pivot.flatRows||[];
    if(rows.length && rows[0].type==='grand'){
      out.push(rows[0]);
      const top = (this._childrenMap && this._childrenMap.get(keyOf([]))) || [];
      for(const t of top) addBranch(t);
      if(this.options.showGrandTotals) out.push(rows[rows.length-1]);
    } else {
      const top = this._topMembers();
      for(const t of top) addBranch(t);
      if(this.options.showGrandTotals){ const g = rows.find(r=>r.type==='grand'); if(g) out.push(g); }
    }
    return out;
  }

  _drawBody(table){
    const { classPrefix: P } = this.options;
    // remove old rows
    [...table.querySelectorAll('tr.'+P+'body')].forEach(tr=>tr.remove());

    const visible = this._collectVisible();
    const colPaths = this.options.pivot.colPaths?.length ? this.options.pivot.colPaths : [[]];

    for(const item of visible){
      const tr = el('tr', cls(P+'body'));
      if(item.type==='grand') tr.classList.add(P+'grand');
      if(item.type==='subtotal') tr.classList.add(P+'subtotal');

      // row header cell
      const tdHdr = el('td', cls(P+'td')+' '+cls(P+'rowhdr'));
      tdHdr.style.paddingLeft = (6 + (item.depth>0? (item.depth-1):0)*16) + 'px';

      const toggle = el('span', cls(P+'toggle'));
      if(item.type==='member' && this._childrenCount(item.path)>0){
        toggle.onclick = ()=>{ const k = keyOf(item.path); if(this._open.has(k)) this._open.delete(k); else this._open.add(k); this._drawBody(table); };
        if(this._open.has(keyOf(item.path))) toggle.classList.add(P+'open');
      } else {
        toggle.style.visibility = 'hidden';
      }
      tdHdr.appendChild(toggle);
      tdHdr.appendChild(text(item.type==='member' ? String(item.label) : item.label));
      tr.appendChild(tdHdr);

      // data cells
      const targets = colPaths.length ? colPaths : [[]];
      for(const cPath of targets){
        for(const v of this.options.values){
          const td = el('td', cls(P+'td')+' '+cls(P+'num') + (v.className? (' '+v.className):''));
          let value = this.options.pivot.getCell ? this.options.pivot.getCell(item, cPath, v) : '';
          if(v.format) value = v.format(value);
          td.textContent = (value===0 || value) ? String(value) : '';
          tr.appendChild(td);
        }
      }

      table.appendChild(tr);
    }

    // toggle state visuals
    const hdrs = table.querySelectorAll('td.'+P+'rowhdr');
    hdrs.forEach((td, i)=>{
      const item = visible[i];
      if(item && item.type==='member'){
        const tog = td.querySelector('.'+P+'toggle');
        if(this._open.has(keyOf(item.path))) tog && tog.classList.add(P+'open');
        else tog && tog.classList.remove(P+'open');
      }
    });
  }

  _childrenCount(path){
    const kids = this._childrenMap && this._childrenMap.get(keyOf(path));
    return kids ? kids.length : 0;
  }
}

/* ---------------------- Utilities ---------------------- */
function keyOf(path){ return JSON.stringify(path||[]); }
function el(tag, className){ const n = document.createElement(tag); if(className) n.className = className; return n; }
function text(t){ return document.createTextNode(t); }
function cls(name){ return name; }

/* ---------------------- Stylesheet ---------------------- */
const STYLE_CACHE = new WeakSet();
function injectStylesOnce(prefix='pg-'){
  const doc = document;
  if(!doc) return;
  const token = (doc.__tfpivot_style_token ||= {});
  if(STYLE_CACHE.has(token)) return;

  const css = `
    .${prefix}root{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px; color:#1f2937}
    .${prefix}card{border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,.04); overflow:hidden; background:#fff}
    .${prefix}toolbar{display:flex; gap:.5rem; align-items:center; padding:.5rem .75rem; border-bottom:1px solid #f3f4f6; background:#fafafa; position:sticky; top:0; z-index:2}
    .${prefix}badge{font-size:12px; padding:.15rem .4rem; border:1px solid #e5e7eb; border-radius:6px; background:#fff}
    .${prefix}btn{cursor:pointer; border:1px solid #e5e7eb; background:#fff; padding:.35rem .55rem; border-radius:8px; user-select:none}
    .${prefix}btn:hover{background:#f9fafb}
    .${prefix}btn:active{transform:translateY(1px)}
    .${prefix}table-wrap{width:100%; overflow:auto}
    .${prefix}table{border-collapse:separate; border-spacing:0; width:max-content; min-width:100%}
    .${prefix}th, .${prefix}td{border-right:1px solid #f3f4f6; border-bottom:1px solid #f3f4f6; padding:.45rem .5rem; white-space:nowrap}
    .${prefix}th{background:#f8fafc; font-weight:600; position:sticky; top:40px; z-index:1}
    .${prefix}rowhdr{position:sticky; left:0; background:#f8fafc; z-index:1; font-weight:600}
    .${prefix}grand{background:#fff7ed; font-weight:700}
    .${prefix}subtotal{background:#f3f4f6; font-weight:600}
    .${prefix}num{text-align:right; font-variant-numeric:tabular-nums}
    .${prefix}toggle{cursor:pointer; margin-right:.35rem; opacity:.8}
    .${prefix}toggle::before{content:'▸'; display:inline-block; width:1em; text-align:center}
    .${prefix}open::before{content:'▾'}
    .${prefix}footer{display:flex; justify-content:space-between; align-items:center; padding:.5rem .75rem; border-top:1px solid #f3f4f6; background:#fafafa; font-size:12px; color:#6b7280}
    .${prefix}pill{padding:.1rem .4rem; border:1px solid #e5e7eb; border-radius:999px; background:#fff}
    .${prefix}compact .${prefix}th, .${prefix}compact .${prefix}td{padding:.28rem .35rem}
  `;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.setAttribute('data-tfpivot','1');
  style.appendChild(document.createTextNode(css));
  doc.head.appendChild(style);
  STYLE_CACHE.add(token);
}

/* ---------------------- Convenience wrapper API ---------------------- */
/**
 * Kapselt die Klasse TFPivotGrid in einer einfachen Draw-Funktion.
 * @param {HTMLElement|string} container - DOM-Element oder CSS-Selector
 * @param {Object} pivotData - Precomputed Pivot (colPaths, flatRows, getCell)
 * @param {Object} params - Weitere Optionen von TFPivotGrid (z.B. values, compact, stickyToolbar, classPrefix, injectCSS)
 * @returns {TFPivotGrid} die (neu erzeugte oder wiederverwendete) Grid-Instanz
 */
export function drawPivotGrid(container, pivotData, params = {}){
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if(!el) throw new Error('drawPivotGrid: container not found');

  const options = Object.assign({ pivot: pivotData }, params);

  // Reuse instance per container, wenn vorhanden
  let grid = el.__tfpivot_instance;
  if(!grid){
    grid = new TFPivotGrid(options);
    el.__tfpivot_instance = grid;
  } else {
    // falls schon existiert, Optionen mergen
    grid.update(options);
  }

  grid.render(el);
  return grid;
}

/**
 * Gibt die TFPivotGrid-Instanz für einen Container zurück (falls vorhanden).
 */
export function getPivotGridInstance(container){
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  return el ? el.__tfpivot_instance || null : null;
}

/**
 * Zerstört die TFPivotGrid-Instanz im angegebenen Container und räumt auf.
 */
export function destroyPivotGrid(container){
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if(!el) return;
  const grid = el.__tfpivot_instance;
  if(grid){ grid.destroy(); }
  el.__tfpivot_instance = null;
}

/* ---------------------- Example wiring ---------------------- */
// USAGE (in your app):
// import { TFPivotGrid, drawPivotGrid } from './pivot.js';
// drawPivotGrid('#container', pivot, { values:[{caption:'Umsatz ∑', format:v=>v.toLocaleString('de-DE')+' €'}] });
// const grid = getPivotGridInstance('#container');
