import { BaseOption } from '../baseOption';

export class ProcessCompressTinyPng extends BaseOption<boolean | null> {
  getValue() {
    return this._getPropertyValue('tiny-png');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return false;
  }
}

class ProcessCompressContainer extends BaseOption<Object | null> {
  getValue() {
    return this._getPropertyValue('compression');
  }
}

export class ProcessCompress {
  tinyPng: boolean | null;

  constructor(configObject: Object | null, inheritCompression: ProcessCompress | null = null) {
    const compression = new ProcessCompressContainer(configObject, null).getValue();

    if (inheritCompression) {
      this.tinyPng = new ProcessCompressTinyPng(compression, inheritCompression.tinyPng).getValue();
    } else {
      this.tinyPng = new ProcessCompressTinyPng(compression).getValue();
    }
  }
}
