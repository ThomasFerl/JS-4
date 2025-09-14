/**
 * TFPivotGrid.js – schlankes Pivot-Grid ohne Frameworks
 * ------------------------------------------------------
 * Features
 * - Sticky Kopfzeilen & erste Spalte
 * - Totals (Zeilen/Spalten + Grand Total) optional
 * - Heatmap-Färbung optional (HSL, dynamisch an Wertebereich)
 * - Dichte (compact/normal/cozy) via CSS-Variablen
 * - Hover/Focus-Highlight, native Tooltip (title)
 * - Klick-Callback: onCellClick({ rowId, colId, value, rowLabel, colLabel, el })
 * - Programmierschnittstelle: setData(), updateOptions(), render(), destroy()
 * - UMD-Export (ESM default + window.TFPivotGrid)
 *
 * @version 1.0.0
 * @author  thomas & knoWiz
 */

/**
 * @typedef {{id: string|number, label: string}} AxisItem
 * @typedef {{rows: AxisItem[], cols: AxisItem[], values: Record<string, number|null|undefined>}} PivotData
 * @typedef {Object} PivotOptions
 * @property {boolean} [showTotals=true]       - Zeige Summen je Zeile/Spalte + Gesamtsumme
 * @property {boolean} [heatmap=true]          - Hintergrundfärbung nach Wertintensität
 * @property {('compact'|'normal'|'cozy')} [density='normal'] - Zell-Padding/Dichte
 * @property {(n:number|null|undefined)=>string} [formatValue] - Wertformatierer
 * @property {(info:{rowId:string|number,colId:string|number,value?:number|null,rowLabel:string,colLabel:string,el:HTMLTableCellElement})=>void} [onCellClick]
 * @property {string} [className]              - Zusätzliche CSS-Klasse am Root-Container
 */

(function factory(root, name){
  /**
   * Minimaler UMD-Wrapper: definiert global (window[name]) und liefert ESM default.
   */
  class TFPivotGrid {
    /**
     * @param {HTMLElement} container
     * @param {PivotOptions} [options]
     */
    constructor(container, options={}){
      if(!container) throw new Error('TFPivotGrid: container fehlt');
      this.el = container;
      this.opt = Object.assign({}, TFPivotGrid.defaults(), options);
      this.data = /** @type {PivotData} */({ rows: [], cols: [], values: {} });
      this._table = null;
      this._ensureStyles();
      this._applyDensity(this.opt.density);
      if(this.opt.className) this.el.classList.add(this.opt.className);
      this.el.classList.add('tfpivot');
      this.el.setAttribute('role','region');
    }

    /** @returns {Required<PivotOptions>} */
    static defaults(){
      return {
        showTotals: true,
        heatmap: true,
        density: 'normal',
        formatValue: (n)=> n==null || Number.isNaN(n) ? '–' : Number(n).toLocaleString('de-DE'),
        onCellClick: undefined,
        className: ''
      };
    }

    /**
     * CSS einmalig in <head> injizieren.
     */
    _ensureStyles(){
      const id = 'tfpivot-styles';
      if(document.getElementById(id)) return;
      const css = `
.tfpivot{ --cell-pad:10px 12px; --grid-border:#222734; --fg:#e8ebf1; --muted:#7e8596; --sticky:#111522e6; --hover:#1b1f2a; --total-bg:linear-gradient(180deg,#1c2130,#161a26); --total-fg:#cfe9ff; overflow:auto; border:1px solid var(--grid-border); border-radius:14px; background:#121319; box-shadow:0 12px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04);}
.tfpivot table{ border-collapse:separate; border-spacing:0; width:max-content; min-width:100%; color:var(--fg); font:14px/1.4 system-ui,Segoe UI,Roboto,Arial }
.tfpivot th, .tfpivot td{ border-right:1px solid var(--grid-border); border-bottom:1px solid var(--grid-border); padding:var(--cell-pad); white-space:nowrap; vertical-align:middle; position:relative; background:transparent }
.tfpivot th{ font-weight:600; color:var(--muted); background:var(--sticky); backdrop-filter: blur(6px); }
.tfpivot th.top{ position:sticky; top:0; z-index:3 }
.tfpivot th.left, .tfpivot td.left{ position:sticky; left:0; z-index:2; background:linear-gradient(90deg, var(--sticky), transparent 98%); }
.tfpivot th.corner{ z-index:4 }
.tfpivot tr:nth-child(even) td{ background:rgba(255,255,255,.01) }
.tfpivot td.value{ text-align:right; font-variant-numeric: tabular-nums; cursor:pointer; }
.tfpivot td.value:hover, .tfpivot td.value:focus{ outline:none; background:var(--hover) }
.tfpivot td.total, .tfpivot th.total{ background:var(--total-bg); font-weight:700; color:var(--total-fg) }
.tfpivot .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0 }
`;
      const style = document.createElement('style');
      style.id = id; style.textContent = css; document.head.appendChild(style);
    }

    /**
     * Dichte anwenden
     * @param {'compact'|'normal'|'cozy'} density
     */
    _applyDensity(density){
      const pad = density==='compact' ? '6px 8px' : density==='cozy' ? '12px 14px' : '10px 12px';
      this.el.style.setProperty('--cell-pad', pad);
    }

    /**
     * @param {PivotData} data
     */
    setData(data){
      this.data = data || { rows:[], cols:[], values:{} };
      return this;
    }

    /**
     * @param {Partial<PivotOptions>} options
     */
    updateOptions(options){
      this.opt = Object.assign({}, this.opt, options||{});
      if(options && 'density' in options) this._applyDensity(this.opt.density);
      return this;
    }

    /**
     * Erzeugt/erneuert die Tabelle im Container.
     */
    render(){
      const { rows, cols, values } = this.data;
      const { showTotals, heatmap, formatValue, onCellClick } = this.opt;
      if(!rows || !cols) return this;

      // min/max für Heatmap
      let min=Infinity, max=-Infinity;
      for(const r of rows){
        for(const c of cols){
          const v = /** @type {number} */(values?.[`${r.id}|${c.id}`]);
          if(typeof v==='number' && !Number.isNaN(v)){
            if(v<min) min=v; if(v>max) max=v;
          }
        }
      }
      if(min===Infinity){ min=0; max=0; }

      // Totals vorbereiten
      /** @type {Record<string, number>} */
      const rowTotals = {};
      /** @type {Record<string, number>} */
      const colTotals = {};
      if(showTotals){
        for(const r of rows){
          let sum=0; for(const c of cols){ const v=values?.[`${r.id}|${c.id}`]; if(typeof v==='number') sum+=v; }
          rowTotals[r.id]=sum;
        }
        for(const c of cols){
          let sum=0; for(const r of rows){ const v=values?.[`${r.id}|${c.id}`]; if(typeof v==='number') sum+=v; }
          colTotals[c.id]=sum;
        }
      }

      // Helpers
      const heat = (v)=>{
        if(!heatmap || typeof v !== 'number' || max===min) return '';
        const t = (v - min) / (max - min); // 0..1
        const hue = 210 - 15*t;     // navy -> cyan
        const sat = 70 + 25*t;
        const light = 16 + 54*t;
        const fg = t>0.6 ? '#0b0f19' : 'var(--fg)';
        return `background:hsl(${hue}deg ${sat}% ${light}%); color:${fg};`;
      };

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const trTop = document.createElement('tr');

      const corner = document.createElement('th');
      corner.className='top left corner'; corner.textContent=' ';
      trTop.appendChild(corner);

      for(const c of cols){
        const th = document.createElement('th'); th.className='top'; th.textContent = c.label; trTop.appendChild(th);
      }
      if(showTotals){ const thT = document.createElement('th'); thT.className='top total'; thT.textContent='Σ'; trTop.appendChild(thT); }
      thead.appendChild(trTop); table.appendChild(thead);

      const tbody = document.createElement('tbody');

      for(const r of rows){
        const tr = document.createElement('tr');
        const thLeft = document.createElement('th'); thLeft.className='left'; thLeft.textContent = r.label; tr.appendChild(thLeft);

        for(const c of cols){
          const key = `${r.id}|${c.id}`;
          const val = /** @type {number|null|undefined} */(values?.[key]);
          const td = document.createElement('td'); td.className='value'; td.tabIndex = 0; td.title = `${r.label} × ${c.label}: ${formatValue(val)}`;
          // Inhalt
          const inner = document.createElement('div'); inner.textContent = formatValue(val); td.appendChild(inner);
          // Heat
          if(heatmap) td.setAttribute('style', heat(val));
          // Events
          td.addEventListener('click', ()=>{
            if(typeof onCellClick==='function') onCellClick({ rowId:r.id, colId:c.id, value: typeof val==='number'?val:null, rowLabel:r.label, colLabel:c.label, el: td });
          });
          td.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); td.click(); } });
          tr.appendChild(td);
        }

        if(showTotals){
          const tdT = document.createElement('td'); tdT.className='value total';
          tdT.textContent = this.opt.formatValue(rowTotals[r.id]);
          tr.appendChild(tdT);
        }

        tbody.appendChild(tr);
      }

      if(showTotals){
        const trSum = document.createElement('tr');
        const thSumLeft = document.createElement('th'); thSumLeft.className='left total'; thSumLeft.textContent='Σ'; trSum.appendChild(thSumLeft);
        for(const c of cols){ const td = document.createElement('td'); td.className='value total'; td.textContent = this.opt.formatValue(colTotals[c.id]); trSum.appendChild(td); }
        const tdGrand = document.createElement('td'); tdGrand.className='value total'; const grand = Object.values(rowTotals).reduce((a,b)=>a+b,0); tdGrand.textContent = this.opt.formatValue(grand); trSum.appendChild(tdGrand);
        tbody.appendChild(trSum);
      }

      table.appendChild(tbody);

      // Mount (ersetzt alte Tabelle)
      this.el.innerHTML = '';
      this.el.appendChild(table);
      this._table = table;
      return this;
    }

    /** Tabelle entfernen & Aufräumen */
    destroy(){ this.el.innerHTML=''; this._table=null; }
  }

  // UMD-Export
  if(root){ root[name] = TFPivotGrid; }
  // ESM default zurückgeben
  if(typeof module !== 'undefined' && module.exports){ module.exports = TFPivotGrid; }
  else if(typeof define === 'function' && define.amd){ define(()=>TFPivotGrid); }
  else { /* ES Module via <script type="module"> import default from file */ }

  // attach to factory return for ESM usage
  return TFPivotGrid;

})(typeof window !== 'undefined' ? window : undefined, 'TFPivotGrid');

// --- ESM Default Export (falls als ES Module geladen) ---
export default (typeof window !== 'undefined' && window.TFPivotGrid) ? window.TFPivotGrid : undefined;

/*
USAGE (ohne Frameworks)
-----------------------
<link rel="stylesheet" href="(nicht nötig – Styles werden injiziert)">
<div id="pivot"></div>
<script type="module">
  import TFPivotGrid from './TFPivotGrid.js';

  const data = {
    rows: [ {id:'cc100', label:'KST 100 – Verwaltung'}, {id:'cc200', label:'KST 200 – Vertrieb'} ],
    cols: [ {id:'q1', label:'Q1'}, {id:'q2', label:'Q2'}, {id:'q3', label:'Q3'} ],
    values: { 'cc100|q1':12034, 'cc100|q2':15440, 'cc100|q3':14110, 'cc200|q1':22010, 'cc200|q2':19990, 'cc200|q3':24500 }
  };

  const grid = new TFPivotGrid(document.getElementById('pivot'), {
    showTotals: true,
    heatmap: true,
    density: 'compact',
    onCellClick: ({rowId, colId}) => openDetails(rowId, colId)
  });

  grid.setData(data).render();
</script>

API (Kurz)
----------
new TFPivotGrid(container, options?)
  .setData({ rows, cols, values })
  .updateOptions(partialOpts)
  .render();

Options: {
  showTotals?: boolean = true,
  heatmap?: boolean = true,
  density?: 'compact'|'normal'|'cozy' = 'normal',
  formatValue?: (n:number|null|undefined)=>string,
  onCellClick?: ({ rowId, colId, value, rowLabel, colLabel, el })=>void,
  className?: string
}
*/
