
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TForm,
         TFPanel,
         TFImage,
         TPropertyEditor
       }                 from "./tfWebApp/tfObjects.js";


export class TPerson 
{
    #data        = {};
    #original    = {};
    #dirtyFields = new Set();
  
    constructor(dbPerson = {}) 
    {
     // enthält dbPerson NUR das Feld "ID", dann wird die Datenstruktur+Daten direkt aus der DB geladen 
     if (dbPerson.ID)
        {
          var response = this.load_from_dB(dbPerson.ID); 
            if(!response.error) dbPerson = response.result;
        }  
       
        for (const field in dbPerson) 
            {
             const value = dbPerson[field];
             this.#defineField(field, value);
        }
    }
  
   
    #defineField(fieldName, defaultValue) 
    {
      if(defaultValue)
        {
         this.#data    [fieldName] = defaultValue;
         this.#original[fieldName] = defaultValue;
        }  
  
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
    { debugger;
      var response = utils.webApiRequest('SAVEPERSON',{person:this.#data} );
      if(response.error){
         dialogs.showMessage(response.errMsg);
        return false;
      }
                        
      this.#data.ID = response.result.lastInsertRowid;                                   
      this.markClean();
      return true;
    }
   

edit()
{
  var caption = this.ID ? 'Person bearbeiten' : 'Neue Person anlegen';
  var w       =    dialogs.createWindow( null,caption,"80%","80%","CENTER");  
  var _w      =    w.hWnd;
  
  w.buildGridLayout_templateColumns('1fr 1fr 1fr 1fr');
  w.buildGridLayout_templateRows   ('1fr 1fr 1fr 1fr');

  var  f      = dialogs.addPanel(_w,'',1,1,3,4); 
  var  p      = new TFPanel( _w , 4 , 1 , 1 , 3 , {dropTarget:true} ); 
       p.callBack_onDrop = function( e,d ) {alert ('onDrop: '+JSON.stringify(d))}.bind(this);

     //  p.imgURL = this.portrait;
  var  c      = dialogs.addPanel(_w,'cssRibbon',4,4,1,1);
  c.backgroundColor = 'gray';
  
  var  clpBtn = dialogs.addButton(c,'',1,1,100,35,'clipbrd');
       clpBtn.callBack_onClick = function() { loadpersonImageFromClipboard( this.picture ) }.bind(this);

              // aParent      , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( f      , this.#data , {}      , {}        , ['ID']       , {}       , '' );    

      
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
                                             }.bind( {self:this, wnd:w, inp:inp , img:this.picture} )
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