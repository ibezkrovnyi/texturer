import * as fs from 'fs-extra';
import * as path from 'path';
import { Folders } from './options/folders';
import { CopyTask } from './tasks/copyTask';
import { TextureMapTask } from './tasks/textureMapTask';
import { TaskDefaults } from './tasks/taskDefaults';
import { FSHelper } from '../utils/fsHelper';
import { Templates } from './options/templates';
import { ExcludeRegExPattern } from './options/excludeRegExPattern';
import { TextureMapTasks } from './tasks/textureMapTasks';
import { CopyTasks } from './tasks/copyTasks';

export class GlobalConfig {
  folders: Folders;
  templates: string[];
  excludeRegExPattern: string | null;
  copyTasks: CopyTask[];
  textureMapTasks: TextureMapTask[];
  taskDefaults: TaskDefaults;

  constructor(config: any) {
    this.folders = new Folders(config);
    console.log('x1x', this.getFolderRootToIndexHtml());
    fs.ensureDirSync(this.getFolderRootToIndexHtml());

    this.templates = new Templates(config).getValue();
    this.excludeRegExPattern = new ExcludeRegExPattern(config).getValue();

    this.taskDefaults = new TaskDefaults(config);
    this.textureMapTasks = new TextureMapTasks(config, this).getValue();
    this.copyTasks = new CopyTasks(config, this).getValue();
  }

  getFolderRootFrom() {
    return path.join(this.folders.rootFolder, this.folders.fromFolder);
  }

  getFolderRootTo() {
    return path.join(this.folders.rootFolder, this.folders.toFolder);
  }

  getFolderRootToIndexHtml() {
    return path.join(this.folders.rootFolder, this.folders.toFolder, this.folders.indexHtmlFolder);
  }
}
