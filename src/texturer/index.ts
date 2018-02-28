/**
 * @preserve
 *
 * Copyright (c) 2014-2015 Igor Bezkrovny
 * @license MIT
 *
 * LICENSE TEXT: {@link https://github.com/igor-bezkrovny/texturer/blob/master/LICENSE}
 */
///<reference path="../shared/types.d.ts" />
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import workerFarm from 'worker-farm';
import { TextureMap } from '../shared/containers/textureMap';
import { LoadedFile } from '../shared/containers/loadedFile';
import { Rect } from '../shared/containers/rect';
import { TexturePoolWriter } from '../shared/utils/texturePoolWriter';
import { ImageHelper } from '../shared/utils/imageHelper';
import { CopyTaskRunner } from '../shared/utils/copyTaskRunner';
import { TextureMapTaskRunner } from '../shared/utils/textureMapTaskRunner';
import { workers } from './workers';
import { validateConfig, InternalConfig, Trim, InternalTrim, InternalCopyTask, InternalTextureMapTask } from './config';

const startTime = Date.now();

export class Texturer {
  private _callback!: (error?: string | Error | null) => void;
  private _config!: InternalConfig;
  // private _configParser!: GlobalConfig;
  private _loadedFilesCount!: number;
  private _totalFilesCount!: number;
  private _totalTexturMapsRequiredCount: any;
  private _loadedFiles!: { [fileName: string]: LoadedFile };
  private _textureMapArray!: TextureMap[];

  generate(config: Object, callback: (error?: string | Error | null) => void) {
    this._callback = callback;

    try {
      // this._configParser = new GlobalConfig(config);
      this._config = validateConfig(JSON.stringify(config));
      this._textureMapArray = [];

      this._loadedFiles = {};

      this._loadedFilesCount = 0;
      this._totalFilesCount = 0;
      this._totalTexturMapsRequiredCount = 0;

      this._loadFiles();
    } catch (e) {
      this._shutdown(e);
    }
  }

  private _loadFiles() {
    this._config.copyTasks.forEach(copyTask => {
      this._totalFilesCount += copyTask.files.length;
      this._totalTexturMapsRequiredCount += copyTask.files.length;
    });

    this._config.textureMapTasks.forEach(textureMapTask => {
      this._totalFilesCount += textureMapTask.files.length;
      this._totalTexturMapsRequiredCount++;
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
      ImageHelper.readImageFile(path.join(this._config.folders.rootFrom, file), (error: Error, instance: { width: number; height: number; data: number[]; }) => {
        if (error) {
          this._shutdown(error);
        } else {
          const realWidth = instance.width;
          const realHeight = instance.height;
          let trim: Rect = { left: 0, right: 0, top: 0, bottom: 0 }; // TODO: why Rect explicit type was not removed by no-unnecessary-type-annotaations ?

          // trim image if it is part of sprite
          if (trim1 && trim1.enable) {
            const trimResult = ImageHelper.trimImage(instance, trim1.alpha);

            // new trimmed png instance and trim parameters
            instance = trimResult.png;
            trim = trimResult.trim;
          }
          this._loadedFiles[file] = new LoadedFile(instance.width, instance.height, realWidth, realHeight, ImageHelper.isOpaque(instance), trim, instance.data);

          this._loadedFilesCount++;
          if (this._totalFilesCount === this._loadedFilesCount) {
            logMemory('files loaded: ' + this._totalFilesCount);
            this._generateTextureMaps();
          }
        }
      });
    });
  }

  private _generateTextureMaps() {
    this._config.copyTasks.forEach(this._runCopyTask, this);
    this._config.textureMapTasks.forEach(this._runTextureMapTask, this);
  }

  private _runCopyTask(copyTask: InternalCopyTask) {
    const runner = new CopyTaskRunner(this._config, copyTask, this._loadedFiles, (error, textureMaps: TextureMap[]) => {
      if (error) {
        this._shutdown(error);
      } else {
        this._onTextureMapGenerated(textureMaps);
      }
    });
    runner.run();
  }

  private _runTextureMapTask(textureMapTask: InternalTextureMapTask) {
    const runner = new TextureMapTaskRunner(this._config, textureMapTask, this._loadedFiles, (error: any, textureMap: any) => {
      if (error) {
        this._shutdown(error);
      } else {
        this._onTextureMapGenerated([textureMap]);
      }
    });
    runner.run();
  }

  private _onTextureMapGenerated(textureMaps: TextureMap[]) {
    for (const textureMap of textureMaps) {
      this._textureMapArray.push(textureMap);
    }

    if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
      logMemory('build time: ' + (Date.now() - startTime) + ' ms');
      const duplicateFileNamesArray = new TexturePoolWriter().writeTexturePoolFile(this._config.folders.rootTo, this._config, this._loadedFiles, this._textureMapArray);
      this._shutdown(duplicateFileNamesArray.length > 0 ? new Error('Found duplicate file names:\n' + duplicateFileNamesArray.join('\n')) : null);
    }
  }

  private _shutdown(error: string | Error | null) {
    workerFarm.end(workers as any);
    if (error) {
      this._callback(error);
    } else {
      this._callback(null);
    }
  }
}

const logMemoryUsage = process.memoryUsage();
function logMemory(title: string) {
  console.log(title + '\nheapUsed: ' + (process.memoryUsage().heapUsed - logMemoryUsage.heapUsed + ', heapTotal: ' + process.memoryUsage().heapTotal));
}
