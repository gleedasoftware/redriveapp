
function testdaa() {
  ReDriveApp.setApiVersion(2);

  var file = ReDriveApp.createFile('testit2.txt', 'hello there', MimeType.PDF);
  

  var file = ReDriveApp.getFileById(file.getId());
  console.log(file.getName());
  var owner = file.getOwner();

  console.log(owner.getEmail())
  console.log(owner.getDomain())
  console.log(owner.getPhotoUrl())
  console.log(owner.getName())    
}