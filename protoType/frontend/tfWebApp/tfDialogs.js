/*
Eingabefeld - Typen
===================

<input type="checkbox">
<input type="color">
<input type="date">
<input type="datetime-local">
<input type="email">
<input type="file">
<input type="month">
<input type="number">
<input type="password">
<input type="radio">
<input type="range">
<input type="search">
<input type="tel">
<input type="text">
<input type="time">
<input type="url">
<input type="week">
<meter>
<progress>
<select>
<textarea>
*/

import * as globals   from "./globals.js";
import * as utils     from "./utils.js";

import { TFDateTime } from "./utils.js";
import { TFWindow   } from "./tfWindows.js";
import { THTMLTable } from "./tfGrid.js";
import { TFTreeView } from "./tfTreeView.js"; 

import { TFCheckBox, 
         TFileUploader, 
         TFImage, 
         TFLabel,     
         TFPanel,
         TFEdit,
         TFComboBox,
         TFButton,
         TForm,
         TPropertyEditor,
         TFileDialog,
         TFListCheckbox } from "./tfObjects.js";

var   splash  = {panel:null, imgPanel:null, msgPanel:null, msg:'...' , activ:false};


export function createWindow(aParent , aCaption , aWidth , aHeight , position )
{
   var wnd = new TFWindow( aParent , aCaption , aWidth , aHeight , position );
   return wnd;
} 
    
   
export function removeWindow( aWindow )
{
    aWindow.destroy();
}
 


export function setLayout( wnd , settings )
{
  wnd.buildGridLayout_templateColumns('repeat('+settings.gridCount+', 1fr)');
  wnd.buildGridLayout_templateRows   ('repeat('+settings.gridCount+', 1fr)');

   var l=1;
   var t=1;
   var f=1;
   var r=settings.gridCount-1;
   var h=settings.gridCount+1;
   var w=settings.gridCount;
  
   var controls = {};

  for (var key in settings)
  {
    if(key=='head') { controls.head = this.addPanel(wnd,'',l,1,w,settings[key]);
                      h=h-settings[key];
                      t=settings[key]+1;
    }

    if(key=='left') { controls.left = this.addPanel(wnd,'',1,t,settings[key],h);
                      controls.left.margin='4px';
                      w=w-settings[key];
                      l=settings[key]+1;
    }
     
    if(key=='right') { controls.right = this.addPanel(wnd,'',settings.gridCount-settings[key]+1,t,settings[key],h);
                      controls.right.margin='4px';
                      w=w-settings[key];
                      r=settings.gridCount-settings[key]+1;
    }

    if(key=='footer') { controls.footer = this.addPanel(wnd,'cssContainerPanel',l,settings.gridCount-settings[key]+1,w,settings[key]);
                      controls.footer.margin ='4px';
                      h=h-settings[key];
    }

    
 }

  controls.dashBoard = this.addPanel(wnd,'',l,t,w,h-1);
  controls.dashBoard.margin = '4px';

  return controls;

}


export function setButton( ctrl , settings )
{
  var numBtn    = settings.btn.length + 2;
  var btns      = {};

  ctrl.buildGridLayout_templateColumns('repeat('+numBtn+', 1fr)');
  ctrl.buildGridLayout_templateRows   ('1fr '+settings.btnHeight+' 1fr');
  
  for (var i=0; i<settings.btn.length; i++) 
  {
    var n = settings.btn[i].name;
    var t = settings.btn[i].text;
    var d = {};
    if(settings.btn[i].caption) d.caption = settings.btn[i].caption;
    if(settings.btn[i].text)    d.caption = settings.btn[i].text;
    if(settings.btn[i].glyph)   d.glyph   = settings.btn[i].glyph;
    
    btns[n] = addButton( ctrl , '' , i+2 , 2 , 1 , 1 , d )
  }  
  
}


export function addLabel( aParent , className , left , top , width , height , text )
{
  var params = {caption:text};
  if (className) params.css = className;
  
  if (width==null) width = (text.length+1)+'em';
  if (height==null) height = '2em';

  return new TFLabel( aParent , left , top , width , height , params );
}


export function addButton( aParent , className , left , top , width , height , decoration  )
{
  var capt  = '';
  var glyph = '';
  
  if(utils.isJSON(decoration)) 
  {
    capt  = decoration.caption;
    glyph = decoration.glyph;
  } else capt = decoration;
  
  var params = {};
  if (className) params.css              = className;     
  if (capt)      params.caption          = capt;
  if (glyph)     params.glyph            = glyph;

  var btn = new TFButton( aParent  , left , top , width , height , params );

  return btn;
}


export function addImage( aParent , className , left , top , width , height , imgURL )
{
  return new TFImage( aParent , left , top , width , height , {imgURL:imgURL} );
}   


export function lineBreak(aParent)
{
  var br = document.createElement("br");
  aParent.DOMelement.appendChild( br );
  return br;  
}


export function addPanel( aParent , className , left , top ,width , height , dontRegister )
{
  var params = {stretch:true};
  if (className)    params.css           = className;
  if (!dontRegister) params.dontRegister = false;
  else params.dontRegister               = true; 
   
  return new TFPanel( aParent , left , top , width , height , params );
}


export function addInput( aParent , left , top , textLength  , labelText , appendix , preset , params )
{
  if(!params) params = {};

  if (labelText)  params.caption    = labelText;
  if (textLength) params.editLength = textLength;
  if (appendix)   params.appendix   = appendix;
  if (preset)     params.value      = preset;

  return new TFEdit( aParent , left , top  , 1 , 1 , params );

}


export function addDateTimePicker( aParent , left , top , labelText , preset , dontRegister , params)
{
 
  if(!params) var params = {};

      params.type  = "datetime-local";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

      preset = preset || '';
      var  d = new TFDateTime(preset); 
      inp.setDateTime(d);
     
     return inp;
   }




export function addDatePicker( aParent , left , top , labelText , preset , dontRegister , params)
{
 
  if(!params) var params = {};

      params.type  = "date";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

   preset = preset || '';
   var  d = new TFDateTime(preset); 
   inp.setDateTime(d);
  
  return inp;
}


export function addTimePicker( aParent , left , top , labelText , preset , dontRegister , params)
{
 
  if(!params) var params = {};

      params.type  = "time";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

      preset = preset || '';
      var  d = new TFDateTime(preset); 
      inp.setDateTime(d);
     
     return inp;
}



export function addFileUploader( button , fileTyp , multiple , onChange )
{
  return new TFileUploader( button , fileTyp , multiple , onChange );   
}


export function addCombobox( aParent , left , top , textLength  , labelText , appendix , preset , items , params )
{
  if(!params) params = {};

  if (labelText)  params.caption    = labelText;
  if (textLength) params.editLength = textLength;
  if (appendix)   params.appendix   = appendix;
  if (preset)     params.value      = preset;
  if (items)      params.items      = items;

  return new TFComboBox( aParent , left , top  , 1 , 1 , params );

}

export function addCheckBox( aParent , left , top , labelText , preset , params )
{
  if(!params) params = {css:"cssPanelForInput", checkboxLeft:true};
   
    params.css     = params.css || "cssPanelForInput"; 
    params.caption = labelText  || 'checkBox';
    params.checked = preset     || false;

   return new TFCheckBox( aParent , left , top , 1 , 1 , params );
}

export function addListCheckbox(aParent , items )
{
  var params = {items:items};

      aParent.buildGridLayout_templateColumns('1fr' , {stretch:true});
      aParent.buildGridLayout_templateRows   ('1fr' , {stretch:true});

  return  new TFListCheckbox( aParent , 1 , 1 , 1 , 1 , params );
}


function translate( fieldName , lookUpList )
{
  if (!lookUpList) return fieldName;
  var h = lookUpList[fieldName];
  if(!h) return fieldName;
  return h;
}



export function valueList( aParent , className , values , exclude , translation )
{
 if(!exclude) exclude = ['',''];

  aParent.innerHTML = '';
  aParent.buildBlockLayout();
  
  var l   = [];
    
  // ist Values ein Array von {field:value},{...}, ....
  if(values.length>1)
  {
    for (var j=0; j<values.length; j++ )
        for(var key in values[j]) 
           if(exclude.indexOf(key)<0) l.push({caption:translate(key , translation) , value: values[j][key] });
  }  
  else 
     {
       for(var key in values) 
          if(exclude.indexOf(key)<0) l.push({caption:translate(key , translation) , value:values[key] });
      }
  
  var css = className || 'cssvalueListPanelJ4';    

  for(var i=0; i<l.length; i++)
  {
    var p = this.addPanel( aParent , css , 0 , 0 , '99%' , '2em' );  
        p.buildGridLayout_templateColumns('1fr 1fr');
        p.buildGridLayout_templateRows('1fr');
        p.backgroundColor = (i % 2) != 0 ? "RGB(240,240,240)" : "RGB(255,255,255)"; 
        addLabel(p,'cssBoldLabel', 1 , 1, 1 ,1 , l[i].caption).textAlign = 'left';
        addLabel(p,'cssLabel'    , 2 , 1, 1 ,1 , l[i].value  ).textAlign = 'left';
    }
      
}


export function valueList_basedOn_HTTPRequest( aParent , className , url )
{
  var response = utils.httpRequest( url );
  if(response.error)
   {
      console.log('Fehler: ' + response.errMsg );
      aParent.innerHTML = '';
   }
    else valueList( aParent , className , response.result );
      
}



export function createTable( aParent , jsonData , exclude , translation )
{
  var table = new THTMLTable( jsonData , exclude );
  if(translation) 
  for (let fieldName in translation) 
  {
    var field     = table.fieldByName(fieldName);
    if (field) field.caption = translation[fieldName];
     
  }

  table.build( aParent);
  return table;
}


// nur nutzbar, wenn chartjs im index.html-header eingebunden ist !!! 
export function createChart(aParent, chartType, caption, jsonData, onChartClick, hostedObject)
 {
  aParent.DOMelement.innerHTML = '';

  // Chart type settings
  let _chartType = chartType;
  let _tension = 0;
  let _radius = 4;
  if (chartType.toUpperCase().indexOf('SPLINE') > -1) {
      _chartType = 'line';
      _tension = 0.4;
  }
  if (chartType.toUpperCase().indexOf('SPLINE_NO_POINTS') > -1) {
      _chartType = 'line';
      _tension = 0.4;
      _radius = 0;
  }

  // Create canvas
  const canvas = createCanvas(aParent);
  const chartOptions = {
                         showLines: true,
                         elements : {
                                      line  : { tension: _tension },
                                      point : { radius : _radius }
                                    },
      
      events     : ['mousemove', 'mouseout', 'click', 'touchstart'],

      interaction: {
                    mode     : 'nearest',
                    axis     : 'x',
                    intersect: true
                   },
      
      onHover    : function(event, activeElements) 
                   {
                     // Reset all points
                     this.data.datasets.forEach((dataset) => {
                     dataset.backgroundColor = dataset.backgroundColor.map(() => 'rgb(147, 147, 147)');    
                    });

                    // Highlight the current point
                    if (activeElements.length > 0) 
                    {
                      const index        = activeElements[0].index;
                      const datasetIndex = activeElements[0].datasetIndex;
                      this.data.datasets[datasetIndex].backgroundColor[index] = 'red';
                    }

                    this.update();
                   },

      onClick    : function(e) 
                   {
                     const clickedPoints = this.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
                     if (clickedPoints.length > 0) 
                      {
                        const clickedPoint = clickedPoints[0];
                        // Reset all points to original color
                        this.data.datasets[clickedPoint.datasetIndex].backgroundColor = this.data.datasets[clickedPoint.datasetIndex].backgroundColor.map(() => 'rgb(147, 147, 147)');
                        // Mark the clicked point
                        this.data.datasets[clickedPoint.datasetIndex].backgroundColor[clickedPoint.index] = chartSelectedColor;
                        const label = this.data.labels[clickedPoint.index];
                        const value = this.data.datasets[clickedPoint.datasetIndex].data[clickedPoint.index];

                        if(onChartClick) onChartClick({chart: this, itemIndex: clickedPoint.index, selectedLabel: label, selectedValue: value, hostedObject: hostedObject });
                        this.update();
                     }
                   }
  };

  const chartParams = {
      type: _chartType,
      options: chartOptions,
      plugins: [
          {
              beforeDraw: function(chart) {
                  const ctx = chart.ctx;
                  ctx.fillStyle = gridAreaBackgroundColor;
                  ctx.fillRect(0, 0, chart.width, chart.height);
              }
          }
      ],
      data: {
          labels: [],
          datasets: [
              {
                  label: caption,
                  pointBackgroundColor: chartPointColor,
                  backgroundColor: [],
                  borderWidth: chartBorderWidth,
                  borderColor: chartBorderColor,
                  data: []
              }
          ]
      }
  };

  for (let i = 0; i < jsonData.length; i++) {
      chartParams.data.labels.push(jsonData[i].X);
      chartParams.data.datasets[0].data.push(jsonData[i].Y);
      chartParams.data.datasets[0].backgroundColor.push(charBackgroundColor);
  }

  return new Chart(canvas, chartParams);
}


export function createTreeView(aParent , tree , params )
// Wenn das TreeVie vorbefüllt werden soll, kann eine Baumstruktur in tree übergeben werden.
// Diese muss folgenden Kriterien gehorchen: Array von Objekten der Form: {caption:"xyz", dataContainer:{...}, childNodes:[{...},...]}
// Das Ganze kann beliebig tief verschachtelt sein.

{
  var t = new TFTreeView( aParent , params );
  // tree rekursiv durchlaufen und Knoten hinzufügen
  var __scanNodes = function( treeNode , subTree )
  {
   for (var i=0; i<subTree.length; i++) 
   { 
     var s = subTree[i];
     var n = t.addSubNode(treeNode , s.caption, s.dataContainer );
     
     //workaround: wenn childNodes kein Array sondern ein Objekt ist, dann wird es als Array interpretiert
     var childNodesArray = Array.from(s.childNodes || []);
    
      if( childNodesArray.length>0) __scanNodes(n, childNodesArray);
   }
  }

  if (typeof tree === 'object' && tree !== null) 
  {
     for (var i=0; i<tree.length; i++) 
      {
        var element = tree[i];
        // Erstelle einen root-Knoten für den aktuellen Schlüssel
        var n=t.addNode( element.caption , element.dataContainer );

        //workaround: wenn childNodes kein Array sondern ein Objekt ist, dann wird es als Array interpretiert
        var childNodesArray = Array.from(element.childNodes || []);
        
          // Rekursiv fortfahren, falls es child-Elemente gibt 
        if (childNodesArray.length > 0) __scanNodes(n, childNodesArray );
     }
  }

  t.buildNodeList(); 
  t.collabseAll(false);


  return t;
}



export function ask( title , msg , callBackIfYes , callBackIfNo )
{
  var w = createWindow( null , "Rückfrage" , "50%" , "40%" , "CENTER" ).hWnd;
      w.overflow = 'hidden';
  
   utils.buildGridLayout_templateColumns( w , '1fr');
   utils.buildGridLayout_templateRows   ( w , '4em 1fr 1em 4em');
 
   var titleDiv = addPanel( w ,"",1,1,1,1);
       titleDiv.margin = '2px';
       titleDiv.backgroundColor = "rgb(200, 207, 197 , 0.77)";
       titleDiv.DOMelement.innerHTML = '<H2><center>'+title+'</H2></center>';

  var msgDivCont    = addPanel( w ,"cssContainerPanel",1,2,1,1);
  msgDivCont.margin = '4px';
  utils.buildGridLayout_templateColumns( msgDivCont , '1fr 7em');
  utils.buildGridLayout_templateRows   ( msgDivCont , '1fr');

  var msgDivGlyph = addPanel( msgDivCont ,"cssContainerPanel",2,1,1,1);
  msgDivGlyph.DOMelement.innerHTML = '<i class="fa-solid fa-circle-question fa-flip fa-2xl"></i>'; 

  var msgDiv = addPanel( msgDivCont ,"cssContainerPanel",1,1,1,1);
      msgDiv.DOMelement.innerHTML = msg;
    
  var btnDiv = addPanel( w ,"cssContainerPanel",1,4,1,1);
  btnDiv.margin   = '4px';
  btnDiv.overflow = 'hidden';
  btnDiv.backgroundColor = "rgba(0,0,0,0.14)";
  utils.buildGridLayout_templateColumns( btnDiv , '1fr 100px 50px 100px 1fr');
  utils.buildGridLayout_templateRows   ( btnDiv , '1fr 1fr 1fr');
  
       
   var btnAddd  = addButton(btnDiv,"",2,2,1,1,"Ja");
       btnAddd.height = '2em'; 
       btnAddd.callBack_onClick = function(){ this.wnd.destroy() ; if (this.yes) this.yes() }.bind({wnd:w.parent, yes:callBackIfYes})
 
   var btnEdit  = addButton(btnDiv,"",4,2,1,1,"Nein");
        btnEdit.height = '2em';
       btnEdit.callBack_onClick = function(){ this.wnd.destroy() ; if (this.no) this.no() }.bind({wnd:w.parent, no:callBackIfNo})
}


export function showMessage( msg , options , callBack )
{
  var button = [];
  var glyph  = null;
  if(options)
  {
    if(options.button) button = options.button; 
    if(options.glyph)  glyph  = options.glyph;
  }  

  if(button.length==0) button.push('OK');

  var w = createWindow( null , "Benachrichtigung" , "50%" , "35%" , "CENTER" ).hWnd;
      w.overflow = 'hidden';
   
  utils.buildGridLayout_templateColumns( w , '1em 1fr 1em');
  utils.buildGridLayout_templateRows   ( w , '0.7em 1fr 0.7em 4em 0.7em');

  var div = addPanel( w ,"",2,2,1,1);
      div.backgroundColor = "rgba(0,0,0,0.04)";

  if(glyph) utils.buildGridLayout_templateColumns( div , '1fr 7em');
  else      utils.buildGridLayout_templateColumns( div , '1fr');
            utils.buildGridLayout_templateRows   ( div , '1fr');
      
  var msgDiv    = addPanel( div ,"cssContainerPanel",1,1,1,1);
      msgDiv.backgroundColor = "rgb(247,244,247)"; 
      msgDiv.DOMelement.innerHTML = '<center>'+msg+'</center>';

  if(glyph)
  {
   var imgDiv    = addPanel( div ,"cssContainerPanel",2,1,1,1);
       imgDiv.DOMelement.innerHTML = '<center><i class="'+glyph+'"></i></center>';
  }     

  var btnDiv = addPanel( w ,"cssContainerPanel",2,4,1,1);
      btnDiv.backgroundColor = "rgba(0,0,0,0.14)";
  
    
  for(var i=0; i<button.length; i++) 
  {  
          var b=addButton(btnDiv,"",1,1,77,35,button[i]);
              b.backgroundColor  = "gray";
              b.attachment       = i;
              b.callBack_onClick = function() { this.wnd.destroy();  if(callBack) callBack(this.btn.attachment) }.bind({wnd:w.parent,btn:b});
  }      

}



export function splashScreen(msg , proc)
{
  if(splash.activ)
  {
    splash.msgPanel.innerHTML   = '<center><H4>'+msg+'</H4></center>';
    return;
  }
  
  console.log('build SPLASHSCREEN - > ' +msg);
  splash.activ                     = true;  
  splash.panel                     = document.createElement('div');
  splash.panel.className           = 'overlay';
  splash.panel.style.visibility    = 'visible';
  document.body.appendChild(splash.panel);

  if(msg!='')
  {
   var container                    = document.createElement('div');
       container.className          = 'splashContainer';
       container.style.visibility   = 'visible';
       splash.panel .appendChild(container);

       splash.imgPanel                  = document.createElement('div');
       splash.imgPanel.className        = 'splashPanel';
       splash.imgPanel.style.visibility = 'visible';
       splash.imgPanel.innerHTML        = '<center><img src="./tfWebApp/res/wait01.gif"></center>';
       container.appendChild(splash.imgPanel);


       splash.msgPanel                  = document.createElement('div');
       splash.msgPanel.className        = 'splashPanel';
       splash.msgPanel.style.visibility = 'visible';
       splash.msgPanel.innerHTML        = '<center><H2>'+msg+'</H2></center>';
       container.appendChild(splash.msgPanel);
  }
  else  splash.panel  .innerHTML        = '<center><img src="./tfWebApp/res/wait01.gif"></center>';  

  if(proc) setTimeout( ()=>{proc(); closeSplashScreen()} , 100 );

}


export function closeSplashScreen()
{
  console.log('CLOSE SPLASHSCREEN');
  splash.activ = false;
  if(splash.panel!=null)
  {
    document.body.removeChild(splash.panel);
    splash.panel = null;
    return;
  } 
}


export function showImage( url )
{
  var w = createWindow( '' , 'pixViewer' , '90%' , '90%' );
      
      w.hWnd.style.background = 'black';
      w.top                   = 35;
      w.buildGridLayout_templateColumns("1fr");
      w.buildGridLayout_templateRows("1px 1fr");
  

  var p = addPanel(w, 'cssHiddenPanel' , 1 , 1 , 1, 1  );  // als Platzhalter für spätere Wünsche ...
      p.backgroundColor = "gray";

  var screen = addPanel(w, 'cssImageContainer' , 1 , 2 , 1 , 1 );       
     
  //----------------------------------------------------------------------
  
  var img = createImage(screen , url );  
  
  
}


export function newPropertyEditor( aParent , properties , btnSave , callBack_onSave  )
{
  var pe = new TPropertyEditor( aParent , properties , btnSave , callBack_onSave );
      pe.render();
  return pe;
}



export function getProperties( obj )
{
  var properties = [];

  properties.push( {label:'objName',type:'string',value:obj.objName} );
  properties.push( {label:'name',type:'INPUT',value:obj.name} );

  properties.push( {label:'css',type:'INPUT',value:obj.css || ''} );


  // Position im GRID-LAYOUT
  properties.push( {label:'gridLeft',type:'INPUT',value:obj.gridLeft} );
  properties.push( {label:'gridTop',type:'INPUT',value:obj.gridTop} );
  properties.push( {label:'gridWidth',type:'INPUT',value:obj.gridWidth} );
  properties.push( {label:'gridHeight',type:'INPUT',value:obj.gridHeight} ); 

  // Nach Initial-Positionierung -> nachträgliche Änderungen der Geometrie
  properties.push( {label:'left',type:'INPUT',value:obj.left} );
  properties.push( {label:'top',type:'INPUT',value:obj.top} );
  properties.push( {label:'width',type:'INPUT',value:obj.width} );
  properties.push( {label:'height',type:'INPUT',value:obj.height} );
  properties.push( {label:'caption',type:'INPUT',value:obj.caption} ); 
  properties.push( {label:'value',type:'INPUT',value:obj.value} ); 
  properties.push( {label:'prompt',type:'INPUT',value:obj.prompt} ); 
  properties.push( {label:'appendix',type:'INPUT',value:obj.appendix} ); 



  properties.push( {label:'margin',type:'INPUT',value:obj.margin || '0px'} );
  properties.push( {label:'marginLeft',type:'INPUT',value:obj.marginLeft || '0px'} );
  properties.push( {label:'marginRight',type:'INPUT',value:obj.marginRight || '0px'} );
  properties.push( {label:'marginTop',type:'INPUT',value:obj.marginTop || '0px'} );
  properties.push( {label:'marginBottom',type:'INPUT',value:obj.marginBottom || '0px'} );

  properties.push( {label:'padding',type:'INPUT',value:obj.padding || '0px'} );
  properties.push( {label:'paddingTop',type:'INPUT',value:obj.paddingTop || '0px'} );
  properties.push( {label:'paddingLeft',type:'INPUT',value:obj.paddingLeft || '0px'} );
  properties.push( {label:'paddingRight',type:'INPUT',value:obj.paddingRight || '0px'} );
  properties.push( {label:'paddingBottom',type:'INPUT',value:obj.paddingBottom || '0px'} );

  properties.push( {label:'borderWidth',type:'INPUT',value:obj.borderWidth || '0px'} );
  properties.push( {label:'borderColor',type:'INPUT',value:obj.borderColor || '0px'} );
  properties.push( {label:'borderRadius',type:'INPUT',value:obj.borderRadius || '0px'} );
  properties.push( {label:'shadow',type:'INPUT',value:obj.shadow} );
  
  properties.push( {label:'overflow',type:'COMBOBOX',value:obj.overflow, items:["auto","hidden"] || 'auto'} );
  properties.push( {label:'stretch',type:'COMBOBOX',value:obj.stretch, items:["JA","NEIN"] || 'JA'} );
  properties.push( {label:'visible',type:'COMBOBOX',value:obj.visible, items:["JA","NEIN"] || 'JA'} );

  properties.push( {label:'backgroundColor',type:'INPUT',value:obj.backgroundColor} );
  properties.push( {label:'color',type:'INPUT',value:obj.color} );  

  return properties;
}



export function setProperties( obj , properties )
{
  for(var i=0; i<properties.length; i++)
  {
    var p = properties[i];
    if(p.value)
    {  
     if(p.label=='name'    ) obj.name = p.value;
     if(p.label=='caption' ) obj.caption = p.value;

     if(p.label=='value'   ) obj.value = p.value;
     if(p.label=='prompt'  ) obj.prompt = p.value;
     if(p.label=='appendix') obj.appendix = p.value;

     if(p.label=='css') obj.css = p.value;
     
     if(p.label=='gridLeft') obj.gridLeft = p.value;
     if(p.label=='gridTop')  obj.gridTop  = p.value;  
     if(p.label=='gridWidth') obj.gridWidth  = p.value;
     if(p.label=='gridHeight') obj.gridHeight  = p.value;

     if(p.label=='left') obj.left = p.value;
     if(p.label=='top') obj.top = p.value;
     if(p.label=='width') obj.width = p.value;
     if(p.label=='height') obj.height = p.value;

     if(p.label=='margin') obj.margin = p.value;
     if(p.label=='marginLeft') obj.marginLeft = p.value;
     if(p.label=='marginRight') obj.marginRight = p.value;
     if(p.label=='marginTop') obj.marginTop = p.value;
     if(p.label=='marginBottom') obj.marginBottom = p.value;

     if(p.label=='padding') obj.padding = p.value;
     if(p.label=='paddingTop') obj.paddingTop = p.value;
     if(p.label=='paddingLeft') obj.paddingLeft = p.value;
     if(p.label=='paddingRight') obj.paddingRight = p.value;
     if(p.label=='paddingBottom') obj.paddingBottom = p.value;


     if(p.label=='borderWidth') obj.borderWidth = p.value;
     if(p.label=='borderColor') obj.borderColor = p.value;
     if(p.label=='borderRadius') obj.borderRadius = p.value;
     if(p.label=='shadow') obj.shadow = p.value;

     if(p.label=='overflow') obj.overflow = p.value;
     if(p.label=='stretch') obj.params.stretch = p.value;
     if(p.label=='visible') obj.visible = p.value;
     if(p.label=='backgroundColor') obj.backgroundColor = p.value;
     if(p.label=='color') obj.color = p.value;
    } 
  }  
}

export function fileDialog( rootPath, mask , multiple , callBackOnSelect , onSelectionChanged )
{
  return new TFileDialog( {mask:mask , root:rootPath , multiple:multiple , callBackOnSelect:callBackOnSelect , onSelectionChanged:onSelectionChanged} );
}


export function playMovieFile(container, fileName)  // fileName kann auch ein Array sein ... 
{
  // Falls `fileName` ein String ist, in ein Array umwandeln
  var fileList=[];
  if(Array.isArray(fileName)) fileList = fileName
  else                        fileList = [fileName];
  
  const speeds     = [0.1,0.12,0.17,0.25,0.5,0.75,0.9,1,1.25,1.5,1.75,2]; // Verschiedene Geschwindigkeiten
  var   speedIndex = 2;
  var currentIndex = 0;
  var  brightness  = 1;

  // Vorherige Inhalte entfernen
  container.innerHTML = "";
  container.backgroundColor = "rgb(35,35,35)";
  utils.buildGridLayout_templateColumns(container, "1fr");
  utils.buildGridLayout_templateRows(container, "1em 1fr 3em");  

  var videoContainer = addPanel(container, "cssContainerPanel", 1, 2, 1, 1);

  // Video-Element erstellen
  var video = document.createElement("video");
  video.src = fileList[currentIndex];
  video.controls = true; // Eigene Steuerung
  video.autoplay = true; // Autoplay aktiviert
  video.style.width = "100%";
  video.style.borderRadius = "7px";
  video.style.filter = "brightness(1)"; // Standard-Helligkeit
  videoContainer.appendChild(video);

  // Steuerungselemente erstellen
  var controls = addPanel(container, "", 1, 3, 1, 1);
      controls.buildGridLayout_templateColumns("1fr 1fr 1fr 1fr 1fr 1fr 1fr");
      controls.buildGridLayout_templateRows("1fr");

  var btnHeight = "2em";
  var btnColor  = "gray";

  var btn_speedUp = addButton(controls, "", 1, 1, 1, 1, "Speed -");
      btn_speedUp.backgroundColor = btnColor;
      btn_speedUp.height = btnHeight;
      btn_speedUp.callBack_onClick=() => {
                                       speedIndex = (speedIndex-1);
                                       if(speedIndex<0) speedIndex = 0;
                                       video.playbackRate = speeds[speedIndex];
                                      }

  var btn_speedDown = addButton(controls, "", 2, 1, 1, 1, "Speed +");
      btn_speedDown.backgroundColor = btnColor;
      btn_speedDown.height = btnHeight; 
      btn_speedUp.callBack_onClick=() => {
                                          speedIndex = (speedIndex+1);
                                          if(speedIndex>=speeds.length) speedIndex = speeds.length;
                                          video.playbackRate = speeds[speedIndex];
                                         }   

  var btn_brightnessUp = addButton(controls, "", 3, 1, 1, 1, "Brightness +");
      btn_brightnessUp.backgroundColor = btnColor;
      btn_brightnessUp.height = btnHeight;  
      btn_brightnessUp.callBack_onClick=() => {
                                            brightness += 0.1;
                                            if(brightness > 2) brightness = 2;
                                            video.style.filter = "brightness(" + brightness + ")";
                                           }

  var btn_brightnessDown = addButton(controls, "", 4, 1, 1, 1, "Brightness -");
      btn_brightnessDown.backgroundColor = btnColor;
      btn_brightnessDown.height = btnHeight;    
      btn_brightnessDown.callBack_onClick=() => {
                                              brightness -= 0.1;
                                              if(brightness < 0) brightness = 0;
                                              video.style.filter = "brightness(" + brightness + ")";
                                             }


  var btn_fullscreen = addButton(controls, "", 5 , 1, 1, 1, "Fullscreen");
      btn_fullscreen.backgroundColor = btnColor;
      btn_fullscreen.height = btnHeight;
      btn_fullscreen.callBack_onClick=() => {
                                              if (video.requestFullscreen) {
                                                video.requestFullscreen();
                                              } else if (video.mozRequestFullScreen) {
                                                video.mozRequestFullScreen();
                                              } else if (video.webkitRequestFullscreen) {
                                                video.webkitRequestFullscreen();
                                              } else if (video.msRequestFullscreen) {
                                                video.msRequestFullscreen();
                                              }
                                            }

  if(fileList.length > 1)
  {
    var btn_prev = addButton(controls, "", 6, 1, 1, 1, "Prev");
        btn_prev.backgroundColor = btnColor;
        btn_prev.height = btnHeight;  
        btn_prev.callBack_onClick=() => {
                                          if (currentIndex > 0) {
                                              currentIndex--;
                                              video.src = fileList[currentIndex];
                                              video.play();
                                          }
                                        } 

    var btn_next = addButton(controls, "", 7, 1, 1, 1, "Next");
        btn_next.backgroundColor = btnColor;
        btn_next.height = btnHeight;
        btn_next.callBack_onClick=() => {
                                          if (currentIndex < fileList.length - 1) {
                                              currentIndex++;
                                              video.src = fileList[currentIndex];
                                              video.play();
                                          }
                                        }

   // Automatisches Abspielen des nächsten Videos
   video.addEventListener("ended", ()=>{btn_next.click();});
                                 
  }  // MEHRERE vIDEOS IN lISTE    
  
  }






