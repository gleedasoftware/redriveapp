/*
  ReDriveApp (short for "Recommended" or "Replacement" DriveApp)
  https://github.com/gleedasoftware/redriveapp

  Provides equivalent methods offered by the built-in DriveApp, but that only require use 
  of '/drive.file' OAuth scope (a "Recommended" OAuth scope). Requires use of Apps Script 
  Advanced Services (Drive) defined with identifier 'Drive' in your Apps Script manifest file.
  Created in preparation for new Google OAuth changes that will make full '/drive' scope a 
  'Restricted' scope. Using Restricted scopes on public apps will require an annual security review
  as part of Google's OAuth verification process.
  
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

////////////////////////////////////////// ReDriveApp //////////////////////////////////////////////

// Global DriveApiVersion_ must be set to 2 or 3 via ReDriveApp.setApiVersion() before anything
// else can be used. 
//
// !! For now only v2 is supported and tested !!
DriveApiVersion_ = null;

// Static class methods for ReDriveApp
// noinspection JSUnusedGlobalSymbols, ThisExpressionReferencesGlobalObjectJS
this['ReDriveApp'] = {
  // Add local alias to run the library as normal code\
  setApiVersion: setApiVersion,
  createFile: createFile,
  getFileById: getFileById,
  getFolderById: getFolderById,
  createFolder: createFolder,
  //getFoldersByName: getFoldersByName, // in progress
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
    throw new Error('ReDriveApp: Drive API version not set. ' + 
      'Please first call ReDriveApp.setApiVersion()');
  }
}

function getFileById(fileId) {
  checkDriveApiVersionIsSet_();

  var driveFilesResource = Drive.Files.get(fileId);

  return new ReFile_.Base({
    driveFilesResource: driveFilesResource, // 'Files' recourse from Drive API
  });
}

/* 
  Replicate 3 different calls to DriveApp.createFile():
    - DriveApp.createFile(blob) // 1 arg
    - DriveApp.createFile(name, content) // 2 args
    - DriveApp.createFile(name, content, mimeType) // 3 args
 */
const CREATE_FILE_SIG_BLOB = 1;
const CREATE_FILE_SIG_NC = 2;
const CREATE_FILE_SIG_NCM = 3;

function createFile(a1, a2, a3) {
  checkDriveApiVersionIsSet_();

  var signature;
  var newFile;

  if (a1 === undefined) {
    throw new Error("Invalid number or arguments to createFile()")
  } else if (a2 === undefined && a3 === undefined) {
    signature = CREATE_FILE_SIG_BLOB;
  } else if (a2 !== undefined && a3 === undefined) {
    signature = CREATE_FILE_SIG_NC;
  } else {
    signature = CREATE_FILE_SIG_NCM;
  }

  if (signature === CREATE_FILE_SIG_BLOB) {
    newFile = createFileFromBlob_(a1);
  } else if (signature === CREATE_FILE_SIG_NC ) {
    newFile = createFileFromContentAndMimetype_(a1, a2, 'text/plain');
  } else if (signature === CREATE_FILE_SIG_NCM ) {
    newFile = createFileFromContentAndMimetype_(a1, a2, a3);
  }

  return newFile;  
}

function createFileFromBlob_(blob) {

  if (DriveApiVersion_ === 3) {
    throw new Error('createFile() not yet supported by ReDriveApp for Drive API v3')
  } else {
    var newFile = {
      title: blob.getName(),
      mimeType: blob.getContentType()
    };
    
    var driveFilesResource = Drive.Files.insert(newFile, blob); 
    
    return new ReFile_.Base({
      driveFilesResource: driveFilesResource, // 'Files' recourse from Drive API
    });
  }
}

function createFileFromContentAndMimetype_(name, content, mimeType) {
  if (DriveApiVersion_ === 3) {
    throw new Error('createFile() not yet supported by ReDriveApp for Drive API v3')
  } else {
    var mimeTypeStr = mimeType.toString(); // convert from Apps Script MimeType enum

    var newFile = {
      title: name,
      mimeType: mimeTypeStr
    };

    var blob = Utilities.newBlob(content, mimeType);

    var driveFilesResource = Drive.Files.insert(newFile, blob);

    return new ReFile_.Base({
      driveFilesResource: driveFilesResource, // 'Files' recourse from Drive API
    });
  }
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
  - x File.getName
  - x File.getId
  - x File.getUrl
  - x File.getOwners
  - x File.getAs
  - x File.makeCopy
  - x File.getContentType
  - x File.getDateCreated().getTime()
  - x File.getLastUpdated().getTime()
  - x File.getSize
  - x File.setName
  - x File.setDescription

  - x File.addViewer
  - x File.setSharing
  - x File.setTrashed
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

reFileBaseClass_.getDateCreated = function getDateCreated() {
  if (DriveApiVersion_ === 2) {
    return new Date(this.base.driveFilesResource.createdDate);
  } else {
    return new Date(this.base.driveFilesResource.createdTime);
  }
}


reFileBaseClass_.getLastUpdated = function getLastUpdated() {
  if (DriveApiVersion_ === 2) {
    return new Date(this.base.driveFilesResource.modifiedDate);
  } else {
    return new Date(this.base.driveFilesResource.modifiedTime);
  }
}

reFileBaseClass_.getSize = function getSize() {
  if (DriveApiVersion_ === 2) {
    return this.base.driveFilesResource.fileSize;
  } else {
    return this.base.driveFilesResource.size;
  }
}

reFileBaseClass_.getId = function getId() {
  return this.base.driveFilesResource.id;
}

reFileBaseClass_.getDescription = function getDescription() {
  return this.base.driveFilesResource.description;
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

reFileBaseClass_.getContentType = function getContentType() {
  return this.base.driveFilesResource.mimeType;
}

reFileBaseClass_.getAs = function getAs(mimeType) {
  // should work the same for v2 and v3
  if (isConvertibleFileType_(this.getContentType())) {
    // Using HTTP endpoint rather than Drive.Files.export() b/c the latter seems to have 
    // a bug. It throws an error that alt=media must be specified (even though this is only
    // supposed to be used for Drive.Files.get() for non-Google file types). And if it is
    // provided, an exception is thrown. See: http://bit.ly/40r4V0z

    var url;
    if (DriveApiVersion_ === 2) {
      url = 'https://www.googleapis.com/drive/v2/files/'
        + this.base.driveFilesResource.id+"/export?mimeType="+ mimeType;
    } else {
      url = 'https://www.googleapis.com/drive/v3/files/'
        + this.base.driveFilesResource.id+"/export?mimeType="+ mimeType;
    }

    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('ReFile.getAs(): Drive API returned error ' + response.getResponseCode() 
        + ': ' + response.getContentText());
    }

    var blobContent = response.getContent();
    return Utilities.newBlob(blobContent, mimeType);

  } else {
    // Trying to convert from non Google file type (i.e. png --> jpg). Native DriveApp does
    // support this, but I'm not sure how as files.export() can only convert native Google 
    // Workspace types, and files.get() does not do conversions.
    // See: https://developers.google.com/drive/api/guides/manage-downloads
    throw new Error('ReFile.getAs() does not support non Google Workspace types: ' + mimeType);
  }

}

const MAKE_COPY_SIG_NO_ARGS = 1;
const MAKE_COPY_SIG_DEST = 2;
const MAKE_COPY_SIG_NAME = 3;
const MAKE_COPY_SIG_NAME_DEST = 4;

reFileBaseClass_.makeCopy = function makeCopy(a1, a2) {
  var signature;

  var file = ReDriveApp.getFileById(this.getId());

  if (a1 === undefined) {
    // non arguments
    signature = MAKE_COPY_SIG_NO_ARGS;
  } else if (a2 === undefined) {
    // 1 argumemt
    if (typeof a1 === 'string') {
      signature = MAKE_COPY_SIG_NAME;
    } else {
      signature = MAKE_COPY_SIG_DEST; // Folder
    }
  } else {
    signature = MAKE_COPY_SIG_NAME_DEST;
  }

  // defaults
  var name = this.getName();
  var parents = this.base.driveFilesResource.parents;
  
  if (signature === MAKE_COPY_SIG_NAME) {
    name = a1;
  } else if (signature === MAKE_COPY_SIG_DEST) {
    // single argument is of type ReDriveFolder
    if (DriveApiVersion_ === 2) {
      parents = [{"kind": "drive#parentReference", "id": a1.getId()}];
    } else {
      parents = [a1.getId()];
    }
  } else if (signature === MAKE_COPY_SIG_NAME_DEST) {
    name = a1;
    if (DriveApiVersion_ === 2) {
      parents = [{"kind": "drive#parentReference", "id": a2.getId()}];
    } else {
      parents = [a2.getId()];
    }
  }

  var newFile = {
    title: name,
    supportsAllDrives	: true,
    parents: parents
  };

  var copiedFile = Drive.Files.copy(newFile, this.getId());

  return new ReFile_.Base({
    driveFilesResource: copiedFile, // 'Files' recourse from Drive API
  });
}

reFileBaseClass_.setName = function setName(name) {
  var options = {};

  if (DriveApiVersion_ === 2) {
    options.title = name;
    this.base.driveFilesResource.title = name;
  } else {
    options.name = name;
    this.base.driveFilesResource.name = name;
  }

  Drive.Files.update(options, this.base.driveFilesResource.id);

  return this;
}

reFileBaseClass_.setDescription = function setDescription(description) {
  var options = {
    description: description
  };

  this.base.driveFilesResource.description = description;

  Drive.Files.update(options, this.base.driveFilesResource.id);

  return this;
}

reFileBaseClass_.setTrashed = function setTrashed(trashed) {

  if (DriveApiVersion_ === 2) {
    var options = {
      supportsAllDrives: true
    }

    if (trashed) {
      Drive.Files.trash(this.base.driveFilesResource.id, options);
    } else {
      Drive.Files.untrash(this.base.driveFilesResource.id, options);
    }
  } else {

    var updateFields = {
      trashed: trashed
    }
    var options = {
      supportsAllDrives: true
    }

    Drive.Files.update(updateFields, this.base.driveFilesResource.id, options);
  }

  return this;
}


reFileBaseClass_.addViewer = function addViewer(emailAddress) {
  
  var resource = {
    value: emailAddress,
    type: 'user',               
    role: 'reader'
  };

  if (DriveApiVersion_ === 2) {
    Drive.Permissions.insert(resource, this.base.driveFilesResource.id);
  } else {
    Drive.Permissions.create(resource, this.base.driveFilesResource.id);
  }

  return this;
}

reFileBaseClass_.setSharing = function setSharing(accessType, permissionType) {
  var type = 'user';
  var role = 'writer';

  var owner_email = Session.getEffectiveUser().getEmail();
  var domain = owner_email.split('@')[1];

  var permissions = {
    kind: 'drive#permission',
    type: type,
    role: role,
  }

  switch (accessType) {
    case DriveApp.Access.ANYONE:
      permissions.type = 'anyone';
      if (DriveApiVersion_ === 2) {
        permissions.withLink = false;
      } else {
        permissions.allowFileDiscovery = true;
      }
      break;
    case DriveApp.Access.ANYONE_WITH_LINK:
      permissions.type = 'anyone';
      if (DriveApiVersion_ === 2) {
        permissions.withLink = true;
      } else {
        permissions.allowFileDiscovery = false;
      }
      break;
    case DriveApp.Access.DOMAIN:
      permissions.type = 'domain';
      permissions.value = domain;
      if (DriveApiVersion_ === 2) {
        permissions.withLink = false;
      } else {
        permissions.allowFileDiscovery = true;
      }
      break;
    case DriveApp.Access.DOMAIN_WITH_LINK:
      if (DriveApiVersion_ === 2) {
        permissions.withLink = true;
      } else {
        permissions.allowFileDiscovery = false;
      }
      permissions.type = 'domain';
      permissions.value = domain;
      break;
    case DriveApp.Access.PRIVATE:
      permissions.type = 'user';
      permissions.value = owner_email;
      break;
  }

  switch (permissionType) {
    case DriveApp.Permission.VIEW:
      permissions.role = 'reader';
      break;
    case DriveApp.Permission.EDIT:
      permissions.role = 'writer';
      break;
    case DriveApp.Permission.COMMENT:
      if (DriveApiVersion_ === 2) {
        permissions.role = 'reader';
        permissions.additionalRoles = ['commenter'];
      } else {
        permissions.role = 'commenter'
      }
      break;
    case DriveApp.Permission.OWNER:
      permissions.role = 'owner';
      break;
    case DriveApp.Permission.ORGANIZER:
      // Google documentations says this is not supported and will throw an exception.
      throw new Error('Invalid permissionType DriveApp.Permission.ORGANIZER');
    case DriveApp.Permission.FILE_ORGANIZER:
      // Google documentations says this is not supported and will throw an exception.
      throw new Error('Invalid permissionType DriveApp.Permission.FILE_ORGANIZER')
    case DriveApp.Permission.NONE:
      if (accessType !== DriveApp.Access.ANYONE) {
        // Google documentations says this is not supported and will throw an exception
        // unless paired with DriveApp.Access.ANYONE.
        throw new Error('Invalid permissionType DriveApp.Permission.NONE');
      }
      break;

  }
  
  if (DriveApiVersion_ === 2) {
    Drive.Permissions.insert(permissions, this.base.driveFilesResource.id);
  } else {
    Drive.Permissions.create(permissions, this.base.driveFilesResource.id);
  }
  
  return this;
}



function isConvertibleFileType_(mimeType) {
  switch (mimeType) {
    case 'application/vnd.google-apps.document':
    case 'application/vnd.google-apps.drawing':
    case 'application/vnd.google-apps.presentation':
    case 'application/vnd.google-apps.spreadsheet':
      return true;
    default:
      return false;
  }

}

///////////////////////////////////// ReFolderIterator /////////////////////////////////////////////
// Define ReFolderIterator class. This is an equivalent to the 'FolderIterator' class returned by 
// methods like DriveApp.getFoldersByName()
// https://developers.google.com/apps-script/reference/drive/folder-iterator
//
var ReFolderIterator_ = {};
ReFolderIterator_.Base = function (base) {
  this.base = base;
};
var reFolderIteratorBaseClass_ = ReFolderIterator_.Base.prototype;

reFolderIteratorBaseClass_.getContinuationToken = function getContinuationToken() {
  
}

reFolderIteratorBaseClass_.hasNext = function hasNext() {
  
}

reFolderIteratorBaseClass_.next = function next() {
  
}

////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////// ReFolder /////////////////////////////////////////////////
// Define ReFolder class. This is an equivalent to the 'Folder' class returned by
// different DriveApp methods (i.e. getFolderById).
var ReFolder_ = {};
ReFolder_.Base = function (base) {
  this.base = base;
};
var reFolderBaseClass_ = ReFolder_.Base.prototype;

function getFolderById(folderId) {
  checkDriveApiVersionIsSet_();

  var reFile = ReDriveApp.getFileById(folderId);

  return new ReFolder_.Base({
    reFile: reFile
  });
}

function getFoldersByName(name) {
  // https://developers.google.com/drive/api/guides/search-files
  // need to define ReFolderIter 

  var options = {
    
  };
  var results = Drive.Files.list(options);
  return new ReFolderIterator_.Base({
    /*
    {
  "kind": "drive#fileList",
  "etag": etag,
  "selfLink": string,
  "nextPageToken": string,
  "nextLink": string,
  "incompleteSearch": boolean,
  "items": [
    files Resource
  ]
}
    */
  });

}

function createFolder(name) {
  checkDriveApiVersionIsSet_();
  if (DriveApiVersion_ === 3) {
    throw new Error('createFolder() not yet supported by ReDriveApp for Drive API v3')
  } else {
    var mimeTypeStr = 'application/vnd.google-apps.folder';

    var newFolder = {
      title: name,
      mimeType: mimeTypeStr
    };

    var driveFilesResource = Drive.Files.insert(newFolder);

    return new ReFile_.Base({
      driveFilesResource: driveFilesResource, // 'Files' recourse from Drive API
    });
  }
}

reFolderBaseClass_.getId = function getId() {
  return this.base.reFile.getId();
}

reFolderBaseClass_.getName = function getName() {
  return this.base.reFile.getName();
}

reFolderBaseClass_.setTrashed = function setTrashed(trashed) {
  return this.base.reFile.setTrashed(trashed);
}

reFolderBaseClass_.setSharing = function setSharing(accessType, permissionType) {
  return this.base.reFile.setSharing(accessType, permissionType);
}

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

