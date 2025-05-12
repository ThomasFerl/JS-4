import * as globals      from "./globals.js";
import * as utils        from "./utils.js";
import * as dialogs      from "./tfDialogs.js";

import {TForm}          from "./tfObjects.js";



export class TFUser 
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();

    
    constructor(dbUser = {}) 
    { 
      this.userGrants = []; 
     // Prüfung: enthält dbUser **nur** das Feld "ID"
     const keys = Object.keys(dbUser);

     if (keys.length === 1 && keys[0] === "ID") 
     {
      var response = this.load_from_dB(dbUser.ID);
      if (!response.error) dbUser = response.result;

      response = utils.webApiRequest('getUserGrants' , JSON.stringify({userName:dbUser.username}));
      if(!response.error) this.userGrants = response.result;
     }
     else
         {
           if (this.userGrants.length==0)
           {
            var response = utils.webApiRequest('getUserGrants' , JSON.stringify({userName:dbUser.username}));
            if(!response.error) this.userGrants = response.result;
           }
         }
       
     for (const field in dbUser) 
     {
             const value = dbUser[field];
             this.#defineField(field, value || '');
             console.log("THIS->" + utils.JSONstringify(this));
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

    hasAccess(grantName)
    {
      for(var i=0; i<this.userGrants.length; i++)
      {
        var g = this.userGrants[i];
        if(g.name == grantName) { return g.access }
      }
      return false;
    } 


    setAccess( grantName , checked)
    { 
      for(var i=0; i<this.userGrants.length; i++)
      {
        var g = this.userGrants[i];
        if(g.name == grantName) { g.access=checked; return true;}
      }
      return false;
    }

    
  
    markClean() 
    {
      this.#dirtyFields.clear();
      Object.assign(this.#original, this.#data);
    }
  
    load_from_dB(id) 
    {
      return  utils.webApiRequest('USER',{userID:id} );
    }

    load(id) 
    {
       var response = this.load_from_dB(id); 
       if(response.error){return false;}
               
      this.#data = response.result;                                    
      this.markClean();
      
      return true;
    }
  
    save() // ggf werden Berechtigungen mitgeliefert ...
    { 
      if(!this.ID || this.ID==0 || this.ID=='')
      { 
         var response = utils.webApiRequest('ADDUSER',this.#data );
         if(response.error)
         {
           dialogs.showMessage(response.errMsg);
           return false;
         }
         this.ID = response.result.lastInsertRowid;
      } 
      
       utils.webApiRequest('EDITUSER',this.#data );
      
       if(this.userGrants.length>0)
        utils.webApiRequest('setUserGrants' , JSON.stringify( {ID_user:this.ID , grants:this.userGrants} ) );
    }
   

edit( callback_if_ready )
{
  var caption = this.ID ? 'Benutzer bearbeiten' : 'Benutzer anlegen';
  
  var wWidth  = '49%';
  if(globals.session.admin) wWidth = '77%';

  var w       =    dialogs.createWindow( null,caption,wWidth,"60%","CENTER");  
  var _w      =    w.hWnd;

  _w.buildGridLayout_templateRows('1fr');

  if(globals.session.admin) _w.buildGridLayout_templateColumns('1fr 1fr');
  else                      _w.buildGridLayout_templateColumns('1fr');

  var hlpContainer = dialogs.addPanel(_w,'cssContainerPanel',1,1,1,1);

  
              // aParent     , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( hlpContainer    , this.#data , {}      , {}        , ['ID']             , {}       , '' );    
      inp.render( true ); 


  if(globals.session.admin)
  {   // Falls Admin -> rechte Seite mit Berechtigungs-Objekten einblenden ...
      var grantDiv            = dialogs.addPanel( _w , "cssContainerPanel" ,  2 , 1 , 1 , 1 );
      grantDiv.margin         = '4px';
      grantDiv.padding        = '4px';


      grantDiv.buildGridLayout_templateColumns('1fr');
      grantDiv.buildGridLayout_templateRows('2em 1fr');
      var captDiv             = dialogs.addPanel( grantDiv , "cssContainerPanel" ,  1 , 1 , 1 , 1 );
      captDiv.backgroundColor = "black";
      var lbl                 = dialogs.addLabel(captDiv , '' , 1,1,"100%",'100%', 'Berechtigungen');
      lbl.fontSize            = '1em';
      lbl.justifyContent      = 'center';
      lbl.color               = 'white';

      var cbItems  = []; 
      for(var i=0; i<globals.session.grants.length; i++) 
      {
         var g = globals.session.grants[i];
         cbItems.push({text:g.caption || g.name, checked:this.hasAccess(g.name) , name:g.name , id_grant:g.ID});
      } 
      var grants   = dialogs.addPanel( grantDiv , "cssContainerPanel" ,  1 , 2 , 1 , 1 );
          
          
      var cb       = dialogs.addListCheckbox(grants , cbItems);
    }    
 
    inp.callBack_onESCBtn = function() { this.wnd.close(); }.bind( {self:this, wnd:w} )

    inp.callBack_onOKBtn  = function(values) { 
                                               for(var i=0; i<values.length; i++) this.self.#data[values[i].field] = values[i].value 
                                               
                                               if(this.cbGrant!=null)
                                                 for(var i=0; i<this.cbGrant.items.length; i++)
                                                    this.self.setAccess(this.cbGrant.items[i].name , this.cbGrant.items[i].checked);
                                                 
                                               this.self.save();  
                                               this.wnd.close(); 
                                               if(this.callback) this.callback();
                                             }.bind( {self:this, wnd:w, inp:inp , cbGrant:cb || null ,  callback:callback_if_ready} )
  }
}



export class TFUserList
{
    constructor()
    {
      this.userList = [];
      this.selected = null;

      this.userListWnd = dialogs.createWindow( null,'Benutzerverwaltung','77%','87%','CENTER');
      this.userListWnd.buildGridLayout_templateColumns('1fr');
      this.userListWnd.buildGridLayout_templateRows   ('4em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.userListWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddUser    = dialogs.addButton(this.menuPanel,'',1,1,1,1,{caption:'neu',glyph:'user-plus'});
      this.btnAddUser.height='3em';
      this.btnAddUser.callBack_onClick = function(){this.newUser()}.bind(this);
      
      this.btnEditUser   = dialogs.addButton(this.menuPanel,'',2,1,1,1,{caption:'bearbeiten',glyph:'user-pen'});
      this.btnEditUser.height='3em';
      this.btnEditUser.callBack_onClick = function(){this.editUser()}.bind(this);

      this.btnDeleteUser = dialogs.addButton(this.menuPanel,'',3,1,1,1,{caption:'löschen',glyph:'user-minus'});
      this.btnDeleteUser.height='3em';
      this.btnDeleteUser.backgroundColor = "red";


      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.userListWnd.close()}.bind(this);
      this.btnCloseWnd.height='3em';
      
      //-------------------------------------------------------------------------------

      // Hilfscontainer zur Platzaufteilung                    
      var hlpContainer = dialogs.addPanel(this.userListWnd.hWnd,'cssContainerPanel',1,2,1,1);
          hlpContainer.buildGridLayout_templateColumns('1fr');
          hlpContainer.buildGridLayout_templateRows('2em 1fr');

      this.filterPanel      = dialogs.addPanel(hlpContainer,'',1,1,1,1);
      this.userListGridView = dialogs.addPanel(hlpContainer,'cssContainerPanel',1,2,1,1);
     
      var response = utils.webApiRequest('LSUSER' , {} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      
      for(var i=0; i<response.result.length; i++)  this.userList.push( new TFUser(response.result[i]) ); 

      this.updateView_user();
    }

    
    selectedUser(p)
    {
      this.selected = p;
    }

    
    updateView_user()
    { 
        this.userListGridView.innerHTML = '';
        var g = dialogs.createTable(this.userListGridView , this.userList , ['ID' , 'passwd' , 'userGrants'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedUser(jsonData) }.bind(this);
    } 
    
    
    newUser()
    {
    if(!globals.session.admin) 
      {
        dialogs.showMessage('Nur Administratoren dürfen neue Benutzer anlegen!'); 
        return;
      }  

    var aUser = {
        ID           : 0,
        username     : '',
        passwd       : '',
        firstname    : '',
        lastname     : '',
        email        : '',
        jobfunction  : ''
      };
        
        var u = new TFUser(aUser);
        u.edit(function(){this.updateView_user()}.bind(this));
    } 


    editUser()
    { 
     if(!this.selected) {dialogs.showMessage('Bitte zuerst einen Benutzer auswählen!'); return;}

    if((!globals.session.admin) && (this.selected.username != globals.session.userName) )
      {
        dialogs.showMessage('Als "Nicht-Administrator dürfen Sie nur Ihren eigen Datensatz bearbeitenn !');
        return;
      }  

     this.selected.edit(function(){this.updateView_user()}.bind(this));
    } 

    
}


export class TFGrant
{
    #data          = {};
    #original      = {};
    #dirtyFields   = new Set();

    
    constructor(dbGrant = {}) 
    { 
     // Prüfung: enthält dbUser **nur** das Feld "ID"
     const keys = Object.keys(dbGrant);

     if (keys.length === 1 && keys[0] === "ID") 
     {
      const response = this.load_from_dB(dbGrant.ID);
      if (!response.error) dbGrant = response.result;
     }
       
     for (const field in dbGrant) 
     {
             const value = dbGrant[field];
             this.#defineField(field, value || '');
             console.log("THIS->" + utils.JSONstringify(this));
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
      return  utils.webApiRequest('GRANT',{grantID:id} );
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
      if(!this.ID || this.ID==0 || this.ID=='')
      { 
         var response = utils.webApiRequest('ADDGRANT',this.#data );
         if(response.error)
         {
           dialogs.showMessage(response.errMsg);
           return false;
         }
         this.ID = response.result.lastInsertRowid;
      }   
      else utils.webApiRequest('EDITGRAND',this.#data );
      return true;
    }
   

edit( callback_if_ready )
{
  var caption = this.ID ? 'Berechtigungs-Objekt bearbeiten' : 'Berechtigungs-Objekt anlegen';
  var w       =    dialogs.createWindow( null,caption,"49%","49%","CENTER");  
  var _w      =    w.hWnd;

  
              // aParent     , aData      , aLabels , aAppendix , aExclude , aInpType , URLForm )
  var inp = new TForm( _w    , this.#data , {}      , {}        , ['ID']             , {}       , '' );    
      inp.render( true ); 

      inp.callBack_onESCBtn = function() { this.wnd.close(); }.bind( {self:this, wnd:w} )
      inp.callBack_onOKBtn  = function(values) {
                                               for(var i=0; i<values.length; i++) 
                                               { this.self.#data[values[i].field] = values[i].value }
                                               this.self.save();  
                                               this.wnd.close(); 
                                               if(this.callback) this.callback();
                                             }.bind( {self:this, wnd:w, inp:inp , callback:callback_if_ready} )
 }
}


export class TFGrantList
{
    constructor()
    {
      this.grantList = [];
      this.selected  = null;

      this.grantListtWnd = dialogs.createWindow( null,'Berechtigungs-Objekte','77%','87%','CENTER');
      this.grantListtWnd.buildGridLayout_templateColumns('1fr');
      this.grantListtWnd.buildGridLayout_templateRows   ('4em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.grantListtWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddGrant    = dialogs.addButton(this.menuPanel,'',1,1,1,1,{caption:'neu',glyph:'square-plus'});
      this.btnAddGrant.height='3em';
      this.btnAddGrant.callBack_onClick = function(){this.newGrant()}.bind(this);
      
      this.btnEditGrant   = dialogs.addButton(this.menuPanel,'',2,1,1,1,{caption:'bearbeiten',glyph:'square-pen'});
      this.btnEditGrant.height='3em';
      this.btnEditGrant.callBack_onClick = function(){this.editGrant()}.bind(this);

      this.btnDeleteGrant = dialogs.addButton(this.menuPanel,'',3,1,1,1,{caption:'löschen',glyph:'square-minus'});
      this.btnDeleteGrant.height='3em';
      this.btnDeleteGrant.backgroundColor = "red";

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.grantListtWnd.close()}.bind(this);
      this.btnCloseWnd.height='3em';
      
      //-------------------------------------------------------------------------------

      // Hilfscontainer zur Platzaufteilung                    
      var hlpContainer = dialogs.addPanel(this.grantListtWnd.hWnd,'cssContainerPanel',1,2,1,1);
          hlpContainer.buildGridLayout_templateColumns('1fr');
          hlpContainer.buildGridLayout_templateRows('2em 1fr');

      this.filterPanel      = dialogs.addPanel(hlpContainer,'',1,1,1,1);
      this.userListGridView = dialogs.addPanel(hlpContainer,'cssContainerPanel',1,2,1,1);
     
      this.updateView_grants();
    }

    
    selectedGrant(p)
    {
      this.selected = p;
    }

    
    updateView_grants()
    { 
        this.userListGridView.innerHTML = '';
        this.grantList                  = [];

        var response = utils.webApiRequest('LSGRANTS' , {} );
        if(response.error) {dialogs.showMessage(response.errMsg);return; }
        for(var i=0; i<response.result.length; i++)  this.grantList.push( new TFGrant(response.result[i]) ); 
  
        var g = dialogs.createTable(this.userListGridView , this.grantList , ['ID'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedGrant(jsonData) }.bind(this);
    } 
    
    
    newGrant()
    {
    var aGrant = {
        ID       : 0,
        name     : '',
        caption  : '',
        kind     : ''
        };
        
        var u = new TFGrant(aGrant);
        u.edit(function(){this.updateView_grants()}.bind(this));
    } 


    editGrant()
    { 
     if(!this.selected) {dialogs.showMessage('Bitte zuerst einen Benutzer auswählen!'); return;}

     this.selected.edit(function(){ this.updateView_grants()}.bind(this));
    } 

    
}



export function adminUser()
{
  new TFUserList();
}

export function adminGrants()
{
  if(!globals.session.admin)
  {
    dialogs.showMessage('Nur Administratoren dürfen Berechtigungs-Objekte anlegen oder bearbeiten!'); 
    return;
  } 

  new TFGrantList();
}
// ------------------------------------------------------------------------------------------------------------------#



