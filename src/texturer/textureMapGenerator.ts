;
;
;
;
;
import { MultiTaskMaster } from '../shared/multitask/master';
import { TextureMap } from '../shared/containers/textureMap';
import { TextureMapTask } from '../shared/config/tasks/textureMapTask';
import { Rect } from '../shared/containers/rect';
import { FileDimensions } from '../shared/containers/textureMap';
import { BinPackerMaster } from './tasks/binPackerMaster';

let path = require("path");

export class TextureMapGenerator {
  private _cq: MultiTaskMaster;
  private _plannedPlaceFilesTests!: number;
  private _finishedPlaceFilesTests!: number;
  private _textureMap!: TextureMap | null;
  private _callback!: any;
  private _totalPixels!: number;
  private _endTime!: number;
  private _textureMapTask!: TextureMapTask;
  private _targetRectangle!: Rect;
  private _files!: FileDimensions[];

  constructor(cq: MultiTaskMaster) {
    this._cq = cq;
  }

  generateTextureMap(files: FileDimensions[], textureMapTask: TextureMapTask, callback: any): void {
    try {
      // calculate total pixels
      let totalPixels = 0;
      files.forEach(function (file: any) {
        totalPixels += file.width * file.height;
      });

      this._plannedPlaceFilesTests = 3;
      this._finishedPlaceFilesTests = 0;
      this._textureMap = null;
      this._callback = callback;
      this._totalPixels = totalPixels;
      this._endTime = Date.now() + textureMapTask.bruteForceTime;

      let targetRectangle = this._checkFiles(textureMapTask, files);

      this._textureMapTask = textureMapTask;
      this._targetRectangle = targetRectangle;
      this._files = files;

      // try different combinations
      this._placeFiles(textureMapTask, targetRectangle, files.sort((a: any, b: any) => (b.width * b.height - a.width * a.height) || (b.id > a.id ? 1 : -1)));
      this._placeFiles(textureMapTask, targetRectangle, files.sort((a: any, b: any) => (b.width - a.width) || (b.id > a.id ? 1 : -1)));
      this._placeFiles(textureMapTask, targetRectangle, files.sort((a: any, b: any) => (b.height - a.height) || (b.id > a.id ? 1 : -1)));

      /*
       for (let i = 0; i < textureMapTask.getNPass(); i++) {
       this._placeFiles(textureMapTask, targetRectangle, this._getShuffledArray(files));
       }
       */
    } catch (e) {
      callback(e.stack, null);
    }
  }

  private _onPlaceFilesFinished(error: any, bestTextureMap: TextureMap | null) {
    if (!error && bestTextureMap) {
      if (this._textureMap === null || bestTextureMap.getArea() < this._textureMap.getArea()) {
        this._textureMap = bestTextureMap;
      }
    }

    this._finishedPlaceFilesTests++;
    if (this._finishedPlaceFilesTests === this._plannedPlaceFilesTests) {
      if (Date.now() < this._endTime) {
        this._plannedPlaceFilesTests++;
        this._placeFiles(this._textureMapTask, this._targetRectangle, this._getShuffledArray(this._files));
      } else {
        if (this._textureMap && this._textureMap.getArea() > 0) {
          this._callback(null, this._textureMap);
        } else {
          this._callback(null, null);
        }
      }
    }
  }

  private _placeFiles(textureMapTask: TextureMapTask, targetRectangle: Rect, files: FileDimensions[]) {
    this._cq.runTask(new BinPackerMaster(textureMapTask, files, targetRectangle, this._totalPixels, (textureMap: TextureMap | null) => {
      this._onPlaceFilesFinished(null, textureMap);
    }));
  }

  private _getShuffledArray<T>(arr: T[]): T[] {
    let shuffled = arr.slice(0);
    for (let i = 0; i < shuffled.length - 1; i++) {
      let l = shuffled.length;
      let index = ((Math.random() * (l - i)) | 0) + i;

      let tmp = shuffled[ index ];
      shuffled[ index ] = shuffled[ i ];
      shuffled[ i ] = tmp;
    }

    return shuffled;
  }

  private _checkFiles(textureMapTask: TextureMapTask, files: FileDimensions[]): Rect {
    // TODO: use another interface here. Rect should for trim!!
    let targetRectangle: Rect = {
      left: 4,
      right: textureMapTask.dimensions.maxX,
      top: 4,
      bottom: textureMapTask.dimensions.maxY
    };

    if (textureMapTask.repeatX && textureMapTask.repeatY) {
      throw new Error("TextureMapGenerator#_checkFiles: Sprite can't be repeat-x and repeat-y at the same time");
    }

    if (textureMapTask.repeatX) {
      targetRectangle.left = targetRectangle.right = files[ 0 ].width;
      files.forEach(file => {
        if (file.width !== targetRectangle.left) {
          throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${textureMapTask.folder} should have the same width to repeat by X axis`);
        }
      });
    }

    if (textureMapTask.repeatY) {
      targetRectangle.top = targetRectangle.bottom = files[ 0 ].height;
      files.forEach(file => {
        if (file.height !== targetRectangle.top) {
          throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${textureMapTask.folder} should have the same width to repeat by Y axis`);
        }
      });
    }

    return targetRectangle;
  }
}
