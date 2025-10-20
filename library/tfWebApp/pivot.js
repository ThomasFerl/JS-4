const pivotpivotDataDemo = [
                         [""         , "Januar", "Februar", "März"],
                         ["Produkt A", 120     , 150      , 100   ],
                         ["Produkt B", 80      , 90       , 110   ],
                         ["Produkt C", 200     , 180      , 160   ]
                        ];  
  
  


export function calcPivotData(daten, xField, yField, sumXY) 
{
  const matrix = [];
  const xSet = new Set();
  const ySet = new Set();

  // Distinct-Werte sammeln
  daten.forEach(row => {
    xSet.add(row[xField]);
    ySet.add(row[yField]);
  });

  const xValues = Array.from(xSet);
  const yValues = Array.from(ySet);

  // Summierfunktion mit Typprüfung
  const sum = (xVal, yVal) => {
    return daten
      .filter(row => row[xField] === xVal && row[yField] === yVal)
      .reduce((acc, row) => {
        const raw = row[sumXY];
        const num = Number(raw);
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
  };

  // Kopfzeile
  matrix.push(['', ...xValues]);

  // Matrix-Zeilen
  yValues.forEach(yVal => {
    const row = [yVal];
    xValues.forEach(xVal => {
      row.push(sum(xVal, yVal));
    });
    matrix.push(row);
  });

  matrix[0][0] = JSON.stringify({ xField: xField, yField: yField });

  return matrix;
}





  export function renderPivotData(container , pivotData , callBack_onClick ) 
  {
    let fieldNames = JSON.parse(pivotData[0][0] || '{}') 
    let xfieldName = fieldNames.xField;
    let yfieldName = fieldNames.yField;
    pivotData[0][0]= '';

    const table    = document.createElement("table");
    table.classList.add("pivot-table");

    const thead    = document.createElement("thead");
    const tbody    = document.createElement("tbody");
    const maxValue = getMaxValue(pivotData);

    // Kopfzeile
    const headerRow = document.createElement("tr");
    
    pivotData[0].forEach((col, index) => 
    {
      const th       = document.createElement("th");
      th.textContent = index === 0 ? "" : col;
      th.classList.add("pivot-col-header");
      headerRow.appendChild(th);
    });
    
    const thSum       = document.createElement("th");
    thSum.textContent = "Σ Zeile";
    thSum.classList.add("pivot-col-header");
    headerRow.appendChild(thSum);
    thead.appendChild(headerRow);

    // Datenzeilen
    for (let i = 1; i < pivotData.length; i++) 
    {
      const tr              = document.createElement("tr");
      const rowLabel        = pivotData[i][0];
      const rowHeader       = document.createElement("td");
      rowHeader.textContent = rowLabel;
      rowHeader.classList.add("pivot-row-header");
      tr.appendChild(rowHeader);

      let rowSum = 0;
      for (let j = 1; j < pivotData[i].length; j++) 
      {
        const value              = pivotData[i][j];
        rowSum                  += value;
        const td                 = document.createElement("td");
        td.textContent           = value;
        td.style.backgroundColor = getColor(value, maxValue);

        td.onclick = function(){ if(callBack_onClick) callBack_onClick(this.xfieldName,this.yValue,this.yfieldName,this.xValue); }.bind({xfieldName :xfieldName,
                                                                                                                                         xValue     :rowLabel,
                                                                                                                                         yfieldName :yfieldName,
                                                                                                                                         yValue     :pivotData[0][j] });

        tr.appendChild(td);
      }


      const tdSum       = document.createElement("td");
      tdSum.textContent = rowSum;
      tdSum.classList.add("pivot-sum-cell");
      tr.appendChild(tdSum);

      tbody.appendChild(tr);
    }

    // Summenzeile
    const sumRow         = document.createElement("tr");
    const sumLabel       = document.createElement("td");
    sumLabel.textContent = "Σ Spalte";
    sumLabel.classList.add("pivot-row-header");
    sumRow.appendChild(sumLabel);

    let grandTotal = 0;
    for (let j = 1; j < pivotData[0].length; j++) 
    {
      let colSum = 0;
      for (let i = 1; i < pivotData.length; i++) colSum += pivotData[i][j];

      grandTotal     += colSum;
      const td        = document.createElement("td");
      td.textContent  = colSum;
      td.classList.add("pivot-sum-cell");
      sumRow.appendChild(td);
    }

    const tdGrand       = document.createElement("td");
    tdGrand.textContent = grandTotal;
    tdGrand.classList.add("pivot-sum-cell");
    sumRow.appendChild(tdGrand);

    tbody.appendChild(sumRow);

    table.appendChild(thead);
    table.appendChild(tbody);

    container.appendChild(table);
  }

  
 function getMaxValue(pivotData) 
 {
    let max = 0;
    for (let i = 1; i < pivotData.length; i++) {
      for (let j = 1; j < pivotData[i].length; j++) {
        max = Math.max(max, pivotData[i][j]);
      }
    }
    return max;
  }


  function getColor(value, max) 
  {
    const intensity = value / max;
    const blue = Math.round(255 * intensity);
    return `rgb(${255 - blue}, ${255 - blue}, 255)`; // Weiß → Hellblau
  }
