import * as fs from 'fs-extra';
import * as path from 'path';
import { TextureMap } from '../containers/textureMap';
import { LoadedFile } from '../containers/loadedFile';
import { encodeFile } from './dataURI';
import { FSHelper } from './fsHelper';
import { workers } from '../../texturer/workers';
import { InternalConfig, InternalCopyTask } from '../../texturer/config';

export async function copyTaskRunner(config: InternalConfig, task: InternalCopyTask, loadedFiles: { [fileName: string]: LoadedFile }) {
  const promises = task.files.map(async (file: string) => {
    const fromFile = path.join(config.folders.rootFrom, file);
    const toFile = path.join(config.folders.rootToIndexHtml, file);
    const loadedFile = loadedFiles[file];

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

    const width = loadedFile.width;
    const height = loadedFile.height;

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
      // fs.link(fromFile, toFile, function (error) {
      await copyFile(fromFile, toFile);
    }
    return textureMap;
  });

  return Promise.all(promises);
}

async function copyFile(fromFile: string, toFile: string) {
  try {
    fs.ensureDirSync(path.dirname(toFile));

    // check if file exists
    if (fs.existsSync(toFile)) {
      // remove read-only and other attributes
      fs.chmodSync(toFile, '0777');

      // delete file
      fs.unlinkSync(toFile);
    }
  } catch (e) {
    // TODO: wrap to some util function, preserve original callstack
    throw new Error('COPY PREPARATION: ' + e.toString());
  }

  try {
    await workers.copyFileWorker({ source: fromFile, target: toFile });
  } catch (error) {
    // TODO: wrap to some util function, preserve original callstack
    throw new Error('' +
      'COPY: \n' +
      'src: ' + fromFile + '\n' +
      'dst: ' + toFile + '\n' +
      'error: ' + error,
    );
  }
}
