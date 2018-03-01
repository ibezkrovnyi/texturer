import * as crypto from 'crypto';
import * as path from 'path';
import { TextureMap, Texture, FileDimensions } from '../shared/containers/textureMap';
import { Rect, Margins } from '../shared/containers/rect';
import { workers } from './workers';
import { InternalTextureMapTask } from './config';
import { stableSort, getHash } from '../shared/utils/fsHelper';
import { Layout } from '../workers/binPacker/binPackerWorker';
import { LoadedFile } from '../shared/containers/loadedFile';

export class TextureMapGenerator {
  private _loadedFiles!: Record<string, LoadedFile>;
  private _arrangementAttemptsPlanned!: number;
  private _arrangementAttemptsDone!: number;
  private _bestLayout!: Layout | null;
  private _callback!: any;
  private _totalPixels!: number;
  private _endTime!: number;
  private _textureMapTask!: InternalTextureMapTask;
  private _targetRectangle!: Margins;
  private _files!: ReadonlyArray<FileDimensions>;

  constructor() {
  }

  generateTextureMap(loadedFiles: Record<string, LoadedFile>, textureMapTask: InternalTextureMapTask, callback: any) {
    const files: FileDimensions[] = textureMapTask.files.map(file => {
      const loadedFile = loadedFiles[file];
      return { width: loadedFile.getWidth(), height: loadedFile.getHeight() };
    });

    try {
      this._loadedFiles = loadedFiles;
      // calculate total pixels
      let totalPixels = 0;
      files.forEach(function (file: any) {
        totalPixels += file.width * file.height;
      });

      this._arrangementAttemptsPlanned = 0;
      this._arrangementAttemptsDone = 0;
      this._bestLayout = null;
      this._callback = callback;
      this._totalPixels = totalPixels;
      this._endTime = Date.now() + textureMapTask.bruteForceTime;

      const targetRectangle = this._checkFiles(textureMapTask, files);

      this._textureMapTask = textureMapTask;
      this._targetRectangle = targetRectangle;
      this._files = files;

      // try different combinations
      this._arrangeRects(textureMapTask, targetRectangle, stableSort(Array.from(files), (a, b) => b.width * b.height - a.width * a.height));
      this._arrangeRects(textureMapTask, targetRectangle, stableSort(Array.from(files), (a, b) => b.width - a.width));
      this._arrangeRects(textureMapTask, targetRectangle, stableSort(Array.from(files), (a, b) => b.height - a.height));
    } catch (e) {
      callback(e.stack, null);
    }
  }

  private _onRectsArranged(error: any, layout: Layout | null) {
    if (!error && layout && getArea(layout) > 0) {
      if (this._bestLayout) {
        const layoutArea = getArea(layout);
        const bestLayoutArea = getArea(this._bestLayout);
        if (layoutArea < bestLayoutArea || (layoutArea === bestLayoutArea && getHash(layout) < getHash(this._bestLayout))) {
          this._bestLayout = layout;
        }
      } else {
        this._bestLayout = layout;
      }
    }

    this._arrangementAttemptsDone++;
    if (this._arrangementAttemptsDone === this._arrangementAttemptsPlanned) {
      if (Date.now() < this._endTime) {
        this._arrangeRects(this._textureMapTask, this._targetRectangle, this._getShuffledArray(this._files));
      } else {
        this._callback(null, this._bestLayout ? this._getTextureMap(this._bestLayout) : null);
      }
    }
  }

  private _getTextureMap(layout: Layout): TextureMap {
    const rectangles = Array.from(layout.rects);
    
    const files = this._textureMapTask.files;
    const textures = files.reduce<TextureMap['textures']>((acc, file) => {
      const loadedFile = this._loadedFiles[file];
      const index = rectangles.findIndex(rect => rect.width === loadedFile.getWidth() && rect.height === loadedFile.getHeight());
      if (index === -1) throw new Error(`Error: no placement for file ${file}`);
      const rect = rectangles.splice(index, 1)[0];
      const texture: Texture = { ...rect };
      acc[file] = texture;
      return acc;
    }, {});

    return {
      file: this._textureMapTask.textureMapFile, 
      width: layout.width, 
      height: layout.height, 
      repeatX: this._textureMapTask.repeatX, 
      repeatY: this._textureMapTask.repeatY,
      textures,
      dataURI: null,
    }
  }

  private _arrangeRects(textureMapTask: InternalTextureMapTask, targetRectangle: Margins, files: FileDimensions[]) {
    this._arrangementAttemptsPlanned++;

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

    workers.binPackerWorker(data, (error: string, layout: Layout | null) => {
      if (error) {
        throw new Error(error);
      } else {
        if (!layout) {
          // TODO: it is not good to call callback with null, think about convert it to specific Error
          this._onRectsArranged(null, null);
        } else {
          // const width = data.width;
          // const height = data.height;
          // // TODO: do we need to add stableSort for textureIds ?
          // const textureIds = Object.keys(data.rectangles);

          // const textureMap = new TextureMap();
          // textureMap.setData(textureMapTask.textureMapFile, width, height, textureMapTask.repeatX, textureMapTask.repeatY);
          // for (const id of textureIds) {
          //   const texture = new Texture();
          //   const textureContainer = data.rectangles[id];
          //   // TODO: why next line in red??
          //   texture.setData(textureContainer.x, textureContainer.y, textureContainer.width, textureContainer.height);
          //   textureMap.setTexture(id, texture);
          // }

          // var sha1 = crypto.createHash('sha1');
          // sha1.update(JSON.stringify(textureMap), 'binary' as any);
          // const dig2 = sha1.digest('hex');
          // console.error('tmp: ', dig1, dig2);

          this._onRectsArranged(null, layout);
        }
      }
    });
  }

  private _getShuffledArray<T>(arr: ReadonlyArray<T>) {
    const shuffled = Array.from(arr);
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

function getArea(layout: Layout) {
  return layout.width * layout.height;
}