
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel,
         TFImage,
         TPropertyEditor
       }                 from "./tfWebApp/tfObjects.js";


export class TPerson 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();
    #destDir       = 'mediaCache/persons';
   
    constructor(dbPerson = {}) 
    { 
      // enumarable: false macht das Feld „unsichtbar“ für z.B. Object.keys()     
      Object.defineProperty(this, 'portraitPanel', {
        value: {}, // dein Panel hier
        writable: true,
        configurable: true,
        enumerable: false  // <-- macht das Feld „unsichtbar“ für z.B. Object.keys()
      });
    // portraitPanel.imgURL = this.portraitURL(); 


     // Prüfung: enthält dbPerson **nur** das Feld "ID"
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
        if(this.PORTRAIT) 
        {
          var response = utils.webApiRequest('portraitURL' , {portrait:this.PORTRAIT} );
          if(!response.error) return utils.buildURL('GETIMAGEFILE',{fileName:response.result});
          else return ''; 
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
  var _w      =    w.hWnd;
  
  w.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr');
  w.buildGridLayout_templateRows   ('1fr 1fr 1fr 1fr');
  // form 
  var  f      = dialogs.addPanel(_w,'',1,1,3,4); 
 
  this.portraitPanel  = new TFPanel( _w  , 4 , 1 , 1 , 3 , {dropTarget:true} ); 
  this.portraitPanel.imgURL = this.portraitURL();
  this.portraitPanel.callBack_onDrop = function(e,d) { this.dropImage(e,d) }.bind(this); 

  
 // dialogs.addFileUploader  ( p , '*.*' , true , 'mediaCache/persons' , (selectedFiles) => { this.PORTRAIT=selectedFiles.result.savedName});
         
      
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
      var response = utils.webApiRequest('PORTRAITFROMFILE' , {ID_FILE:data.json.ID_FILE , fnPortrait:this.ID+"_"+Date.now() } );
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



}


export class TPersonList
{
    constructor()
    {
      this.personen = [];
      this.selected = null;

      this.personenWnd = dialogs.createWindow( null,'Personen','80%','80%','CENTER');
      this.personenWnd.buildGridLayout_templateColumns('1fr');
      this.personenWnd.buildGridLayout_templateRows   ('3em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.personenWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddPerson    = dialogs.addButton(this.menuPanel,'',1,1,1,1,'neu');
      this.btnAddPerson.height='2em';
      this.btnAddPerson.callBack_onClick = function(){this.newPerson()}.bind(this);
      
      this.btnEditPerson   = dialogs.addButton(this.menuPanel,'',2,1,1,1,'bearbeiten');
      this.btnEditPerson.height='2em';
      this.btnEditPerson.callBack_onClick = function(){this.editPerson()}.bind(this);

      this.btnDeletePerson = dialogs.addButton(this.menuPanel,'',3,1,1,1,'löschen');
      this.btnDeletePerson.height='2em';

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.personenWnd.close()}.bind(this);
      this.btnCloseWnd.height='2em';
      
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

      var hlpContainer3 = dialogs.addPanel(hlpContainer1,'cssContainerPanel',3,1,1,1);
          hlpContainer3.buildGridLayout_templateColumns('1fr');
          hlpContainer3.buildGridLayout_templateRows('1fr 1fr');    

      // ----------------rechte Seite: Portrait + mediaReferenzen
      this.imagePanel      = dialogs.addPanel(hlpContainer3,'',1,1,1,1);
      this.personMediaPanel= dialogs.addPanel(hlpContainer3,'',1,2,1,1);
      //---------------------------------------------------------------------------

      this.personGridView = dialogs.addPanel(this.personPanel,'cssContainerPanel',1,1,'100%','100%');
      this.personGridView.position='absolute';

      var response = utils.webApiRequest('LSPERSON' , {} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      else 
           for(var i=0; i<response.result.length; i++) { this.personen.push( new TPerson(response.result[i]) ); }

      this.updateView_personen();
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

    
    updateView_personen()
    { 
        this.personGridView.innerHTML = '';
        var g = dialogs.createTable(this.personGridView , this.personen , ['ID','ALIAS1','ALIAS2','ALIAS3','GEBURTSJAHR','BUSINESSTART','BUSINESENDE'] , [] );
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