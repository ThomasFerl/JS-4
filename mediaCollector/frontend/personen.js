
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel}        from "./tfWebApp/tfObjects.js";  

import { TFgui }         from "./tfWebApp/tfGUI.js";         
import { TFDataObject}   from "./tfWebApp/tfDbObjects.js"
       
import {TFMediaCollector_thumb} from "./tfMediaCollector_thumb.js";



export class TPerson extends TFDataObject
{
    #destDir       = 'mediaCache/persons';
    #portraitPath  = '';

    constructor( tableName , portraitPath = null ) 
    { 
      super('PERSON');
    
      if(portraitPath) this.#portraitPath = portraitPath;

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
 
   
   

edit( callback_if_ready )
{
  var caption = this.ID ? 'Person bearbeiten' : 'Neue Person anlegen';
  var w       =    dialogs.createWindow( null,caption,"100%","100%","CENTER");  
  
  var gui     =  new TFgui( w , 'personDlg' , {autoSizeWindow:true} );

      gui.btnOk.callBack_onClick = function() { this.gui.update('data');
                                                this.self.save();
                                                this.self.portraitPanel.imgURL = this.self.portraitURL();
                                                if(this.callback) this.callback();
                                                this.wnd.close();
                                              }.bind({self:this,gui:gui,wnd:w,callback:callback_if_ready});

      gui.bttnAbort.callBack_onClick = function() { this.wnd.close() }.bind({wnd:w}); 
      gui.btnImageFromClipboard.callBack_onClick = function() { loadpersonImageFromClipboard( this.picture ) }.bind(this);



  // wenn im GUI-Builder das Datenfeld: "DataFieldName" auf den gültigen Feldamen in der dB-Tabelle gesetzt wurd,
  // kann das explizit gesetzte DataBinding entfallen.
  gui.dataBinding( this );
  gui.update('gui');
  
  gui.imaage.imgURL = this.portraitURL();
  

  
 // dialogs.addFileUploader  ( p , '*.*' , true , 'mediaCache/persons' , (selectedFiles) => { this.PORTRAIT=selectedFiles.result.savedName});
  
 
  var herkunft = [];
  var response = utils.fetchRecords("Select  distinct HERKUNFT from personen order by HERKUNFT");
  if(!response.error) for(var i=0; i<response.result.length; i++) herkunft.push(response.result[i].HERKUNFT);

  gui.cbHerkunft.items = herkunft;
  
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