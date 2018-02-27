import * as path from 'path';
import { ProcessDataURI } from '../process/dataURI';
import { TaskFolder } from '../options/taskFolder';
import { GlobalConfig } from '../globalConfig';
import { FSHelper } from '../../utils/fsHelper';

export class CopyTask {
  folder: string;
  files: string[];
  dataURI: ProcessDataURI;

  constructor(taskObject: Object, globalConfig: GlobalConfig) {
    this.folder = new TaskFolder(taskObject).getValue();
    this.dataURI = new ProcessDataURI(taskObject, globalConfig.taskDefaults.dataURI);
    this.files = this._getFiles(globalConfig);
  }

  private _getFiles(globalConfig: GlobalConfig) {
    const folder = this.folder;
    const fullFolder = path.join(globalConfig.folders.rootFolder, globalConfig.folders.fromFolder, folder);

    FSHelper.checkDirectoryExistsSync(fullFolder);

    let filter = null;
    if (globalConfig.excludeRegExPattern) {
      const regex = new RegExp(globalConfig.excludeRegExPattern, 'gi');
      filter = function (name: string) {
        regex.lastIndex = 0;
        return regex.test(name);
      };
    }

    const files = FSHelper.getFilesInFolder(fullFolder, filter, true).map(file => {
      return path.join(this.folder, file).replace(/\\/g, '/');
    });

    if (files.length <= 0) {
      throw new Error('no files in fullfolder ' + folder);
    }
    return files;
  }
}
