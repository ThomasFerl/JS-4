const { TFDateTime } = require('./nodeUtils.js');

// Testfall für die Funktion 'getDateTime'
var dt = new TFDateTime('2025-01-15 17:35:14');
console.log(dt.formatDateTime('dd.mm.yyyy hh:mn:ss'));




