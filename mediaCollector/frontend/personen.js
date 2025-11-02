
import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel}        from "./tfWebApp/tfObjects.js";  

import { TFgui }         from "./tfWebApp/tfGUI.js";         
import { TFDataObject}   from "./tfWebApp/tfDbObjects.js"
       
import {TFMediaCollector_thumb} from "./tfMediaCollector_thumb.js";


import * as forms        from "./forms.js";


export class TPerson extends TFDataObject
{
    #destDir       = 'mediaCache/persons';
    #portraitPath  = '';

    constructor( params ) 
    { 
      params = params || {id:'',datContainer:null, portraitPath:null};

      if (params.portraitPath) this.#portraitPath = params.portraitPath;

      super('PERSONS' , params.id , params.dataContainer );
    
      this.portraitURL = ()=>
      {
        // Um zu verhindern, dass JEDES MAL eine Serveranfrage veranlasst wird, wird der PortraitPath gepuffert ...
        if(this.PORTRAIT) 
        {
          if(this.#portraitPath  == '')
          {  
            var response = utils.webApiRequest('portraitURL' , {portrait:this.PORTRAIT} );
            if(response.error) {dialogs.showMessage(response.errMsg); return '';}
            this.#portraitPath = response.result;
          }  
          
          return utils.buildURL('GETIMAGEFILE',{fileName:this.#portraitPath+this.PORTRAIT});
        }
      }
    }  
 
   
   

edit( callback_if_ready )
{ 
  var gui         =  new TFgui( null , forms.personDlg , {autoSizeWindow:true} );
  var w           =  gui.getWindow();
  w.caption.text  =  this.ID ? 'Person bearbeiten' : 'Neue Person anlegen';


  // wenn im GUI-Builder das Datenfeld: "DataFieldName" auf den gültigen Feldamen in der dB-Tabelle gesetzt wurde,
  // kann das explizit gesetzte DataBinding entfallen.
  gui.dataBinding( this );
  gui.update('gui');
  
  gui.image.imgURL = this.portraitURL();
  dialogs.addFileUploader  ( p , '*.*' , true , 'mediaCache/persons' , (selectedFiles) => { this.PORTRAIT=selectedFiles.result.savedName});
  
  // lookUp Liste befüllen
  var herkunft = [];
  var response = utils.fetchRecords("Select  distinct HERKUNFT from persons order by HERKUNFT");
  if(!response.error) for(var i=0; i<response.result.length; i++) herkunft.push(response.result[i].HERKUNFT);

  gui.cbHerkunft.items = herkunft;
  



      gui.btnOk.callBack_onClick = function() { this.gui.update('data');
                                                this.self.save();
                                                //this.self.portraitPanel.imgURL = this.self.portraitURL();
                                                if(this.callback) this.callback();
                                                this.gui.close();
                                              }.bind({self:this,gui:gui,callback:callback_if_ready});

      gui.bttnAbort.callBack_onClick = function() {this.gui.close();}.bind({gui:gui}); 

      gui.btnImageFromClipboard.callBack_onClick = function() { loadpersonImageFromClipboard( this.picture ) }.bind(this);
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

      var gui = new TFgui( null , forms.personList );

      this.personPanel = gui.gridContainer;
      this.personPanel.buildBlockLayout();
      this.personPanel.position='relative';
      this.personPanel.overflow = 'hidden';

      this.personThumbView = dialogs.addPanel(this.personPanel,'cssContainerPanel',1,1,'100%','100%');
      this.personThumbView.position='relative';
      this.personThumbView.setInvisible()

      this.personGridView = dialogs.addPanel(this.personPanel,'cssContainerPanel',1,1,'100%','100%');
      this.personGridView.position='relative';
      this.personGridView.setVisible();



      gui.btnNew.callBack_onClick      = function(){this.newPerson()}.bind(this);
      gui.btnEdit.callBack_onClick     = function(){this.editPerson()}.bind(this);
      gui.btnDelete.callBack_onClick   = function(){dialogs.showMessage('Noch nicht implementiert!')}.bind(this);
      gui.btnListView.callBack_onClick = function(){ 
                                                    this.personThumbView.setInvisible();
                                                    this.personGridView.setVisible();
                                                  }.bind(this);
      


      gui.btnThumbView.callBack_onClick = function(){ 
                                                    this.personThumbView.setVisible();
                                                    this.personGridView.setInvisible();
                                                  }.bind(this);

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
            var p = new TPerson({id:response.result[i].ID , dataContainer:response.result[i] , portraitPath:portraitPath });
            
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
      var vl = [];
     // for(var key in p) vl.push({Name:key, Value:p[key]});
     // dialogs.valueList( this.personGridView , '' , vl );
    }

    
    updateGrid_personen()
    { 
        this.personGridView.innerHTML = '';
        var g = dialogs.createTable(this.personGridView , this.personen , ['ID','portraitURL'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedPerson(jsonData) }.bind(this);
    } 
    
    
    newPerson()
    {
       var p = new TPerson();
       p.edit(function(){this.updateGrid_personen()}.bind(this));
    } 


    editPerson()
    { 
     if(!this.selected) {dialogs.showMessage('Bitte zuerst eine Person auswählen!'); return;}

     this.selected.edit(function(){this.updateGrid_personen()}.bind(this));
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