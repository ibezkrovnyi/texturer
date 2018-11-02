import * as fs from 'fs-extra';
import * as path from 'path';
import { TextureMap } from '../containers/textureMap';
import { LoadedFiles } from '../containers/loadedFile';
import { encodeFile } from './dataURI';
import { workers } from '../../texturer/workers';
import { InternalConfig, InternalCopyTask } from '../../texturer/config';

export async function runCopyTask(
  task: InternalCopyTask,
  loadedFiles: LoadedFiles,
  config: InternalConfig,
) {
  const promises = task.files.map(async file => {
    const fromFile = path.join(config.folders.rootFrom, file);
    const toFile = path.join(config.folders.rootToIndexHtml, file);

    // dataURI
    let dataURI: string | null = null;
    if (task.dataURI.enable) {
      dataURI = encodeFile(fromFile);
      if (task.dataURI.maxSize !== null) {
        if (dataURI.length >= task.dataURI.maxSize) {
          dataURI = null;
        }
      }
    }

    const { width, height } = loadedFiles[file];
    const textureMap: TextureMap = {
      file,
      width,
      height,
      dataURI,
      repeatX: false,
      repeatY: false,
      textures: {
        [file]: {
          x: 0,
          y: 0,
          width,
          height,
        },
      },
    };

    const skipFileWrite = dataURI && !task.dataURI.createImageFileAnyway;
    if (!skipFileWrite) {
      fs.ensureDirSync(path.dirname(toFile));
      fs.removeSync(toFile);
      await workers.copyFileWorker({ source: fromFile, target: toFile });
    }
    return textureMap;
  });

  return Promise.all(promises);
}
