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

import  * as globals   from "./globals.js";
import  * as symbols   from "./symbols.js";  
import  * as utils     from "./utils.js";

import { TFDateTime } from "./utils.js";
import { TFWindow   } from "./tfWindows.js";
import { THTMLTable } from "./tfGrid.js";
import { TFTreeView } from "./tfTreeView.js"; 

import { TFCheckBox, 
         TFileUploadPanel, 
         TFImage, 
         TFLabel,     
         TFPanel,
         TFEdit,
         TFComboBox,
         TFSelectBox,
         TFButton,
         TFMenu,
         TPropertyEditor,
         TFileDialog,
         TFListBox,
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


export function addLabel( aParent , className , left , top , width , height , text , params)
{
  if(!params) params = {};
      params.caption = text;
  if (className) params.css = className;
  
  if (width==null) width = (text.length+1)+'em';
  if (height==null) height = '2em';

  return new TFLabel( aParent , left , top , width , height , params );
}


export function addButton( aParent , className , left , top , width , height , decoration , params )
{
  var capt  = '';
  var glyph = '';
  
  if(utils.isJSON(decoration)) 
  {
    capt  = decoration.caption;
    glyph = decoration.glyph;
  } else capt = decoration;
  
  if(!params) params = {};
  if (className) params.css              = className;     
  if (capt)      params.caption          = capt;
  if (glyph)     params.glyph            = glyph;

  var btn = new TFButton( aParent  , left , top , width , height , params );

  return btn;
}


export function addImage( aParent , left , top , width , height , imgURL , params )
{
  if (!params) params = {};
  params.imgURL = imgURL || '';
  return new TFImage( aParent , left , top , width , height , params );
}   


export function lineBreak(aParent)
{
  var br = document.createElement("br");
  aParent.DOMelement.appendChild( br );
  return br;  
}


export function addPanel( aParent , className , left , top ,width , height , params )
{
  if(!params) params = {};
      params.stretch = true;
  if (className)  params.css           = className;
                  params.dontRegister  = params.dontRegister || false; // wenn true, dann wird das Panel nicht in der globalen Liste registriert
  
  return new TFPanel( aParent , left , top , width , height , params );
}


export function addInput( aParent , left , top , textLength  , labelText , appendix , preset , params )
{
  if(!params) params = {};

  if (labelText)  params.caption    = labelText;
  if (textLength) params.editLength = 'auto';
  if (appendix)   params.appendix   = appendix;
  if (preset)     params.value      = preset;

  return new TFEdit( aParent , left , top  , 1 , 1 , params );

}


export function addDateTimePicker( aParent , left , top , labelText , preset , params)
{
 
  if(!params) var params = {};

      params.type  = "datetime-local";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

      preset = preset || '';
      var  d = new TFDateTime(preset); 
      inp.setDateTime(d);
     
     return inp;
   }




export function addDatePicker( aParent , left , top , labelText , preset , params)
{
 
  if(!params) var params = {};

      params.type  = "date";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

   preset = preset || '';
   var  d = new TFDateTime(preset); 
   inp.setDateTime(d);
  
  return inp;
}


export function addTimePicker( aParent , left , top , labelText , preset , params)
{
 
  if(!params) var params = {};

      params.type  = "time";
      var inp = addInput( aParent , left , top , 8 , labelText , "" , preset , params );

      preset = preset || '';
      var  d = new TFDateTime(preset); 
      inp.setDateTime(d);
     
     return inp;
}



export function addFileUploader( parent , fileTyp , multiple , destDir , onUpload )  
{
 return new TFileUploadPanel( parent , {fileType:fileTyp, multiple:multiple, onUpload:onUpload, destDir:destDir}); 
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


export function addSelectBox( aParent , left , top , textLength  , labelText , appendix , preset , items , params )
{
  if(!params) params = {};
  if (labelText)  params.caption    = labelText;
  if (textLength) params.editLength = textLength;
  if (appendix)   params.appendix   = appendix;
  if (preset)     params.value      = preset;
  if (items)      params.items      = items;

  return new TFSelectBox( aParent , left , top  , 1 , 1 , params );

}




export function addCheckBox( aParent , left , top , labelText , preset , params )
{
  if(!params) params = {css:"cssPanelForInput", checkboxLeft:true};
   
    params.css     = params.css || "cssPanelForInput"; 
    params.caption = labelText  || 'checkBox';
    params.checked = preset     || false;

   return new TFCheckBox( aParent , left , top , 1 , 1 , params );
}

export function addListBox( aParent , left , top , width , height , items, params )
{
  if(!params) params = {};
  params.items = items || [];
  return  new TFListBox( aParent , left , top , width , height , params );
}


export function addListCheckbox(aParent , items , params)
{
  if(!params) params = {};
  params.items = items;

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
  var glyph  = '';
  if(options)
  {
    if(options.button) button = options.button; 
    if(options.glyph)  glyph  = options.glyph ;
  }  

  glyph  = glyph || "circle-info";

  if(button.length==0) button.push('OK');

  var w = createWindow( null , "Benachrichtigung" , "50%" , "35%" , "CENTER" ).hWnd;
      w.overflow = 'hidden';
   
  w.buildGridLayout_templateColumns( '1fr');
  w.buildGridLayout_templateRows   ( '0.4em 1fr 0.7em 4em 0.4em');

  var div = addPanel( w ,"",1,2,1,1);
      div.backgroundColor = "rgba(76, 186, 52, 0.04)";
      div.margin = '4px';

  if(glyph) div.buildGridLayout_templateColumns('1fr 7em');
  else      div.buildGridLayout_templateColumns('1fr');
            div.buildGridLayout_templateRows   ('1fr');
      
  var msgDiv    = addPanel( div ,"cssContainerPanel",1,1,1,1);
      msgDiv.backgroundColor = "rgb(247,244,247)"; 
      msgDiv.DOMelement.innerHTML = '<center>'+msg+'</center>';

  if(glyph)
  {
   var imgDiv    = addPanel( div ,"cssContainerPanel",2,1,1,1);
       utils.drawSymbol( glyph , imgDiv , "gray" , "77%");
  }     

  var btnDiv = addPanel( w ,"cssContainerPanel",1,4,1,1);
      btnDiv.backgroundColor = "rgba(0,0,0,0.14)";
  
    
  for(var i=0; i<button.length; i++) 
  {  
          var b=addButton(btnDiv,"",1,1,100,47, {caption:button[i]});
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


export function newPropertyEditor( aParent , properties , btnSave , callBack_onSave  )
{
  var pe = new TPropertyEditor( aParent , properties , btnSave , callBack_onSave );
      pe.render();
  return pe;
}



export function getProperties( obj )
{
  return obj.getProperties();
}


export function setProperties( obj , properties )
{ 
  // Properties vom PropertyEditor in property-Objekt für TFObject umwandeln
  var propObj    = {};

  for (var i=0; i<properties.length; i++ )
  {
    var item = properties[i];
    propObj[item.label]=item.value;
  } 
  obj.setProperties(propObj);  
}


export function fileDialog( rootPath, mask , multiple , callBackOnSelect , onSelectionChanged )
{
  return new TFileDialog( {mask:mask , root:rootPath , multiple:multiple , callBackOnSelect:callBackOnSelect , onSelectionChanged:onSelectionChanged} );
}


export function playMovieFile(container, url , caption )  // fileName kann auch ein Array sein ... 
{
  if(!container){
    container = new TFWindow( null , caption || "Video" , "77%" , "77%" , "CENTER" ).hWnd;
  }
  
  // Falls `fileName` ein String ist, in ein Array umwandeln
  var fileList=[];
  if(Array.isArray(url)) fileList = url
  else                   fileList = [url];
  
  const speeds     = [0.1,0.12,0.17,0.25,0.5,0.75,0.9,1,1.25,1.5,1.75,2]; // Verschiedene Geschwindigkeiten
  var   speedIndex = 2;
  var currentIndex = 0;
  var  brightness  = 1;

  // Vorherige Inhalte entfernen
  container.innerHTML = "";
  container.backgroundColor = "rgb(35,35,35)";
  container.buildGridLayout_templateColumns("1fr");
  container.buildGridLayout_templateRows("1fr 3em");  
  var videoContainer = addPanel(container, "cssContainerPanel", 1, 1, 1, 1); // cssContainerPanel
  var controls       = addPanel(container, "cssContainerPanel", 1, 2, 1, 1);

  
  // Video-Element im VideoContainer erstellen
var video = document.createElement("video");
video.controls = true;          // Eigene Steuerung
video.autoplay = true;          // Autoplay aktiviert
video.style.maxWidth = "100%";  // Breite maximal wie das Parent
video.style.maxHeight = "100%"; // Höhe maximal wie das Parent
video.style.width = "100%";     // Automatisch, um Seitenverhältnis zu bewahren
video.style.height = "100%";    // Gilt ebenfalls dem Seitenverhältnis
video.style.objectFit = "contain"; // Lässt es vollständig sichtbar mit evtl. Letterboxing
video.style.margin = "auto";    // Zentrierung im Flex-Parent
video.style.display = "block";  // Verhindert unerwünschten Inline-Space
video.style.borderRadius = "7px";
video.style.filter = "brightness(1)"; // Standard-Helligkeit
video.style.transition = "filter 0.3s ease"; // Sanfter Übergang bei Helligkeitsänderung
video.src = fileList[currentIndex]; // Setze die Quelle des Videos
// Optional: sicherstellen, dass das Parent Flexbox-Zentrierung verwendet
videoContainer.buildFlexBoxLayout();
videoContainer.alignItems     = "center";
videoContainer.justifyContent = "center";
videoContainer.appendChild(video);

// Steuerungselemente erstellen
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
  
export function showImage( url , caption )
  { 
    var w = new TFWindow( null , caption || 'pixViewer' , "77%" , "77%" , "CENTER" );
      
        w.hWnd.backgroundColor  = 'black';
        w.buildGridLayout_templateColumns("1fr");
        w.buildGridLayout_templateRows("2em 1fr");
        w.hide();
    
  
    var p = addPanel(w.hWnd, '' , 1 , 1 , 1, 1  );  // als Platzhalter für spätere Wünsche ...
         
    var img = addPanel(w.hWnd, '' , 1 , 2 , 1 , 1 );      
    img.imgURL = url; 
   
  // Automatische Größenanpassung, sobald das Bild geladen wurde
  const imgObj    = new Image();
  imgObj.onload   = function()
               { 
                 const imgRatio = this.img.naturalWidth / this.img.naturalHeight;
                 const h        = this.wnd.heightPx;
                // Höhe bleibt fix – Breite wird auf Bildformat angepasst
                 const w = h * imgRatio;
                 this.wnd.widthPx = w;
                 this.wnd.show();
               }.bind({img:imgObj,wnd:w});

  imgObj.src = url;




     
  }
  

  export function diaShow( parent , imageUrls , interval )
  {
    var container = new TFPanel( parent , 0 , 0 , parent.widthPx+'px' , parent.heightPx+'px' , {css:"slideshow-container"} );
        container.ID = 'slideshow';

    imageUrls.forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('slideshow-image');
        if (i === 0) img.classList.add('active');
        container.appendChild(img);
      });

      let index = 0;
      const images = container.DOMelement.querySelectorAll('.slideshow-image');
      setInterval(() => 
        { 
         images[index].classList.remove('active');
         index = (index + 1) % images.length;
         images[index].classList.add('active');
        }, interval);
    
  }


  
  export async function browseSymbols()
  {  
    var w            = new TFWindow( null , 'Symbol-Browser' , '80%' , '80%' , 'CENTER' );
    var svgContainer = w.hWnd;

   var svgs = symbols.list()
  
   for(var i=0; i<svgs.length; i++)
   { 
     console.log('Symbol: ' + svgs[i]);
     var p = addPanel( svgContainer , "" , 1 , 1 , "77px" , "77px" );
  
     symbols.draw( p ,  svgs[i] ); 
     //symbols.drawStatic( p , svgs[i] ); 
     await utils.processMessages();    
    }      
 }


  export function createMenu( menuItems)
  {
     result = new TFMenu( menuItems );
     return result;
  }