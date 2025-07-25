var childProc           = require('child_process');
var axios               = require('axios');
const excelJS           = require('exceljs');
var   { spawn }         = require('child_process');
const { TFLogging }     = require('./logging.js');


module.exports.debug    = true;
module.exports.logging  = new TFLogging();


// if (!Buffer.from) var { Buffer } = require("node:buffer");


module.exports.getSymbolPath = (symbolName) =>
{
   return global.symbolPath (group)
}

module.exports.log = (s) =>
{
  if(this.debug) console.log(s);
  //return this.logging.log(s);
}


module.exports.execSync = ( cmd ) =>
{
  var exec = childProc.execSync;
  var options = {shell: true};
  var res     = '';

  try { res = exec( cmd , options ).toString(); }
  catch (err){ return {error:true, errMsg:err.message + '  / sdterr : ' + err.stderr.toString(), result:"" } }

  return {error:false, errMsg:"OK" , result:res}
} 


module.exports.exec = ( cmd , callback ) =>
{
  var exec = childProc.exec;
  var options = {shell: true};
  var res     = '';

  try {        res = exec( cmd , options , (err, stdout , stderr )=>{ if(callback) callback(err, stdout , stderr)} ); }
  catch (err){ result = {error:true,errMsg:err.message + '  / sdterr : ' + err.stderr.toString(), result:""};}

 return {error:false, errMsg:"OK" , result:res}
}


module.exports.generateRandomString = ( offset )=>
{
  var timestamp = Date.now(); 
  var randomNum = Math.floor(Math.random() * 1000); 
  if(offset) randomNum = offset;
  return timestamp.toString() + randomNum;
}


function _excelToUnixTimestamp(excelTimestamp)
{
  return new TFDateTime(excelTimestamp).toUnixTimestamp();
}


module.exports.excelToUnixTimestamp = (excelTimestamp) =>
{
    return  _excelToUnixTimestamp(excelTimestamp)
 }


module.exports.unixTimestampToExcel = (unixTimestamp) =>
{
   return new TFDateTime(unixTimestamp).dateTime();
}


module.exports.strDateTimeToExcel = (strDateTime) =>
{
  return new TFDateTime(strDateTime).dateTime();
}


//--------------------------------------------------------------------------------------------
/*
REST in Console:

t.setDateTime('01.01.2000 12:00')

for (var i=0; i<24; i++) {t.incMinute(15); console.log('Stunde: ' + t.hour() + '  /  Minute: ' + t.minute() + '  -> ' +t.formatDateTime()) }

*/


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





class TFDateTime 
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

module.exports.TFDateTime = TFDateTime;


//--------------------------------------------------------------------------------------------


module.exports.encodeBase64 = (data) => { return Buffer.from(data).toString('base64'); }


module.exports.decodeBase64 = (data) => { return Buffer.from(data, 'base64').toString('ascii'); }


module.exports.mod  = (a,b) => { if(b!=0) return Math.floor(a/b); else return NaN;}


module.exports.now = () => { return new TFDateTime().formatDateTime(); }


module.exports.seconds = () => 
{ 
  var dt=new Date(); 
  return Math.round(dt.valueOf()/1000); 
}
 

module.exports.formatDate = ( date )=>
{
  return TFDateTime(date).formatDateTime('dd.mm.yyyy');
}
  

module.exports.formatTime = ( date )=>
{
  return TFDateTime(date).formatDateTime('hh:mn:ss');
}


module.exports.formatDateTime = ( unixTimestamp )=>
{
   // Formatierung als "dd.mm.yyyy hh:mm:ss"
  return this.formatDate( unixTimestamp ) + ' ' + this.formatTime( unixTimestamp );
}


module.exports.datumSZU=(year) => 
{
  // Letzter Sonntag im März
  return new TFDateTime('SZU ' + year).unixDateTime();
}


module.exports.datumWZU=(year) => 
{
   // Letzter Sonntag im März
   return new TFDateTime('WZU ' + year).unixDateTime();
}


module.exports.isWZU=( date )=>
{
  return new TFDateTime(date).isWZU();
}


module.exports.isSZU=( date )=>
{
  return new TFDateTime(date).isSZU();
}


module.exports.UTCstr=( yyyy , mm , dd , hh , mn , ss)=>
{
    return new TFDateTime(dd+'.'+mm+'.'+yyyy+' '+hh+':'+mn+':'+ss).toUTCshort();
}


module.exports.UTC_yyyymmdd=( date )=>
{
  return this.UTCstr( date.getUTCFullYear() , date.getUTCMonth() + 1 , date.getUTCDate() )
}


module.exports.UTC_yyyymmddhhmm=( date )=>
{
  return this.UTCstr( date.getUTCFullYear() , date.getUTCMonth() + 1 , date.getUTCDate() ,  date.getUTCHours() , date.getUTCMinutes() )
}


module.exports.UTC_yyyymmddhhmmss=( date )=>
{
  return this.UTCstr( date.getUTCFullYear() , date.getUTCMonth() + 1 , date.getUTCDate() ,  date.getUTCHours() , date.getUTCMinutes() ,  date.getUTCSeconds() )
}


module.exports.decodeUTC = ( utc )=>  // expect: yyyymmddhhmm returns {day:16, month:01, year:2012, hour:18, min:02, sec:00, fD:16.01.2012, fT:18:00:00, fDT:16.01.2012 18:02:00, DT:%WindowsNotation%    }
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


module.exports.strCompare = (str, rule) =>
{
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  var result = new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);


  this.log('utils.strCompare(str:'+str+' , rule:'+rule+' ) -> ' + result);
  return result;
}


module.exports.scanDir = (fs , path , dirName ) =>
{
  if (!dirName) dirName='/';

  this.log('scanDir('+dirName+')');
  
  try {

  var scanResult = fs.readdirSync( dirName , 'utf8' );
  
  if(scanResult.errno<0)
  { // Fehler ...
    var scanResultStr = JSON.stringify( scanResult );
    this.log('abort: ' + scanResultStr );
    return {error:true, errMsg:scanResultStr, result:{} };
  }

   // Fileinfos besorgen....
  const response = [];
  for (var i=0; i<scanResult.length; i++)
  {
    var n=scanResult[i]
    var p=path.join(dirName,n);
        p= path.resolve(path.normalize(p));

    if (fs.existsSync(p))
    { 
      var e=path.extname(p);   
      var s=fs.statSync(p).size;
      var D=fs.statSync(p).isDirectory();
      var F=fs.statSync(p).isFile();
      response.push({ name:n, ext:e, size:s, isDir:D, isFile:F});
    }
  }    
  
  //var scanResultStr = JSON.stringify( response );
  return {error:false, errMsg:'OK', result:response };

}  catch(err) { return {error:true, errMsg:err.message, result:"" }; }

  
}


module.exports.getTextFile = function( fs , fileName )
{
  this.log('getFile('+fileName+')');
  
  try {
  if (fs.existsSync(fileName))  return {error:false, errMsg:'OK', result:fs.readFileSync(fileName, 'utf8') }; 
  else                         return {error:true, errMsg:'File not found', result:'' };
  } catch(err) { return {error:true, errMsg:err.message, result:"" }; } 
}



exports.getImageFile = async( fs , path , img , req , res  ) =>
{
    var mime =
       {
        gif: 'image/gif',
        jpg: 'image/jpeg',
        png: 'image/png',
        svg: 'image/svg+xml',
       };
  
    var type      = mime[path.extname(img).slice(1)] || 'text/plain';
     
    try
    {
      var stream    = fs.createReadStream(img);
          res.set('Content-Type', type );
          stream.pipe(res);
    }      
    catch(err)
              {
                res.set('Content-Type', 'text/plain');
                res.send(err);
              };
  }
  
  exports.getMovieFile = async( fs , path , movie , req , res  ) =>
    {
      console.log( 'playMovie('+movie+')' );
    
      var mime =
         {
          mp4:  'video/mp4',
          flv:  'video/x-flv',
          m3u8: 'application/x-mpegURL',
          ts:   'video/MP2T',
          mov:  'video/quicktime',
          avi:  'video/x-msvideo',
          wmv:  'video/x-ms-wmv',
          m4v:  'video/x-m4v',
          webm: 'video/webm', 
          weba: 'audio/webm', 
          ogm:  'video/ogg',
          ogv:  'video/ogg',
          ogg:  'video/ogg',
    
         };
    
      if( !fs.existsSync(movie) )
      { 
         res.set('Content-Type', 'text/plain');
         res.send("missing fileName"); 
         return;
      }
    
      console.log( 'try to load "' + movie +'"');
    
     var type      = mime[path.extname(movie).slice(1)] || 'text/plain';
    
     console.log( 'typ : ' + type );
    
     const stat      = fs.statSync(movie);
     const fileSize  = stat.size
     const range     = req.headers.range
    
     if (range)
     {
        const parts     = range.replace(/bytes=/, "").split("-")
        const start     = parseInt(parts[0], 10)
        const end       = parts[1] ? parseInt(parts[1], 10) : fileSize-1
        const chunksize = (end-start)+1
        const file      = fs.createReadStream( movie , {start, end} )
        const head      =
        {
          'Content-Range' : `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges' : 'bytes',
          'Content-Length': chunksize,
          'Content-Type'  : 'video/mp4',
        }
    
        res.writeHead(206, head);
        file.pipe(res);
      }
      else
        {
           const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(movie).pipe(res)
      }
    
    }
    


module.exports.httpRequest = async function (url) 
{
  this.log('httpRequest.url:' + url);

  var res  = {error:false,errMsg:'OK',result:''};

  try {
    // Sende eine GET-Anfrage an die Web-API
    const response = await axios.get(url);

    // Die empfangenen Daten ausgeben
    this.log('Empfangene Daten:');
    this.log(response.data);
    res.result = response.data;
    } 
     catch (error) 
    {
      // Fehlerbehandlung, falls die Anfrage fehlschlägt
      console.error('Fehler bei der Anfrage:', error.message);
      res.error=true; res.errMsg=error.message; 
    }

  return res;
}


/* mit Callback

module.exports.httpRequest = function ( url ) 
{
  axios.get(url)
    .then (response => callback(null, response))
    .catch(error => callback(error));
}

*/


module.exports.isJSON = function(data) 
{
  if (typeof data === "string") return false;
  
  else 
      if (typeof data === "object" && data !== null) return true;
      else return false;
}



module.exports.findEntryByKey = ( array , key ) =>
{
  for (var i = 0; i < array.length; i++) 
  {
    if (key in array[i]) return array[i]; // Schlüssel gefunden
  }
  return null
}


module.exports.findIndexByField = ( array , fieldName , value ) =>
{
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



module.exports.findEntryByField = ( array , fieldName , value ) =>
{
  var ndx = this.findIndexByField( array , fieldName , value )
  
  if(ndx>-1) return array[ndx];
  else       return null; 
}


module.exports.jsonToCSV=(jsonArray , seperator , withHead , withQ) =>
{
    // Überprüfen, ob das Array leer ist
    if (jsonArray.length === 0) {
        return "";
    }

    // Extrahiere die Spaltenüberschriften: Schlüssel des ersten Objekts
    const headers = Object.keys(jsonArray[0]);

    // Erzeuge die CSV-Zeilen aus den JSON-Daten
    const csvLines = jsonArray.map(row => {
        return headers.map(fieldName => {
            // Prüfe auf null oder undefined und handle entsprechend
            let field = row[fieldName];
            let fieldValue = "";
            if (field !== null && field !== undefined) {
                fieldValue = field.toString().replace(/"/g, '""'); // Sicherstellen, dass interne Anführungszeichen verdoppelt werden
            }
            if(withQ) return `"${fieldValue}"`;
            else      return fieldValue;
        }).join(seperator);
    });

    // Füge die Überschriften als erste Zeile hinzu
    if(withHead) csvLines.unshift(headers.join(seperator));

    // Verbinde alle Zeilen mit Zeilenumbrüchen
    return csvLines.join('\r\n');
}

//-----------------------------------------------------------------------------------

module.exports.json2Excel = ( worksheetName , jsnArr , excludeFields , fieldTitles , res ) =>
{
  try
  {
    // Neues Excel-Workbook erstellen
    const workbook = new excelJS.Workbook();

    // Neues Arbeitsblatt hinzufügen
    const ws = workbook.addWorksheet(worksheetName);

    // Spalten definieren
    var columns = []; 

    if(jsnArr)
    if (Array.isArray(jsnArr)) 
    if(jsnArr.length>0)   
    {
     var firstDataItem = jsnArr[0];
     for (var key in firstDataItem)
     {
       var useField   = true;
       var fieldTitle = key;
       if(excludeFields)
       if(excludeFields.indexOf(key)>=0) useField = false;
       
       if(fieldTitles)
       {
         // Translation Title (ggf)
         // Variante1: [{var1:"1"} , {var2:"2"} , {var3:"3"} , .... , {varn:"n"}]
         if (Array.isArray(fieldTitles)) 
         { 
           var jsnHelp = this.findEntryByKey( fieldTitles , key );
           if(jsnHelp) fieldTitle = jsnHelp[key];
         }
         else // Variante2: {var1:"1" , var2:"2" , var3:"3" , .... , varn:"n"}
         {
           if(fieldTitles[key]) fieldTitle = fieldTitles[key];
         }
        }  
        
        if(useField) columns.push({header:fieldTitle , key:key , width:10, style:{ numFmt: '#,##0.00;(-#,##0.00)' }}) 
     }
   }
   
   ws.columns = columns;
     
   // Daten hinzufügen
   for(var i=0; i<jsnArr.length; i++)
   {
    var row    = {};
    var jsnObj = jsnArr[i];
    for (var key in jsnObj)
    {
       var useField   = true;
       if(excludeFields)
       if(excludeFields.indexOf(key)>=0) useField = false;

       if(useField) row[key] = jsnObj[key];
    }    

     // DEBUG this.log('row['+i+'] : ' + JSON.stringify(row))
     ws.addRow( row );
   }

   // Zellenformatierung für die erste Zeile (Kopfzeile)
    ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00000000' } };
    });



   // Header für den Download setzen
   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
   res.setHeader('Content-Disposition', 'attachment; filename=excelDownload.xlsx');

   // Excel-Datei direkt in die Response streamen
   workbook.xlsx.write(res).then(() => {this.log("xls-render-process ready"); res.end() });
  }
  catch(e) {return {error:true, errMsg:e.message, result:{} } }

  this.log("---finish------");
  return {error:false, errMsg:"OK", result:{} , isStream:true}
  
}
