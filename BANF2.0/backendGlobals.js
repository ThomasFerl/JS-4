const path          = require('path');

var   ___staticPath = '';

module.exports.staticPath           = (pathName) => {if(pathName) ___staticPath = pathName; return ___staticPath;};
module.exports.symbolPath           = (grp) => {
                                                 var p = path.join(___staticPath , 'tfWebApp' , 'symbols');
                                                 if(grp) return  path.join( p , grp);
                                                 else    return p;
                                            };
module.exports.ignoreSession        = true;

module.exports.__Port_webSocket     =  4444;
module.exports.maxAgePayloadHistory =  365;  // 1 Jahr