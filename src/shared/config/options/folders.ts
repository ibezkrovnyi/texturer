import { BaseOption } from '../baseOption';

class FolderRoot extends BaseOption<string> {
  getValue() {
    return process.cwd();
  }
}

class FolderFrom extends BaseOption<string> {
  getValue() {
    return this._getPropertyValue('source');
  }
}

class FolderTo extends BaseOption<string> {
  getValue() {
    return this._getPropertyValue('target');
  }
}

class FolderIndexHtml extends BaseOption<string> {
  getValue() {
    return this._getPropertyValue('images(index.html)');
  }
}

export class Folders {
  rootFolder: string;
  fromFolder: string;
  toFolder: string;
  indexHtmlFolder: string;

  constructor(configObject: { folders: any }) {
    const foldersObject = configObject.folders;
    this.rootFolder = new FolderRoot(foldersObject).getValue();
    this.fromFolder = new FolderFrom(foldersObject).getValue();
    this.toFolder = new FolderTo(foldersObject).getValue();
    this.indexHtmlFolder = new FolderIndexHtml(foldersObject).getValue();
  }
}
