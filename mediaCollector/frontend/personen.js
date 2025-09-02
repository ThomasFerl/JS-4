
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel,
         TFImage,
         TPropertyEditor
       }                        from "./tfWebApp/tfObjects.js";  
       
import {TFMediaCollector_thumb} from "./tfMediaCollector_thumb.js";


export class TPerson 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();
    #destDir       = 'mediaCache/persons';
    #portraitPath  = '';
   
    constructor(dbPerson = {} , portraitPath = null) 
    { 
      // enumarable: false macht das Feld „unsichtbar“ für z.B. Object.keys()     
      Object.defineProperty(this, 'portraitPanel', {
        value: {}, // dein Panel hier
        writable: true,
        configurable: true,
        enumerable: false  // <-- macht das Feld „unsichtbar“ für z.B. Object.keys()
      });
    // portraitPanel.imgURL = this.portraitURL(); 

    // portraitPath ist optional, wenn nicht angegeben, wird es später ermittelt
    // Bei Listen - Also dem wiederholtem Initialisieren von TPerson-Objekten, wird der 
    // srtändige Aufruf maximal redundant, so dass nur das ERSTE Listenelemen den Server abfragt
    // und alle weireren Objekte bekommen die Info mit auf dem  Weg...

    if(portraitPath) this.#portraitPath = portraitPath;

     // Prüfung: enthält dbPerson **nur** das Feld "ID" dann wird es aus der dB geladen. Dazu muss natürlich eine dB-Instanz mitgegeben werden
     const keys = Object.keys(dbPerson);

    if (keys.length === 1 && keys[0] === "ID") 
    {
      const response = this.load_from_dB(dbPerson.ID);
      if (!response.error) dbPerson = response.result;
    }
       
        for (const field in dbPerson) 
            {
             const value = dbPerson[field];
             this.#defineField(field, value || '');
             console.log("THIS->" + utils.JSONstringify(this));
        }


      this.portraitURL = ()=>
      {
        // Um zu verhindern, dass JEDES MAL eine Serveranfrage veranlasst wird, wird der PortraitPath gepuffert ...
        if(this.PORTRAIT) 
        {
          if(this.#portraitPath  == '')
          {  
            var response = utils.webApiRequest('portraitURL' , {portrait:''} );
            if(response.error) {dialogs.showMessage(response.errMsg); return '';}
            this.#portraitPath = response.result;
          }  
          
          return utils.buildURL('GETIMAGEFILE',{fileName:this.#portraitPath+this.PORTRAIT});
        }
      }
    }  
  
   
    #defineField(fieldName, defaultValue) 
    {
      // "ERZEUGEN" des Feldnamen innerhalb des lokalen "Data-Containers" 
      this.#data    [fieldName] = defaultValue || '';
      this.#original[fieldName] = defaultValue || '';
     
      Object.defineProperty(this, fieldName, {
                                               get: () => this.#data[fieldName],
                                               set: (val) => {
                                                               this.#data[fieldName] = val;
                                                               if (val !== this.#original[fieldName]) this.#dirtyFields.add(fieldName);
                                                               else                                   this.#dirtyFields.delete(fieldName);
                                                             },
                                              enumerable: true
                                            });
    }
  
    get isDirty() {return this.#dirtyFields.size > 0;}
    
  
    getChangedFields() {return Array.from(this.#dirtyFields);}
    
  
    markClean() 
    {
      this.#dirtyFields.clear();
      Object.assign(this.#original, this.#data);
    }
  
    load_from_dB(id) 
    {
      return  utils.webApiRequest('PERSON',{ID:id} );
    }

    load(id) 
    {
       var response = this.load_from_dB(id); 
       if(response.error){return false;}
               
      this.#data = response.result;                                    
      this.markClean();
      
      return true;
    }
  
    save() 
    { 
      var response = utils.webApiRequest('SAVEPERSON',{person:this.#data} );
      if(response.error){
         dialogs.showMessage(response.errMsg);
        return false;
      }
                        
      if(!this.#data.ID) this.#data.ID = response.result.lastInsertRowid;                                   
      this.markClean();
      return true;
    }
   

edit( callback_if_ready )
{
  var caption = this.ID ? 'Person bearbeiten' : 'Neue Person anlegen';
  var w       =    dialogs.createWindow( null,caption,"80%","80%","CENTER");  
  
  var gui    =  new TFgui( w , 'personDlg' );

      // Hier werden die Datenfelder der Datenbank mit den GUI-Elementen verbunden
      this.addDataBinding( gui.editFirstName , 'VORNAME' );
      this.addDataBinding( gui.editName      , 'NAME'    );
      this.addDataBinding( gui.editAlias1    , 'ALIAS1'  );
      this.addDataBinding( gui.editAlias2    , 'ALIAS2'  );
      this.addDataBinding( gui.editAlias3    , 'ALIAS3'  );


  
  w.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr');
  w.buildGridLayout_templateRows   ('1fr 1fr 1fr 1fr');
  // form 
  var  f      = dialogs.addPanel(_w,'',1,1,3,4); 
 
  this.portraitPanel  = new TFPanel( _w  , 4 , 1 , 1 , 3 , {dropTarget:true} ); 
  this.portraitPanel.imgURL = this.portraitURL();
  this.portraitPanel.callBack_onDrop = function(e,d) {debugger; this.dropImage(e,d) }.bind(this); 

  
 // dialogs.addFileUploader  ( p , '*.*' , true , 'mediaCache/persons' , (selectedFiles) => { this.PORTRAIT=selectedFiles.result.savedName});
  
 debugger;
  var herkunft = [];
  var response = utils.fetchRecords("Select  distinct HERKUNFT from personen order by HERKUNFT");
  if(!response.error) for(var i=0; i<response.result.length; i++) herkunft.push(response.result[i].HERKUNFT);
  
      
  var  c      = dialogs.addPanel(_w,'cssRibbon',4,4,1,1);
  c.backgroundColor = 'gray';
  
  var  clpBtn = dialogs.addButton(c,'',1,1,100,35,'clipbrd');
       clpBtn.callBack_onClick = function() { loadpersonImageFromClipboard( this.picture ) }.bind(this);

              // aParent      , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( f      , this.#data , {}      , {}        , ['ID','PORTRAIT']       , {}       , '' );    
      inp.setLabel('NAME','Name');
      inp.setLabel('VORNAME','Vorname');
      inp.setLabel('ALIAS1','Alias #1');
      inp.setLabel('ALIAS2','Alias #2');
      inp.setLabel('ALIAS3','Alias #3');
      inp.setLabel('HERKUNFT','Herkunft');
      inp.setInputType('HERKUNFT','lookup',{items:herkunft});

      inp.setLabel('GEBURTSJAHR','Geburtsjahr');
      inp.setLabel('BUSINESSTART','Start Busines');
      inp.setLabel('BUSINESENDE','Ende Busines');
      inp.setLabel('RANKING','Ranking (1..10)');
      inp.setInputType('RANKING','range', {sliderMin:1,sliderMax:10,sliderStep:1,sliderPosition:this.#data.RANKING} );
      
      inp.render( true);  
      
      inp.callBack_onOKBtn = function(values) {
                                               for(var i=0; i<values.length; i++) 
                                               { this.self.#data[values[i].field] = values[i].value }
                                               this.self.save();  
                                               this.wnd.close(); 
                                               if(this.callback) this.callback();
                                             }.bind( {self:this, wnd:w, inp:inp , img:this.picture , callback:callback_if_ready} )
}


dropImage( e , data )  // onDrop ( event , data )
{ 
  if (data.localFile) 
    {
     const f = (globals.session.userName || 'developer') + '_' + utils.buildRandomID();
     utils.uploadFileToServer(data.localFile, f, 
           function(result)
           { debugger;
             this.self.PORTRAIT=result.result.savedName; ; 
             this.self.portraitPanel.imgURL=this.self.portraitURL() 
            }.bind({self:this,destDir:this.#destDir}) , {destDir:this.#destDir} );
    }

 
    if (data.json) 
    {
      debugger
      var response = utils.webApiRequest('PORTRAITFROMFILE' , {ID_FILE:data.json.mediaFile.ID , fnPortrait:this.ID+"_"+Date.now() } );
      if (response.error) 
      {
        dialogs.showMessage(response.errMsg);
        return;
      }
      this.PORTRAIT             = response.result;
      this.portraitPanel.imgURL = this.portraitURL() 
    }
      

        if (data.url) {
          alert("Web-Image gedroppt:"+ data.url);
        }
      
        if (data.plainText) {
          alert("Plain Text:"+ data.plainText);
        }
}

portraitPath()
{ return this.#portraitPath}



}


export class TPersonList
{
    constructor()
    {
      this.personen    = [];
      this.personThums = [];
      this.selected    = null;

      this.personenWnd = dialogs.createWindow( null,'Personen','80%','80%','CENTER');
      this.personenWnd.buildGridLayout_templateColumns('1fr');
      this.personenWnd.buildGridLayout_templateRows   ('4em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.personenWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddPerson    = dialogs.addButton(this.menuPanel,'',1,1,1,1, {caption:'neu',glyph:'person-circle-plus'});
      this.btnAddPerson.height='3em';
      this.btnAddPerson.callBack_onClick = function(){this.newPerson()}.bind(this);
      
      this.btnEditPerson   = dialogs.addButton(this.menuPanel,'',2,1,1,1,{caption:'bearbeiten',glyph:'person-circle-check'});
      this.btnEditPerson.height='3em';
      this.btnEditPerson.callBack_onClick = function(){this.editPerson()}.bind(this);

      this.btnDeletePerson = dialogs.addButton(this.menuPanel,'',3,1,1,1,{caption:'löschen',glyph:'person-circle-minus'});
      this.btnDeletePerson.height='3em';

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,{caption:'schließen',glyph:'right-from-bracket'});
      this.btnCloseWnd.callBack_onClick = function(){this.personenWnd.close()}.bind(this);
      this.btnCloseWnd.height='3em';
      
      //-------------------------------------------------------------------------------

      // Hilfscontainer zur Platzaufteilung                    
      var hlpContainer1 = dialogs.addPanel(this.personenWnd.hWnd,'cssContainerPanel',1,2,1,1);
          hlpContainer1.buildGridLayout_templateColumns('1fr 1fr 1fr');
          hlpContainer1.buildGridLayout_templateRows('1fr');

      var hlpContainer2 = dialogs.addPanel(hlpContainer1,'cssContainerPanel',1,1,2,1);
          hlpContainer2.buildGridLayout_templateColumns('1fr');
          hlpContainer2.buildGridLayout_templateRows('2em 1fr');    

      // ----------------linke Seite: FilterPanel + personListPanel
      this.filterPanel     = dialogs.addPanel(hlpContainer2,'',1,1,1,1);
      this.personPanel     = dialogs.addPanel(hlpContainer2,'',1,2,1,1);
      //-------------------------------------------------------------------------------
      this.filterPanel.buildGridLayout_templateColumns('1fr 2em 2em'); 
      this.filterPanel.buildGridLayout_templateRows   ('1fr');
      this.filterPanel.overflow = 'hidden';
      this.filterPanel.padding = '0';

      var btnListView  = dialogs.addButton(this.filterPanel,'',2,1,1,1,{glyph:'align-justify' , glyphColor:'black'});
          btnListView.backgroundColor = 'gray';
          btnListView.margin='0';
          btnListView.marginRight='4px';
          
          btnListView.color = 'black';
          btnListView.callBack_onClick = function(){ 
                                                    this.personThumbView.setInvisible();
                                                    this.personGridView.setVisible();
                                                  }.bind(this);
      
      var btnThumbView = dialogs.addButton(this.filterPanel,'',3,1,1,1,{glyph:'users-line' , glyphColor:'black'});
          btnThumbView.backgroundColor = 'gray';
          btnThumbView.margin='0';
          btnThumbView.marginLeft='4px';
          btnThumbView.callBack_onClick = function(){ 
                                                    this.personThumbView.setVisible();
                                                    this.personGridView.setInvisible();
                                                  }.bind(this);

      var hlpContainer3 = dialogs.addPanel(hlpContainer1,'cssContainerPanel',3,1,1,1);
          hlpContainer3.buildGridLayout_templateColumns('1fr');
          hlpContainer3.buildGridLayout_templateRows('1fr 1fr');    

      // ----------------rechte Seite: Portrait + mediaReferenzen
      this.imagePanel      = dialogs.addPanel(hlpContainer3,'',1,1,1,1);
      this.personMediaPanel= dialogs.addPanel(hlpContainer3,'',1,2,1,1);
      //---------------------------------------------------------------------------
      // Das personMediaPanel ist ein Container für das listViewPanel und dem thumbViewPanel
      // die jeweils wechselseitig angezeigt werden. Beide sind überlagert und werden via hide & show gesteuert

      this.personPanel.buildBlockLayout();
      this.personPanel.position='relative';
      this.personPanel.overflow = 'hidden';

      this.personThumbView = dialogs.addPanel(this.personPanel,'cssContainerPanel',1,1,'100%','100%');
      this.personThumbView.position='relative';
      this.personThumbView.setInvisible()

      this.personGridView = dialogs.addPanel(this.personPanel,'cssContainerPanel',1,1,'100%','100%');
      this.personGridView.position='relative';
      this.personGridView.setVisible();

      this.loadPersons();

      this.updateGrid_personen();
    }



    loadPersons()
    { 
      var portraitPath = null;
      var response     = utils.webApiRequest('LSPERSON' , {} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      else 
        for(var i=0; i<response.result.length; i++) 
        { 
            var p = new TPerson(response.result[i] , portraitPath );
            
            var t = new TFMediaCollector_thumb( this.personThumbView , {thumbURL:p.portraitURL() , caption:p.VORNAME+' '+p.NAME} );
                t.person = p;
                t.callBack_onClick = function(e,d,h) { this.selectedPerson(h.self.person) }.bind(this);

            // im ersten Durchlauf wird PATH ermittelt -danach wird es nur noch gesetzt
            if(i==0) portraitPath = p.portraitPath();    

            this.personen.push( p );
            this.personThums.push( t );
        }
      }

   
    selectedPerson(p)
    {
      this.person            = p;
      this.selected          = p;
      this.imagePanel.imgURL = p.portraitURL();

      dialogs.valueList( panels[11] , '' , [ {Name:'Ferl'},
                                                  {Vorname:'Thomas'},
                                                  {geb:'29.10.1966'},
                                                  {Wohnort:'Schönebeck'}] );

    
    }

    
    updateGrid_personen()
    { 
        this.personGridView.innerHTML = '';
        var g = dialogs.createTable(this.personGridView , this.personen , ['ID','ALIAS1','ALIAS2','ALIAS3','GEBURTSJAHR','BUSINESSTART','BUSINESENDE','BEMERKUNGEN','PORTRAIT','portraitURL'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedPerson(jsonData) }.bind(this);
    } 
    
    
    newPerson()
    {
      var aPerson = {
        ID           : 0,
        NAME         : '',
        VORNAME      : '',
        ALIAS1       : '',
        ALIAS2       : '',
        ALIAS3       : '',
        GEBURTSJAHR  : null,
        HERKUNFT     : '',
        BUSINESSTART : null,
        BUSINESENDE  : null,
        RANKING      : 0,
        BEMERKUNGEN  : '' ,
        PORTRAIT     : ''};
      
        var p = new TPerson(aPerson);
        p.edit(function(){this.updateView_personen()}.bind(this));
    } 


    editPerson()
    { 
     if(!this.selected) {dialogs.showMessage('Bitte zuerst eine Person auswählen!'); return;}

     this.selected.edit(function(){this.updateView_personen()}.bind(this));
    } 

    
}



 
   /*
async function loadpersonImageFromClipboard( imageObj ) 
{
  console.log('loadpersonImageFromClipboard ...');
  console.log('check permission:');
  try {
    const permission = await navigator.permissions.query({
      name: "clipboard-read",
    });
    console.log('clipboard-read -> ' + permission.state);  

    if (permission.state === "denied") {
      throw new Error("Not allowed to read clipboard.");
    }

    console.log('read Clipboard Content ...');
    const clipboardContents = await navigator.clipboard.read();
    let i=0;
    for (let item of clipboardContents) 
    {
      i++;
      let imageType  = item.types.find(type => type.startsWith("image/"));
      if (imageType) 
      {
        console.log('try to load "'+imageType+'" from clipboard ...');
        let file = await item.getType(imageType);

         utils.uploadFileToServer(file, '' , function (response) { 
                                                                  if(response.error) dialogs.showMessage(response.errMsg);
                                                                  else{
                                                                      var p  = response.result.path;
                                                                      console.log('loadImage path: '+p);
                                                                      var url=utils.buildURL( 'LOADIMAGE' ,  {img:p} )
                                                                      this._custum_path = p;
                                                                      console.log('this._custum_path :'+ this._custum_path )
                                                                      this.paint( url ) 
                                                                    }}.bind(imageObj)  ); 
     } else console.log('clipboard-content is "'+imageType+'". This is not a image !')

    }
  } catch(err) {dialogs.showMessage(err.message)}   
}
  */