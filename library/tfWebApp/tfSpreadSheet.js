import * as globals   from "./globals.js";
import { TFPanel }    from "./tfObjects.js";
import * as utils     from "./utils.js";
import * as dialogs   from "./tfDialogs.js";
import { TFDateTime } from "./utils.js";

class TFCell 
{
  constructor(aParent, inRow , l, t, w, h, cellName , onCellClick , onCellMove , onCellLeave ) 
  {
    this.parent   = aParent;
    this.myRow    = inRow;
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

  numValue()
  {
    if(this._value==undefined) return 0;
    if(this._value==null) return 0;
    if(this._value=='')   return 0;
    if(this._value==' ')  return 0;

    if(isNaN(this._value)) return 0;
    
    return parseFloat(this._value);
  }


}

export class TFSreadSheet 
{
  constructor(aParent, buildingPlan)
  {
    this.parent = aParent;
    this.rows         = [];
    this.cellNames    = new Map();
    this.selectedCell = null;
    this.savedBorder  = {width:1,color:'black'};

    var headPlan      = [];

    if (buildingPlan.hasOwnProperty("layout")) 
    {
      var layoutArr = buildingPlan.layout.split('x');
      this.colCount = parseInt(layoutArr[0]);
      this.rowCount = parseInt(layoutArr[1]);
    }
    else
        {
          // Grid-Größe aus dem Plan ermitteln
          headPlan = (buildingPlan.head || "x").split(" ");
    
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
    }      
          
    utils.buildGridLayout(this.parent, `${this.colCount}x${this.rowCount}` , {rowHeight:Math.round(utils.pixProEM(this.parent)*2) });  // 1.5em in Pixel 

    this.cellNames.clear();

    if (buildingPlan.hasOwnProperty("layout"))
    {
      // Head
      let aRow = []; 
      for( let i=0; i<this.colCount; i++) this.createCell( aRow , i+1 , 1 , 1 , 1 );
      this.rows.push(aRow);

      // Body
      for( let j=1; j<this.rowCount; j++) 
      {
        let aRow = []; 
        for(let i=0; i<this.colCount; i++) this.createCell( aRow , i+1 , j+1 , 1 , 1 );
        this.rows.push(aRow);
      }  
      return;
    }   


    // HEAD (Zeile 1)
    let l = 1;
    let aRow = []; 
    for (let i = 0; i < headPlan.length; i++) 
    {
      const w    = ___numColumns(headPlan[i]);
      if(w>0){ 
               this.createCell( aRow , l , 1 , w , 1 );
               l += w;
             }  
    }
    this.rows.push(aRow);



    // BODY (ab Zeile 2)
     const rows = buildingPlan.rows || [];
     for (let j = 1; j < rows.length; j++) 
     {
      const row = rows[j].split(" ");
      let   lx  = 1;
      let  aRow = []; 
      for (let i = 0; i < row.length; i++) 
      {
        const w    = ___numColumns(row[i]);
        if(w>0){
                this.createCell( aRow , lx , j+1 , w , 1 )
                lx += w;
              } 
       }
       this.rows.push(aRow)
     }
   
} 


createCell( inRow , col , row , width , height )
{ 
  const cell = new TFCell(this.parent, inRow , col , row , width , height , '' ,  function( cell ){this.onCellClick( cell )}.bind(this) , 
                                                                                  function( cell ){this.onCellMove ( cell )}.bind(this) ,
                                                                                  function( cell ){this.onCellLeave( cell )}.bind(this) );
  inRow.push(cell);
  this.cellNames.set( cell.cellName , cell );
  return cell;
}


deleteCell( cell )
{ 
  if(cell==null) return;
  if(cell==undefined) return;

  let index = cell.myRow.indexOf(cell);
  if (index !== -1) cell.myRow.splice(index, 1);

  this.cellNames.delete(cell.cellName);

  cell.obj.remove();
}

forEachCell( f )
{
  for(var i=0; i<this.rows.length; i++)
      for(var j=0; j<this.rows[i].length; j++)    
      {
        var c=this.rows[i][j];
        f(c);
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
  var n = 'R'+row+'C'+col;
 return this.getCellbyName(n);
}   


getCellbyName(cellName)
{ 
    return this.cellNames.get(cellName);
}

buildCluster( cellRange )
{ 
  for(var i=0; i<cellRange.length; i++) if(cellRange[i]==null) return null;

  // aus dem Cell-Array wird die Dimension der Range ermittelt und als EINE Zelle betrachtet.
  // All durch diesen Vorgang überlappten Zellen werden gelöscht...
  var l=Number.MAX_SAFE_INTEGER;
  var t=Number.MAX_SAFE_INTEGER;
  var r=Number.MIN_SAFE_INTEGER;
  var b=Number.MIN_SAFE_INTEGER;

  for (var i=0; i<cellRange.length; i++)
  {
    var c=cellRange[i];
    if(l>c.colNr) l=c.colNr;
    if(t>c.rowNr) t=c.rowNr;
    if(r<(c.colNr+c.width))  r=c.colNr+c.width;
    if(b<(c.rowNr+c.height)) b=c.rowNr+c.height;
  }

  var clusterStartCell = this.getCell(l,t);
  var clusterStartRow  = clusterStartCell.myRow;
  var deleteCells = [];
  this.forEachCell(function(c){if((c.colNr>=l)&&(c.colNr<r)&&(c.rowNr>=t)&&(c.rowNr<b)) this.deleteCells.push(c)}.bind({deleteCells:deleteCells}))
  
  while(deleteCells.length > 0) 
  {
    var c=deleteCells[0];
    deleteCells.splice(0,1);
    this.deleteCell(c);
  }  
  // cluster-Zelle ausdehnen ....
  return this.createCell( clusterStartRow , l , t , (r-l) , (b-t));

}


range(cell1,cell2)
{
  var l=cell1.colNr<cell2.colNr?cell1.colNr:cell2.colNr;
  var r=cell2.colNr<cell1.colNr?cell1.colNr:cell2.colNr;

  var t=cell1.rowNr<cell2.rowNr?cell1.rowNr:cell2.rowNr;
  var b=cell2.rowNr<cell1.rowNr?cell1.rowNr:cell2.rowNr;

  var rangeCells = [];
  this.forEachCell( (c)=> {
                            //console.log("cell "+c.cellName+"  col:"+c.colNr+"  bound("+l+"<-->"+r+")  row:"+c.rowNr+"  bound("+t+"<-->"+b+")");
                            if((c.colNr>=l)&&(c.colNr<=r)&&(c.rowNr>=t)&&(c.rowNr<=b)) {console.log('hit'); rangeCells.push(c)}
                          })
 
  return rangeCells;  
}

summe(cell1,cell2)
{
  var sum = 0;
  this.range(cell1,cell2).forEach(c=>{console.log('sum:'+sum+' c.value: '+c.value+' c.numValue() : '+c.numValue()); sum=sum+c.numValue()})
  return sum;
}




exportToExcel()
{
  dialogs.showMessage('not implemented yet ...');
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
