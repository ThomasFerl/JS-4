import * as globals   from "./globals.js";
import { TFPanel }    from "./tfObjects.js";
import * as utils     from "./utils.js";
import { TFDateTime } from "./utils.js";

class TFCell 
{
  constructor(aParent, l, t, w, h, cellName , onCellClick , onCellMove , onCellLeave ) 
  {
    this.parent   = aParent;
    this.rowNr    = t;
    this.colNr    = l;
    this.width    = w;
    this.height   = h;
    this.cellName = cellName || 'R'+t+'C'+l;
    this.obj      = new TFPanel(aParent, l, t, w, h, { css: "cssSpreadSheetCell" });
    this._value   = null;

    this.onCellClick = onCellClick;
    this.onCellMove  = onCellMove;
    this.onCellLeave = onCellLeave;
    
    this.obj.callBack_onClick     = function(){ if(this.onCellClick) this.onCellClick(this) }.bind(this);
    this.obj.callBack_onMouseMove = function(){ if(this.onCellMove)  this.onCellMove (this) }.bind(this);
    this.obj.callBack_onMouseOut  = function(){ if(this.onCellLeave) this.onCellLeave(this) }.bind(this);


   
    // um die Eigenschaften vom TFPanel nicht einzeln "wrappen" zu müssen nutzen wir eine Proxy-Klasse
    // ACHTUNG: Als Rückgabe gibt es jetzt keine TFCell sondern ein Proxy, dass sich wie ein TFCell verhält ....

     return new Proxy(this, {
      get(target, prop) {
        if (prop in target.obj) {
          return target.obj[prop];
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (prop in target.obj) {
          target.obj[prop] = value;
          return true;
        }
        target[prop] = value;
        return true;
      }
    });
  }


  set value(v) 
  {
    this._value = v;
    this.obj.innerHTML = v;
  }
  
  get value() 
  { 
    return this._value; 
  }

}

export class TFSreadSheet 
{
  constructor(aParent, buildingPlan)
  {
    this.parent = aParent;

    this.head         = [];
    this.rows         = [];
    this.cellNames    = new Map();
    this.selectedCell = null;
    this.savedBorder  = {width:1,color:'black'};

     // Grid-Größe aus dem Plan ermitteln
    const headPlan = (buildingPlan.head || "x").split(" ");
    
    let colCount = 0;
    for (let i = 0; i < headPlan.length; i++) colCount += ___numColumns(headPlan[i]);
    

    // ist buildingPlan ein String, dann muss dieswer geparst werden...
    if(typeof buildingPlan.rows === "string")
    { 
       // z.B.: '10*[4x . . . x x x x x x]' 
       var subStrArray = buildingPlan.rows.split('*');
       this.rowCount   = parseInt( subStrArray[0] , 10) + 1;
       var hlp = [];
       for(var i=0; i<this.rowCount; i++) hlp.push(subStrArray[1].replace('[','').replace(']','') );

       buildingPlan.rows = hlp;
    } // isString
    

    let rowCount = (buildingPlan.rows || []).length + 1;

    this.colCount   = colCount || 1;
    this.rowCount   = rowCount || 1;
    this.autoExpand = true; // <— wenn true, wächst das Grid bei Bedarf mit

    utils.buildGridLayout(this.parent, `${this.colCount}x${this.rowCount}` , {minRowHeight:Math.round(utils.pixProEM(this.parent)*1.5) });  // 1.5em in Pixel 

    // HEAD (Zeile 1)
    let l = 1;
    for (let i = 0; i < headPlan.length; i++) 
    {
      const w    = ___numColumns(headPlan[i]);
      if(w>0){ 
               const cell = new TFCell(this.parent, l, 1, w, 1 , '' , function( cell ){this.onCellClick( cell )}.bind(this) , 
                                                                      function( cell ){this.onCellMove ( cell )}.bind(this) ,
                                                                      function( cell ){this.onCellLeave( cell )}.bind(this) );
               this.head.push(cell);
               l += w;
             }  
    }

    // BODY (ab Zeile 2)
    this.rows  = [];
    this.cellNames.clear();
    
     const rows = buildingPlan.rows || [];
     for (let j = 0; j < rows.length; j++) 
     {
      const row = rows[j].split(" ");
      let   lx  = 1;
      let  aRow = []; 
      for (let i = 0; i < row.length; i++) 
      {
        const w    = ___numColumns(row[i]);
        if(w>0){
                const cell = new TFCell(this.parent, lx, j + 2, w, 1 , '' ,  function( cell ){this.onCellClick( cell )}.bind(this) , 
                                                                             function( cell ){this.onCellMove ( cell )}.bind(this) ,
                                                                             function( cell ){this.onCellLeave( cell )}.bind(this) );
                aRow.push(cell);
                this.cellNames.set( cell.cellName , cell )
                lx += w;
              } 
       }
       this.rows.push(aRow)
     }
   
  } 

onCellClick( cell )
{ 
  if(cell==this.selectedCell) return;
  
  if(this.selectedCell!=null) 
  {
    this.selectedCell.obj.borderColor = this.savedBorder.color;
    this.selectedCell.obj.borderWidth = this.savedBorder.width;
    this.selectedCell.obj.margin      = 0;
  }  
 
  this.selectedCell                   = cell;
  this.savedBorder.color              = cell.obj.borderColor;
  this.savedBorder.width              = cell.obj.borderWidth;

  this.selectedCell.obj.margin        = '2px';
  this.selectedCell.obj.borderColor   = 'black';
  this.selectedCell.obj.borderWidth   = '2px';
  
}
  


onCellMove( cell )
{
 console.log('cellMove -> ' + cell.cellName)
}
  
onCellLeave( cell )
{
  console.log('cellLeave -> ' + cell.cellName)
}




  getCell(col,row)
  {
    if(row<this.rows.length)
    {
      var aRow = this.rows[row];
      if (col<aRow.length) return aRow[col];
      else return null;
    }
    else return null;
  }

  getCellbyName(cellName)
  { 
    return this.cellNames.get(cellName);
  }


}  
   

// Hilfsfunktion...
function ___numColumns(st) 
{
  if (st === '.') return 0;
  if (st === ' ') return 0;
  if (st ===  '') return 0;
  if (st === "x") st = "1x";
  const h = st.split("x")[0];
  return isNaN(h) ? 1 : parseInt(h, 10);
}
