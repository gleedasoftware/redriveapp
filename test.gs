
function testdaa() {
  ReDriveApp.setApiVersion(2);

  //var fid = '1zP1o3Yk-zkrShCdyH7tjnZIhp7-bz6tXg5DKEoZ1ry4'; // google doc
  var fid = '15XjiNCxSFlOoOhmKHdCo2uEa5UAPg4cd'; // pdf

  var file = ReDriveApp.getFileById(fid);
  var owner = file.getOwner();

  console.log(owner.getEmail())
  console.log(owner.getDomain())
  console.log(owner.getPhotoUrl())
  console.log(owner.getName())      
}