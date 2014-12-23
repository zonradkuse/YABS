/** The User Model
* @param {String} pName The useres name as it is visible for the system.
* @param {String[]} pAccess This holds the access rights.
*/

function User(pName, pAccess, pID, pApi){
  this.name = pName;
  this.access = pAccess; 
  this.id = pID;
  this.l2pAPIKey = pApi;
}

module.exports = User;