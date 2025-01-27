import * as utils from "./tfWebApp/utils.js";    



function ___buildTopicTree(topics , startAtLevel) 
{
  const tree = {}; // Wurzel des Baums
  var   loop = 0;
  if( startAtLevel==undefined ) startAtLevel = 0;
  
  topics.forEach(({ ID, topic }) => 
    {
      const parts = topic.split("/"); // Zerlege das Topic
      let currentNode = tree; // Start bei der Wurzel
      loop = 0;
      parts.forEach((part, index) => 
        {
          loop++;
          if(loop>=startAtLevel)
          {
          // Wenn der Knoten noch nicht existiert, füge ihn hinzu
          if (!currentNode[part]) {
              currentNode[part] = {};
          }
          currentNode = currentNode[part]; // Gehe eine Ebene tiefer
          
          // Füge die ID an den letzten Knoten der Hierarchie an
          if (index === parts.length - 1) {
              if (!currentNode._ids) {
                  currentNode._ids = []; // Initialisiere die ID-Liste
              }
              currentNode._ids.push(ID); // Füge die ID hinzu
          }
          }  
      });
  });
  
  return tree;
}



function buildTopicTree(topics, startAtLevel = 0) {
    const tree = {}; // Wurzel des Baums
  
    topics.forEach(({ ID, topic }) => {
      const parts = topic.split("/"); // Zerlege das Topic
      let currentNode = tree; // Start bei der Wurzel
      let loop = 0;
  
      parts.forEach((part, index) => {
        loop++;
        if (loop >= startAtLevel) {
          // Suche in den childNodes nach den aktuellen Knoten
          let child = currentNode[part];
  
          if (!child) {
            // Erstelle einen neuen Knoten, wenn er noch nicht existiert
            child = {
              caption: part, // Der Name des Knotens
              dataContainer: null, // Platzhalter für Daten
              childNodes: [] // Unterknoten als Array
            };
  
            currentNode[part] = child; // Füge ihn zur aktuellen Ebene hinzu
          }
  
          // Am letzten Knoten: Daten hinzufügen
          if (index === parts.length - 1) {
            child.dataContainer = ID; // Speichere die ID
          }
  
          // Gehe eine Ebene tiefer
          currentNode = child.childNodes;
        }
      });
    });
  
    // Konvertiere das Objekt in ein Array für den Root-Level
    return Object.values(tree);
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
  return utils.webApiRequest('GETVALUES' , {  ID_topic:topic,
                                              from    :from,
                                              to      :to,
                                              aggr    :aggr});
}
