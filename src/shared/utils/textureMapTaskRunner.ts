import * as crypto from 'crypto';
import * as path from 'path';
import { LoadedFile } from '../containers/loadedFile';
import { TextureMapGenerator } from '../../texturer/textureMapGenerator';
import { FileDimensions, Texture, TextureMap } from '../containers/textureMap';
import { encodeBuffer } from './dataURI';
import { workers } from '../../texturer/workers';
import { InternalConfig, InternalTextureMapTask } from '../../texturer/config';

interface Callback {
  (error: string | Error | null, result: null): void;
  (error: null, result: TextureMap | null): void;
}

// TODO: refactor
export class TextureMapTaskRunner {
  private _textureMapTask: InternalTextureMapTask;
  private _loadedFiles: { [fileName: string]: LoadedFile };
  private _callback: Callback;
  private _globalConfig: InternalConfig;

  constructor(globalConfig: InternalConfig, textureMapTask: InternalTextureMapTask, loadedFiles: { [fileName: string]: LoadedFile }, callback: Callback) {
    this._globalConfig = globalConfig;
    this._textureMapTask = textureMapTask;
    this._loadedFiles = loadedFiles;
    this._callback = callback;
  }

  run() {
    const textureMapGenerator = new TextureMapGenerator();
    textureMapGenerator.generateTextureMap(this._loadedFiles, this._textureMapTask, (error: string, textureMap: TextureMap) => {
      if (textureMap) {
        this._compressTextureMapImage(textureMap);
      } else {
        // TODO: do texture map size configurable!!
        this._callback(new Error('Texture Generator: Can\'t pack texture map for folder \'' + this._textureMapTask.folder + '\' - too large art. Split images into 2 or more folders!'), null);
      }
    });
  }

  private _compressTextureMapImage(textureMap: TextureMap) {
    console.log(this._textureMapTask.textureMapFile + ': w = ' + textureMap.width + ', h = ' + textureMap.height + ', area = ' + (textureMap.width * textureMap.height));

    // TODO: what type here?
    const textureArray: any[] = [];
    Object.keys(textureMap.textures).forEach(id => {
      const loadedFile = this._loadedFiles[id];
      const texture = textureMap.textures[id];

      textureArray.push({
        ...texture,
        realWidth: loadedFile.realWidth,
        realHeight: loadedFile.realHeight,
        bitmapSerialized: loadedFile.bitmap,
      });
    });

    const filterTypes = [0, 1, 2, 3, 4];
    let bestCompressedImage: Buffer | null = null;
    let filterCount = 0;

    for (let i = 0; i < filterTypes.length; i++) {

      const data = {
        // TODO: integrate with new compress object properties
        textureArray,
        options: this._textureMapTask.compression,
        filterType: filterTypes[i],
        width: textureMap.width,
        height: textureMap.height,
      };

      workers.compressImageWorker(data, (error: string, result: any) => {
        if (error) {
          // console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount} - finished with error`);
          this._callback(new Error(error), null);
        } else {
          // console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount + 1}/${filterTypes.length} - finished OK`);

          // check if better compressed
          const compressedImage = new Buffer(result.compressedPNG);
          if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
            bestCompressedImage = compressedImage;
          }

          // check if finished
          filterCount++;
          if (filterCount === filterTypes.length) {
            this._onTextureMapImageCompressed(textureMap, bestCompressedImage);
          }
        }
      });
    }
  }

  private _onTextureMapImageCompressed(textureMapImage: TextureMap, compressedImage: Buffer) {
    if (this._textureMapTask.compression.tinyPNG) {
      workers.tinyPngWorker(
        {
          content: Array.prototype.slice.call(compressedImage, 0),
          // TODO: create property configFileName
          configFile: './config.json',
        },
        (error: string, result: any) => {
          if (error) {
            this._callback(error, null);
            return;
          }

          const compressedImage = new Buffer(result);
          this._createDataURI(textureMapImage, compressedImage);
        },
      );
    } else {
      this._createDataURI(textureMapImage, compressedImage);
    }
  }

  private _createDataURI(textureMap: TextureMap, compressedImage: Buffer) {
    let dataURI: string | null = null;
    if (this._textureMapTask.dataURI.enable) {
      dataURI = encodeBuffer(compressedImage, 'image/png');
      if (this._textureMapTask.dataURI.maxSize !== null) {
        if (dataURI.length >= this._textureMapTask.dataURI.maxSize) {
          dataURI = null;
        }
      }
    }

    textureMap.dataURI = dataURI;

    const skipFileWrite = dataURI && !this._textureMapTask.dataURI.createImageFileAnyway;
    if (!skipFileWrite) {
      // write png
      const file = path.join(this._globalConfig.folders.rootToIndexHtml, this._textureMapTask.textureMapFile);
      const data = {
        file,
        content: Array.prototype.slice.call(compressedImage, 0),
      };

      workers.writeFileWorker(data, (error: string, result: any) => {
        if (error) {
          this._callback(error, null);
        } else {
          this._callback(null, textureMap);
        }
      });
    } else {
      this._callback(null, textureMap);
    }
  }
}
