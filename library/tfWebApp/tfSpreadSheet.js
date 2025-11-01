import * as globals   from "./globals.js";
import { TFPanel }    from "./tfObjects.js";
import * as utils     from "./utils.js";
import { TFDateTime } from "./utils.js";

class TFCell {
  constructor(aParent, l, t, w, h) {
    this.parent = aParent;
    this.obj    = new TFPanel(aParent, l, t, w, h, { css: "cssSpreadSheetCell" });
    this._value = null;
  }
  set value(v) {
    this._value = v;
    this.obj.innerHTML = v;
  }
  get value() { return this._value; }
}

export class TFSreadSheet 
{
  constructor(aParent, buildingPlan)
  {
    this.parent = aParent;

    this.head   = [];
    this.body   = [];

    // Koordinaten-Map und Proxy-Cache
    this._cellByCoord = new Map();     // key: "x,y" -> TFCell
    this._xProxyCache = new Map();     // key: x     -> Proxy für zweite Ebene

    // Grid-Größe aus dem Plan ermitteln
    const headPlan = (buildingPlan.head || "x").split(" ");
    let colCount = 0;
    for (let i = 0; i < headPlan.length; i++) colCount += ___numColumns(headPlan[i]);
    let rowCount = (buildingPlan.rows || []).length + 1;

    this.colCount   = colCount || 1;
    this.rowCount   = rowCount || 1;
    this.autoExpand = true; // <— wenn true, wächst das Grid bei Bedarf mit

    utils.buildGridLayout(this.parent, `${this.colCount}x${this.rowCount}`);

    // HEAD (Zeile 1)
    let l = 1;
    for (let i = 0; i < headPlan.length; i++) {
      const w = ___numColumns(headPlan[i]);
      const cell = new TFCell(this.parent, l, 1, w, 1);
      this.head.push(cell);
      this._cellByCoord.set(this._key(l, 1), cell);
      l += w;
    }

    // BODY (ab Zeile 2)
    const rows = buildingPlan.rows || [];
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j].split(" ");
      let lx = 1;
      for (let i = 0; i < row.length; i++) {
        const w = ___numColumns(row[i]);
        const cell = new TFCell(this.parent, lx, j + 2, w, 1);
        this.body.push(cell);
        this._cellByCoord.set(this._key(lx, j + 2), cell);
        lx += w;
      }
    }

    // ---------- geschachtelter Proxy: table.cells[x][y] ----------
    this.cells = new Proxy({}, {
      get: (_t1, xProp) => {
        const x = this._toIndex(xProp);
        if (x == null) return undefined;

        // Unter-Proxy (2. Ebene) aus Cache holen/erzeugen
        if (!this._xProxyCache.has(x)) {
          const secondLevel = new Proxy({}, {
            get: (_t2, yProp) => {
              const y = this._toIndex(yProp);
              if (y == null) return undefined;
              const cell = this._getOrCreate(x, y);
              return cell?.getValue();
            },
            set: (_t2, yProp, value) => {
              const y = this._toIndex(yProp);
              if (y == null) return false;
              const cell = this._getOrCreate(x, y);
              if (cell) cell.setValue(value);
              return true;
            },
            has: (_t2, yProp) => {
              const y = this._toIndex(yProp);
              return y != null && this._cellByCoord.has(this._key(x, y));
            },
            ownKeys: () => {
              // optional: alle vorhandenen y für dieses x
              const ys = [];
              for (const k of this._cellByCoord.keys()) {
                const [kx, ky] = k.split(",").map(Number);
                if (kx === x) ys.push(String(ky));
              }
              return ys;
            },
            getOwnPropertyDescriptor: (_t2, yProp) => {
              const y = this._toIndex(yProp);
              if (y != null && this._cellByCoord.has(this._key(x, y))) {
                return { enumerable: true, configurable: true };
              }
              return undefined;
            }
          });
          this._xProxyCache.set(x, secondLevel);
        }
        return this._xProxyCache.get(x);
      }
    });
  }

  // ---------- Öffentliche Helfer ----------
  setCell(x, y, v) { this._getOrCreate(x, y)?.setValue(v); }
  getCellValue(x, y) { return this._cellByCoord.get(this._key(x, y))?.getValue(); }
  getCell(x, y) { return this._cellByCoord.get(this._key(x, y)) || null; }

  // ---------- Interne Helfer ----------
  _key(x, y) { return `${x},${y}`; }

  _toIndex(prop) {
    // akzeptiert Zahl oder stringifizierte Zahl (Proxy keys sind oft Strings)
    const n = Number(prop);
    return Number.isInteger(n) && n >= 1 ? n : null; // 1-basiert
  }

  _getOrCreate(x, y) {
    // ggf. Grid erweitern
    if ((x > this.colCount || y > this.rowCount) && this.autoExpand) {
      this._expandGridTo(Math.max(x, this.colCount), Math.max(y, this.rowCount));
    }
    const k = this._key(x, y);
    let cell = this._cellByCoord.get(k);
    if (!cell) {
      // neue 1x1-Zelle an Position (x,y) erzeugen
      cell = new TFCell(this.parent, x, y, 1, 1);
      this.body.push(cell);
      this._cellByCoord.set(k, cell);
    }
    return cell;
  }

  _expandGridTo(newCols, newRows) {
    if (newCols <= this.colCount && newRows <= this.rowCount) return;
    this.colCount = Math.max(this.colCount, newCols);
    this.rowCount = Math.max(this.rowCount, newRows);
    // Grid neu setzen – vorhandene Panels behalten ihre l/t/w/h und bleiben positioniert
    utils.buildGridLayout(this.parent, `${this.colCount}x${this.rowCount}`);
  }
}

// Hilfsfunktion aus deinem Code
function ___numColumns(st) {
  if (st === "x") st = "1x";
  const h = st.split("x")[0];
  return isNaN(h) ? 1 : parseInt(h, 10);
}
