
import * as globals     from "./tfWebApp/globals.js";
import * as mcGlobals   from "./tfMediaCollector_globals.js";
import * as utils       from "./tfWebApp/utils.js";
import * as dialogs     from "./tfWebApp/tfDialogs.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js";

import { TFCheckBox, 
    TFileUploadPanel, 
    TFImage, 
    TFLabel,     
    TFPanel,
    TFEdit,
    TFComboBox,
    TFButton,
    TForm,
    TPropertyEditor,
    TFileDialog,
    TFListCheckbox } from "./tfWebApp/tfObjects.js";



import { TFMediaCollector_thumb }          from "./tfMediaCollector_thumb.js";

const validExtensions = mcGlobals.videoExtensions.concat(mcGlobals.imageExtensions);


export class TFMediaCollector_editMedia
{
  constructor( ID_media )
  { 
    var mediaResponse        = utils.webApiRequest("FILE" , {ID:ID_media} );
    if(mediaResponse.error) {dialogs.showMessage("Fehler beim Laden des Media-Objekts: "+mediaResponse.error); return; }
      
      this.media             = mediaResponse.result;
      this.tags              = [];
      this.persons           = [];
      this.callback_if_ready = null;

      
      // welche TAGS und PERSONEN sind im Media-Set enthalten?
      var response = utils.fetchRecords("Select ID,NAME from tags where ID in (Select ID_TAG from tagsInMedia Where ID_FILE="+this.media.ID+") order by NAME");
      if(!response.error) for(var i=0; i<response.result.length; i++) this.tags.push(response.result[i]);

      response = utils.fetchRecords("Select ID,(VORNAME + ' ' + NAME) as NAME from persons where ID in (Select ID_PERSON from personsInMedia Where ID_FILE="+this.media.ID+") order by NAME");
      if(!response.error) for(var i=0; i<response.result.length; i++) this.persons.push(response.result[i]);


      // lookup-Tables initialisieren ....
      this.lookUp_TAGS  = [];
      response = utils.fetchRecords("Select ID,NAME from tags order by NAME");
      if(!response.error) for(var i=0; i<response.result.length; i++) this.lookUp_TAGS.push(response.result[i]);

      this.lookUp_PERSONS  = [];
      response = utils.fetchRecords("Select ID,(VORNAME + ' ' + NAME) as NAME from persons order by NAME");
      if(!response.error) for(var i=0; i<response.result.length; i++) this.lookUp_PERSONS.push(response.result[i]);
 





      this.wnd    = dialogs.createWindow( null,'Media bearbeiten',"77%","77%","CENTER");  
      this.hWnd   = this.wnd.hWnd;
      this.edit(); 
    }
    
   
  
load(id) 
{
  return true;
}
  

save() 
{ 
  
}
   

edit()
{ debugger;
  var form = new TForm(  this.hWnd , this.media , [] , [] , []  , [] , './dlg/clipEdit.html');
          
  // FileSize etwas schöner darstelle:
  this.media.FILESIZE = Math.round(this.media.FILESIZE / 1024 /1024 * 10) / 10;

   // PLAYTIME etwas schöner darstelle:
   this.media.PLAYTIME = Math.round(this.media.PLAYTIME / 60 * 10) / 10;

   form.render();  


   // Nun die statischen Formularfelder des HTLML-Formulars mit den akt. Values füllen:
   // 1. Stichwörter Tags für dieses file:
   var tagsListbox = form.getInpElement("TAGS");
   if(tagsListbox)
   {
    tagsListbox.innerHTML = ''; 
    for(var i=0; i<this.tags.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = this.tags[i].NAME;
         item.value = this.tags[i].ID;
         tagsListbox.appendChild(item);
    }
   }  

   // ALLE Stichwörter Tags als AUSWAHL in Combobox
   var allTagsListbox = form.getInpElement("ALLTAGS");
   if(allTagsListbox)
   { 
    allTagsListbox.innerHTML = ''; 
    for(var i=0; i<this.lookUp_TAGS.length; i++) 
    {
     var item       = document.createElement("option");
         item.text  = this.lookUp_TAGS[i].NAME;
         item.value = this.lookUp_TAGS[i].ID;
         allTagsListbox.appendChild(item);
    }
  } 
/*
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
 */              
}




}
