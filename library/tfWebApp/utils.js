import * as globals   from "./globals.js";
import * as symbols   from './symbols.js';


const debug              = globals.debug;

function mod(a,b) { if(b!=0) return Math.floor(a/b); else return NaN;}


export function processMessages(wait) { return new Promise(resolve => setTimeout(resolve, wait ||  0)); }

export function wait( ms ) { return new Promise(resolve => setTimeout(resolve, ms));  }


export function buildRandomID( offset )
{
  var timestamp = Date.now(); 
  var randomNum = Math.floor(Math.random() * 1000); 
  if(offset) randomNum = offset;
  return timestamp.toString() + randomNum;
}


export function getYearList(startDate, endDate) 
{
  // Datum im europäischen Format dd.mm.yyyy erwartet
  var startYear = new TFDateTime(startDate).year();
  var endYear   = new TFDateTime(endDate).year();

  // Array zur Speicherung der Jahreszahlen
  var yearList  = [];

  // Schleife von Startjahr bis Endjahr, um die Jahreszahlen zu sammeln
  for (let year = startYear; year <= endYear; year++) {
      yearList.push(year);
  }

  return yearList;
}



export function isHTMLElement(element) 
{
  return element instanceof HTMLElement;
}


export function indexOfIgnoreCase(arr, searchValue) 
{
  searchValue = searchValue.toLowerCase();
  
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].toLowerCase() === searchValue) {
      return i; // Rückgabe des Index des gefundenen Eintrags
    }
  }
  
  return -1; // Rückgabe -1, wenn nichts gefunden wurde
}



export function isJSON(data) 
{
  if (typeof data === "string") return false;
  
  else 
      if (typeof data === "object" && data !== null) return true;
      else return false;
}



export function JSONstringify(obj) 
{
  const seen = new WeakSet();
  return JSON.stringify(obj, function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined; // Zirkuläre Referenz gefunden, überspringen
      }
      seen.add(value);
    }
    return value;
  });
}



export function drawSymbol( symbolName, container, color, size , symbolGroup) 
{
  const dom = container.DOMelement || container;

  // Container vorbereiten
  /*
  dom.style.overflow = 'hidden';
  dom.style.padding = '0';
  dom.style.margin = '0';
  dom.style.borderWidth = '0';
  dom.style.borderColor = 'transparent';
*/
  // Symbol einfügen (symbolName wie "OK", size z. B. "77%" oder Zahl)
  symbols.draw(dom, symbolName, size , symbolGroup );
  
  
  // Optional: Farbe setzen
  if (color) {
    const svg = dom.querySelector('svg');
    if (svg) {
      const elements = svg.querySelectorAll('*');
      elements.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (['path', 'rect', 'circle', 'ellipse', 'polygon', 'line', 'polyline', 'g', 'use'].includes(tag)) {
          el.setAttribute('fill', color);
          if (el.hasAttribute('stroke')) el.setAttribute('stroke', color);
        }
      });
    }
  }
}



/*   ALTE LOGIK 

export function drawSymbol( symbolName , container , color , size )
{ 
  var svgFile = webApiRequest('SYMBOL',{symbolName:symbolName});
  if (svgFile.error) {console.error('Error loading SVG:', svgFile.error); return }
  
  container.overflow = 'hidden';
  container.padding = 0;
  container.margin  = 0;
  container.borderWidth = 0;
  container.borderColor = 'transparent';
  container.DOMelement.innerHTML  = svgFile.result;
  var svg = container.DOMelement.querySelector('svg');
  if (svg) prepareSVG(svg, container, color || "white" , size || "77%" );
} 



// sorgt dafür, ein SVG als Text in den DOM einzuhängen 
// Benötigt wird das speziell für Button und Icons. 
export function prepareSVG(svg, container, color , size) 
{
  if (!svg) return;

  // Größe entfernen und auf 100% setzen
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  // viewBox ergänzen, falls nicht vorhanden
  if (!svg.hasAttribute('viewBox')) {
    const w = svg.getAttribute('width') || container.width || 35;
    const h = svg.getAttribute('height') || container.height || 35;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  // Optional: Farbe setzen
  if (color) {
    const elements = svg.querySelectorAll('*');
    elements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (['path', 'rect', 'circle', 'ellipse', 'polygon', 'line', 'polyline', 'g', 'use'].includes(tag)) {
        el.setAttribute('fill', color);
        // Optional: Linienfarbe auch setzen
        if (el.hasAttribute('stroke')) el.setAttribute('stroke', color);
      }
    });
  }

  // Sicherheitshalber SVG auf volle Größe strecken
  svg.style.width =  size;
  svg.style.height = size;

}

*/


export function evaluate( exp )
{
  var operator = '?';
  if(exp.indexOf("+")>-1) operator = "+";
  if(exp.indexOf("-")>-1) operator = "-";
  if(exp.indexOf("*")>-1) operator = "*";
  if(exp.indexOf("/")>-1) operator = "/";

  if(operator=="?") {exp = exp+"+0"; operator='+' }  // falls schlüsselwort ohne operator ankommt, wird eine dummy Operation benutzt

  var parts = exp.split( operator );
  if(parts.lengt < 2) return {error:true,errMsg:"uncomplete expression"}
  
  try { var num = parseInt(parts[1]); 
        return {error:false,errMsg:"OK",strVal:parts[0],operator:operator,numVal:num}
      }
  catch { return {error:true,errMsg:"no numeric value found"} }    
  
}

export function calculate( val1 , op ,val2 )
{
  if(op=="+") return val1+val2;
  if(op=="-") return val1-val2;
  if(op=="*") return val1*val2;
  if(op=="/") return val1/val2;
}  


export function pixProEM(element)
{
  log("pixProEM -> "+element);
  if(isHTMLElement(element)) var container = element;
  else                       var container = element.DOMelement;
  return parseFloat(getComputedStyle(container).fontSize);
}


export function strCompare(str, rule) 
{
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}


export function strMatches(searchStr, topic) 
{
  // (1) Kein WildCard -> searchStr muss identisch mit topic sein
  if (!searchStr.includes('*')) {
      return searchStr === topic;
  }

  // (2) searchStr ist ein '*' -> Jedes topic liefert einen Treffer
  if (searchStr === '*') {
      return true;
  }

  // (3) searchStr beginnt mit einem '*' -> topic muss mit dem Rest enden
  if (searchStr.startsWith('*')) {
      const ending = searchStr.slice(1); // Entferne das '*'
      return topic.endsWith(ending);
  }

  // (4) searchStr endet mit einem '*' -> topic muss mit dem Rest beginnen
  if (searchStr.endsWith('*')) {
      const beginning = searchStr.slice(0, -1); // Entferne das '*'
      return topic.startsWith(beginning);
  }

  // (5) searchStr enthält mitten im String einen '*' -> Anfang und Ende prüfen
  const [start, end] = searchStr.split('*'); // Splitte am '*'
  return topic.startsWith(start) && topic.endsWith(end);
}





export function containing( key , list )
{
 return  list.some(element => element.toUpperCase() == key.toUpperCase());
}


// -----------------------------------------------------------------------------------------------------------------------------


class TFDateParser 
{
 /*
     @param {string} dateString - Der Eingabe-Zeitstring
     @param {object} [options] - Optionen (z. B. { utc: true })
     @returns {Date|null}
 */
  static parse(dateString, options = {utc:true}) 
  {
    if (typeof dateString !== 'string') return null;

    let normalized = dateString
      .trim()
      .replace(/T/, ' ')
      .replace(/[\/\.]/g, '-')
      .replace(/\s+/, ' ');

    const [datePart, timePart = "00:00:00"] = normalized.split(' ');

    const dateParts = datePart.split('-').map(s => s.padStart(2, '0'));

    let year, month, day;
    if (parseInt(dateParts[0]) > 31) {[year, month, day] = dateParts;} 
    else if (parseInt(dateParts[2]) > 31) {[day, month, year] = dateParts;} 
         else {                            [day, month, year] = dateParts;
               if (year.length === 2) { year = parseInt(year) < 50 ? '20' + year : '19' + year;}
     }

    const [h = '00', m = '00', s = '00'] = timePart.split(':').map(p => p.padStart(2, '0'));

    const timeString   = `${year}-${month}-${day}T${h}:${m}:${s}`;
    const isoString    = options.utc ? timeString + 'Z' : timeString;

    const date = new Date(isoString);
    return isNaN(date) ? null : date;
  }

  static toISOString(dateString, options = {}) 
  {
    const d = this.parse(dateString, options);
    return d ? d.toISOString() : null;
  }

  static toLocalString(dateString, locale = 'de-DE', options = {}) 
  {
    const d = this.parse(dateString, options);
    return d ? d.toLocaleString(locale) : null;
  }
}





export class TFDateTime 
{ 
   // private Methoden:
   // Methode zur Umwandlung eines Unix-Timestamps in ein Excel-Timestamp
   #__unixToExcel(unixTimestamp) 
   {
      let daysSinceExcelEpoch = (unixTimestamp - this.excelEpoch) / this.msPerDay;
      if (daysSinceExcelEpoch >= 60)  daysSinceExcelEpoch += 1;  // Berücksichtige den Excel-Schaltjahr-Bug
      return daysSinceExcelEpoch;
   }

  // Methode zur Umwandlung des internen Excel-Timestamps in ein Unix-Timestamp
  #__toUnixTimestamp() 
  {
    let unixTimestamp = this.excelEpoch + this.excelTimestamp * this.msPerDay;
    if (this.excelTimestamp >= 60) {
        unixTimestamp -= this.msPerDay; // Berücksichtige den Excel-Schaltjahr-Bug
    }
    return unixTimestamp;
  }

  #__lastSundayOfMonth() 
  {
    let   year       = this.year();
    let   month      = this.month();
    let   date       = new Date(Date.UTC( year, month , 0 )); // letzter Tag im Monat
    let   lastSunday = date.getDate() - date.getDay();        // subtrahiere den Wochentag
          date       = new Date(Date.UTC(year, month-1, lastSunday));
    return new TFDateTime(date);      
  }
  
  
  constructor(input) 
  {
    this.excelEpoch     = Date.UTC(1899, 11, 31);
    this.msPerDay       = 1000 * 60 * 60 * 24;
    this.excelTimestamp = -1;

    this.setDateTime(input);
  }


  setDateTime(input)
  {
    if(input==undefined)
    {
      var now = new Date();
      input   = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    } 

    if(input.constructor.name.toUpperCase()=='DATE') 
    {
       this.excelTimestamp = this.#__unixToExcel( input.getTime() );
       return this;
    }  


    if(input.constructor.name.toUpperCase()=='TFDATETIME') 
      {
         this.excelTimestamp = input.dateTime();
         return this;
      }  


    if (typeof input === 'string')
    {
      if (input.toUpperCase().includes('SZU'))
      {
        let parts           = input.split('SZU ');
        let year            = parseInt(parts[1], 10);
        this.excelTimestamp = new TFDateTime('01.03.'+year+' 00:00:00').dateTime();
        this.excelTimestamp = this.#__lastSundayOfMonth().dateTime();
        return this;
      }

      if (input.toUpperCase().includes('WZU'))
        {
          let parts           = input.split('WZU ');
          let year            = parseInt(parts[1], 10);
          this.excelTimestamp = new TFDateTime('01.10.'+year+' 00:00:00').excelTimestamp;
          this.excelTimestamp = this.#__lastSundayOfMonth().excelTimestamp;
          return this;
        }
    }
    
    if (typeof input === 'number') 
    {
       // Annahme: Wenn der Input weniger als eine Million Tage seit der Excel-Epoche ist, ist es ein Excel-Timestamp
       // Sonst ist es ein Unix-Timestamp
       if (input < 365205)  this.excelTimestamp = input;  // 1 Million Tage sind etwa 2738 Jahre
       else                 this.excelTimestamp = this.#__unixToExcel(input);
          
    } 
    else if (typeof input === 'string') 
         {
                var date   = TFDateParser.parse( input , {utc:true})
                if(date==null) console.err( 'Unsupported input format -> ' + input );  
                else this.excelTimestamp = this.#__unixToExcel(date.getTime());
         }
 
      return this;
  }

  setDate( input )
  {
    this.setDateTime(input);
    return this;
  }


  setTime( input )
  {
    var st = this.formatDateTime('dd.mm.yyyy') + ' ' + input;
    this.setDateTime(st);
    return this;
  }

  setDay(day) 
  {
    // Konvertiere den aktuellen Excel-Zeitstempel in einen Unix-Timestamp
    let d = new Date(this.#__toUnixTimestamp());
  
    // Setze das Datum ohne Zeitdifferenz
    d.setUTCDate(day);
  
    // Konvertiere zurück in einen Excel-Zeitstempel
    this.excelTimestamp = this.#__unixToExcel(d.getTime());
    
    return this;
  }
  
  setMonth(month) {
    // Konvertiere den aktuellen Excel-Zeitstempel in einen Unix-Timestamp
    let d = new Date(this.#__toUnixTimestamp());

    // Setze den Monat ohne Zeitdifferenz
    d.setUTCMonth(month - 1);
  
    // Konvertiere zurück in einen Excel-Zeitstempel
    this.excelTimestamp = this.#__unixToExcel(d.getTime());
    
    return this;
  }
  

  setYear(year) {
    // Konvertiere den aktuellen Excel-Zeitstempel in einen Unix-Timestamp
    let d = new Date(this.#__toUnixTimestamp());
  
    // Setze das Jahr ohne Zeitdifferenz
    d.setUTCFullYear(year);
  
    // Konvertiere zurück in einen Excel-Zeitstempel
    this.excelTimestamp = this.#__unixToExcel(d.getTime());
    
    return this;
  }

  
  setHour(hour) {
  // Konvertiere den aktuellen Excel-Zeitstempel in einen Unix-Timestamp
  let d = new Date(this.#__toUnixTimestamp());

  // Setze die Stunde ohne Zeitdifferenz
  d.setUTCHours(hour);

  // Konvertiere zurück in einen Excel-Zeitstempel
  this.excelTimestamp = this.#__unixToExcel(d.getTime());
  
  return this;
}


setMinute(minute) {
  // Konvertiere den aktuellen Excel-Zeitstempel in einen Unix-Timestamp
  let d = new Date(this.#__toUnixTimestamp());

  // Setze die Minute ohne Zeitdifferenz
  d.setUTCMinutes(minute);

  // Konvertiere zurück in einen Excel-Zeitstempel
  this.excelTimestamp = this.#__unixToExcel(d.getTime());
  
  return this;
}


  setSecond( second )
  {
    let d = new Date(this.#__toUnixTimestamp());
        d.setUTCSeconds(second);
    this.excelTimestamp = this.#__unixToExcel(d.getTime());
    return this;
  }

  incHour(hours)
  {
    if(!hours) hours = 1;
    // this.excelTimestamp = this.excelTimestamp  += (hours / 24);
    // diese Variante ist zu ungenau, da die Division durch 24 zu Rundungsfehlern führt
    // Wir müssen den Weg über den Unix-Timestamp gehen	...
    var date = new Date(this.#__toUnixTimestamp());
        date.setUTCHours(date.getUTCHours() + hours); 

    this.excelTimestamp = this.#__unixToExcel(date.getTime());  
    
    return this;
  }

  incMinute(minutes)
  {
    if(!minutes) minutes = 1;
    // this.excelTimestamp = this.excelTimestamp  += (hours / 24);
    // diese Variante ist zu ungenau, da die Division durch 24 zu Rundungsfehlern führt
    // Wir müssen den Weg über den Unix-Timestamp gehen	...
    //this.excelTimestamp += minutes / (24 * 60);
    let date = new Date(this.#__toUnixTimestamp());
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    this.excelTimestamp = this.#__unixToExcel(date.getTime());
    return this;
  }


  incDay(days)
  {
    if(!days) days = 1;
    this.excelTimestamp += days;
    return this;
  }

  incMonth(months)
  {
    if(!months) months = 1;
    let date = new Date(this.#__toUnixTimestamp());
    date.setUTCMonth(date.getUTCMonth() + months);
    this.excelTimestamp = this.#__unixToExcel(date.getTime());
    return this;
  }

  getMonth()
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCMonth()+1;
  }

  month()
  {
    return this.getMonth();
  }   

  getFullYear()
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCFullYear();
  } 

  year()  
  {
    return this.getFullYear();
  } 

  getDay()  
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCDate();
  }   

 day()   
  {
    return this.getDay();
  }   

  dayOfWeek()   
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCDay();
  } 
    
  dayOfYear()   
  {
    return Math.abs(this.daysBetween(new TFDateTime('01.01.' + this.year())));
  } 

  lastDayOfMonth()
  {
    return new TFDateTime( new Date(Date.UTC(this.year(), this.month(), 0)) );
  }  

 

  numDaysInMonth()
  {
    return new Date(Date.UTC(this.year(), this.month(), 0)).getDate();
  }

  hour()
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCHours();
  }

  minute()    
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCMinutes();
  }
  
  second()
  {
    let date = new Date(this.#__toUnixTimestamp());
    return date.getUTCSeconds();
  }
  

  isWZU()
  {
    if(this.month()!=10) return false;
    
    let wzuDate = new TFDateTime('WZU ' + this.year() );
    return (wzuDate.date() == this.date() );
 }

 isSZU()
 {
   if(this.getMonth()!=3) return false;
   
   let szuDate = new TFDateTime('SZU ' + this.year() );
   return (szuDate.date() == this.date() );
 }

 isSchaltjahr()
 {
    let year = this.year();
    return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
 }

 daysBetween(dateTo)
 {
    if (dateTo.constructor.name.toUpperCase()=='TFDATETIME')  var to = dateTo;
    else                                                      var to = new TFDateTime(dateTo);
    return Math.trunc(to.date() - this.date());
 }
  
  monthBetween(dateTo)
  {
      if (dateTo.constructor.name.toUpperCase()=='TFDATETIME')  var to = dateTo;
      else                                                      var to = new TFDateTime(dateTo);
      return to.month() - this.month() + (12 * (to.year() - this.year())) 
  }

  yearsBetween(dateTo) 
  {
    return mod(this.monthBetween(dateTo) , 12 );
  }

   
  date()
  {
    return Math.trunc(this.excelTimestamp);
  }


  time()
  {
    return this.excelTimestamp - this.date();
  }


  dateTime()
  {
    return this.excelTimestamp;
  }

  unixDateTime()
  {
    return new Date(this.#__toUnixTimestamp());
  }

  toUnixTimestamp()
  {
    return this.#__toUnixTimestamp();
  }

 
  // Methode zur Formatierung des Datums
  formatDateTime(format) 
  {
      if (!format) format = 'dd.mm.yyyy hh:mn:ss';

      let date = new Date(this.#__toUnixTimestamp());

      let dd   = String(date.getUTCDate()).padStart(2, '0');
      let mm   = String(date.getUTCMonth() + 1).padStart(2, '0'); // Monate sind nullbasiert
      let yyyy = date.getUTCFullYear();
      let hh   = String(date.getUTCHours()).padStart(2, '0');
      let mn   = String(date.getUTCMinutes()).padStart(2, '0');
      let ss   = String(date.getUTCSeconds()).padStart(2, '0');

      return format.replace('dd', dd).replace('mm', mm).replace('yyyy', yyyy)
          .replace('hh', hh).replace('mn', mn).replace('ss', ss);
  }

  // Methode zur Umwandlung des internen Excel-Timestamps in einen UTC-String
  toUTC() 
  {
    return new Date(this.#__toUnixTimestamp()).toISOString();
  }

  toUTCshort() 
  {
    return this.formatDateTime('yyyymmddhhmnss');
  }


}



//-------------------------------------------------------------------------------------------------------------------------------


export function dayOfWeek( dt )
{
  var w = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  return w[ new TFDateTime(dt).dayOfWeek() ];
}

export function datumSZU(year) 
{
  return new TFDateTime('SZU ' + year);
}

function datumWZU(year) 
{
  return new TFDateTime('WZU ' + year).formatDateTime('dd.mm.yyyy');
}

export function isWZU( date )
{
  return new TFDateTime(date).isWZU();
}  


export function isSZU( date )
{
  return new TFDateTime(date).isSZU();  
}


export function UTC_yyyymmdd( date )
{
 return new TFDateTime(date).formatDateTime('yyyymmdd');
}


export function UTC_yyyymmddhhmm( date )
{
  return new TFDateTime(date).formatDateTime('yyyymmddhhmn');
}


export function UTC_yyyymmddhhmmss( date )
{
  return new TFDateTime(date).formatDateTime('yyyymmddhhmnss');
}


function daysInMonth(year ,month) 
{
  return new TFDateTime('01.' + (month + 1) + '.' + year).numDaysInMonth();
} 


 export function uxTimeStamp(year,month,day,hour,min,sec)
 {
  return new TFDateTime(day+'.'+month+'.'+year+' '+hour+':'+min+':',sec).unixDateTime();
 }


export function decodeUTC( utc ) // expect: yyyymmddhhmm returns {day:16, month:01, year:2012, hour:18, min:02, sec:00, fD:16.01.2012, fT:18:00:00, fDT:16.01.2012 18:02:00, DT:%WindowsNotation%    }
{
  var result = {};
  var dt     = new TFDateTime(utc);
  
  result.year   = dt.year();
  result.month  = dt.month();
  result.day    = dt.day();
  result.hour   = dt.hour();
  result.min    = dt.minute();
  result.fD     = dt.formatDateTime('dd.mm.yyyy');
  result.fT     = dt.formatDateTime('hh:mn');
  result.fDT    = dt.formatDateTime('dd.mm.yyyy hh:mn');
  result.uxDT   = dt.unixDateTime();
  result.xlsDT  = dt.dateTime();

  return result;
}



export function strToUxDate(str)
{
   return new TFDateTime(str).unixDateTime();
}



export function tab(len)
{
 var s="";
 for(var i=0 ; i<len; i++) s=s+" ";
 return s;
}


export function fill(len)
{
 return tab(len);
}

export function fillString( str , len )
{
  var l = str.length;
  var f = len-l;
  if (f<0) return str.slice(0,len);
  else     return str + tab(f);
}


export function prefix0( value )
{
  if(value<10) return '0' + value;
  else         return ''  + value;
}

export function parseRGBstring( rgbStr )
{
 // Entfernen von "rgb(" und ")"
 if(!rgbStr) return;
 if(rgbStr.toUpperCase().indexOf('RGB')<0) return;

const start = rgbStr.indexOf('(') + 1; 
const end   = rgbStr.indexOf(')'); 
const colorValues = rgbStr.slice(start, end); 
// Splitte den String anhand der Kommata
const v      = colorValues.split(',').map(Number);
const result = { r: v[0], g: v[1], b: v[2] };
if (v.length > 3) result.a = v[3];

return result;

}

export function randomColor() {return "#" +  Math.floor(Math.random()*16777215).toString(16);};

export function rndColor() {return randomColor();};

export function rgbToHsl(r, g, b) 
{
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, l];
}


export function hslToRgb(h, s, l) 
  {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
  
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
  


export function rgbToHex(r, g, b) 
  {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}



// Konvertiert RGB in HSL
export function darkenColor(color, amount) 
{
  var r = 0;
  var g = 0;
  var b = 0;
  var d = false;
  
  // liegt Farbe als RGB() vor ? 
  if(color.toUpperCase().indexOf('RGB')>-1)
    { // Extrahiere RGB-Werte aus RGB-String
      const rgb = parseRGBstring(color);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
      d = true;
  } 

  if(color.indexOf('#')>-1)
    { // Extrahiere RGB-Werte aus Hex-Farbe
      const hslMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
     if (hslMatch) 
      { 
        r = parseInt(hslMatch[1], 16);
        g = parseInt(hslMatch[2], 16);
        b = parseInt(hslMatch[3], 16);
        d = true;
      }  
    }   

  if (!d)
    {
       var ctx = document.createElement('canvas').getContext('2d');
           ctx.fillStyle = color;
       return this.darkenColor(ctx.fillStyle , amount);
     }
      
  
  // Konvertiere RGB zu HSL
  let hsl = this.rgbToHsl(r, g, b);

  // Dunkle die Helligkeit ab
  hsl[2] = Math.max(0, hsl[2] - amount);

  // Konvertiere zurück zu RGB
  let rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);

  // Konvertiere zurück zu Hex
  const darkenedColor = this.rgbToHex(rgb[0], rgb[1], rgb[2]);

  return darkenedColor;
}


   
export function log(s)
{
   if(debug) console.log(s);  
}






export function formatFloat( floatValue , nachkomma )
{   
  if(nachkomma == null) nachkomma = 0;
  if( isNaN(floatValue)) return '-';
  if(floatValue == null) return '-';

  if(floatValue.constructor.name.toUpperCase()=='NUMBER')
    try{
         return floatValue.toLocaleString('de-DE', { minimumFractionDigits: nachkomma, // Minimale Anzahl von Nachkommastellen
                                                     maximumFractionDigits: nachkomma  // Maximale Anzahl von Nachkommastellen
                                                   });
       } catch { return '-'}                                             
     else return '-';                                          
}


  export function formatInteger( intValue )
{
  if( isNaN(intValue)) return '-';
  if(intValue == null) return '-';
  var r  = "";  var j = 0 ;
  var st = "" + intValue;
      for (var i=st.length-1; i>=0 ; i--)
      {
       r=st[i]+r;
       j++;
       if(((j%3)==0)&&(i>0)) r="."+r;
      }
      return r;
}


export function formatBoolean( boolValue)
{
  var r = "Nein"; 
  if( (boolValue==1)||(boolValue=="1")||(boolValue.toUpperCase()=="TRUE")||(boolValue.toUpperCase()=="ON") ) r = "Ja";
  return r;
}


export function formatUXdateTime( uxdt )
{
   var dt = new TFDateTime(uxdt);
   return dt.formatDateTime();
}


export function formatUXDateMonth( uxdt , withMonthName )
{
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year   = uxdt.getFullYear();

  if(withMonthName) var result  = months[uxdt.getMonth()] + ' ' + year;
  else              var result  = prefix0(uxdt.getMonth()+1) + ' / ' + year;

  return result;
}


export function formatUXdate( uxdt )
{
   var dt = new TFDateTime(uxdt);
   return dt.formatDateTime();
}


export function formatDate( _dt )
{
   var dt = new TFDateTime(_dt);
   return dt.formatDateTime('dd.mm.yyyy');
}


export function formatUXtime( uxdt )
{
   var dt = new TFDateTime(uxdt);
   return dt.formatDateTime('hh:mn');
}


export function formatTime( _dt )
{
   var dt = new TFDateTime(_dt);
   return dt.formatDateTime('hh:mn');
}


export function formatFileSize( sizeInBytes )
{
  if(sizeInBytes == 0) return '0 Byte';
  var i = Math.floor( Math.log(sizeInBytes) / Math.log(1024) );
  return ( sizeInBytes / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['Byte', 'KB', 'MB', 'GB', 'TB'][i];
}

export function pathJoin(d='', f='', e) 
{
  let p = '';
  if (d === '' && f === '') return '';
  
  if (d === '/') p = '/' + f;
  else {
       if (d[d.length - 1] === '/') p = d + f;
       else                         p = d + '/' + f;
  } 
  
  if (e) p += '.' + e;

  return p;
}




//----------------------------------------------------------------
//------------------------------------------------------------------

// Hilfsfunktion für nodeJS-Antworten früherer Versionen .....
export function trimRequest( str )
{
  if (str.indexOf('[')>-1)
  {
    var p1  = str.indexOf('[');
    var p2  = str.lastIndexOf(']');
    return str.substring(p1, p2+1);
  }

  if (str.indexOf('{')>-1)
  {
    var p1  = str.indexOf('{');
    var p2  = str.lastIndexOf('}');
    return str.substring(p1, p2+1);

  }

  return str;
  
}


export function httpRequest( url , header , method )
{
  console.log('httpRequest: '+ url ) 
  const request = new XMLHttpRequest();
  if(!method) method = 'GET';
  request.open( method , url , false );  // `false` makes the request synchronous
  if(header) request.setRequestHeader( header.keyWord , header.argument );
  try {request.send(null);} catch {}
  if (request.readyState == 4 && request.status == 200) { return {error:false,errMsg:'OK', result:request.responseText } }
  else                                                    return {error:true, errMsg:request.status};
}


export function buildURL(  _cmd , _param )
{
  if(isJSON(_param)) _param = JSON.stringify(_param);

  console.log("buildURL(session:"+globals.session.ID+" , cmd:"+_cmd+" , param:"+_param+" )");

  var jsnStr   = JSON.stringify( {session:globals.session.ID , cmd:_cmd , param:_param } );
  var result   = globals.URL_webAppRequest() + encodeURIComponent( jsnStr); 

  console.log("=> "+result);

  return result;
}


export function webApiRequest_based_on_GET( _cmd , _param  )
{
  var url = buildURL( _cmd , _param )

  const request = new XMLHttpRequest();
  
  request.open('GET', url , false );  // `false` makes the request synchronous
  
  try {request.send(null);} catch(err) {return { error:true, errMsg:err.message , result:{} };}
  
  if (request.readyState == 4 && request.status == 200) 
  { 
    // Try to parse response as JSON 
    try        { var resultJsn = JSON.parse(request.responseText);                 }
    catch      { return { error:false, errMsg:'OK', result:request.responseText }; }

    if(resultJsn.errMsg && (resultJsn.errMsg.toUpperCase()=='INVALID SESSION'))
    {
      alert('<B>S</B>itzung abgelaufen !' , {glyp:"fa-solid fa-person-walking-arrow-right",button:['OK']})
      document.body.innerHTML = 'Applikation beendet  - Neustart mit F5 ';
      return {error:true, errMsg:resultJsn.errMsg, result:{} }; 
    }
    
    if (resultJsn.hasOwnProperty('result')) return  resultJsn;
    else                                    return  {error:false, errMsg:'OK', result:resultJsn}; 
    
  }
  else return { error:true, errMsg:'not found', result:{} };
}



export function webApiRequest_based_on_POST( _cmd , _param  )
{
  if(isJSON(_param)) _param = JSON.stringify(_param);

  var body = JSON.stringify({session:globals.session.ID , cmd:_cmd , param:_param }) 
  var url  = globals.URL_webAppPOSTrequest();

  const request = new XMLHttpRequest();
  
  request.open('POST', url , false );  // `false` makes the request synchronous
  request.setRequestHeader("Content-Type", "application/json"); 

  try {request.send( body );} catch(err) {return { error:true, errMsg:err.message , result:{} };}
  
  if (request.readyState == 4 && request.status == 200) 
  { 
    // Try to parse response as JSON 
    try        { var resultJsn = JSON.parse(request.responseText);                 }
    catch      { return { error:false, errMsg:'OK', result:request.responseText }; }
   
    if(resultJsn.errMsg && (resultJsn.errMsg.toUpperCase()=='INVALID SESSION'))
    {
      alert('<B>S</B>itzung abgelaufen !' , {glyp:"fa-solid fa-person-walking-arrow-right",button:['OK']})
      document.body.innerHTML = 'Applikation beendet  - Neustart mit F5 ';
      return {error:true, errMsg:resultJsn.errMsg, result:{} }; 
    }
    
    if (resultJsn.hasOwnProperty('result')) return  resultJsn;
    else                                    return  {error:false, errMsg:'OK', result:resultJsn}; 
    
  }
  else return { error:true, errMsg:'not found', result:{} };
}



export function webApiRequest( _cmd , _param , getOrPost )
{
  if(getOrPost)
  {
    if(getOrPost.toUpperCase()=='POST') return webApiRequest_based_on_POST(_cmd,_param)
    else return webApiRequest_based_on_GET(_cmd,_param);
  }
  else return webApiRequest_based_on_GET(_cmd,_param);
}     



export async function webApiRequestAsync(_cmd, _param = {}, getOrPost = 'GET') 
{
  const session = globals.session?.ID;
  let url, options;

  if (getOrPost.toUpperCase() === 'GET') 
  {
    url = buildURL(_cmd, _param);
    options = { method: 'GET' };
  } else 
   {
    url = globals.URL_webAppPOSTrequest();
    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, cmd: _cmd, param: _param })
    };
  }

  try {
    const response = await fetch(url, options);
    const text     = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      return { error: false, errMsg: 'OK', result: text };
    }

    if (json.errMsg && json.errMsg.toUpperCase() === 'INVALID SESSION') {
      alert('<B>S</B>itzung abgelaufen !', {
        glyp: 'fa-solid fa-person-walking-arrow-right',
        button: ['OK']
      });
      document.body.innerHTML = 'Applikation beendet  - Neustart mit F5 ';
      return { error: true, errMsg: json.errMsg, result: {} };
    }

    if ('result' in json) return json;
    else return { error: false, errMsg: 'OK', result: json };
  } catch (err) {
    return { error: true, errMsg: err.message, result: {} };
  }
}




export function POSTrequest(_cmd, _param, downloadURL) 
{
  console.log("webApiPOSTrequest(" + _cmd + ")");

  // Erstellen des Anfragekörpers
  const requestBody = JSON.stringify({session: globals.session.ID , cmd: _cmd , param: _param });

  // Verwenden von fetch() anstelle von XMLHttpRequest
  fetch(globals.URL_webAppPOSTrequest(), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: requestBody} )
      .then(response => {
                          if (!response.ok) { throw new Error('Fehler beim POSTrequest'); }
                          return response.blob();
                        })
      .then(blob => {
                      // Erstellen eines Links und Herunterladen der Datei
                      const downloadUrl = URL.createObjectURL(blob);
                      console.log("downloadUrl: "+downloadURL);
                      const a      = document.createElement("a");
                            a.href = downloadUrl;
                            a.download = downloadURL; // Dateiname
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(downloadUrl);
                    })
      .catch(error => {
                        console.error('Fehler:', error);
                        alert(error.message);
                     });
}





export function webRequest( url )
{
  log("webRequest( "+url+" )")
  
  const request = new XMLHttpRequest();
  
  request.open('GET', url , false );  // `false` makes the request synchronous
  
  try {request.send(null);} catch(err) {return { error:true, errMsg:err.message };}
  
  if (request.readyState == 4 && request.status == 200) 
  { 
    try   { var resultJsn = JSON.parse(request.responseText); }
    catch { var resultJsn =            request.responseText; }
    return { error:false, errMsg:'OK', result: resultJsn };
  }
  else return { error:true, errMsg:"requestState="+request.status };

}




export function loadContent( url ) 
{
  var result         = {error:false, errMsg:'OK' , script:'', body:'' , doc:''};
  var body           = ''; 
  var response       = httpRequest(url);

  if(response.error) return response;


  var responseText     = response.result; 
  result.doc           = responseText;
  
  //isoliere den HTML-Code zwisch den <body>-Tags
  var bodyTagStart     = responseText.indexOf('<body>');
  var bodyTagEnd       = responseText.indexOf('</body>'); 
  if((bodyTagStart>-1)&&(bodyTagEnd>-1)) body = responseText.substring(bodyTagStart+6,bodyTagEnd);
    
  if(body=='') body = responseText; 

 result.state  = 'OK';
 result.script = '';
 result.body   = body;
   
  return result; 
}



export function loadContentFromWebPage( url ) 
{
  var result         = {error:false, errMsg:'OK' , script:'', body:'' , doc:''};
  var script         = ''; 
  var body           = ''; 
  var response       = httpRequest(url);

  if( !isJSON(response) )
  {
    log('loadContent.response ->  ... ist not a valid JSON :'+ response);
    result.errMsg = 'response ist not a valid JSON';
    result.body   = response;
    return result;
  }
  
  var responseText = '';
  try {   responseText = response.result; }
  catch { responseText = response; }

  log('loadContent.responseText -> '+ responseText);

  result.doc = responseText;

 // zuerst alle Script-tags finden und bündeln ... sofern vorhanden ...
 var scriptTags = responseText.split('<script>');
if(scriptTags.length>1)
         for(var i=0; i<scriptTags.length; i++) script = script + scriptTags[i].replace('</script>','');
     
 // body-tag finden und isolieren...
 var scriptBody = responseText.split('<body>');
 if(scriptBody.lengt>1) body = scriptBody[0].replace('</body>','');

 if(body=='') body = responseText; 

 result.state='OK (scriptTags:'+scriptTags.length+' , bodyTag:'+scriptBody.lengt;
 result.script =script;
 result.body   =body;
   
  return result; 
}



export function saveForm(formName , formData )
{
   return  webApiRequest( 'SAVEFORM', {formName:formName, formData:formData} , 'POST' )
}

export function lsForms()
{ 
  var response = webApiRequest('LSFORMS' , {} ); 
  if (response.error) return [];
  else
      {
        var r = [];
        for( var i=0; i<response.result.length; i++) r.push(response.result[i]['FORMNAME'])
        return r;
      }                
}  

export function loadForm(formName)
{ 
  var response = webApiRequest('LOADFORM' , {formName:formName} ); 
  if (response.error) return [];
  var r = {};
  try
  { r = JSON.parse(response.result['FORMDATA'])
    return r;
  }  
  catch { return {} }
  
}  


export function fetchRecord( sql , etc )
{
   var _etc = false;
   if(etc) _etc=true;
   
   var response = webApiRequest( 'FETCHRECORD' , {sql:sql , etc:_etc} );
   console.log('fetchRecord('+sql+') ->' + JSON.stringify(response));
   response.result = keys_toUpperCase(response.result)
   return response;
}


export function fetchRecords( sql , etc )
{
  var _etc = false;
   if(etc) _etc=true;
   
   var response = webApiRequest( 'FETCHRECORDS' , {sql:sql , etc:_etc} );
   response.result = keys_toUpperCase(response.result)
   console.log('fetchRecords('+sql+') ->' + JSON.stringify(response));
   return response;
}


export function fetchValue( sql , etc )
{
  var _etc = false;
   if(etc) _etc=true;
   
   var response = webApiRequest( 'FETCHVALUE' , {sql:sql , etc:_etc} );
   console.log('fetchValue('+sql+') ->' + JSON.stringify(response));
   return response;
}


export function insertIntoTable( tableName , fields , etc )
{
  var _etc = false;
   if(etc) _etc=true;
   
   var response = webApiRequest( 'INSERTINTOTABLE' , {tableName:tableName , fields:fields  , etc:_etc} );
   console.log('insertIntoTable('+tableName+') ->' + JSON.stringify(response));
   return response;
}


export function _copyStringToClipboard (str) 
{
  log( 'utils.copyStringToClipboard('+str+')' );
  
  navigator.clipboard
    .writeText(str)
    .then(() => {
      alert("Inhalt in Zwischenablage kopiert");
    })
    .catch(() => {
      alert("Inhalt konnte nicht in die Zwischenablage kopiert werden !");
    });
}


export function copyStringToClipboard (str) 
{
  let text = str;
 
  if (window.clipboardData && window.clipboardData.setData) {
    // IE: prevent textarea being shown while dialog is visible
    return window.clipboardData.setData("Text", text);

  } else if (document.queryCommandSupported && 
             document.queryCommandSupported("copy")) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    // Prevent scrolling to bottom of page in MS Edge
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      // Security exception may be thrown by some browsers
      return document.execCommand("copy");
    } catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}


export function printJSON( jsn , excludeFields )
{
  if(!excludeFields) excludeFields = ['',''];
  var html="<ul style='margin:0.5em;'>"
  for (var key in jsn) 
   if(excludeFields.indexOf(key)<0) 
   if(isJSON(jsn[key])) html = html + "<li style='margin-bottom:0.5em;'><b>"+key+"</b>:"+this.printJSON(jsn[key])+"</li>";  // rekursion 
   else                 html = html + "<li style='margin-bottom:0.5em;'><b>"+key+'</b>:'+jsn[key]+"</li>"
  return html + "</ul>";
}

export function findEntryByKey( array , key )
{
  if(!array) return null;

  for (var i = 0; i < array.length; i++) 
  {
    if (key in array[i]) return array[i]; // Schlüssel gefunden
  }
  return null
}



export function findIndexByField( array , fieldName , value )
{
  if(!array) return -1;
  
  for (var i = 0; i < array.length; i++) 
  {
    var jsn = array[i];
    try {
         if (jsn[fieldName]==value) return i;  // Schlüssel gefunden  -> Index zurück
        } 
    catch { return  -1;}      
  }
  return -1
}



export function findEntryByField( array , fieldName , value )
{
  var ndx = findIndexByField( array , fieldName , value )
  
  if(ndx>-1) return array[ndx];
  else       return null; 
}



export function uploadFileToServer(file, fileName , callBackAfterUpload , params  ) 
{
  console.log('uploadFileToServer...');
  console.log('  - file     :'+ file.name);
  console.log('  - fileName :'+fileName);

  let formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName ); // Hinzufügen des Dateinamens zum FormData-Objekt

  if(params.destDir) formData.append('destDir' , params.destDir); 

// Erstelle ein XMLHttpRequest-Objekt
var xhr = new XMLHttpRequest();

// Konfiguriere die Anfrage (Method, URL und asynchroner Modus)
// getUploadURL() -> getServer()+'/upload'; API-Endpunkt für den Upload
xhr.open('POST', globals.getUploadURL() , true);

// Definiere eine Funktion, die aufgerufen wird, wenn die Anfrage abgeschlossen ist
xhr.onload = function () 
{
    if (xhr.status >= 200 && xhr.status < 300) {
        // Erfolgreiche Antwort verarbeiten
        console.log('uploadFileToServer Response::', xhr.responseText);
        if(callBackAfterUpload) try{ callBackAfterUpload( JSON.parse(xhr.responseText) ) } catch(err) {} 
    } else {
        // Fehler verarbeiten
        console.error('uploadFileToServer Fehler:', xhr.status, xhr.statusText);
    }
};

// Sende die Anfrage mit dem FormData-Objekt
xhr.send(formData);

 }




export function getGridLayoutDimension( element )
/*
window.getComputedStyle() wird verwendet, um die berechneten CSS-Stile des Grid-Containers abzurufen, und dann werden die Werte der grid-template-columns- und grid-template-rows-Eigenschaften analysiert. Diese Werte werden normalerweise als Zeichenketten mit den Größen der Spalten und Zeilen im Grid definiert, z.B. "1fr 2fr" für zwei Spalten.
Mit .split(' ') wird die Zeichenkette in ein Array aufgeteilt, und die Länge dieses Arrays entspricht der Anzahl der Spalten bzw. Zeilen im Grid. Beachten Sie, dass dies die aktuell im CSS definierten Spalten und Zeilen zählt und dass sich diese während der Laufzeit ändern können, wenn das Layout dynamisch angepasst wird.
*/
{
  var gridContainer = null;
  if(isHTMLElement(element))  gridContainer = element;
  else if(element.isTFObject) gridContainer = element.DOMelement;

  if(!gridContainer) return  {err:true,errMsg:"keine Grid-Demensionen von unbekanntem Objekt abrufbar !",gridColumnCount:1, gridRowCount:1} 
  
   // Die Wert der grid-template-columns/rows-Eigenschaft abrufen
   var gridColumnValue = window.getComputedStyle(gridContainer).getPropertyValue('grid-template-columns');
   var gridColumns     = gridColumnValue.split(' ').filter(value => parseFloat(value) > 0);

   var gridRowValue = window.getComputedStyle(gridContainer).getPropertyValue('grid-template-rows');
   var gridRows     = gridRowValue.split(' ').filter(value => parseFloat(value) > 0);

   console.log('getGridLayoutDimension => gridColumnValue:'+gridColumnValue+'  gridRowValue:'+gridRowValue);

   // Die Anzahl der Spalten und Zeilen analysieren
   return {gridColumnCount:gridColumns.length , gridRowCount:gridRows.length} ;
}   



export function buildGridLayout( parent , gridSizeOrTemplate , params )
{
  var rowCount      =  1;
  var colCount      =  1;
  var gridSize      =  1;
  var gridTemplate  =  '';

  if(!params) params = {stretch:true};
      
  if(!isNaN(gridSizeOrTemplate))
  {
    gridSize = gridSizeOrTemplate;
    log('buildGridLayout  based on gridSize='+gridSize);
    // Die Anzahl der Zeilen und Spalten ermitteln, die den Container ausfüllen sollen
    colCount = Math.floor(this.width / gridSize) - 1; // Anzahl GridColumns pro Spalte
    rowCount = Math.floor(this.height / gridSize) - 1; // Anzahl GridRows pro Zeile
  }
  else
      {
            gridTemplate = gridSizeOrTemplate;
            log('buildGridLayout  based on Template='+gridTemplate);
            
            //zuerst prüfen auf "cols x rows"
            var tst = gridTemplate.split('x'); 
            if(tst.length==2) 
            {
              log('Dimensionsvorgabe (cols x rows) erkannt');
              try {colCount=parseInt(tst[0]); rowCount=parseInt(tst[1]);}
              catch {}
            }
            else
                {
                  var arr      = gridTemplate.split('"');
                  rowCount     = Math.round((arr.length-1)/2);
                  var firstRow = arr[1];
                  colCount     = firstRow.split(' ').length; 
                }  
     }    

  log('parse-Results:');
  log('  - rowcount:'+rowCount);
  log('  - colCount:'+colCount);

  // Rastergröße auf die berechnete Anzahl von Zeilen und Spalten setzen
  
  parent.DOMelement.style.display = 'grid';

  if(colCount>0) parent.DOMelement.style.gridTemplateColumns  = 'repeat(' + (colCount) + ', 1fr )';
  else           parent.DOMelement.style.gridTemplateColumns  = '1fr';

  if(rowCount>0) parent.DOMelement.style.gridTemplateRows     = 'repeat(' + (rowCount) + ', 1fr )';
  else           parent.DOMelement.style.gridTemplateRows     = '1fr';

  // dafür sorgen, dass das Client-Item sich ausdeht
  if(params.stretch)  parent.DOMelement.style.alignItems ='stretch';
  else
  { parent.DOMelement.style.alignItems='center';
    parent.DOMelement.style.justifyContent='center';
  } 

  if(gridTemplate!='') 
  {
    log('...style.gridTemplateAreas = '+gridTemplate );
    parent.DOMelement.style.gridTemplateAreas =   gridTemplate;
  }
}

export function buildGridLayout_templateColumns( parent , template , params )
{
  if(!params) params = {stretch:false};
  if(isHTMLElement(parent))
  {
    parent.style.display              = 'grid';
    parent.style.gridTemplateColumns  = template;
    if(params.stretch)  parent.style.alignItems ='stretch';
    else
    { parent.style.alignItems='center';
      parent.style.justifyContent='center';
    } 
    return;
  }

  parent.DOMelement.style.display              = 'grid';
  parent.DOMelement.style.gridTemplateColumns  = template;
  if(params.stretch)  parent.DOMelement.style.alignItems ='stretch';
  else
  { parent.DOMelement.style.alignItems='center';
    parent.DOMelement.style.justifyContent='center';
  } 
 
}  


export function buildGridLayout_templateRows( parent , template , params)
{
  if(!params) params = {stretch:false};
  if(isHTMLElement(parent))
  {
    parent.style.display              = 'grid';
    parent.style.gridTemplateRows     = template;
    
    if(params.stretch)  parent.style.alignItems ='stretch';
    else
    { parent.style.alignItems='center';
      parent.style.justifyContent='center';
    } 
    
    parent.isGridLayout               = true;
    return;
  }
parent.DOMelement.style.display              = 'grid';
parent.DOMelement.style.gridTemplateRows     = template;
if(params.stretch)  parent.DOMelement.style.alignItems ='stretch';
else
{ parent.DOMelement.style.alignItems='center';
  parent.DOMelement.style.justifyContent='center';
} 

}  

export function buildBlockLayout( parent ) 
{
  if(isHTMLElement(parent))
  {
    parent.style.display             = 'block';
    parent.style.gridTemplateColumns = "none";
    parent.style.gridTemplateRows    = "none";
    parent.style.gridTemplateAreas   = "none";
    //parent.style.gridAutoFlow        = "row";
    return;
  }
  parent.isGridLayout                         = false;
  parent.DOMelement.style.display             = 'block';
  parent.DOMelement.style.gridTemplateColumns = "none";
  parent.DOMelement.style.gridTemplateRows    = "none";
  parent.DOMelement.style.gridTemplateAreas   = "none";
  parent.DOMelement.style.gridAutoFlow        = "row"; // Oder "column" je nach Bedarf
}

export function buildFlexBoxLayout( parent ) 
{
  if(isHTMLElement(parent))
  {
    parent.style.display             = 'flex';
    parent.style.flexDirection       = 'row';
    parent.style.gridAutoFlow        = 'row'; // Oder "column" je nach Bedarf
    parent.style.overflowY           = 'auto';
    parent.style.flexWrap            = 'wrap';
  
    parent.style.gridTemplateColumns = "none";
    parent.style.gridTemplateRows    = "none";
    parent.style.gridTemplateAreas   = "none";
    return;
  }
  parent.isGridLayout = false;
  parent.DOMelement.style.display             = 'flex';
  parent.DOMelement.style.flexDirection       = 'row';
  parent.DOMelement.style.gridAutoFlow        = 'row'; // Oder "column" je nach Bedarf
  parent.DOMelement.style.overflowY           = 'auto';
  parent.DOMelement.style.flexWrap            = 'wrap';

  parent.DOMelement.style.gridTemplateColumns = "none";
  parent.DOMelement.style.gridTemplateRows    = "none";
  parent.DOMelement.style.gridTemplateAreas   = "none";
}


export function showFullScreen()
{
  var element = globals.Screen;
  // In den Vollbildmodus wechseln
 if (element.requestFullscreen) {
  element.requestFullscreen(); 
 } else if (element.mozRequestFullScreen) { // Firefox
  element.mozRequestFullScreen();
 } else if (element.webkitRequestFullscreen) { // Chrome, Safari und Opera
  element.webkitRequestFullscreen();
 } else if (element.msRequestFullscreen) { // Internet Explorer
   element.msRequestFullscreen();
 }
}


export function exitFullScreen()
{
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { // Firefox
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { // Chrome, Safari und Opera
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { // Internet Explorer
    document.msExitFullscreen();
  }
}


export function doPosition( wnd )
{
  var r = globals.webApp.activeWorkspace.DOMelement.getBoundingClientRect();
  var w = wnd.baseContainer.getBoundingClientRect();

  log("doPosition()");
  log("  - Parent -> " + JSON.stringify(r));
  log("  - Window -> " + JSON.stringify(w));

// z.B.   r = {x: 0, y: 121.28125, width: 1408, height: 1576.71875, top: 121.28125 }

  if(wnd.pLeft)   wnd.left = r.left;
  if(wnd.pTop)    wnd.top  = r.top;
  if(wnd.pRight)  wnd.left = r.width - wnd.width;
  if(wnd.pBottom) wnd.top  = r.height - wnd.height;

  if(wnd.pLeft  && wnd.pMiddle) wnd.top   = Math.round((r.height-wnd.height)/2);
  if(wnd.pRight && wnd.pMiddle) wnd.top   = Math.round((r.height-wnd.height)/2);

  if(wnd.pTop && wnd.pMiddle) wnd.left    = Math.round((r.width-wnd.width)/2);
  if(wnd.pBottom && wnd.pMiddle) wnd.left = Math.round((r.width-wnd.width)/2);

  if(wnd.pCenter)
                 {
                   wnd.top   = Math.round((r.height-wnd.height)/2);
                   wnd.left    = Math.round((r.width-wnd.width)/2);
                 }  

  if(wnd.pLeft  && wnd.pClient)
  {
     wnd.top    = r.top;
     wnd.height = r.height;
  }   

  if(wnd.pRight && wnd.pClient)
  {
    wnd.top    = r.top;
    wnd.height = r.height;
 }   

  if(wnd.pTop && wnd.pClient)
  {
    wnd.left   = r.left;
    wnd.width  = r.width;
  }   

  if(wnd.pBottom && wnd.pClient) 
  {
    wnd.left   = r.left;
    wnd.width  = r.width;
  }   

  if(wnd.pFullClient) 
  {
    wnd.left   = r.left;
    wnd.width  = r.width;
    wnd.left   = r.left;
    wnd.width  = r.width;                
  }  
}



function ___compare( operator , str1 , str2 )  // str1 = Temperatur    str2 = "Temp*"
{
  var result = false;

  if(operator=="=")  {console.log("___compare " +str1+" equal "+str2);      result = (str1.toUpperCase()==str2.toUpperCase()); }

  if(operator=="!=") {console.log("___compare " +str1+" not equal "+str2); result = (str1.toUpperCase()!=str2.toUpperCase()); }

  if(operator=="~")  {console.log("___compare " +str1+" like "+str2);      result = strCompare( str1.toUpperCase() , str2.toUpperCase() ); }
  
  if(operator=="!~") {console.log("___compare " +str1+" not like "+str2);  result = !strCompare( str1.toUpperCase() , str2.toUpperCase() ); }

  console.log('result:'+result);

  return result;
}



export function checkGrant( grantName , grantCondition )
{
  console.log("");
  console.log("checkGrant( grant:"+grantName+" ,  grantCondition");
  console.log("==========");
  if(globals.session.admin) return true;
  
  var result = false;

  for(var i=0; i<globals.session.grants.length; i++)   // durchlaufe alle Grants dieser Session
  {
    var g=globals.session.grants[i];
    console.log('');
    console.log('');
    console.log(i+'. grant:'+g.name);
    console.log('');
    console.log('Probe gegen "'+JSON.stringify(g)+'"');
    if(g.name.toUpperCase()==grantName.toUpperCase())  // falls Grant in der Liste dann ->TRUE sofern keine grantCondition existiert.....
    {
      console.log('...hit');

      if(g.kind=="") result = g.access; // falls Berechtigung an keine Bedingung geknüpft ist, dann ist der Zugriff in "access" geregelt...
      else { 
             console.log('es existiert die Grant-Condition:'+g.kind+' die gegen params:'+grantCondition+' geprüft wird ...' );
             // Reihenfolge beachten da ein IndexOf("=") auch bei != einen Treffer liefert ...
             if(g.kind.indexOf('!=')>-1)
             {
              var items=g.kind.split('!=');
              if(___compare("!=" , grantCondition , items[1])) result=g.access;
              console.log('result '+result);
             }
        
             if(g.kind.indexOf('=')>-1)
             {
               var items=g.kind.split('=');
               if(___compare("=" , grantCondition , items[1])) result=g.access;
               console.log('result '+result);
             } 
             
             if(g.kind.indexOf('!~')>-1)
             {
               var items=g.kind.split('!~');
               if(___compare("!~" , grantCondition , items[1])) result=g.access;
               console.log('result '+result);
             } 

             if(g.kind.indexOf('~')>-1)
             {
              var items=g.kind.split('~');
              if(___compare("~" , grantCondition , items[1])) result=g.access;
              console.log('result '+result);
             } 
          } 
       }      
     }
     return result;
  }   




  export function addItem( htmlListElement , itemText , itemValue )
  {
    var newOption = document.createElement("option");
    newOption.value = itemValue
    newOption.text  = itemText;

    // Überprüfen, ob die Option bereits in der ListBox existiert
    var exists = false;
    for (var i = 0; i < htmlListElement.options.length; i++) {
        if (htmlListElement.options[i].value === newOption.value) 
        {
            exists = true;
            break;
        }
    }

    // Wenn die Option noch nicht existiert, hinzufügen
    if (!exists) htmlListElement.add(newOption);
    else newOption = null;
}



export function getSelectedItem( htmlElement )
{
  return htmlElement.options[htmlElement.selectedIndex];
}


export function keys_toUpperCase(jsn) 
{
  return jsn.map(obj => {
                          let newObj = {};
                          for (let key in obj) newObj[key.toUpperCase()] = obj[key]; // Ändert alle Schlüssel in Großbuchstaben
                          return newObj;
                        });
}


export function isMovieFile(ext)
{
   for(var i=0; i<globals.movieFileExtensions.length; i++)
   {
     if(ext.toUpperCase()==globals.movieFileExtensions[i].toUpperCase()) return true;
   }
   return false;  
}

export function isImageFile(ext)
{
   // besitzt ext einen vorangestellten Punkt ?
   if(ext.indexOf('.')==0) ext = ext.substring(1);

   for(var i=0; i<globals.imageFileExtensions.length; i++)
   {
     if(ext.toUpperCase()==globals.imageFileExtensions[i].toUpperCase()) return true;
   }
   return false;  
}

// parst eine Zeichenkette in ein JSON-Objekt - siehe Beispiel unten
export function parseToJSON(inputStr)  
  {
    let result = {};
    let pairs = inputStr.split(";").map(pair => pair.trim()).filter(pair => pair); // Aufteilen & leere Elemente entfernen

    pairs.forEach(pair => {
        let [path, value] = pair.split("=").map(part => part.trim());
        value = value.replace(/^"(.*)"$/, "$1"); // Entfernt optionale Anführungszeichen um Werte
        
        if (path.includes(".")) {
            // Falls ein Punkt existiert → Hierarchie aufbauen
            let keys = path.split(".");
            let obj = result;

            keys.forEach((key, index) => {
                if (index === keys.length - 1) {
                    obj[key] = value; // Letzter Key → Wert zuweisen
                } else {
                    obj[key] = obj[key] || {}; // Neues Objekt erstellen, falls noch nicht vorhanden
                    obj = obj[key]; // Tiefere Ebene setzen
                }
            });
        } else {
            // Kein Punkt → Direkt in das JSON-Objekt setzen
            result[path] = value;
        }
    });

    return result;
}

/*
 ======Test======
let input = "person.Name=Doe;person.VORNAME=Jon;adresse.Strasse=Hauptstrasse;Alter=30;Land=DE";
let jsonObj = parseToJSON(input);
console.log(jsonObj);

 
======Ergebnis========
{
    person: { Name: "Doe", VORNAME: "Jon" },
    adresse: { Strasse: "Hauptstrasse" },
    Alter: "30",
    Land: "DE"
}
*/


// utils.js

/**
 * Liefert eine alphabetisch sortierte Liste aller verwendbaren CSS-Klassen
 * aus den aktuell eingebundenen Stylesheets (sofern zugreifbar).
 *
 * Rückgabe:  string[] Array mit CSS-Klassen-Selektoren (z. B. ".myClass")
 */
export function getAvailableCSSClasses() 
{
  const result = new Set();

  Array.from(document.styleSheets).forEach(sheet => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText) {
          rule.selectorText
            .split(',')
            .map(sel => sel.trim())
            .filter(sel => sel.startsWith('.'))
            .forEach(sel => result.add(sel));
        }
      }
    } catch (err) {
      console.warn("CSS-Klassen konnten nicht ausgelesen werden (CORS):", sheet.href);
    }
  });
  return Array.from(result).sort();
};


export function getComputedStyleValue(dom, prop) 
{
  return window.getComputedStyle(dom)[prop];
}