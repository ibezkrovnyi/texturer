var fs = require("fs"),
  path = require("path");

export class FSHelper {
  static getFileNameWithoutExtension(fileName: string) {
    fileName = path.basename(fileName);
    var index = fileName.lastIndexOf('.');
    return (index < 0) ? fileName : fileName.substr(0, index);
  }

  static getExtension(fileName: string) {
    var index = fileName.lastIndexOf('.');
    return (index < 0) ? '' : fileName.substr(index + 1);
  }

  static createDirectory(dir: string) {
    var folders = path.normalize(dir).replace(/\\/g, "/").split("/");

    if (folders && folders.length > 0) {
      for (var i = 0; i < folders.length; i++) {
        var testDir = folders.slice(0, i + 1).join("/");
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir);
        }
      }
    }
  }

  static checkDirectoryExistsSync(dir: string) {
    // check that folder exists
    if (!fs.existsSync(dir)) {
      throw new Error("FS: Folder doesn't exist: " + dir);
    } else if (!fs.statSync(dir).isDirectory()) {
      throw new Error("FS: " + dir + " is not a folder");
    }
  }

  static getFilesInFolder(folder: string, filter: ((file: string) => boolean) | null, recursive: boolean, subFolder?: string) {
    var fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder),
      folderFiles = fs.readdirSync(fullFolder),
      files: string[] = [];

    folderFiles.forEach(function (file: string) {
      if (filter && filter(file)) {
        console.log(path.join(fullFolder, file) + " removed by filter");
        return;
      }

      var stat = fs.statSync(path.join(fullFolder, file)),
        subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);

      if (stat.isFile()) {
        files.push(subFolderFileName);
      } else if (stat.isDirectory()) {
        if (recursive) {
          files = files.concat(FSHelper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
        }
      }
    });

    return files.map(function (file) {
      return file.replace(/\\/g, "/");
    });
  }

  static getFoldersInFolder(folder: string, filter: ((file: string) => boolean) | null, recursive: boolean, subFolder: string) {
    var fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder),
      folderFiles = fs.readdirSync(fullFolder),
      folders: string[] = [];

    folderFiles.forEach(function (file: string) {
      if (filter && filter(file)) {
        console.log(path.join(fullFolder, file) + " removed by filter");
        return;
      }

      var stat = fs.statSync(path.join(fullFolder, file)),
        subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);

      if (stat.isDirectory()) {
        folders.push(subFolderFileName);
        if (recursive) {
          folders = folders.concat(FSHelper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
        }
      }
    });

    return folders.map(function (folder) {
      return folder.replace(/\\/g, "/");
    });
  }
}
