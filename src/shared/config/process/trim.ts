import { BaseOption } from '../baseOption';

export class ProcessTrimContainer extends BaseOption<Object | null> {
  getValue() {
    return this._getPropertyValue('trim');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return null;
  }
}

export class ProcessTrimEnable extends BaseOption<boolean | null> {
  getValue() {
    return this._getPropertyValue('enable');
  }

  protected _hasDefaultValue(): boolean {
    return true;
  }

  protected _getDefaultValue(): boolean {
    return true;
  }
}

export class ProcessTrimAlpha extends BaseOption<number> {
  getValue(): number {
    return this._getPropertyValue('alpha');
  }

  protected _hasDefaultValue(): boolean {
    return true;
  }

  protected _getDefaultValue(): number {
    return 0;
  }
}

export class ProcessTrim {
  enable: boolean | null;
  alpha: number;

  constructor(configObject: Object | null, inheritTrim: ProcessTrim | null = null) {
    const trimContainer = new ProcessTrimContainer(configObject).getValue();
    if (inheritTrim) {
      this.enable = new ProcessTrimEnable(trimContainer, inheritTrim.enable).getValue();
      this.alpha = new ProcessTrimAlpha(trimContainer, inheritTrim.alpha).getValue();
    } else {
      this.enable = new ProcessTrimEnable(trimContainer).getValue();
      this.alpha = new ProcessTrimAlpha(trimContainer).getValue();
    }
  }
}
