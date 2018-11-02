/**
 * @preserve
 *
 * Copyright (c) 2014-2015 Igor Bezkrovny
 * @license MIT
 *
 * LICENSE TEXT: {@link https://github.com/igor-bezkrovny/texturer/blob/master/LICENSE}
 */
///<reference path="../shared/types.d.ts" />
import * as path from 'path';
import { writeMeta } from '../shared/utils/meta';
import { TextureMap } from '../shared/containers/textureMap';
import { LoadedImage, LoadedFiles } from '../shared/containers/loadedFile';
import { Margins } from '../shared/containers/rect';
import { ImageHelper } from '../shared/utils/imageHelper';
import { runCopyTask } from '../shared/utils/copyTaskRunner';
import { runTextureMapTask } from '../shared/utils/textureMapTaskRunner';
import { workerFarmEnd } from './workers';
import { validateConfig, InternalConfig, InternalTrim } from './config';

const startTime = Date.now();

export class Texturer {
  private _callback!: (error?: string | Error | null) => void;
  private _config!: InternalConfig;
  // private _configParser!: GlobalConfig;
  private _loadedFilesCount!: number;
  private _totalFilesCount!: number;
  private _loadedFiles!: LoadedFiles;

  generate(config: Object, callback: (error?: string | Error | null) => void) {
    this._callback = callback;

    try {
      // this._configParser = new GlobalConfig(config);
      this._config = validateConfig(JSON.stringify(config));

      this._loadedFiles = {};

      this._loadedFilesCount = 0;
      this._totalFilesCount = 0;

      this._loadFiles();
    } catch (e) {
      callback(e);
    }
  }

  private _loadFiles() {
    this._config.copyTasks.forEach(copyTask => {
      this._totalFilesCount += copyTask.files.length;
    });

    this._config.textureMapTasks.forEach(textureMapTask => {
      this._totalFilesCount += textureMapTask.files.length;
    });

    this._config.copyTasks.forEach(copyTask => {
      this._loadFilesForTextureMap(copyTask.files);
    });

    this._config.textureMapTasks.forEach(textureMapTask => {
      this._loadFilesForTextureMap(textureMapTask.files, textureMapTask.trim);
    });
  }

  private _loadFilesForTextureMap(files: string[], trim1?: InternalTrim) {
    files.forEach(file => {
      ImageHelper.readImageFile(
        path.join(this._config.folders.rootFrom, file),
        (error: Error, instance: LoadedImage) => {
          if (error) {
            this._shutdown();
            this._callback(error);
          } else {
            const realWidth = instance.width;
            const realHeight = instance.height;
            let trim: Margins = { left: 0, right: 0, top: 0, bottom: 0 }; // TODO: why Rect explicit type was not removed by no-unnecessary-type-annotaations ?

            // trim image if it is part of sprite
            if (trim1 && trim1.enable) {
              const trimResult = ImageHelper.trimImage(instance, trim1.alpha);

              // new trimmed png instance and trim parameters
              instance = trimResult.png;
              trim = trimResult.trim;
            }
            this._loadedFiles[file] = {
              width: instance.width,
              height: instance.height,
              realWidth,
              realHeight,
              opaque: ImageHelper.isOpaque(instance),
              trim,
              bitmap: instance.data,
            };

            this._loadedFilesCount++;
            if (this._totalFilesCount === this._loadedFilesCount) {
              logMemory('files loaded: ' + this._totalFilesCount);
              this._generateTextureMaps();
            }
          }
        },
      );
    });
  }

  private async _generateTextureMaps() {
    const arrayOfTextureMapArrays = await Promise.all([
      ...this._config.copyTasks.map(task =>
        runCopyTask(task, this._loadedFiles, this._config),
      ),
      ...this._config.textureMapTasks.map(task =>
        runTextureMapTask(task, this._loadedFiles, this._config),
      ),
    ]);
    const textureMapArray = ([] as TextureMap[]).concat(
      ...arrayOfTextureMapArrays,
    );

    logMemory('build time: ' + (Date.now() - startTime) + ' ms');
    const duplicateFileNamesArray = writeMeta(
      this._config.folders.rootTo,
      this._config,
      this._loadedFiles,
      textureMapArray,
    );
    if (duplicateFileNamesArray.length > 0) {
      throw new Error(
        'Found duplicate file names:\n' + duplicateFileNamesArray.join('\n'),
      );
    }
    this._shutdown();
  }

  private _shutdown() {
    workerFarmEnd();
  }
}

const logMemoryUsage = process.memoryUsage();
function logMemory(title: string) {
  console.log(
    title +
      '\nheapUsed: ' +
      (process.memoryUsage().heapUsed -
        logMemoryUsage.heapUsed +
        ', heapTotal: ' +
        process.memoryUsage().heapTotal),
  );
}
