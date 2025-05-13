import * as globals      from "./tfWebApp/globals.js";
import * as clpGlobals   from "./clpGlobals.js";

import * as utils        from "./tfWebApp/utils.js";
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as movieUtils   from "./movieUtils.js";

import { createWindow }  from "./tfWebApp/tfDialogs.js";
import { TFdataSet }     from "./tfWebApp/dataset.js";
import { TForm }         from "./tfWebApp/tfObjects.js";


export class TClip
{
  constructor( clipID )
  {
    console.log("TClip.constructor( clipID : "+clipID+" )");
    this.ID      = clipID;  
    this.content = {};  
    this.actors  = [];
    this.poster  = {};
    this.clpImg  = '';

    this.error   = false;
    this.errMsg  = '';
   
   var response = utils.webApiRequest('ISREGISTERED' , utils.JSONstringify({movieID:clipID}));

     if(response.error) {this.content = {}; this.error = true; this.errMsg = response.errMsg; }
     else               this.content = response.result;
  }
  
  
edit()
{
  console.log("TClip.edit() -> content:"+utils.JSONstringify(this.content));

  var w    = dialogs.createWindow( null , "Clip bearbeiten" , "90%" , "90%" , 'CENTER');
  var form = new TForm(  w , this.content.clip , [] , [] , []  , './dlg/clipEdit.html');
          
  // FileSize etwas schöner darstelle:
  this.content.clip.FILESIZE = Math.round(this.content.clip.FILESIZE / 1024 /1024 * 10) / 10;

   // PLAYTIME etwas schöner darstelle:
   this.content.clip.PLAYTIME = Math.round(this.content.clip.PLAYTIME / 60 * 10) / 10;

   form.render();  


// Inhalt der Formularfelder setzen:


   // Stichwörter Tags für diesen Clip:
   var tagsListbox = form.getInpElement("TAGS");
   if(tagsListbox)
   { 
    tagsListbox.innerHTML = ''; 
    for(var i=0; i<this.content.tags.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = this.content.tags[i].name;
         item.value = this.content.tags[i].id;
         tagsListbox.appendChild(item);
    }
   }  

   // ALLE Stichwörter Tags als AUSWAHL für Clip:
   var response = utils.fetchRecords('Select * from tags order by ID');

   var allTagsListbox = form.getInpElement("ALLTAGS");
   if(allTagsListbox)
   { 
    allTagsListbox.innerHTML = ''; 
    for(var i=0; i<response.result.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = response.result[i].NAME;
         item.value = response.result[i].ID;
         allTagsListbox.appendChild(item);
    }
  } 

// Schaltfläche für add Tag...
var btn_addTag = form.getInpElement("btn_addTag");
    console.log("btn_addTag ->" + btn_addTag);
    if(btn_addTag) 
       btn_addTag.addEventListener("click", function()
                 {
                  var selectedItem = utils.getSelectedItem( this.allItems );
                  utils.addItem( this.items , selectedItem.text , selectedItem.value );
                 }.bind({allItems:allTagsListbox, items:tagsListbox}) );

// Schaltfläche für remove Tag...
var btn_removeTag = form.getInpElement("btn_delTag");
if(btn_removeTag) 
btn_removeTag.addEventListener("click", function()
             {
              var selectedIndex = this.items.selectedIndex;
              if (selectedIndex !== -1) this.items.remove(selectedIndex);
             }.bind({items:tagsListbox}) );



  // ALLE Quellen als AUSWAHL für Source Combobox:
  response = utils.fetchRecords("Select distinct SOURCE from Clip where Name <> '' order by Source");

  var sourceCombobox = form.getInpElement("SOURCE");
  if(sourceCombobox)
  { 
    sourceCombobox.innerHTML = ''; 
   for(var i=0; i<response.result.length; i++) 
   {
    var item       = document.createElement("option");
        item.text  = response.result[i].SOURCE;
        item.value = response.result[i].SOURCE;
        sourceCombobox.appendChild(item);
   }
 } 


 // ALLE Quellen als AUSWAHL für Kategorie Combobox
 response = utils.fetchRecords("Select distinct KATEGORIE from Clip where Name <> '' order by KATEGORIE");

 var kategorieCombobox = form.getInpElement("KATEGORIE");
 if(kategorieCombobox)
 { 
  kategorieCombobox.innerHTML = ''; 
  for(var i=0; i<response.result.length; i++) 
  {
   var item       = document.createElement("option");
       item.text  = response.result[i].KATEGORIE;
       item.value = response.result[i].KATEGORIE;
       kategorieCombobox.appendChild(item);
  }
} 


// Actors
var actorListbox = form.getInpElement("ACTORS");
   if(actorListbox)
   { 
    actorListbox.innerHTML = ''; 
    for(var i=0; i<this.content.actors.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = this.content.actors[i].name;
         item.value = this.content.actors[i].id;
         actorListbox.appendChild(item);
    }
   }  

   // ALLE Actors als AUSWAHL für Clip:
   var response = utils.fetchRecords('Select ID,NAME,VORNAME from actor order by VORNAME , NAME');

   var allActorsListbox = form.getInpElement("ALLACTORS");
   if(allActorsListbox)
   { 
    allActorsListbox.innerHTML = ''; 
    for(var i=0; i<response.result.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = response.result[i].VORNAME + ', '+response.result[i].NAME;
         item.value = response.result[i].ID;
         allActorsListbox.appendChild(item);
    }
  } 

// Schaltfläche für add Actor...
var btn_addActor = form.getInpElement("btn_addActor");
if(btn_addActor)
btn_addActor.addEventListener("click", function()
                 {
                  var selectedItem = utils.getSelectedItem( this.allItems );
                  utils.addItem( this.items , selectedItem.text , selectedItem.value );
                 }.bind({allItems:allActorsListbox, items:actorListbox}) );

// Schaltfläche für remove Tag...
var btn_removeActor = form.getInpElement("btn_delActor");
if(btn_removeActor)
btn_removeActor.addEventListener("click", function()
             {
              var selectedIndex = this.items.selectedIndex;
              if (selectedIndex !== -1) this.items.remove(selectedIndex);
             }.bind({items:actorListbox}) );


// Poster
var panelPoster = form.getInpElement("POSTER");
if(panelPoster) panelPoster.style.backgroundImage ="url('"+ utils.buildURL( 'LOADIMAGE' , JSON.stringify({img:this.content.clip.CAPTURE}))+"')"; 

   
       
  // thumbs
  var panelThumbs = form.getInpElement("THUMBS");
      panelThumbs.innerHTML = '';

  for(var i=0 ; i<this.content.thumbs.length; i++ )
 {
   var thumbURL  = utils.buildURL( 'LOADIMAGE' , JSON.stringify({img:this.content.thumbs[i].thumbName}) );

  console.log("Thumb URL ->" + thumbURL );
  
  var p= dialogs.addPanel( panelThumbs , '' , 1,1, '20%' , '25%' );
      p.DOMelement.innerHTML  = '<img src="'+thumbURL+'" style="max-width: 100%;max-height: 100%">';  
                           
 }


 
 var btnAbort = form.getInpElement("btnAbort");
 if(btnAbort)
 btnAbort.addEventListener("click", function()
             {
             this.dlg.closeWindow()
             }.bind({dlg:w}) );


 var btnOk = form.getInpElement("btnOk");
 if(btnOk)
  btnOk.addEventListener("click", function()
             {
             var inpResults = this.inpForm.getInputFormValues()
             this.self.distribute( inpResults );
             this.dlg.closeWindow()
             }.bind({self:this, dlg:w , inpForm:form }) );
}


distribute( data)
{
  var s=[]
  for (var i=0; i<data.length; i++)  s.push({field:data[i].field , value:data[i].value });
 
  alert("distribute:"+JSON.stringify(s));
}



}
