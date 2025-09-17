const path                          = require('path');

var   ___staticPath                 = '';

module.exports.staticPath           = (pathName) => {if(pathName) ___staticPath = pathName; return ___staticPath;};
module.exports.symbolPath           = (group) => {return path.join(___staticPath , 'tfWebApp' , 'symbols' , group || '');};
module.exports.ignoreSession        = true;
module.exports.archivePath          = 'archive';

module.exports.__Port_webSocket     =  4444;
module.exports.maxAgePayloadHistory = 31;  // Tage