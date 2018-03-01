import * as crypto from 'crypto';
import * as path from 'path';
import { TextureMap, Texture, FileDimensions } from '../shared/containers/textureMap';
import { Rect, Margins } from '../shared/containers/rect';
import { workers } from './workers';
import { InternalTextureMapTask } from './config';
import { stableSort, getHash } from '../shared/utils/fsHelper';
import { BinPackerResult } from '../workers/binPacker/binPackerWorker';

export class TextureMapGenerator {
  private _plannedPlaceFilesTests!: number;
  private _finishedPlaceFilesTests!: number;
  private _textureMap!: TextureMap | null;
  private _callback!: any;
  private _totalPixels!: number;
  private _endTime!: number;
  private _textureMapTask!: InternalTextureMapTask;
  private _targetRectangle!: Margins;
  private _files!: FileDimensions[];

  constructor() {
  }

  generateTextureMap(files: FileDimensions[], textureMapTask: InternalTextureMapTask, callback: any) {
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

      const targetRectangle = this._checkFiles(textureMapTask, files);

      this._textureMapTask = textureMapTask;
      this._targetRectangle = targetRectangle;
      this._files = files;

      // try different combinations
      // this._placeFiles(textureMapTask, targetRectangle, files.sort((a, b) => (b.width * b.height - a.width * a.height) || (b.id > a.id ? 1 : -1)));
      // this._placeFiles(textureMapTask, targetRectangle, files.sort((a, b) => (b.width - a.width) || (b.id > a.id ? 1 : -1)));
      // this._placeFiles(textureMapTask, targetRectangle, files.sort((a, b) => (b.height - a.height) || (b.id > a.id ? 1 : -1)));
      this._placeFiles(textureMapTask, targetRectangle, stableSort(files.slice(0), (a, b) => b.width * b.height - a.width * a.height));
      this._placeFiles(textureMapTask, targetRectangle, stableSort(files.slice(0), (a, b) => b.width - a.width));
      this._placeFiles(textureMapTask, targetRectangle, stableSort(files.slice(0), (a, b) => b.height - a.height));

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
      if (this._textureMap) {
        if (
          bestTextureMap.getArea() < this._textureMap.getArea() ||
          (bestTextureMap.getArea() === this._textureMap.getArea() && getHash(bestTextureMap) < getHash(this._textureMap))
        ) {
          this._textureMap = bestTextureMap;
        }
      } else {
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

          var sha1 = crypto.createHash('sha1');
          sha1.update(JSON.stringify(this._textureMap), 'binary' as any);
          const dig1 = sha1.digest('hex');
          console.error('placefinished: ', dig1);

          this._callback(null, this._textureMap);
        } else {
          this._callback(null, null);
        }
      }
    }
  }

  private _placeFiles(textureMapTask: InternalTextureMapTask, targetRectangle: Margins, files: FileDimensions[]) {
    const data = {
      files,
      fromX: targetRectangle.left,
      toX: targetRectangle.right,
      fromY: targetRectangle.top,
      toY: targetRectangle.bottom,
      totalPixels: this._totalPixels,
      gridStep: textureMapTask.gridStep,
      paddingX: textureMapTask.paddingX,
      paddingY: textureMapTask.paddingY,
    };

    var sha1 = crypto.createHash('sha1');
    sha1.update(JSON.stringify({ textureMapTask, targetRectangle, files }), 'binary' as any);
    const dig1 = sha1.digest('hex');

    workers.binPackerWorker(data, (error: string, data: BinPackerResult) => {
      if (error) {
        throw new Error(error);
      } else {
        if (!data) {
          // TODO: it is not good to call callback with null, think about convert it to specific Error
          this._onPlaceFilesFinished(null, null);
        } else {
          const width = data.width;
          const height = data.height;
          // TODO: do we need to add stableSort for textureIds ?
          const textureIds = Object.keys(data.rectangles);

          const textureMap = new TextureMap();
          textureMap.setData(textureMapTask.textureMapFile, width, height, textureMapTask.repeatX, textureMapTask.repeatY);
          for (const id of textureIds) {
            const texture = new Texture();
            const textureContainer = data.rectangles[id];
            // TODO: why next line in red??
            texture.setData(textureContainer.x, textureContainer.y, textureContainer.width, textureContainer.height);
            textureMap.setTexture(id, texture);
          }

          var sha1 = crypto.createHash('sha1');
          sha1.update(JSON.stringify(textureMap), 'binary' as any);
          const dig2 = sha1.digest('hex');
          console.error('tmp: ', dig1, dig2);

          this._onPlaceFilesFinished(null, textureMap);
        }
      }
    });
  }

  private _getShuffledArray<T>(arr: T[]) {
    const shuffled = arr.slice(0);
    for (let i = 0; i < shuffled.length - 1; i++) {
      const l = shuffled.length;
      const index = ((Math.random() * (l - i)) | 0) + i;

      const tmp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = tmp;
    }

    return shuffled;
  }

  private _checkFiles(textureMapTask: InternalTextureMapTask, files: FileDimensions[]): Margins {
    if (textureMapTask.repeatX && textureMapTask.repeatY) {
      throw new Error('TextureMapGenerator#_checkFiles: Sprite can\'t be repeat-x and repeat-y at the same time');
    }

    let left = 4;
    let right = textureMapTask.dimensions.maxX;
    let top = 4;
    let bottom = textureMapTask.dimensions.maxY;

    if (textureMapTask.repeatX) {
      left = right = files[0].width;
      files.forEach(file => {
        if (file.width !== left) {
          throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${textureMapTask.folder} should have the same width to repeat by X axis`);
        }
      });
    }

    if (textureMapTask.repeatY) {
      top = bottom = files[0].height;
      files.forEach(file => {
        if (file.height !== top) {
          throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${textureMapTask.folder} should have the same height to repeat by Y axis`);
        }
      });
    }

    return { left, right, top, bottom };
  }
}
