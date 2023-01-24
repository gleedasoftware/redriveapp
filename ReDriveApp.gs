/*
  ReDriveApp (short for "Recommended" or "Replacement" DriveApp)
  https://github.com/gleedasoftware/redriveapp

  Provides equivalent methods to the built-in DriveApp, but that only require use of '/drive.file'
  OAuth scope (a "Recommended" OAuth scope). Requires use of Apps Script Advanced Services (Drive)
  defined as with identifier 'Drive' in your Apps Script manifest file. Created in preparation for
  new Google OAuth changes that will make full '/drive' scope a 'Restricted' scope. Using Restricted
  scopes on public apps will require a yearly security review as part of Google's OAuth
  verification process.
  
  Also replaces built-in, related Apps Script classes with equivalents:
    File             --> ReFile
    Folder           --> ReFolder
    User             --> ReUser
    FileIterator     --> ReFileIterator
    FolderIterator   --> ReFolderIterator
    

  Copyright (c) 2023 - Dave Abouav and Gleeda Software LLC (gleeda.net)
  
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except 
  in compliance with the License. You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software distributed under the License
  is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express 
  or implied. See the License for the specific language governing permissions and limitations under 
  the License.
*/

function testdaa()
{
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

////////////////////////////////////////// ReDriveApp //////////////////////////////////////////////

// Global DriveApiVersion_ must be set to 2 or 3 via ReDriveApp.setApiVersion() before anything
// else can be used. 
// !! For now only v2 is supported and tested !!
DriveApiVersion_ = null;

// Static class methods for ReDriveApp
// noinspection JSUnusedGlobalSymbols, ThisExpressionReferencesGlobalObjectJS
this['ReDriveApp'] = {
  // Add local alias to run the library as normal code\
  setApiVersion: setApiVersion,
  //createFile: createFile,
  getFileById: getFileById,
  //getRootFolder: getRootFolder,
  //getFoldersByName: getFoldersByName, // define ReFolderIter (and ReFileIter) ?
  //createFolder: createFolder   
};

function setApiVersion(versionNumber) {
  if (versionNumber == 2 || versionNumber == 3) {
    DriveApiVersion_ = versionNumber;
    return;
  }

  throw new Error('ReDriveApp: Unsupported Drive API version: ' + versionNumber);
}

function checkDriveApiVersionIsSet_() {
  if (!DriveApiVersion_) {
    throw new Error('ReDriveApp: Drive API version not set. Please first call ReDriveApp.setApiVersion()');
  }
}

function getFileById(fileId) {
  checkDriveApiVersionIsSet_();

  var driveFilesResource = Drive.Files.get(fileId);

  return new ReFile_.Base({
    fileId: fileId,
    driveFilesResource: driveFilesResource, // 'Files' recourse from Drive API
  });
}

////////////////////////////////////////// ReFile //////////////////////////////////////////////////
// Define ReFile class. This is an equivalent to the 'File' class returned by different DriveApp 
// methods (i.e. getFileById).
var ReFile_ = {};
ReFile_.Base = function (base) {
  this.base = base;
};
var reFileBaseClass_ = ReFile_.Base.prototype;


/*
  List of File functionality to replicate:
  - File.getName
  - File.getId
  - File.getUrl
  - File.getOwners()[0].getEmail()
  - File.getAs
  - File.getDateCreated().getTime()
  - File.getLastUpdated().getTime()
  - File.getContentType
  - File.getBytes
  - File.setName
  - File.setSharing
  - File.setDescription
  - File.setTrashed
  - File.makeCopy
  - File.addViewer
*/

// See:
//   v2: https://developers.google.com/drive/api/v2/reference/files
//   v3: https://developers.google.com/drive/api/v3/reference/files

reFileBaseClass_.getName = function getName() {
  if (DriveApiVersion_ === 2) {
    return this.base.driveFilesResource.title;
  } else {
    return this.base.driveFilesResource.name;
  }
}

reFileBaseClass_.getId = function getId() {
  return this.base.driveFilesResource.id;
}

reFileBaseClass_.getUrl = function getUrl() {
  if (DriveApiVersion_ === 2) {
    return this.base.driveFilesResource.alternateLink;
  } else {
    return this.base.driveFilesResource.webViewLink;
  }
}

reFileBaseClass_.getOwner = function getOwner() {
  var owner = this.base.driveFilesResource.owners[0];

  var photoUrl;

  if (DriveApiVersion_ === 2) {
    photoUrl = owner.picture.url;
  } else {
    photoUrl = owner.photoLink;
  }

  var domain = owner.emailAddress.split('@')[1];

  return new ReUser_.Base({
    name: owner.displayName,
    email: owner.emailAddress,
    domain: domain, // not present in File object of Drive API 
    photoUrl: photoUrl
  });
}

// daa todo: pick up with getAs()

///////////////////////////////////////// ReFolder /////////////////////////////////////////////////
// Define ReFolder class. This is an equivalent to the 'Folder' class returned by
// different DriveApp methods (i.e. getFolderById).
var ReFolder_ = {};
ReFolder_.Base = function (base) {
  this.base = base;
};
var reFolderBaseClass_ = ReFolder_.Base.prototype;


////////////////////////////////////////// ReUser //////////////////////////////////////////////////
// Define ReUser class. This is an equivalent to the 'User' class returned by
// different DriveApp methods (i.e. File.getOwner)
var ReUser_ = {};
ReUser_.Base = function (base) {
  this.base = base;
};
var reUserBaseClass_ = ReUser_.Base.prototype;


reUserBaseClass_.getName = function getName() {
  return this.base.name;
}

reUserBaseClass_.getEmail = function getEmail() {
  return this.base.email;
}

reUserBaseClass_.getPhotoUrl = function getPhotoUrl() {
  return this.base.photoUrl;
}

reUserBaseClass_.getDomain = function getDomain() {
  return this.base.domain;
}
