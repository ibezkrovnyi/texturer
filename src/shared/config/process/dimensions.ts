import { BaseOption } from '../baseOption';

export class ProcessDimensionsContainer extends BaseOption<Object | null> {
  getValue() {
    return this._getPropertyValue('dimensions');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return null;
  }
}

export class ProcessDimensionsMaxX extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('max-x');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 1920;
  }
}

export class ProcessDimensionsMaxY extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('max-y');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 1080;
  }
}

export class ProcessDimensions {
  maxX: number;
  maxY: number;

  constructor(configObject: Object | null, inheritDimensions: ProcessDimensions | null = null) {
    const dimensionsContainer = new ProcessDimensionsContainer(configObject).getValue();
    if (inheritDimensions) {
      this.maxX = new ProcessDimensionsMaxX(dimensionsContainer, inheritDimensions.maxX).getValue();
      this.maxY = new ProcessDimensionsMaxY(dimensionsContainer, inheritDimensions.maxY).getValue();
    } else {
      this.maxX = new ProcessDimensionsMaxX(dimensionsContainer).getValue();
      this.maxY = new ProcessDimensionsMaxY(dimensionsContainer).getValue();
    }
  }
}
