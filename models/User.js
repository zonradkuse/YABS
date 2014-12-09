/*! The User Model
* @param {String} pName The useres name as it is visible for the system.
* @param {String[]} pAccess This holds the access rights.
*/
var name;
var pAccess;
var id;

exports = function(pName, pAccess, pID){
  this.name = pName;
  this.access = pAccess; 
  this.id = pID;
}