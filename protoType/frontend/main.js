
import * as globals      from "./tfWebApp/globals.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";  
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as app          from "./tfWebApp/tfWebApp.js"; 
import * as sysadmin     from "./tfWebApp/tfSysAdmin.js";


// Anwendungsspezifische Einbindungen
import { TFEdit, 
         TForm,
         TFPopUpMenu,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";


var caption1  = '';
var caption2  = '';

var testContainer1 = null;
var testContainer2 = null;
var testContainer3 = null;


var panels         = [];
var menuContainer  = null;
var dashBoard      = null;

var editPath       = null;
var clock          = null;
var chart          = null; 
var osziX          = 0;   
var treeView       = null;
var treeData       = {};



export function main(capt1)
{
  caption1 = capt1;
  caption2 = '';
  
  globals.sysMenu.push( {caption:'Benutzer' , action:function(){sysadmin.adminUser()} } );
  globals.sysMenu.push( {caption:'Berechtigungen' , action:function(){sysadmin.adminGrants()} } );
  globals.sysMenu.push( {caption:'Info' , action:function(){app.sysInfo()} } );
  globals.sysMenu.push( {caption:'API-Test (nur in der Entwicklungsphase)' , action:function(){app.APItest()} } );
  globals.sysMenu.push( {caption:'Symbol-Bibliothek (nur in der Entwicklungsphase)' , action:function(){dialogs.browseSymbols()} } );
  globals.sysMenu.push( {caption:'GUI Builder (nur in der Entwicklungsphase)' , action:function(){app.guiBuilder()} } );
    globals.sysMenu.push( {caption:'Abbrechen' , action:function(){} } );
  
  app.login( ()=>{  caption2 = 'Willkommen ' + globals.session.userName ; run() });
  
}  


export function run()
{ 
   //  document.document.requestFullscreen();

    var ws = app.startWebApp(caption1,caption2).activeWorkspace;

    var l  = dialogs.setLayout( ws.handle , {gridCount:28,head:3,left:14} )
  
      menuContainer = l.head;

      var testContainer = l.left;
          testContainer.buildGridLayout_templateColumns('1fr 1fr 1fr');
          testContainer.buildGridLayout_templateRows('1fr');

          testContainer1 = dialogs.addPanel( testContainer , "" , 1 , 1 , 1 , 1 );  
          testContainer2 = dialogs.addPanel( testContainer , "" , 2 , 1 , 1 , 1 );
          testContainer3 = dialogs.addPanel( testContainer , "" , 3 , 1 , 1 , 1 );

      dashBoard  = l.dashBoard; 

      menuContainer.backgroundColor = 'gray';
      menuContainer.buildGridLayout_templateColumns('10em 10em 10em 10em 10em 10em 10em 10em 10em 10em 10em 1fr ');
      menuContainer.buildGridLayout_templateRows('1fr');

 
  var btn4 = dialogs.addButton( menuContainer , "" , 4 , 1 , 1 , 1 , "Grid-Test"  )
      btn4.callBack_onClick = function() { 
                                           var g = dialogs.createTable( dashBoard , [{Name:"Ferl",Vorname:"Thomas",gebDatum:"29.10.1966"},
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
                                            var form = new TForm( dashBoard , formData , {}      , {}        , []       , {}       , '' );    
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
                                                        {label:"favFastfood",value:"Pizza",type:"lookup",items:["Pizza","Pommes","Döner","HotDog","Sushi"]},
                                                        {label:"level",value:"90",type:"range",items:[]},
                                                        {label:"online",value:"true",type:"boolean",items:[]}];

                                                        var p = new TPropertyEditor( dashBoard , data , null , null )
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
            p.callBack_onKeyDown = function(e) { if(e.keyCode==13) alert(enter) ; }.bind(p);
            p.borderRadius = '1px';
            p.margin = '0.1em';
            p.buildGridLayout('1x1');
            p.overflow = 'hidden';  
            panels.push(p);
      } 


      var l=dialogs.addLabel( panels[0] , '' , 1 , 1 , 1 , 1 , 'irgend ein Text (Label)' );
      
      editPath = dialogs.addInput( panels[1] , 1 , 1 , 10 , 'path' , '' , '' , {} );
     
      dialogs.addDateTimePicker( panels[2] , 1 , 1 , 'dateTime' , '01.01.2000 17:35' , null , {} );

      dialogs.addDatePicker( panels[3] , 1 , 1 , 'date' , '17.01.2013 18:03' , null , {} );

      dialogs.addTimePicker( panels[4] , 1 , 1 , 'time' , '01.01.2000 17:35' , null , {} );

      dialogs.addFileUploader(panels[5] , '*.*' , true , 'testUpload' , (selectedFiles) => {dialogs.showMessage(JSON.stringify(selectedFiles))}  );
                 
      
      dialogs.addCombobox( panels[6] , 1 , 1 , 10 , 'combobox' , '' , 'aaaa' , [ {caption:'aaaa',value:'A'},
                                                                                 {caption:'bbbb',value:'B'},
                                                                                 {caption:'cccc',value:'C'},
                                                                                 {caption:'dddd',value:'D'} ] , {} );
             
      dialogs.addCheckBox( panels[7], 1,1,'checkBox' , true , {checkboxLeft:false} );

    
      dialogs.addButton( panels[8] , '' , 1 , 1 , 100 , 32 , 'API-Test' )
             .callBack_onClick = ()=> { apiTest(); };


      dialogs.addButton( panels[9] , '' , 1 , 1 , 100 , 32 , 'Datei-Manager' ) 
             .callBack_onClick=()=>{dialogs.fileDialog( "/" , "*.*" , true , (d,f,ff)=>{editPath.value=d+'/';} , (fn)=>{alert(fn)} )};
          



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
for (let i = 0; i < 10; i++) {    
    const p = {
        x: Math.round(Math.random() * 200), // Zufällige Startposition (x)
        y: Math.round(Math.random() * 200), // Zufällige Startposition (y)
        radius: 7,                          // Radius des Punkts
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
    
 

 function apiTest()
 {
  var w = new TFWindow( null , 'API-Test' , '70%' , '30%' , 'CENTER' );
  var cmds = ['LSGRANTS' , 'GETUSERGRANTS' , 'GETVAR' , 'GETVARS' , 'USERLOGOUT' , 'CREATETABLE' , 'FETCHVALUE' , 'FETCHRECORD' , 'FETCHRECORDS',
              'INSERTINTOTABLE' , 'UPDATETABLE' , 'DROP' , 'EXISTTABLE' , 'STRUCTURE' , 'AST' , 'LSUSER' , 'ADDUSER' ,  'EDITUSER' , 'ADDGRANT' , 'IDGRANT' , 
              'RESETUSERGRANTS' , 'ADDUSERGRANT' , 'SETUSERGRANTS' , 'GETUSERGRANTS' , 'SETVAR' , 'DELVAR' , 'JSN2EXCEL' ];
              
  var cbItems = [];
  for(var i=0; i<cmds.length; i++) cbItems.push({caption:cmds[i],value:cmds[i]}); 


  w.buildGridLayout_templateColumns('1fr');
  w.buildGridLayout_templateRows('1fr 1fr 1fr 1fr');
  var c = dialogs.addCombobox( w.hWnd ,        1 , 1 ,70 , 'Command' , '' , 'TEST' , cbItems , {} );
  var p = dialogs.addInput ( w.hWnd ,          1 , 2 , 70 , 'params' , '' , '{param:value}' , {} );
  var l = dialogs.addLabel ( w.hWnd , '' ,     1 , 3 , '100%' , '2em' , 'Parameter in der Form "param1=value1;param2=value2..." angeben !' );
  var b = dialogs.addButton( w.hWnd , '' ,     1 , 4 , '10em' , '2em' , 'OK' );
     b.margin = '1em';
     b.callBack_onClick = function(){ 
                                      var param = utils.parseToJSON(this.p.value);
                                      console.log("param =>"+JSON.stringify(param));
                                      var response = utils.webApiRequest(this.c.value , param);
                                      console.log(response);
                                      dialogs.showMessage( JSON.stringify(response) );
                                    }.bind({c:c,p:p});
    
 }