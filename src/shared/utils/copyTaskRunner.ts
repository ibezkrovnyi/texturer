import { TextureMap } from '../containers/textureMap';
import { CopyFileMaster } from '../../texturer/tasks/copyFileMaster';
import { Texture } from '../containers/textureMap';
import { TextureImage } from '../containers/textureMap';
import { CopyTask } from '../config/tasks/copyTask';
import { GlobalConfig } from '../config/globalConfig';
import { LoadedFile } from '../containers/loadedFile';
import { MultiTaskMaster } from '../multitask/master';
import { DataURIEncoder } from './dataURIEncoder';
import { FSHelper } from './fsHelper';

var path = require("path"),
  fs = require("fs");

export class CopyTaskRunner {
  private _globalConfig: GlobalConfig;
  private _copyTask: CopyTask;
  private _loadedFiles: { [fileName: string]: LoadedFile };
  private _clusterQueue: MultiTaskMaster;
  private _callback: (error: Error | null, result: any) => void;
  private _textureMaps: TextureMap[];

  constructor(globalConfig: GlobalConfig, copyTask: CopyTask, loadedFiles: { [fileName: string]: LoadedFile }, clusterQueue: MultiTaskMaster, callback: (error: Error | null, result: any) => void) {
    this._globalConfig = globalConfig;
    this._copyTask = copyTask;
    this._loadedFiles = loadedFiles;
    this._clusterQueue = clusterQueue;
    this._textureMaps = [];
    this._callback = callback;
  }

  run(): void {
    this._copyTask.files.forEach((file: string) => {
      var fromFile = path.join(this._globalConfig.getFolderRootFrom(), file),
        toFile = path.join(this._globalConfig.getFolderRootToIndexHtml(), file),
        loadedFile: LoadedFile = this._loadedFiles[ file ];

      // dataURI
      let dataURI: string | null = null;
      if (this._copyTask.dataURI.enable) {
        dataURI = new DataURIEncoder().encodeFile(fromFile);
        if (this._copyTask.dataURI.maxSize !== null) {
          if (dataURI.length >= this._copyTask.dataURI.maxSize) {
            dataURI = null;
          }
        }
      }

      var width = loadedFile.getWidth(),
        height = loadedFile.getHeight();

      let textureImage = new TextureImage();
      textureImage.setData(loadedFile.getRealWidth(), loadedFile.getRealHeight(), loadedFile.getBitmap(), loadedFile.getTrim(), loadedFile.isOpaque());

      let texture = new Texture();
      texture.setData(0, 0, width, height);
      texture.setTextureImage(textureImage);

      let textureMap: TextureMap = new TextureMap();
      textureMap.setData(file, width, height, false, false);
      textureMap.setDataURI(dataURI);
      textureMap.setTexture(file, texture);

      const skipFileWrite = dataURI && !this._copyTask.dataURI.createImageFileAnyway;
      if (!skipFileWrite) {
        // fs.link(fromFile, toFile, function (error) {
        this._copyFile(fromFile, toFile, () => {
          this._addTextureMap(textureMap);
        });
      } else {
        this._addTextureMap(textureMap);
      }
    });
  }

  private _copyFile(fromFile: string, toFile: string, onCopyFinishedCallback: () => void): void {
    try {
      FSHelper.createDirectory(path.dirname(toFile));

      // check if file exists
      if (fs.existsSync(toFile)) {
        // remove read-only and other attributes
        fs.chmodSync(toFile, '0777');

        // delete file
        fs.unlinkSync(toFile);
      }
    } catch (e) {
      this._callback(new Error("COPY PREPARATION: " + e.toString()), null);
    }

    var copyTask = new CopyFileMaster({ source: fromFile, target: toFile }, error => {
      if (error) {
        this._callback(new Error("" +
          "COPY: \n" +
          "src: " + fromFile + "\n" +
          "dst: " + toFile + "\n" +
          "error: " + error
        ), null);
      }

      onCopyFinishedCallback();
    });

    this._clusterQueue.runTask(copyTask);
  }

  private _addTextureMap(textureMapImage: TextureMap): void {
    this._textureMaps.push(textureMapImage);

    if (this._copyTask.files.length === this._textureMaps.length) {
      this._callback(null, this._textureMaps);
    }
  }
}
