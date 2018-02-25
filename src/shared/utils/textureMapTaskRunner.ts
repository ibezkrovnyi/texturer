import { LoadedFile } from '../containers/loadedFile';
import { TextureMapTask } from '../config/tasks/textureMapTask';
import { MultiTaskMaster } from '../multitask/master';
import { GlobalConfig } from '../config/globalConfig';
import { TextureMapGenerator } from '../../texturer/textureMapGenerator';
import { FileDimensions, Texture } from '../containers/textureMap';
import { TextureMap } from '../containers/textureMap';
import { CompressImageMaster } from '../../texturer/tasks/compressImageMaster';
import { TinyPngMaster } from '../../texturer/tasks/tinyPngMaster';
import { DataURIEncoder } from './dataURIEncoder';
import { WriteFileMaster } from '../../texturer/tasks/writeFileMaster';

var path = require("path");

interface Callback {
  (error: string | Error | null, result: null): void;
  (error: null, result: TextureMap | null): void;
}

// TODO: refactor
export class TextureMapTaskRunner {
  private _textureMapTask: TextureMapTask;
  private _loadedFiles: { [fileName: string]: LoadedFile };
  private _clusterQueue: MultiTaskMaster;
  private _callback: Callback;
  private _globalConfig: GlobalConfig;

  constructor(globalConfig: GlobalConfig, textureMapTask: TextureMapTask, loadedFiles: { [fileName: string]: LoadedFile }, clusterQueue: MultiTaskMaster, callback: Callback) {
    this._globalConfig = globalConfig;
    this._textureMapTask = textureMapTask;
    this._loadedFiles = loadedFiles;
    this._clusterQueue = clusterQueue;
    this._callback = callback;
  }

  run(): void {
    let fileDimensionsArray: FileDimensions[] = this._textureMapTask.files.map(file => {
      let loadedFile = this._loadedFiles[ file ];
      return new FileDimensions(file, loadedFile.getWidth(), loadedFile.getHeight());
    });

    let textureMapGenerator: TextureMapGenerator = new TextureMapGenerator(this._clusterQueue);
    textureMapGenerator.generateTextureMap(fileDimensionsArray, this._textureMapTask, (error: string, textureMap: TextureMap) => {
      if (textureMap) {
        this._compressTextureMapImage(textureMap);
      } else {
        // TODO: do texture map size configurable!!
        this._callback(new Error("Texture Generator: Can't pack texture map for folder '" + this._textureMapTask.folder + "' - too large art. Split images into 2 or more folders!"), null);
      }
    });
  }

  private _compressTextureMapImage(textureMap: TextureMap) {
    console.log(this._textureMapTask.textureMapFileName + ": w = " + textureMap.getWidth() + ", h = " + textureMap.getHeight() + ", area = " + textureMap.getArea());

    // TODO: what type here?
    let textureArray: any[] = [];

    textureMap.getTextureIds().forEach(id => {
      const loadedFile: LoadedFile = this._loadedFiles[ id ],
        texture = textureMap.getTexture(id);

      textureArray.push({
        x: texture.getX(),
        y: texture.getY(),
        width: texture.getWidth(),
        height: texture.getHeight(),
        realWidth: loadedFile.getRealWidth(),
        realHeight: loadedFile.getRealHeight(),
        bitmapSerialized: loadedFile.getBitmap()
      });
    });

    var bestCompressedImage: Buffer | null = null,
      filterCount = 0,
      filterTypes = [ 0, 1, 2, 3, 4 ];

    for (var i = 0; i < filterTypes.length; i++) {

      var data = {
        // TODO: integrate with new compress object properties
        options: this._textureMapTask.compress,
        filterType: filterTypes[ i ],
        width: textureMap.getWidth(),
        height: textureMap.getHeight(),
        textureArray: textureArray
      };

      this._clusterQueue.runTask(new CompressImageMaster(data, (error, result: any) => {
        if (error) {
          //console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount} - finished with error`);
          this._callback(new Error(error), null);
        } else {
          //console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount + 1}/${filterTypes.length} - finished OK`);

          // check if better compressed
          var compressedImage = new Buffer(result.compressedPNG);
          if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
            bestCompressedImage = compressedImage;
          }

          // check if finished
          filterCount++;
          if (filterCount === filterTypes.length) {
            this._onTextureMapImageCompressed(textureMap, bestCompressedImage);
          }
        }
      }));
    }
  }

  private _onTextureMapImageCompressed(textureMapImage: TextureMap, compressedImage: Buffer) {
    if (this._textureMapTask.compress.tinyPng) {
      this._clusterQueue.runTask(new TinyPngMaster({
        content: Array.prototype.slice.call(compressedImage, 0),
        // TODO: create property configFileName
        configFile: "./config.json"
      }, (error, result) => {
        if (error) {
          this._callback(error, null);
          return;
        }

        let compressedImage = new Buffer(result);
        this._createDataURI(textureMapImage, compressedImage);
      }));
    } else {
      this._createDataURI(textureMapImage, compressedImage);
    }
  }

  private _createDataURI(textureMap: TextureMap, compressedImage: Buffer): void {
    let dataURI: string | null = null;
    if (this._textureMapTask.dataURI.enable) {
      dataURI = new DataURIEncoder().encodeBuffer(compressedImage, "image/png");
      if (this._textureMapTask.dataURI.maxSize !== null) {
        if (dataURI.length >= this._textureMapTask.dataURI.maxSize) {
          dataURI = null;
        }
      }
    }

    textureMap.setDataURI(dataURI);

    const skipFileWrite = dataURI && !this._textureMapTask.dataURI.createImageFileAnyway;
    if (!skipFileWrite) {
      // write png
      var file = path.join(this._globalConfig.getFolderRootToIndexHtml(), this._textureMapTask.textureMapFileName),
        data = {
          file: file,
          content: Array.prototype.slice.call(compressedImage, 0)
        };

      this._clusterQueue.runTask(new WriteFileMaster(data, (error, result) => {
        if (error) {
          this._callback(error, null);
        } else {
          this._callback(null, textureMap);
        }
      }));
    } else {
      this._callback(null, textureMap);
    }
  }
}
