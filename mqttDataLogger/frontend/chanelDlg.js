

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import * as graphics     from "./tfWebApp/tfGrafics.js";

import { TFEdit, 
         TForm,
         TPropertyEditor,
         TFAnalogClock,
         TFWorkSpace }   from "./tfWebApp/tfObjects.js";

import { TFWindow }      from "./tfWebApp/tfWindows.js"; 
import { TFChart }       from "./tfWebApp/tfObjects.js";
import { TFDateTime }    from "./tfWebApp/utils.js";


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
  constructor( chanel ) 
  { 
      this.error      = false;
      this.errMsg     = ""; 
      this.newChanel  = false;
      this.callBack_onDialogComplete = null;
      this.callBack_onDialogAbort    = null;

      if(chanel != null) this.chanel = chanel
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
      }

      var availeableTopics = [];

      if(this.newChanel)
      {  
        var r = utils.webApiRequest('availeableTopics' , {} );
        for(var i=0; i<r.result.length; i++) availeableTopics.push(r.result[i].descr)
      }      
      
      var cpt = this.newChanel ? "neuen Kanal hinzufügen" : "Kanal bearbeiten";
          
      this.dlgWnd = dialogs.createWindow( null , cpt , "50%" , "77%" , "CENTER" );
      this.dlgWnd.buildGridLayout_templateRows("4em,1fr");
      this.dlgWnd.buildGridLayout_templateColumns("1fr");
      
      var head = dialogs.addPanel(this.dlgWnd.hWnd,"",1,1,1,1);
          head.buildGridLayout_templateRows("1fr");
          head.buildGridLayout_templateColumns("1fr");  // falls noch ein Button platziert werden muss
      this.infoPunktSchl = dialogs.addInput(head,1,1,21,"Informationspunkt-Schlüssel","","",{})    
         
      
      var body = dialogs.addPanel(this.dlgWnd.hWnd,"cssContainerPanel",1,2,1,1); 

      this.form   = new TForm( body, 
                               this.chanel, 
                               {NAME:"Kanal-Name",TYP:"Kanal-Typ",UNIT:"Einheit",BESCHREIBUNG:"Kanal-Beschreibung",SIGNALART:"Art des Signals"} ,   // Labels
                               {} ,                             // Appendix
                               ['ID','ID_Device','lfdNr_BM','InfoPktName'] ,  // Exclude
                               {} ,                             // InpType
                               '' );

      this.form.setInputType("UNIT"             , "select" ,{items:getStrList(__units)          } );
      this.form.setInputType("SIGNALART"        , "select" ,{items:getStrList(__signalArt)      } );
      this.form.setInputType("Betriebsmittel"   , "select" ,{items:getStrList(__betriebsMittel) } );
      
      this.form.setInputType("TOPIC" , "select" , {items:availeableTopics} );

      this.form.render(true);

        // ItemIndex der Combobox auf aktuellen Wert setzen...
        debugger;
      var signArt =  this.form.getControlByName("SIGNALART").editControl;
          signArt.itemIndex = findIndex( __signalArt , this.chanel.SIGNALART );
          signArt.editControl.callBack_onChange = function(value){debugger; this.infoPunktSchl.value=value}.bind(this)

        this.form.getControlByName("Betriebsmittel").editControl.itemIndex = findIndex( __betriebsMittel , this.chanel.Betriebsmittel )
             
      this.form.callBack_onOKBtn  = this.saveChanel.bind(this);
      this.form.callBack_onESCBtn = function () {this.dlgWnd.destroy() ; if(this.callBack_onDialogAbort!=null) this.callBack_onDialogAbort() }.bind(this);
     
  }




  saveChanel( chanelData )
  {
      for(var i=0; i<chanelData.length; i++)
      if(this.chanel.hasOwnProperty(chanelData[i].field)) this.chanel[chanelData[i].field] = chanelData[i].value;
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