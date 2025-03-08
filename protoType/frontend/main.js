

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TFPopUpMenu,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";

import { TFMediaCollector } from "./tfWebApp/tfMediaCollector.js";


const svgPath = '/GIT/JS-3/tfWebApp/fontAwsome/svgs/';  // '/home/tferl/GIT/JS-3/tfWebApp/fontAwsome/svgs/';
const imgPath = '/home/tferl/GIT/JS-3/prodia/uploads/';

var svgContainer   = null;
var testContainer1 = null;
var testContainer2 = null;
var testContainer3 = null;

var imgs           = [];
var imgNdx         = -1;


var panels         = [];
var menuContainer  = null;

var editPath       = null;
var clock          = null;
var chart          = null; 
var osziX          = 0;   
var treeView       = null;
var treeData       = {};

var mediaViewer    = null;


function viewMedia(fn)
{
 // Dateiendung ermitteln...
    var ext = fn.split('.').pop().toLowerCase();

    if(mediaViewer==null) 
          mediaViewer = new TFWindow( svgContainer , fn , '77%' , '77%' , 'CENTER' );
    else mediaViewer.innerHTML = '';     
  
    if(utils.isImageFile(ext))
    {
     var url = utils.buildURL('GETIMAGEFILE',{fileName:fn} );
     dialogs.addImage( mediaViewer.hWnd , '' , 1 , 1 , '100%' , '100%' , url );
    }
 
    if(utils.isMovieFile(ext))
    {
      var url = utils.buildURL('GETMOVIEFILE',{fileName:fn} );
      dialogs.playMovieFile( mediaViewer.hWnd , url );
    }    
}





export function main(capt1,capt2)
{
    var ws = new TFWorkSpace('mainWS' , capt1,capt2 );

    var l  = dialogs.setLayout( ws.handle , {gridCount:27,head:2,left:14} )
  
      menuContainer = l.head;

      var testContainer = l.left;
          testContainer.buildGridLayout_templateColumns('1fr 1fr 1fr');
          testContainer.buildGridLayout_templateRows('1fr');

          testContainer1 = dialogs.addPanel( testContainer , "" , 1 , 1 , 1 , 1 );  
          testContainer2 = dialogs.addPanel( testContainer , "" , 2 , 1 , 1 , 1 );
          testContainer3 = dialogs.addPanel( testContainer , "" , 3 , 1 , 1 , 1 );

      svgContainer  = l.dashBoard; 

      menuContainer.backgroundColor = 'gray';
      menuContainer.buildGridLayout_templateColumns('10em 10em 10em 10em 10em 10em 10em 10em 10em 10em 10em 1fr ');
      menuContainer.buildGridLayout_templateRows('1fr');


  var btn1 = dialogs.addButton( menuContainer , "" , 1 , 1 , 1 , 1 , "regular"  )
      btn1.callBack_onClick = function() { showSVGs('regular') };
      btn1.heightPx = 35;

  var btn2 = dialogs.addButton( menuContainer , "" , 2 , 1 , 1 , 1 , "solid"  )
      btn2.callBack_onClick = function() { showSVGs('solid') };
      btn2.heightPx = 35;

  var btn3 = dialogs.addButton( menuContainer , "" , 3 , 1 , 1 , 1 , "brands"  )
      btn3.callBack_onClick = function() { ; showIMGs(editPath.value || imgPath) };
      btn3.callBack_onClick = function() { showIMGs(editPath.value || imgPath) };
      btn3.heightPx = 35;

  var btn4 = dialogs.addButton( menuContainer , "" , 4 , 1 , 1 , 1 , "Grid-Test"  )
      btn4.callBack_onClick = function() { 
                                           var g = dialogs.createTable( svgContainer , [{Name:"Ferl",Vorname:"Thomas",gebDatum:"29.10.1966"},
                                                                                        {Name:"Mustermann",Vorname:"Max",gebDatum:"01.01.2000"},
                                                                                        {Name:"Schmidt",Vorname:"Klaus",gebDatum:"15.03.1975"}] , '' , ''); }
      btn4.heightPx = 35;


  var btn5 = dialogs.addButton( menuContainer , "" , 5 , 1 , 1 , 1 , "Clock-Test"  )
      btn5.callBack_onClick = function() { 
                                           if(clock==null) clock = new TFAnalogClock( panels[14] , 1 , 1 , '100%' , '100%' , {isDragable:true} );
                                           else {clock.destroy(); clock = null;}
                                         }
      btn5.heightPx = 35;


var btn6 = dialogs.addButton( menuContainer , "" , 6 , 1 , 1 , 1 , "Chart-Test"  )
    btn6.callBack_onClick = function() { 
                                           if(chart==null)
                                            {
                                             chart = new TFChart( panels[13] , 1 , 1 , '100%' , '100%' , {chartBackgroundColor:'white',chartType:'Spline',maxPoints:50} );
                                             var dummyData = [];
                                             var series    = chart.addSeries('dummyData','green');
                                             for(var i=0; i<50; i++) dummyData.push({x:i, y:Math.random()*100, color:utils.randomColor() });   

                                             chart.addPoint(series , dummyData);

                                             osziX = 50;

                                             setInterval( function (){
                                                                       osziX++; 
                                                                       this.chart.addPoint(this.series , {x:osziX, y:Math.random()*100 , color:utils.randomColor()} )
                                                                     }.bind({chart:chart,series:series}) , 100 );
                                             }    
                    
                                           else {chart.destroy(); chart = null;}
                                         }
    btn6.heightPx = 35;


    treeData =[{caption:"A", dataContainer:"111"},
               {caption:"b", dataContainer:"110"},
               {caption:"C", dataContainer:"101"},
               {caption:"S", dataContainer:"102" ,  childNodes:[{caption:"T" ,dataContainer:"1021"},
                                                                {caption:"TT",dataContainer:"1022"},
                                                                {caption:"TZ",dataContainer:"1023"}]
                                                },
               {caption:"D", dataContainer:"011"},
               {caption:"E", dataContainer:"000"}]

    var btn7 = dialogs.addButton( menuContainer , "" , 7 , 1 , 1 , 1 , "TreeView-Test"  );
    btn7.heightPx = 35;
    btn7.callBack_onClick = function() { 
                                           if(treeView==null) treeView = dialogs.createTreeView( testContainer3 , treeData , {} );
                                           else {treeView.destroy(); treeView = null;}
                                         }
   


    var btn8 = dialogs.addButton( menuContainer , "" , 8 , 1 , 1 , 1 , "Formular-Test"  );
    btn8.heightPx = 35;
    btn8.callBack_onClick = function() { 
                                          var formData = {Name       :"Ferl",
                                                          Vorname    :"Thomas",
                                                          gebDatum   :"29.10.1966",
                                                          PLZ        :"39218",
                                                          Ort        :"Schönebeck",
                                                          favFastfood:"Pizza",
                                                          level      : 90,
                                                          online     :true};
                                                               // aParent      , aData    , aLabels , aAppendix , aExclude , aInpType , URLForm )
                                            var form = new TForm( svgContainer , formData , {}      , {}        , []       , {}       , '' );    
                                                form.setLabel("favFastfood" , "Lieblings-Fastfood")
                                                form.setInputType("favFastfood" , "select" , {items:["Pizza","Pommes","Döner","HotDog","Sushi"]} );
                                                form.setInputType("gebDatum" , "date");
                                                form.setInputType("level" , "range" , {sliderMin:1,sliderMax:100,sliderStep:5,sliderPosition:formData.level} );
                                                form.setInputType("online" , "checkBox"  );
 
                                                form.render( true);  
                                                form.callBack_onOKBtn = function(values) {console.log(JSON.stringify(values))};
                                       }




var   btn9 = dialogs.addButton( menuContainer , "" , 9 , 1 , 1 , 1 , "Property-Editor"  );
      btn9.heightPx = 35;
      btn9.callBack_onClick = function() {
                                            var data = [{label:"Name",value:"Ferl",type:"text",items:[]},
                                                        {label:"Vorname",value:"Thomas",type:"text",items:[]},
                                                        {label:"gebDatum",value:"29.10.1966",type:"date",items:[]},
                                                        {label:"PLZ",value:"39218",type:"text",items:[]},
                                                        {label:"Ort",value:"Schönebeck",type:"text",items:[]},
                                                        {label:"favFastfood",value:"Pizza",type:"text",items:["Pizza","Pommes","Döner","HotDog","Sushi"]},
                                                        {label:"level",value:"90",type:"range",items:[]},
                                                        {label:"online",value:"true",type:"boolean",items:[]}];

                                                        var p = new TPropertyEditor( svgContainer , data , null , null )
                                                            p.render();
                                          
                                         }    




var   btn10 = dialogs.addButton( menuContainer , "" , 10 , 1 , 1 , 1 , "ask me"  );
      btn10.heightPx = 35;
      btn10.callBack_onClick = function() 
      {
        dialogs.ask( "Frage" , "Wollen Sie das wirklich ?" , ()=>{dialogs.showMessage( "JA" , null , null )} , ()=>{dialogs.showMessage( "NEIN" , null , null )} );
      }

      testContainer1.buildGridLayout_templateRows('repeat(10,1fr)');
      testContainer1.buildGridLayout_templateColumns('1fr');

      for(var i=0; i<10; i++)
      {
        var p = dialogs.addPanel( testContainer1 , "" , 1 , i+1 , 1 , 1 );
            p.borderRadius = '1px';
            p.margin = '0.1em';
            p.buildGridLayout('1x1');
            p.overflow = 'hidden';  
            panels.push(p);
      } 

      testContainer2.buildGridLayout_templateRows('repeat(5,1fr)');
      testContainer2.buildGridLayout_templateColumns('1fr');

      for(var i=0; i<5; i++)
      {
        var p = dialogs.addPanel( testContainer2 , "" , 1 , i+1 , 1 , 1 );
            p.borderRadius = '1px';
            p.margin = '0.1em';
            p.buildGridLayout('1x1');
            p.overflow = 'hidden';  
            panels.push(p);
      } 


      var l=dialogs.addLabel( panels[0] , '' , 1 , 1 , 1 , 1 , 'irgend ein Text (Label)' );
      
      editPath = dialogs.addInput( panels[1] , 1 , 1 , 10 , 'path' , '' , '' , {} );
      editPath.callBack_onClick=()=>{mediaViewer=null; dialogs.fileDialog( "*.*" , true , (d,f,ff)=>{editPath.value=d+'/';} , (fn)=>{viewMedia(fn)} )};
    

      dialogs.addDateTimePicker( panels[2] , 1 , 1 , 'dateTime' , '01.01.2000 17:35' , null , {} );

      dialogs.addDatePicker( panels[3] , 1 , 1 , 'date' , '17.01.2013 18:03' , null , {} );

      dialogs.addTimePicker( panels[4] , 1 , 1 , 'time' , '01.01.2000 17:35' , null , {} );

      dialogs.addFileUploader( dialogs.addButton(panels[5],'',1,1,1,1,'Upload any File') , '*.*' , true , (selectedFiles) => {console.log(JSON.stringify(selectedFiles))}  );
                 
      
      dialogs.addCombobox( panels[6] , 1 , 1 , 10 , 'combobox' , '' , 'aaaa' , [ {caption:'aaaa',value:'A'},
                                                                                 {caption:'bbbb',value:'B'},
                                                                                 {caption:'cccc',value:'C'},
                                                                                 {caption:'dddd',value:'D'} ] , {} );
             
      dialogs.addCheckBox( panels[7], 1,1,'checkBox' , true , {checkboxLeft:false} );

      dialogs.addButton( panels[8] , '' , 1 , 1 , 100 , 32 , 'mediaCollector' )
             .callBack_onClick = ()=> { new TFMediaCollector( '77%' , '77%' , {} ); };


dialogs.addButton( panels[9] , '' , 1 , 1 , 100 , 32 , 'API-Test' )
             .callBack_onClick = ()=> { apiTest(); };



      dialogs.addListCheckbox( panels[10] ,  [ {caption:'aaaa',value:'A'},
                                              {caption:'bbbb',value:'B'},
                                              {caption:'cccc',value:'C'},
                                              {caption:'dddd',value:'D'} ]  );
      

     dialogs.valueList( panels[11] , '' , [ {Name:'Ferl'},
                                            {Vorname:'Thomas'},
                                            {geb:'29.10.1966'},
                                            {Wohnort:'Schönebeck'}] );


    //animation Demo
    // Array für die Punkte
const points = [];

// Punkte initialisieren
for (let i = 0; i < 100; i++) {    
    const p = {
        x: Math.round(Math.random() * 200), // Zufällige Startposition (x)
        y: Math.round(Math.random() * 200), // Zufällige Startposition (y)
        radius: 4,                          // Radius des Punkts
        dx: Math.random() * 2,              // Geschwindigkeit in x-Richtung
        dy: Math.random() * 2,              // Geschwindigkeit in y-Richtung
        width: 500,                         // Standardbreite
        height: 500,                        // Standardhöhe
        
        // Funktion zum Zeichnen
        draw(ctx) {
            graphics.drawCircle(ctx, this.x, this.y, this.radius, { backgroundColor: utils.randomColor() });
        },

        // Bewegung zur nächsten Position
        nextPosition() {
            this.x += this.dx;
            this.y += this.dy;

            // Kollision mit Rändern: Richtung umkehren
            if (this.x > this.width || this.x < 0) this.dx = -this.dx;
            if (this.y > this.height || this.y < 0) this.dy = -this.dy;
        }
    };

    points.push(p);
}

// Animations-Setup

panels[12].callBack_onClick = () => {panels[12].toggleAnimation();};
panels[12].animation(
    // Vorbereitung: Canvas-Größe anpassen
    (ctx) => {
        points.forEach((p) => {
            p.width = ctx.canvas.width;
            p.height = ctx.canvas.height;
        });
    },
    // Zeichnen und Bewegung
    (ctx) => {
        // Canvas leeren
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Punkte zeichnen und bewegen
        points.forEach((p) => {
            p.draw(ctx);
            p.nextPosition();
        });
    }
        
);
  
 
      
} 
    
     
async function showSVGs(type)
{ 
   //load all SVG's
   svgContainer.innerHTML = '';
   svgContainer.buildFlexBoxLayout();

   var progress = dialogs.addLabel( svgContainer , "" , 1 , 1 , '100%' , '100%' , "loading ..." );
       progress.position = 'relative';
       progress.backgroundColor = 'rgba(0,0,0,0.25)';
       progress.color = 'white';

   var response = utils.webApiRequest('SCANDIR' , {dir:svgPath+type} )
   var svgs     = [];

   for (var i=0; i<response.result.length; i++)
       if(response.result[i].isFile) svgs.push( response.result[i].name );

   for(var i=0; i<svgs.length; i++)
   { 
    progress.caption = 'loading ' + i + ' of ' + svgs.length + '  (' + Math.round(i/svgs.length*100) + '%)';

    // Warte kurz, damit der Browser aktualisieren kann
    await utils.processMessages();

     var p = dialogs.addImage( svgContainer , "" , 1 , 1 , "77px" , "77px" );
     
     var svg = utils.webApiRequest('GETFILE',{fileName:svgPath + type + '/' + svgs[i]} ); 

        if (!svg.error) 
          {
            p.svgContent = svg.result;
            p.dataBinding = {svg:svg.result};
            p.callBack_onClick = function(e, d ) { var wnd = new TFWindow( svgContainer , 'TEST' , '50%' , '70%' , 'CENTER' ); 
                                                   var img = dialogs.addImage( wnd.hWnd ,  '' , 1, 1, '100%' , '100%' );                                       
                                                       img.svgContent = d.svg;
                                                 };
          }
    }      

    progress.destroy();

 }


 async function showIMGs(path )
{ 
   //load all SVG's
   svgContainer.innerHTML = '';
   svgContainer.buildFlexBoxLayout();

   var progress = dialogs.addLabel( svgContainer , "" , 1 , 1 , '100%' , '100%' , "loading ..." );
       progress.backgroundColor = 'rgba(0,0,0,0.25)';
       progress.color = 'white';

   var response = utils.webApiRequest('SCANDIR' , {dir:path} )
   imgs = [];

   for (var i=0; i<Math.min(response.result.length , 2000); i++)
       if(response.result[i].isFile) imgs.push( utils.buildURL('GETIMAGEFILE',{fileName:path + response.result[i].name }  ));

   for(var i=0; i<imgs.length; i++)
   { 
    progress.caption = 'loading ' + i + ' of ' + imgs.length + '  (' + Math.round(i/imgs.length*100) + '%)';

    // Warte kurz, damit der Browser aktualisieren kann
    await utils.processMessages();

     var p        = dialogs.addImage( svgContainer , "" , 1 , 1 , "77px" , "77px" );
         p.imgURL = imgs[i];
         p.dataBinding = {imgURL:p.imgURL, index:i};
         p.callBack_onClick = function(e, d ) { 
                                                var wnd        = new TFWindow( svgContainer , 'TEST' , '70%' , '90%' , 'CENTER' ); 
                                                var img        = dialogs.addImage( wnd.hWnd ,  '' , 1, 1, '100%' , '100%' );                                       
                                                    img.imgURL = d.imgURL;
                                                    imgNdx     = d.index;
                                                    wnd.callBack_onClick = (e)=>{
                                                                                  if(e.button==0) nextImage(img);
                                                                                  if(e.button==2) prevImage(img);
                                                                                  if(globals.isALTpressed) diaShow(img);
                                                                                 } 

                                                    var popup = new TFPopUpMenu([{caption:'Diashow',value:1} , {caption:'aabrechen',value:2 }]);
                                                        popup.onClick = function (sender , item ){ if(item.value==1) diaShow(this);}.bind(img);
                            
                                                    img.addPopupMenu(popup); 
                                                 };
    }

    progress.destroy();

 }

 function nextImage(img)
 {
    imgNdx++;
   if(imgNdx>imgs.length) imgNdx = 0;
   img.imgURL = imgs[imgNdx]; 
 }  

 function prevImage(img)
 {
    imgNdx--;
   if(imgNdx<0) imgNdx = imgs.length-1;
   img.imgURL = imgs[imgNdx]; 
 }  


 function diaShow(img)
 {
  setInterval( () => { nextImage(img); }, 4000 ); 
 }


 function apiTest()
 {
  var w = new TFWindow( null , 'API-Test' , '70%' , '30%' , 'CENTER' );
  w.buildGridLayout_templateColumns('1fr');
  w.buildGridLayout_templateRows('1fr 1fr 1fr 1fr');
  var c = dialogs.addInput ( w.hWnd ,          1 , 1 ,70 , 'Command' , '' , 'TEST' , {} );
  var p = dialogs.addInput ( w.hWnd ,          1 , 2 , 70 , 'params' , '' , '{param:value}' , {} );
  var l = dialogs.addLabel ( w.hWnd , '' ,     1 , 3 , '100%' , '2em' , 'Parameter in der Form "param1=value1;param2=value2..." angeben !' );
  var b = dialogs.addButton( w.hWnd , '' ,     1 , 4 , '10em' , '2em' , 'OK' );
     b.margin = '1em';
     b.callBack_onClick = function(){ 
                                      var param = {};
                                      var x = this.p.value.split(';');
                                      for(var i=0; i<x.length; i++)
                                      {
                                        var xx = x[i].split('=');
                                        param[xx[0]] = xx[1];
                                      }
                                      var response = utils.webApiRequest(this.c.value , param);
                                      console.log(response);
                                      dialogs.showMessage( JSON.stringify(response) );
                                    }.bind({c:c,p:p});
    
 }