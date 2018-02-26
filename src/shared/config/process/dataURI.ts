import { BaseOption } from '../baseOption';

class ProcessDataURIEnable extends BaseOption<boolean | null> {
  getValue() {
    return this._getPropertyValue('enable');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return true;
  }
}

class ProcessDataURIMaxSize extends BaseOption<number | null> {
  getValue() {
    return this._getPropertyValue('max-size');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    // Opera 11 limitation = 65000 characters
    return 32 * 1024 - 256;
  }
}

class ProcessDataURICreateImageFileAnyway extends BaseOption<boolean | null> {
  getValue() {
    return this._getPropertyValue('create-image-file-anyway');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return false;
  }
}

class ProcessDataURIContainer extends BaseOption<Object | null> {
  getValue() {
    return this._getPropertyValue('data-uri');
  }
}

export class ProcessDataURI {
  enable: boolean | null;
  maxSize: number | null;
  createImageFileAnyway: boolean | null;

  constructor(configObject: Object | null, inheritDataURI: ProcessDataURI | null = null) {
    const dataURI = new ProcessDataURIContainer(configObject, null).getValue();
    if (inheritDataURI) {
      this.enable = new ProcessDataURIEnable(dataURI, inheritDataURI.enable).getValue();
      this.maxSize = new ProcessDataURIMaxSize(dataURI, inheritDataURI.maxSize).getValue();
      this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI, inheritDataURI.createImageFileAnyway).getValue();
    } else {
      this.enable = new ProcessDataURIEnable(dataURI).getValue();
      this.maxSize = new ProcessDataURIMaxSize(dataURI).getValue();
      this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI).getValue();
    }
  }
}
