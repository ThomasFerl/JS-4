

import * as globals        from "./tfWebApp/globals.js";
import * as globalSettings from "./globalSettings.js";

import * as utils          from "./tfWebApp/utils.js";    
import * as dialogs        from "./tfWebApp/tfDialogs.js";
import * as graphics       from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }     from "./tfWebApp/tfObjects.js";

import { TFWindow }        from "./tfWebApp/tfWindows.js"; 
import { TFChart }         from "./tfWebApp/tfObjects.js";
import { TFDateTime }      from "./tfWebApp/utils.js";


// Combobox-Lookup:
const __units = ["","°C","mBar","m3","l","l/h","m3/h","kW","kWh","Impulse"]

const __betriebsMittel = 
    [
        { BF: "Volumenstrommessung, Wasserzähler, Durchflussmesser" },
        { BT: "Temperaturmessung" },
        { BU: "Energiezähler, Wärmemengenzähler" },
        { BL: "Füllstandsmessung, Leckagemelder" },
        { BP: "Druckmessung, Differenzdruckmessung, Druckschalter" },
        { EM: "Brenner, Heizkessel, Brennofen" },
        { EP: "Wärmetauscher, Wärmepumpe, Lufterhitzer, Heizkörper, ERG" },
        { GF: "Signalgeber, Signalgenerator, Impulsgeber" },
        { KF: "Steuerung, Relais, CPU, I/O-Gruppe" },
        { WP: "Rohrleitung, Abwasserleitung (starre Umschließung)" },
        { BQ: "Rauchwächter, CO- Messung, Viskosität , ph- Wert, Partikelzählung" },
        { BS: "Drehzahlwächter, Laufüberwachung (Geschw., Frequenz)" },
        { BC: "Stromwandler, Messwandler (Strom)" },
        { AF: "Bediendisplay, Touchscreen" },
        { BZ: "kombinierte Aufgaben, Kombi-Fühler" },
        { CC: "Akkumulator (chem. Speicherung el. Energie)" },
        { CL: "Zisterne, Becken, offener Speicher" },
        { CM: "Tank, Brauchwasserspeicher, Ausdehnungsgefäß" },
        { EA: "Leuchte, LED, Leuchtstoffröhre (Beleuchtungszweck)" },
        { EB: "Heizstab, Elektro-Lufterhitzer, Infrarotstrahler" },
        { EC: "Kältemaschine, Kühlschrank, Kühlaggregat" },
        { BG: "Näherungsfühler/-schalter, Bew.melder, Positionsschalter" },
        { AZ: "Bedienpanel, Anzeigepanel, Tableau" },
        { EQ: "Umluftkühlgerät, Kühldecke, Luftkühler, Verdampfer" },
        { EZ: "kombinierte Aufgaben, Heiz-Kühldecke, Klimagerät" },
        { FA: "Überspannungsschutz" },
        { FB: "Fehlerstromschutzschalter, RCD" },
        { FC: "Sicherung, Leitungs-, Motorschutzschalter" },
        { FL: "Sicherheitsdruckbegrenzer, Druckwächter" },
        { FM: "Brandschutzeinrichtung, -klappe, -tür, Tellerventil" },
        { FN: "Taupunktwächter" },
        { FT: "Sicherheitstemperaturbegrenzer, Temperatur-/Frostwächter" },
        { GB: "Batterie, Brennstoffzelle (el. Energie durch chem. Prozess)" },
        { BM: "Feuchtigkeitsmessung, Hygrostat" },
        { GP: "Pumpe, Schneckenförderer" },
        { GQ: "Ventilator, Lüfter, Verdichter, Vakuumpumpe" },
        { GZ: "Druckhaltestation, Hebeanlage" },
        { HQ: "Luftfilter, Flüssigkeitsfilter, Tropfenabscheider" },
        { HW: "Befeuchter" },
        { BA: "Phasenwächter, Spannungsmesseinheit, Messwandler (Spannung)" },
        { MA: "Elektromotor" },
        { MM: "Stellantrieb pneumatisch, Hydraulikzylinder" },
        { PF: "LED, Signalleuchte, Anzeige von Einzelzuständen" },
        { PG: "Voltmeter, Amperemeter, Manometer, Thermometer, Zähler" },
        { PJ: "akkustisches Signalgerät, Hupe, Klingel, Lautsprecher" },
        { PZ: "kombinierte Aufgaben, optische und akkustische Signalisierung" },
        { QA: "Leistungsschalter, Schütz, Thyristor, Motoranlasser" },
        { QB: "Lasttrennschalter, Trennschalter, Reparaturschalter" },
        { QM: "Klappe, Absperrventil, Absperrarmatur" },
        { QN: "Regelklappe, Regelventil, Regelarmatur, Volumenstromregler" },
        { QQ: "Tür, Drehkreuz" },
        { QW: "Fenster, Verglasung" },
        { RA: "Widerstand, Diode, Drossel" },
        { RB: "USV (Stabilisierung eines el. Energieflusses)" },
        { RF: "Tiefpass, Entzerrer, Signalfilter" },
        { RT: "Jalousie, Rolladen, Sonnen-, Blendschutz, Raffstore" },
        { SF: "Schalter, Taster, Sollwerteinsteller" },
        { TA: "Transformator, Frequenzumrichter, Redundanzmodule" },
        { TB: "Netzteil, Gleichrichter, Wechselrichter" },
        { TF: "Signalumformer, Antenne, Messumformer" },
        { UA: "Montageplatte, Einbau- / Schwenkrahmen in Schaltschrank" },
        { UB: "Kabelkanal, Kabeltrasse, Kabelpritsche (Leistungskabel)" },
        { UC: "Elektroverteilergehäuse" },
        { UF: "Baugruppenträger, Rack" },
        { UG: "Kabelkanal, Kabeltrasse, Kabelpritsche (kommunikativ)" },
        { UH: "Steuerschrank, Gehäuse für leittechnische Einrichtungen" },
        { WC: "Sammelschiene" },
        { WD: "Leistungskabel" },
        { WE: "Erdungsleitung, Erdungsschiene, Potentialausgleichsschiene" },
        { WF: "Datenbus, Feldbus, Rangierverteiler" },
        { WG: "Steuerkabel, Messkabel, Datenleitung" },
        { WH: "Lichtwellenleiter, Glasfaserkabel, Kabel optisch" },
        { WU: "Luftkanal" },
        { XD: "Klemmen / Anschlüsse (Leistung), Steckdose" },
        { XE: "Erdungsklemme, Schirmanschlussklemme" },
        { XF: "Hub, Switch, Patchpanel, Patchdose" },
        { XG: "Klemmen / Anschlüsse (Steuerkabel, kommunikativ)" },
        { XH: "optischer Anschluss, Spleißbox" }
    ];


    const __signalArt = 
    [
        { T: "Prozesssignal, analog (Messgrößen)" },
        { R: "Meldesignal (Zustand, Status, Störung)" },
        { Z: "Zählwert (Impulszähler, WMZ, Betriebsstundenzähler)" },
        { P: "Befehl (Handeingriff vor Ort) (Rep.Sch., Not-Aus, Stufenschalter)" },
        { S: "Grenzsignal, binär (TW, SDB, STB, max. Feuchte, Druckwächter)" },
        { A: "Befehl (Handeingriff)" },
        { B: "Analogsignal (Sollwert)" }
    ];
      


    function getItem(jsnArray , ndx)
    {
      var r={short:"",long:""};
        if(ndx >jsnArray.length) return r;

        if(jsnArray==__units) return {short:__units[ndx],long:__units[ndx]}

       var h= jsnArray[ndx];
       for(var key in h) r={short:key,long:h[key]}
       return r;
    }


    function findIndex( jsnArray , short) 
    {
      for(var i=0; i<jsnArray.length; i++) 
        if(getItem(jsnArray,i).short==short) return i;
      
      return -1;
    }


    function getStrList( jsnArray )
    {
        var r=[];
        for(var i=0; i<jsnArray.length; i++) r.push(getItem(jsnArray,i).long)
        return r;
    }    
    



export class TChanelDlg 
{
  constructor( chanel , device ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newChanel  = false;
      this.callBack_onDialogComplete = null;
      this.callBack_onDialogAbort    = null;
      this.device                    = device; 
      // Zur Bestimmung der laufenden BM und Signalarten brauchen wir alle Kanäle des Gerätes....
      var response = utils.webApiRequest('LOADCHANELS' , {ID_Device:device.ID});
      if(!response.error) this.allChanels = response.result;
      else                this.allChanels = [];

      this.infoPunktSchl_BM          = '';
      this.infoPunktSchl_signArt     = '';
      this.infoPunktSchl_AnlSchl     = this.device.AnlagenSchluessel;


      if(chanel != null) {this.chanel = chanel;}
      else {
             this.newChanel = true;
             var response   = utils.webApiRequest('schema' , {tableName:"chanels"} );
             if (response.error) 
             {
                dialogs.showMessage(response.errMsg);
                this.error      = true;
                this.errMsg     = response.errMsg;
                return;
             }
             this.chanel = {};
             for(var i=0; i<response.result.length; i++) this.chanel[response.result[i].fieldName] = response.result[i].defaultValue || "";
             this.chanel.ID_Device = this.device.ID;
      }
        var availeableTopics = [];
        var r = utils.webApiRequest('LSTOPICS' , {ID_Device:device.ID} );
        if(!r.error) 
           for(var i=0; i<r.result.length;i++)
           {
              var ID = r.result[i].ID;
              var t  = r.result[i].topic;
              var d  = r.result[i].descr;
              var h  = t.substr(d.length);
             availeableTopics.push({caption:h , value:ID})
           }  
     
      var cpt = this.newChanel ? "neuen Kanal hinzufügen" : "Kanal bearbeiten";
          
      this.dlgWnd = dialogs.createWindow( null , cpt , "50%" , "77%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("1em 7em 1em 1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
    
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"",1,2,1,1);
          head.margin = '1em';
          head.buildGridLayout_templateRows("1fr");
          head.buildGridLayout_templateColumns("1fr");  // falls noch ein Button platziert werden muss
      this.infoPunktSchl = dialogs.addInput(head,1,1,21,"Informationspunkt-Schlüssel","","",{});
      this.infoPunktSchl.inpFieldFontWeight = 'bold';
      
      var body = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,4,1,1); 

      this.form   = new TForm( body, 
                               this.chanel, 
                               {NAME            :"Kanal-Name",
                                TYP             :"Kanal-Typ",
                                UNIT            :"Einheit",
                                BESCHREIBUNG    :"Kanal-Beschreibung",
                                SIGNALART       :"Art des Signals",
                                DESC            :"(sub)Topic",
                                payloadField_val:"Feldname(Wert)",
                                payloadField_dt :"Feldname(timestamp)" } ,// Labels
                               {} ,                             // Appendix
                               ['ID','ID_Device', 'ID_Topic' , 'lfdNr_BM','InfoPktName'] ,  // Exclude
                               {} ,                             // InpType
                               '' );

      // Combo-Boxen befüllen ....                         
      this.form.setInputType("UNIT"             , "select" ,{items:getStrList(__units)          } );
      this.form.setInputType("SIGNALART"        , "select" ,{items:getStrList(__signalArt)      } );
      this.form.setInputType("Betriebsmittel"   , "select" ,{items:getStrList(__betriebsMittel) } );
      this.form.setInputType("DESC"             , "select" ,{items:availeableTopics} );

      // Das Payloadfield soll sich immer dann, wenn sich das Topic ändert anpassen.
      // Es gibt für die Initialisierung drei Fälle:
      // 1. Neuanlage  -> weder Topic noch ein vorbelegtes Payload-Field 
      // 2. Bearbeiten -> es gibt bereits ein Topic -> Abfrage der möglichen Payload-Felder
      // 3. Bearbeiten -> es gibt bereits ein PayloadField -> Setzen des vorhandenen Wertes

      var pl = []
      if(this.chanel.DESC) pl = this.getPayloadFields(this.chanel.ID_Topic);

      this.form.setInputType("payloadField_val" , "select" ,{items:pl} );
      this.form.setInputType("payloadField_dt"  , "select" ,{items:pl} );

      // ggf. vorhandene Ausprägung setzen....
      this.form.getControlByName("payloadField_val").value = this.chanel.payloadField_val;
      this.form.getControlByName("payloadField_dt").value  = this.chanel.payloadField_dt;

      this.form.render(true);

      this.infoPunktSchl.value = this.chanel.InfoPktName;

        // ItemIndex der Combobox auf aktuellen Wert setzen...
    
      var signArt           =  this.form.getControlByName("SIGNALART").editControl;
          signArt.itemIndex = findIndex( __signalArt , this.chanel.SIGNALART ); 
          signArt.callBack_onChange = function(value){ this.update_infoPunkt_schluessel() }.bind(this)

      var betrMit           = this.form.getControlByName("Betriebsmittel").editControl;
          betrMit.itemIndex = findIndex( __betriebsMittel , this.chanel.Betriebsmittel );
          betrMit.callBack_onChange = function(value){ this.update_infoPunkt_schluessel() }.bind(this)

      var topic             = this.form.getControlByName("DESC").editControl; 
          topic.callBack_onChange = function(value){ 
                                                     var t =this.form.getControlByName("DESC").editControl;
                                                     var pl=this.getPayloadFields(t.value);
                                                     
                                                     this.form.getControlByName("payloadField_val").editControl.setItems(pl);
                                                     this.form.getControlByName("payloadField_dt").editControl.setItems(pl);
                                                        
                                                    }.bind(this)

     
           this.form.callBack_onOKBtn  = function () { // im Formular ist die ID des Topic/Descriptor gespeichert
                                                       // wir brauchen aber den Klartextnamen ....
                                                       var t =this.form.getControlByName("DESC").editControl;  
                                                       var r =this.form.getInputFormValues();
                                                       var h1 = utils.findEntryByField(r , 'field' , 'DESC');
                                                       if(h1!=null) h1.value = t.text;

                                                       var h2 = utils.findEntryByField(r , 'field' , 'ID_TOPIC');
                                                        if(h2!=null) h2.value = t.value;
                                                       
                                                       this.saveChanel(r);
                                                     }.bind(this);  

                                                     
           this.form.callBack_onESCBtn = function () {this.dlgWnd.destroy() ; if(this.callBack_onDialogAbort!=null) this.callBack_onDialogAbort() }.bind(this);
        
  }

 
 __count(arr,field,value,len)
 {
   if((value=='--') || (value='')) s='1'
   else
       {
         var cnt=0;
         for(var i=0; i<arr.length; i++)
         if(arr[i][field]==value) cnt++;
         var s=''+(cnt+1);
        }  

    while(s.length<len) s='0'+s;

    return s;
 }



getPayloadFields(idTopic)
{   
  var h=[];
  var r = utils.webApiRequest('getPayloadFields' , {ID_Topic:idTopic} );  
  if(!r.error)
     for(var i=0; i<r.result.length;i++) h.push({caption:r.result[i],value:r.result[i]})

  return h;
}



  update_infoPunkt_schluessel()
  {
    var ndx                                = this.form.getControlByName("SIGNALART").editControl.itemIndex;
    if (ndx>=0) this.infoPunktSchl_signArt = getItem(__signalArt , ndx).short
    else        this.infoPunktSchl_signArt = "--";  

    ndx                               = this.form.getControlByName("Betriebsmittel").editControl.itemIndex;
    if (ndx>=0) this.infoPunktSchl_BM = getItem(__betriebsMittel , ndx).short
    else        this.infoPunktSchl_BM = "--";  

    var cntSignArt                 = this.__count(this.allChanels , 'SIGNALART'      , this.infoPunktSchl_signArt , 3);
    var cntBetrMi                  = this.__count(this.allChanels , 'Betriebsmittel' , this.infoPunktSchl_BM      , 2);
    var r                          = globalSettings.praefix+
                                     this.infoPunktSchl_AnlSchl + 
                                     globalSettings.nummernKreis +
                                     globalSettings.trennZeichen + 
                                     this.infoPunktSchl_BM + 
                                     cntBetrMi + ";" + 
                                     this.infoPunktSchl_signArt + 
                                     cntSignArt;
    this.infoPunktSchl.value       = r;
    return r;                                 
  }




  saveChanel( chanelData )
  { 
      for(var i=0; i<chanelData.length; i++)
      if(this.chanel.hasOwnProperty(chanelData[i].field)) this.chanel[chanelData[i].field] = chanelData[i].value;
      // die Combobox-Einträge in Kurzform umwandeln. 
      // Das wird als "Nebenprodukt" bei der Info-Schl-Generierung frei ....
      this.chanel.InfoPktName    = this.update_infoPunkt_schluessel();
      this.chanel.SIGNALART      = this.infoPunktSchl_signArt;
      this.chanel.Betriebsmittel = this.infoPunktSchl_BM;

      // der Descriptor soll in disem Fall nicht die ID sondern das SubTopic im Klarnamen speichern ....
      // this.chanel.DESC = utils.findEntryByField( chanelData , '')


      this.dlgWnd.destroy();
  
      if(this.newChanel) var response = utils.webApiRequest("NEWCHANEL",{fields:this.chanel})
      else               var response = utils.webApiRequest("UPDATECHANEL",{fields:this.chanel,idField:"ID",idValue:this.chanel.ID})     
  
      console.log(JSON.stringify(response));
  
      if(response.err) 
      {
          dialogs.showMessage("Fehler beim Speichern des Kanalas. Fehlermeldung: " + response.errMsg);
          this.error = true;
          this.errMsg = response.errMsg;
          return;
      }                                                                             
      
      if(this.newChanel) this.chanel.ID = response.result.lastInsertRowid;
  
      if(this.callBack_onDialogComplete!=null) this.callBack_onDialogComplete( this.chanel )
    
  }

  
}  