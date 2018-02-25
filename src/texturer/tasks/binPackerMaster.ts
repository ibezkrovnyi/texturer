import { MultiTaskMasterTask } from '../../shared/multitask/types';
import { TextureMapTask } from '../../shared/config/tasks/textureMapTask';
import { TextureMap } from '../../shared/containers/textureMap';
import { FileDimensions } from '../../shared/containers/textureMap';
import { Rect } from '../../shared/containers/rect';
import { BinPackerResult } from '../../shared/containers/binPackerResult';
import { Texture } from '../../shared/containers/textureMap';

export class BinPackerMaster implements MultiTaskMasterTask {
  private _data: Object;
  private _textureMapTask: TextureMapTask;
  private _callback: (textureMap: TextureMap | null) => void;

  constructor(textureMapTask: TextureMapTask, files: FileDimensions[], targetRectangle: Rect, totalPixels: number, callback: (textureMap: TextureMap | null) => void) {
    this._textureMapTask = textureMapTask;
    this._callback = callback;
    this._data = {
      fromX: targetRectangle.left,
      toX: targetRectangle.right,
      fromY: targetRectangle.top,
      toY: targetRectangle.bottom,
      totalPixels: totalPixels,
      files: files,
      gridStep: textureMapTask.gridStep,
      paddingX: textureMapTask.paddingX,
      paddingY: textureMapTask.paddingY
    };
  }

  getFile(): string {
    return 'binPacker/binPackerWorker.js';
  }

  getWorkerData(): Object {
    return this._data;
  }

  onData(error: string, data: BinPackerResult): void {
    if (error) {
      throw new Error(error);
    } else {
      if (!data) {
        // TODO: it is not good to call callback with null, think about convert it to specific Error
        this._callback(null);
      } else {
        const width = data.width,
          height = data.height,
          textureIds = Object.keys(data.rectangles);

        let textureMap = new TextureMap();
        textureMap.setData(this._textureMapTask.textureMapFileName, width, height, this._textureMapTask.repeatX, this._textureMapTask.repeatY);
        for (const id of textureIds) {
          let texture = new Texture(),
            textureContainer = data.rectangles[ id ];
          // TODO: why next line in red??
          texture.setData(textureContainer.x, textureContainer.y, textureContainer.width, textureContainer.height);
          textureMap.setTexture(id, texture);
        }

        this._callback(textureMap);
      }
    }
  }
}
