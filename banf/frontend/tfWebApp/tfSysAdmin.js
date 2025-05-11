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
        if(g.grantName == grantName) return true;
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
    {  debugger;
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
  {   // Falls Admin -> Berechtigungen einblenden ...
      var grantDiv = dialogs.addPanel( _w , "cssContainerPanel" ,  2 , 1 , 1 , 1 );
      grantDiv.margin = '1em';
      grantDiv.buildGridLayout_templateColumns('1fr');
      grantDiv.buildGridLayout_templateRows('2em 1fr');
      var captDiv = dialogs.addPanel( grantDiv , "cssContainerPanel" ,  1 , 1 , 1 , 1 );
      captDiv.backgroundColor = "black";
      var lbl      = dialogs.addLabel(captDiv , '' , 1,1,"100%",'100%', 'Berechtigungen');
      lbl.fontSize = '1em';
      lbl.justifyContent = 'center';
      lbl.color = 'white';

      var cbItems  = []; 
      for(var i=0; i<globals.session.grants.length; i++) 
      {
         var g = globals.session.grants[i];
         cbItems.push({text:g.caption || g.name, checked:this.hasAccess(g.name) , name:g.name , id_grant:g.ID});
      }
      var grants   = dialogs.addPanel( grantDiv , "cssWhitePanel" ,  1 , 2 , 1 , 1 );
      var cb       = dialogs.addListCheckbox(grants , cbItems);
    }    
 
    inp.callBack_onESCBtn = function() { this.wnd.close(); }.bind( {self:this, wnd:w} )
    inp.callBack_onOKBtn  = function(values) { debugger;
                                               for(var i=0; i<values.length; i++) this.self.#data[values[i].field] = values[i].value 
                                               
                                               if(this.cbGrant!=null)
                                                {
                                                  var userGrants = {ID_user:this.self.ID,grants:[]};
                                                  for(var i=0; i<this.cbGrant.items.length; i++)
                                                  {
                                                    var item = this.cbGrant.items[i];
                                                    if(item.checked) userGrants.grants.push({ID:item.id_grant, name:item.text || item.caption ,  access:item.checked } ); 
                                                  }
                                                }
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
      this.userListWnd.buildGridLayout_templateRows   ('3em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.userListWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddUser    = dialogs.addButton(this.menuPanel,'',1,1,1,1,'neu');
      this.btnAddUser.height='2em';
      this.btnAddUser.callBack_onClick = function(){this.newUser()}.bind(this);
      
      this.btnEditUser   = dialogs.addButton(this.menuPanel,'',2,1,1,1,'bearbeiten');
      this.btnEditUser.height='2em';
      this.btnEditUser.callBack_onClick = function(){this.editUser()}.bind(this);

      this.btnDeleteUser = dialogs.addButton(this.menuPanel,'',3,1,1,1,'löschen');
      this.btnDeleteUser.height='2em';

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.userListWnd.close()}.bind(this);
      this.btnCloseWnd.height='2em';
      
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
        var g = dialogs.createTable(this.userListGridView , this.userList , ['ID' , 'passwd'] , [] );
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
      this.grantListtWnd.buildGridLayout_templateRows   ('3em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.grantListtWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddGrant    = dialogs.addButton(this.menuPanel,'',1,1,1,1,'neu');
      this.btnAddGrant.height='2em';
      this.btnAddGrant.callBack_onClick = function(){this.newGrant()}.bind(this);
      
      this.btnEditGrant   = dialogs.addButton(this.menuPanel,'',2,1,1,1,'bearbeiten');
      this.btnEditGrant.height='2em';
      this.btnEditGrant.callBack_onClick = function(){this.editGrant()}.bind(this);

      this.btnDeleteGrant = dialogs.addButton(this.menuPanel,'',3,1,1,1,'löschen');
      this.btnDeleteGrant.height='2em';

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.grantListtWnd.close()}.bind(this);
      this.btnCloseWnd.height='2em';
      
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




/*



function addUser( ds )   
{
  // Datenstruktur besorgen, da noch nix zum editieren vorliegt....
  var record = {};
  for (var i=0; i<ds.pragma.length; i++) 
  if(ds.primaryKey!=ds.pragma[i].name) record[ds.pragma[i].name]= null;

  // Grants besorgen, da noch nix zum editieren vorliegt....
  var cbItems  = [];
  for(var i=0; i<globals.session.grants.length; i++) 
  {
    var g = globals.session.grants[i];
    cbItems.push({text:g.caption, checked:false , name:g.name , id_grant:g.ID});
   }

  var w = dialogs.createWindow( null , "neuen Benutzer anlegen" , "74%" , "74%" , 'CENTER');
  utils.buildGridLayout_templateColumns(w , "1fr 1fr");
  utils.buildGridLayout_templateRows(w , "1fr");

  var inpDiv = dialogs.addPanel( w , '' , 1 , 1 , 1 , 1 );
      inpDiv.margin = '1em';

  var grantDiv = dialogs.addPanel( w , "cssWhitePanel" ,  2 , 1 , 1 , 1 );
  grantDiv.margin = '1em';
  utils.buildGridLayout_templateColumns(grantDiv , "1fr");
  utils.buildGridLayout_templateRows(grantDiv , "2em 1fr");

  var captDiv = dialogs.addPanel( grantDiv , "cssWhitePanel" ,  1 , 1 , 1 , 1 );
  captDiv.backgroundColor = "black";
  captDiv.color           = "white";
  captDiv.innerHTML       = "<b>Berechtigungen</b>";

  var grants   = dialogs.addPanel( grantDiv , "cssWhitePanel" ,  1 , 2 , 1 , 1 );
  var cb       = dialogs.addListCheckbox(grants , cbItems);
 
  var inp    = dialogs.buildInputForm(
                                      inpDiv , record , 'NEW' , ds.captions ,// Feldnamen "übersetzen"
                                      [] ,                                   // Appendix für bestimmte Felder
                                      [ds.primaryKey] ,                      // ausgeschlossene Felder
                                      [{passwd:'password'}]
                                    );

  // bei Abbruch                                  
  inp.btnAbort.callBack_onClick = function() { this.wnd.closeWindow(); }.bind({wnd:w} ) 
  
  // bei OK
  inp.btnOk.callBack_onClick = function()
  { 
    // Zuerst USER speichern da ID für GRANTS benötigt wird ...
    var inpResults = dialogs.getInputFormValues(this.inpDlg);
    // Ergebnis der Eingabe in record zurück speichern....
    for(var i=0; i<inpResults.length; i++) { this.record[inpResults[i].field] = inpResults[i].value }
    
    console.log('prepared for insertRecord -> '+JSON.stringify(this.record));
    
    var response = utils.webApiRequest("INSERTINTOTABLE" , JSON.stringify( { etc:true, 
                                                                             tableName:this.dataset.table , 
                                                                             fields:this.record 
                                                                           } ) );
    if(!response.error)
    {  
      var userGrants = {ID_user:response.result.lastInsertRowid , grants:[]};

      for(var i=0; i<this.grantsChecklistBox.items.length; i++)
      {
        var item = this.grantsChecklistBox.items[i];
        //console.log('GrantObj: '+ utils.JSONstringify(item));
        userGrants.grants.push({grantName:item.id_grant, access:item.checked } );
      }
         
      
      console.log('AddUser / GRANTS: ' + JSON.stringify( userGrants ))

      utils.webApiRequest("setUserGrants" , JSON.stringify( userGrants ) );
    }  

    this.wnd.closeWindow(); 
    this.dataset.refreshDatasetRow( this.record )  

  }.bind( {wnd:w , inpDlg:inp.form , record:record , grantsChecklistBox:cb , dataset:ds} )                 

}





function editUser( ds , record )    // benutzerdefinierte Funktion ....
{
      var w = dialogs.createWindow( null , "Benutzer-Datensatz bearbeiten" , "74%" , "74%" , 'CENTER');

      if (!globals.session.admin) w.width = Math.round(globals.Screen.width / 2);

      if (globals.session.admin) utils.buildGridLayout_templateColumns(w , "1fr 1fr");
      else                       utils.buildGridLayout_templateColumns(w , "1fr");

      utils.buildGridLayout_templateRows(w , "1fr");

      var inpDiv = dialogs.addPanel( w , '' , 1 , 1 , 1 , 1 );
          inpDiv.margin = '1em';

      
      // wenn user mit admin-Berechtigung, dann Berechtigungen verwalten
      // dh. listen aller Berechtigungen und wahlweise hinzufügen zum Benutzer...
      if (globals.session.admin)    
      {
        var grantDiv = dialogs.addPanel( w , "cssWhitePanel" ,  2 , 1 , 1 , 1 );
        grantDiv.margin = '1em';
        utils.buildGridLayout_templateColumns(grantDiv , "1fr");
        utils.buildGridLayout_templateRows(grantDiv , "2em 1fr");

        var captDiv = dialogs.addPanel( grantDiv , "cssWhitePanel" ,  1 , 1 , 1 , 1 );
        captDiv.backgroundColor = "black";
        captDiv.color           = "white";
        captDiv.innerHTML       = "<b>Berechtigungen</b>";

        var grants   = dialogs.addPanel( grantDiv , "cssWhitePanel" ,  1 , 2 , 1 , 1 );
        var cbItems  = [];
        var response = utils.webApiRequest('getUserGrants' , JSON.stringify({userName:record.username}))

        console.log('getUserGrants: '+ utils.JSONstringify(response));

        if(!response.error)
        {
        for(var i=0; i<response.result.length; i++) 
          {
            var g = response.result[i];
            cbItems.push({ text:g.caption, checked:g.access==true || g.access>0 , name:g.name , id_grant:g.ID });
          }
        }
        var cb     = dialogs.addListCheckbox(grants , cbItems);
      }  
      
      var exclude = [ds.primaryKey];
      if (!globals.session.admin) exclude.push('admin');
            
      var inp     = dialogs.buildInputForm(
                                          inpDiv , record , ds.primaryKey , ds.captions ,     // Feldnamen "übersetzen"
                                          [] ,                                                // Appendix für bestimmte Felder
                                          exclude ,                                           // ausgeschlossene Felder
                                          {passwd:'password'},                                                 
                                          );
      
         inp.btnAbort.callBack_onClick = function() { this.wnd.closeWindow(); }.bind({wnd:w} ) 
    
         inp.btnOk.callBack_onClick    = function()
                                         { 
                                            if(this.admin)
                                            { 
                                              var userGrants = {ID_user:this.record[this.dataset.primaryKey],grants:[]};
                                              for(var i=0; i<this.grantsChecklistBox.items.length; i++)
                                              {
                                                var item = this.grantsChecklistBox.items[i];
                                                //console.log('GrantObj: '+ utils.JSONstringify(item));
                                                userGrants.grants.push({grantName:item.id_grant, access:item.checked } );
                                              }
                                            } else var userGrants = {}; 
      
                                            var inpResults = dialogs.getInputFormValues(this.inpDlg);
                                            // Ergebnis der Eingabe in record zurück speichern....
                                            for(var i=0; i<inpResults.length; i++) { this.record[inpResults[i].field] = inpResults[i].value }
                                            //console.log('prepared for updateRecord -> '+JSON.stringify(this.record));
                                            
                                            utils.webApiRequest("UPDATETABLE" , JSON.stringify( { etc:true , 
                                                                                                    tableName:this.dataset.table , 
                                                                                                    ID_field:this.dataset.primaryKey , 
                                                                                                    ID_value:this.record[this.dataset.primaryKey] , 
                                                                                                    fields:this.record } ) );
                                              
                                              if(this.admin) utils.webApiRequest("setUserGrants" , JSON.stringify( userGrants ) );
                                             
                                              this.wnd.closeWindow(); 
                                              this.dataset.refreshDatasetRow( this.record )  
                                         }.bind( {wnd:w , inpDlg:inp.form , record:record , grantsChecklistBox:cb , dataset:ds , admin:globals.session.admin} )                 
      
}
                                           
   


export function adminUser()
{
   var ds = new TFdataSet( 'user' , true ) 
      ds.hideFields(['ID','birthdate','passwd','admin']); 
      ds.setCaptions({username:'Benutzername',firstname:'Vorname',lastname:'Nachname',jobfunction:'Tätigkeit'}) 
      
      ds.onEditRecord = function(record) {editUser( this.ds , record )}.bind({ds:ds})  
      ds.onAddRecord  = function()       {addUser ( this.ds          )}.bind({ds:ds})   
      
      if(ds.error) { dialogs.showMessage('Fehler bei Abfrage der Datenstruktur : ' + ds.errMsg ); return }
      else 
          {
            ds.open();
            if (ds.error) {dialogs.showMessage(ds.errMsg); return}
            
            var w = dialogs.createWindow( null , "Benutzerverwaltung" , '74%' , '74%' , 'TOP' );
            ds.render(w);
          }
}

 


//------------------------------------------------------------------------------------------------------------------#
//------------------------------------------------------------------------------------------------------------------#
//------------------------------------------------------------------------------------------------------------------#
//------------------------------------------------------------------------------------------------------------------#

export function adminGrants()
{
    var ds = new TFdataSet( 'grantObj' , true) 
        ds.hideFields(['ID']); 
        ds.setCaptions({name:'Berechtigungs-Objekt',caption:'Beschreibung',kind:'Verwendung'}) 
        
        if(ds.error) { dialogs.showMessage('Fehler bei Abfrage der Datenstruktur : ' + ds.errMsg ); return }
        else 
            {
              ds.open();
              if (ds.error) {dialogs.showMessage(ds.errMsg); return}
              
              var w = dialogs.createWindow( null , "Berechtigungs-Objekte verwalten" , '33%' , '50%' , 'CENTER' );
              ds.render(w);
            }
}



export function userSettings()
{
  var usr = new TFdataSet('select * from user where ID='+globals.session.userID , true );
  usr.hideFields(['ID','birthdate','passwd','admin']); 
  usr.setCaptions({username:'Benutzername',firstname:'Vorname',lastname:'Nachname',jobfunction:'Tätigkeit'}) 
  usr.onEditRecord = function(record) {editUser( this.ds , record )}.bind({ds:usr})  
  if(usr.open()) usr.editRecord();
}

*/




