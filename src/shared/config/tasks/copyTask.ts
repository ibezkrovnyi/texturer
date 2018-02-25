import { ProcessDataURI } from '../process/dataURI';
import { TaskFolder } from '../options/taskFolder';
import { GlobalConfig } from '../globalConfig';
import { FSHelper } from '../../utils/fsHelper';

let path = require("path");

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
    var folder = this.folder,
      fullFolder = path.join(globalConfig.folders.rootFolder, globalConfig.folders.fromFolder, folder);

    FSHelper.checkDirectoryExistsSync(fullFolder);

    var regex = globalConfig.excludeRegExPattern ? new RegExp(globalConfig.excludeRegExPattern, "gi") : null,
      filter = regex ? function (name: string) {
          regex!.lastIndex = 0;
          return regex!.test(name);
        } : null;

    var files = FSHelper.getFilesInFolder(fullFolder, filter, true).map(file => {
      return path.join(this.folder, file).replace(/\\/g, "/");
    });

    if (files.length <= 0) {
      throw "no files in fullfolder " + folder;
    }
    return files;
  };
}
