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



export function getValues( params )
{
   return utils.webApiRequest('MQTTGETVALUES' , params );
}



export function getLastValues( params )
{
   return utils.webApiRequest('MQTTGETLASTVALUES' , params );
}



export function lastpayload( ID_topic  )
{
  return utils.webApiRequest('MQTTLASTPAYLOAD' , { ID_topic:ID_topic}); 
}


// holt die Zeitreihe aus den Values des Payloads
export function lastpayloads( ID_topic , fieldNameValues , fieldNameTimestamp )
{
  return utils.webApiRequest('MQTTLASTPAYLOADS' , { ID_topic:ID_topic ,  fieldNameValues:fieldNameValues ,fieldNameTimestamp:fieldNameTimestamp }); 
}





export function count( ID_topic , fieldName , ID_Chanel)
{
  var params = {};
  if(ID_topic)  params.ID_topic  = ID_topic;
  if(fieldName) params.fieldName = fieldName;
  if(ID_Chanel) params.ID_Chanel = ID_Chanel;
   
  return utils.webApiRequest('MQTTCOUNT' , params); 
}