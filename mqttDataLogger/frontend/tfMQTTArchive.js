import * as utils from "./tfWebApp/utils.js";    



function buildTopicTree(topics, startAtLevel = 0) 
{
    const tree = []; // Root-Level ist ein Array
  
    topics.forEach(({ ID, topic }) => {
      const parts = topic.split("/"); // Zerlege das Topic
      let currentNodeArray = tree; // Start bei der Wurzel als Array
      let loop = 0;
  
      parts.forEach((part, index) => {
        loop++;
        if (loop >= startAtLevel) {
          // Prüfen, ob der Knoten bereits existiert
          let existingNode = currentNodeArray.find(node => node.caption === part);
  
          if (!existingNode) {
            // Neuen Knoten erstellen und pushen
            existingNode = {
              caption: part, // Der Name des Knotens
              dataContainer: null, // Platzhalter für Daten
              childNodes: [] // Leeres Array für Unterknoten
            };
            currentNodeArray.push(existingNode);
          }
  
          // Am letzten Knoten: Daten hinzufügen
          if (index === parts.length - 1) existingNode.dataContainer = {ID_topic:ID , topic:topic}; // Speichere die ID
          else                            existingNode.dataContainer = {ID_topic:0  , topic:''}; // Platzhalter für Daten
  
          // Gehe eine Ebene tiefer
          currentNodeArray = existingNode.childNodes;
        }
      });
    });
  
    return tree;
}

  

export function lsTopics( startAtLevel )
{
   if( startAtLevel==undefined ) startAtLevel = 0;

   var response = utils.webApiRequest('LSTOPICS' , {});
   if (response.error) return response;
   else                return {error:false, errMsg:'OK', result:buildTopicTree(response.result , startAtLevel )}; 
}



export function getValues( topic , from , to , aggr )
{
  var params = {};
    params.ID_topic = topic;
    if(from) params.from = from;
    if(to)   params.to   = to;
    if(aggr) params.aggr = aggr;

  
  
    return utils.webApiRequest('GETVALUES' , params );
}


export function lastpayload( ID_topic  )
{
  return utils.webApiRequest('LASTPAYLOAD' , { ID_topic:ID_topic}); 
}

export function count( ID_topic , fieldName )
{
  var params = {ID_topic:ID_topic, fieldName:fieldName};
   
  return utils.webApiRequest('COUNT' , params); 
}