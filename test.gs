/* 
  Test TODO:
    - test with Certify'em Dev
    - test with installed Certify'em Dec (test@ user) to ensure existing trigger, and existing selected template still work
    - test with published version
    - work through OAuths scope stuff and publishing
 */

// globals (needed for cleanup function)
file = null;
pdfFile = null;
txtFile = null;
mapFile = null;
copy = null;
destFolder = null;

function testReDriveApp() {
  const fileName = 'Test ReDriveApp';
  const folderName = "ReDriveApp's Test Folder";
  const dataText = 'test test test';

  // existingGoogleDocId: Only works if this file has first been opened by this script. In
  // absence of Drive Picker, this requires temporarily switching to full /auth/drive 
  // scope and opening this file. Needed to test .getAs()
  const existingGoogleDocId = '1WkMoywAyqJMPuMg8F3xgbUFuuY4ziH4UzgGs7vIvGGE';

  ReDriveApp.setApiVersion(2);

  var blob = Maps.newStaticMap().setCenter('76 9th Avenue, New York NY').getBlob();
  blob.setName('testBlob.png')
  mapFile = ReDriveApp.createFile(blob);
  
  mapFile = ReDriveApp.getFileById(mapFile.getId());
  if (mapFile.getName() !== 'testBlob.png') {
    console.log("ReDriveApp createFile error 1: file name: " + mapFile.getName());
    testCleanup();
    return;
  }

  var txtFile = ReDriveApp.createFile(fileName + ".txt", dataText, MimeType.PLAIN_TEXT);
  txtFile = ReDriveApp.getFileById(txtFile.getId());
  if (txtFile.getName() !== fileName + ".txt") {
    console.log("ReDriveApp createFile error 2: file name: " + txtFile.getName());
    testCleanup();
    return;
  }

  var pdfFile = ReDriveApp.createFile(fileName + ".pdf", dataText, MimeType.PDF);
  pdfFile = ReDriveApp.getFileById(pdfFile.getId());
  if (pdfFile.getName() !== fileName + ".pdf") {
    console.log("ReDriveApp createFile error 3: file name: " + pdfFile.getName());
    testCleanup();
    return;
  }

  var dt = new Date();
  var fileCreateTime = dt.getTime();
  if ((pdfFile.getDateCreated().getTime() - fileCreateTime) > 1000) {
    console.log("ReFile getDateCreated error");
    testCleanup();
    return;
  }
  
  // test createFolder and copy file
  file = ReDriveApp.getFileById(existingGoogleDocId);
  destFolder = ReDriveApp.createFolder(folderName);

  var matchingFolders = ReDriveApp.getFoldersByName(folderName);
  if (!matchingFolders.hasNext()) {
    console.log("Failed to find created folder");
    testCleanup();
    return;
  } else {
    destFolder = matchingFolders.next();
  }

  copy = file.makeCopy('new file name', destFolder);

  // test addViewer
  copy.addViewer('dave@edcode.org');

  var pdfExportBlob = copy.getAs('application/pdf');
  pdfExportBlob.setName('newly exported.pdf')
  createfile = ReDriveApp.createFile(pdfExportBlob);
  file = ReDriveApp.getFileById(createfile.getId());

  if ((file.getName() !== 'newly exported.pdf')
    && (file.getContentType !== 'application/pdf')) {
    console.log("ReFile getAs error");
    testCleanup();
    return;
  }

  file.setName(fileName);
  var file = ReDriveApp.getFileById(file.getId());
  if (file.getName() !== fileName) {
    console.log("ReFile setName error");
    testCleanup();
    return;
  }

  file.setDescription(dataText)
  var file = ReDriveApp.getFileById(file.getId());
  if (file.getDescription() !== dataText) {
    console.log("ReFile setDescription error");
    testCleanup();
    return;
  }

  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE);
  // once have method to get sharing status, write test for above calls to setSharing() and addViewer()
  
  testCleanup();

  /*
  pdfFile.setTrashed(true);
  txtFile.setTrashed(true);
  mapFile.setTrashed(true);

  createfile.setTrashed(true);
  copy.setTrashed(true);
  file.setTrashed(true);
  destFolder.setTrashed(true);
  */

  console.log("ReDriveApp: All tests passed");
}

function testCleanup() {
  if (pdfFile) {
    pdfFile.setTrashed(true);
  }

  if (txtFile) {
    txtFile.setTrashed(true);
  }

  if (mapFile) {
    mapFile.setTrashed(true);
  }

  if (createfile) {
    createfile.setTrashed(true);
  }

  if (copy) {
    copy.setTrashed(true);
  }

  if (file) {
    file.setTrashed(true);
  }

  if (destFolder) {
    destFolder.setTrashed(true);
  }  
}