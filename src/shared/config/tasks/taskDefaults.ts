import { BaseOption } from '../baseOption';
import { ProcessTrim } from '../process/trim';
import { ProcessDataURI } from '../process/dataURI';
import { ProcessCompress } from '../process/compress';
import { ProcessDimensions } from '../process/dimensions';
import { BruteForceTime } from '../options/bruteForceTime';
import { GridStep } from '../options/gridStep';
import { PaddingX } from '../options/paddingX';
import { PaddingY } from '../options/paddingY';

class TaskDefaultsContainer extends BaseOption<Object | null> {
  getValue() {
    return this._getPropertyValue('task-defaults');
  }
}

export class TaskDefaults {
  bruteForceTime: number;
  gridStep: number;
  paddingX: number;
  paddingY: number;
  trim: ProcessTrim;
  dataURI: ProcessDataURI;
  compress: ProcessCompress;
  dimensions: ProcessDimensions;

  constructor(config: Object) {

    const taskDefaultsContainer = new TaskDefaultsContainer(config, null).getValue();

    this.bruteForceTime = new BruteForceTime(taskDefaultsContainer).getValue();
    this.gridStep = new GridStep(taskDefaultsContainer).getValue();
    this.paddingX = new PaddingX(taskDefaultsContainer).getValue();
    this.paddingY = new PaddingY(taskDefaultsContainer).getValue();

    this.trim = new ProcessTrim(taskDefaultsContainer);
    this.dataURI = new ProcessDataURI(taskDefaultsContainer);
    this.compress = new ProcessCompress(taskDefaultsContainer);
    this.dimensions = new ProcessDimensions(taskDefaultsContainer);
  }
}
