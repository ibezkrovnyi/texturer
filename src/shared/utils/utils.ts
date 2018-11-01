import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export function getFileNameWithoutExtension(fileName: string) {
  fileName = path.basename(fileName);
  const index = fileName.lastIndexOf('.');
  return (index < 0) ? fileName : fileName.substr(0, index);
}

export function getExtension(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return (index < 0) ? '' : fileName.substr(index + 1);
}

export function getFilesInFolder(folder: string, filter: ((file: string) => boolean) | null, recursive: boolean, subFolder?: string) {
  const fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder);
  const folderFiles = fs.readdirSync(fullFolder);
  let files: string[] = [];

  folderFiles.forEach(function (file: string) {
    if (filter && filter(file)) {
      console.log(path.join(fullFolder, file) + ' removed by filter');
      return;
    }

    const stat = fs.statSync(path.join(fullFolder, file));
    const subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);

    if (stat.isFile()) {
      files.push(subFolderFileName);
    } else if (stat.isDirectory()) {
      if (recursive) {
        files = files.concat(getFilesInFolder(folder, filter, recursive, subFolderFileName));
      }
    }
  });

  return files.map(function (file) {
    return file.replace(/\\/g, '/');
  });
}

export function getFoldersInFolder(folder: string, filter: ((folder: string) => boolean) | null, recursive: boolean, subFolder: string) {
  const fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder);
  const folderFiles = fs.readdirSync(fullFolder);

  let folders: string[] = [];
  folderFiles.forEach(function (file: string) {
    if (filter && filter(file)) {
      console.log(path.join(fullFolder, file) + ' removed by filter');
      return;
    }

    const stat = fs.statSync(path.join(fullFolder, file));
    const subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);

    if (stat.isDirectory()) {
      folders.push(subFolderFileName);
      if (recursive) {
        folders = folders.concat(getFilesInFolder(folder, filter, recursive, subFolderFileName));
      }
    }
  });

  return folders.map(function (folder) {
    return folder.replace(/\\/g, '/');
  });
}

export function stableSort<T>(array: ReadonlyArray<T>, compare: (a: T, b: T) => number) {
  var sorted = Array.from(array);

  sorted.sort((a, b) => {
    const result = compare(a, b);
    return result === 0 ? array.indexOf(a) - array.indexOf(b) : result;
  });

  return sorted;
}

export function getShuffledArray<T>(array: ReadonlyArray<T>) {
  const shuffled = Array.from(array);
  for (let i = 0; i < shuffled.length - 1; i++) {
    const l = shuffled.length;
    const index = ((Math.random() * (l - i)) | 0) + i;

    const tmp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = tmp;
  }

  return shuffled;
}

export function getHash(data: any) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(JSON.stringify(data), 'binary' as any);
  return sha1.digest('hex');
}