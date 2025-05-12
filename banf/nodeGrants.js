const utils        = require('./nodeUtils');
const dbUtils      = require('./dbUtils');


var allGrants      = [];


module.exports.lsGrants = ( db ) =>
{
  var response = dbUtils.fetchRecords_from_Query( db , 'select * from grantObj' );
  console.log("lsGrants: " + JSON.stringify(response));
  allGrants = [];
  if (!response.error) 
  for(var i=0; i<response.result.length; i++) 
  {
    var g = response.result[i];
    console.log("grantObj["+i+"] : "+JSON.stringify(g));  
    allGrants.push( g.name.toUpperCase() );
  }  

  return response;
}


module.exports.isGrantObj = ( grantName ) =>
{
  //console.log("is "+grantName+" in ["+allGrants.join(' , '));
  return (allGrants.indexOf( grantName.toUpperCase()) > -1 )
}



module.exports.addGrant = ( db , grant ) =>
{
  // ist frant bereits eine ID ?
  if(!isNaN(grant)) return {error:false, errMsg:"alredy ID", result:grant }
  var response = this.idGrant( db , grant.name );
    
  if(!response.error)
  {
    if(response.result!="")
    { 
      return response;
    }  
  }
  
  response = dbUtils.insertIntoTable( db , 'grantObj' , {name:grant.name,caption:grant.captiontName,kind:grant.kind} );

  if(response.error) return response;

  response.result = response.result.lastInsertRowid;

  this.lsGrants( db );
 
  return response;
}


module.exports.editGrant = ( db , grant ) =>
  {
    
    return dbUtils.updateTable( db , 'grantObj' , 'ID' , grant.ID , {name:grant.name,caption:grant.caption,kind:grant.kind} );
  
  }




module.exports.idGrant = ( db , grantName ) =>
{
  console.log("idGrant(grantName:"+grantName+") ");
  if(!isNaN(grantName)) return {error:false, errMsg:"alredy ID", result:grantName }  

  var response = dbUtils.fetchValue_from_Query( db , "select ID from grantObj Where name='"+grantName+"'" );
  console.log("Result => " + JSON.stringify(response));
  return response;
}


module.exports.idUser = ( db , userName ) =>
{
  if(!isNaN(userName)) return {error:false, errMsg:"alredy ID", result:userName }

  var response = dbUtils.fetchValue_from_Query( db , "select ID from user Where username='"+userName+"'" );
  console.log("idUser(userName:"+userName+") -> " + JSON.stringify(response));
  return response;
}


module.exports.resetUserGrant = ( db , userName ) =>
{
  if(isNaN(userName)) var response = dbUtils.runSQL( db , "Delete from userGrants Where ID_user in (select ID from user Where username='"+userName+"'");
  else                var response = dbUtils.runSQL( db , "Delete from userGrants Where ID_user = "+userName );           
  
  return response;
}


module.exports.addUserGrant = ( db , userName , grantName  ) =>
{
  var response = this.idGrant( db , grantName );
  if (response.error) return response;
  var idGrant = response.result;
 
  response    = this.idUser( db , userName);
  if (response.error) return response;
  var idUser  = response.result;

  return dbUtils.insertIntoTable( db , 'userGrants'  , {ID_user:idUser , ID_grant:idGrant} )
}


module.exports.setUserGrants = ( db , params ) =>
{
  var errResponse = [];
  console.log("setUserGrants("+JSON.stringify(params));

  this.resetUserGrant( db , params.ID_user );
  
  for(var i=0; i<params.grants.length; i++)
  {
    var grant    = params.grants[i];
    if(grant.access)
    {
      var response = this.addUserGrant( db , params.ID_user , grant.ID );
      if (response.error)
      {
        errResponse.push("Error: "+response.errMsg);
        console.log("Error: "+response.errMsg);
      }
      else
         {
            console.log("User "+params.ID_user+" granted "+response.grant.ID);
      }
    }  
  }

  if(errResponse.length>0) return {error:true,errMsg:errResponse.join(" / "),result:0}
  else                     return {error:false,errMsg:"OK",result:0}
   
}


module.exports.getUserGrants = ( db , userName) =>
{
  var idUser = 0;
  // ist userName eine ID ?
  if(!isNaN(userName)) idUser = userName;
  else
  {
    // ist userName ein Name ?
    var response = this.idUser( db , userName);
    if (response.error) return response;
    idUser = response.result;
  }
  
  response = dbUtils.fetchRecords_from_Query( db ,"Select g.ID,g.name,g.caption,g.kind,(select count(*) from userGrants where ID_grant=g.ID and ID_user="+idUser+") as access from grantObj g order by g.ID");
  if (response.error) return response;

  // aus 0, 1, 2... true oder false machen
  for(var i=0; i<response.result.length; i++) response.result[i].access=(response.result[i].access>0) 

  return response;
  
}
