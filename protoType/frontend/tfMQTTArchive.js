import * as utils from "./tfWebApp/utils.js";    



function buildTopicTree(topics) {
  const tree = {}; // Wurzel des Baums
  
  topics.forEach(({ ID, topic }) => {
      const parts = topic.split("/"); // Zerlege das Topic
      let currentNode = tree; // Start bei der Wurzel
      
      parts.forEach((part, index) => {
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
      });
  });
  
  return tree;
}


export function lsTopics( topic , from , to , aggr )
{
   var response = utils.webApiRequest('LSTOPICS' , {});
   if (response.error) return response;
   else                return {error:false, errMsg:'OK', result:buildTopicTree(response.result)}; 
}



export function getValues( topic , from , to , aggr )
{
  return utils.webApiRequest('GETVALUES' , {  ID_topic:topic,
                                              from    :from,
                                              to      :to,
                                              aggr    :aggr});
}
