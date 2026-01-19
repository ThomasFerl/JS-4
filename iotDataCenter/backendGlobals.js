const path          = require('path');

var   ___staticPath = '';

module.exports.staticPath           = (pathName) => {if(pathName) ___staticPath = pathName; return ___staticPath;};
module.exports.symbolPath           = () => {return path.join(___staticPath , 'tfWebApp' , 'symbols');};
module.exports.ignoreSession        = true;

module.exports.__Port_webSocket     =  4444;
module.exports.maxAgePayloadHistory =  365;  // 1 Jahr