function testReDriveApp() {
  var file;
  const fileName = 'Test ReDriveApp';
  const dataText = 'test test test';
  const existingGoogleDocId = '1WkMoywAyqJMPuMg8F3xgbUFuuY4ziH4UzgGs7vIvGGE';

  ReDriveApp.setApiVersion(2);
  
  var createfile = ReDriveApp.createFile(fileName, dataText, MimeType.PDF);
  var dt = new Date();
  var fileCreateTime = dt.getTime();

  file = ReDriveApp.getFileById(createfile.getId());
  if (file.getName() !== fileName) {
    console.log("ReDriveApp createFile error 1");
    return;
  }

  if ((file.getDateCreated().getTime() - fileCreateTime) > 1000) {
    console.log("ReFile getDateCreated error");
    return;
  }
  createfile.setTrashed(true);

  var blob = Maps.newStaticMap().setCenter('76 9th Avenue, New York NY').getBlob();
  blob.setName('testBlob.png')
  var fileFromBlob = ReDriveApp.createFile(blob);
  
  file = ReDriveApp.getFileById(fileFromBlob.getId());
  if (file.getName() !== 'testBlob.png') {
    console.log("ReDriveApp createFile error 2");
    return;
  }
  fileFromBlob.setTrashed(true);

  // test createFolder and copy file
  file = ReDriveApp.getFileById(existingGoogleDocId);
  var destFolder = ReDriveApp.createFolder('ReDriveApp Test Folder');
  var copy = file.makeCopy('new file name', destFolder);

  // test addViewer
  copy.addViewer('dave@edcode.org');

  var pdfExportBlob = copy.getAs('application/pdf');
  pdfExportBlob.setName('newly exported.pdf')
  createfile = ReDriveApp.createFile(pdfExportBlob);
  file = ReDriveApp.getFileById(createfile.getId());

  if ((file.getName() !== 'newly exported.pdf')
    && (file.getContentType !== 'application/pdf')) {
    console.log("ReFile getAs error");
    return;
  }

  file.setName(fileName);
  var file = ReDriveApp.getFileById(file.getId());
  if (file.getName() !== fileName) {
    console.log("ReFile setName error");
    return;
  }

  file.setDescription(dataText)
  var file = ReDriveApp.getFileById(file.getId());
  if (file.getDescription() !== dataText) {
    console.log("ReFile setDescription error");
    return;
  }

  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE);
  // once have method to get sharing status, write test for above calls to setSharing() and addViewer()
  
  createfile.setTrashed(true);
  copy.setTrashed(true);
  file.setTrashed(true);
  destFolder.setTrashed(true);

  console.log("ReDriveApp: All tests passed");

}