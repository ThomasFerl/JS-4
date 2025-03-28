
import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";

export class TPerson 
{
    #data        = {};
    #original    = {};
    #dirtyFields = new Set();
  
    constructor(dbPerson = {}) 
    {
     for (const field in dbPerson) 
        {
         const value = dbPerson[field];
         this.#defineField(field, value);
        }
    }
  
   
    #defineField(fieldName, defaultValue) 
    {
      this.#data    [fieldName] = defaultValue;
      this.#original[fieldName] = defaultValue;
  
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
  
    load(id) 
    {
      this.#data     = {}; 
      this.#original = {}; 
      this.#dirtyFields.clear(); 

      var response = utils.webApiRequest('PERSON',{ID:id} );
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
                        
      this.#data.ID = response.result.lastInsertedId;                                   
      this.markClean();
      return true;
    }
   

edit()
{
  var caption = this.ID ? 'Person bearbeiten' : 'Neue Person anlegen';
  var w       =    dialogs.createWindow( null,caption,"80%","80%","CENTER");  
  var _w      =    w.hWnd;
  
  utils.buildGridLayout_templateColumns( _w , '1fr 1fr 1fr 1fr');
  utils.buildGridLayout_templateRows   ( _w , '1fr 1fr 1fr 1fr');

  var  w      = dialogs.addPanel(_w,'',1,1,3,4); 
  var  p      = dialogs.addPanel(_w,'',4,1,1,2); 
     //  p.imgURL = this.portrait;
  var  c      = dialogs.addPanel(_w,'cssRibbon',4,3,1,1); 
  
  var  clpBtn = dialogs.addButton(c,'',1,1,100,35,'clipbrd');
       clpBtn.callBack_onClick = function() { loadpersonImageFromClipboard( this.picture ) }.bind(this);
     
              // aParent      , aData    , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( _w , formData , {}      , {}        , []       , {}       , '' );    
/*
      inp.setLabel("favFastfood" , "Lieblings-Fastfood")
      inp.setInputType("favFastfood" , "select" , {items:["Pizza","Pommes","Döner","HotDog","Sushi"]} );
      inp.setInputType("gebDatum" , "date");
      inp.setInputType("level" , "range" , {sliderMin:1,sliderMax:100,sliderStep:5,sliderPosition:formData.level} );
      inp.setInputType("online" , "checkBox"  );
 */     
      inp.render( true);  
  
      inp.callBack_onOKBtn = function(values) { debugger;
                                               console.log(JSON.stringify(values));
                                               for(var i=0; i<values.length; i++) 
                                               { this[values[i].field] = values[i].value }

                                            }.bind( {wnd:_w, inp:inp , img:this.picture} )
}

}
 
     /* 
      inp.form.setLabel('NAME','Name');
      inp.form.setLabel('VORNAME','Vorname');
      inp.form.setLabel('ALIAS1','Alias #1');
      inp.form.setLabel('ALIAS2','Alias #2');
      inp.form.setLabel('ALIAS3','Alias #3');

      inp.form.setLabel('GEBURTSJAHR','Geburtsjahr');
      inp.form.setInputType('GEBURTSJAHR','number');
      inp.form.setInputLength('GEBURTSJAHR','5em');

      inp.form.setLabel('BUSINESSTART','Start Busines');
      inp.form.setInputType('BUSINESSTART','number');
      inp.form.setInputLength('BUSINESSTART','5em');

      inp.form.setLabel('BUSINESENDE','Ende Busines');
      inp.form.setInputType('BUSINESENDE','number');
      inp.form.setInputLength('BUSINESENDE','5em');

      inp.form.setLabel('RANKING','Ranking (1..10)');
      inp.form.setInputType('RANKING','range');
      inp.form.setInputLength('RANKING','14em');

}

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