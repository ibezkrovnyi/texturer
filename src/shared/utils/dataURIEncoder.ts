import * as fs from 'fs';
import { FSHelper } from './fsHelper';

// TODO: gif support?
const extensionToMimeTypeMap = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  bmp: 'image/bmp',
};

export class DataURIEncoder {
  encodeBuffer(buffer: Buffer, mimeType: string) {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  encodeFile(file: string) {
    return this.encodeBuffer(fs.readFileSync(file), this._getImageMimeTypeByFileName(file));
  }

  private _getImageMimeTypeByFileName(file: string) {
    const extension = FSHelper.getExtension(file).toLowerCase() as keyof typeof extensionToMimeTypeMap;

    if (extension in extensionToMimeTypeMap) {
      return extensionToMimeTypeMap[extension];
    }

    throw new Error(`DataURIEncoder#_getImageMimeTypeByFileName: extension .${extension} is unsupported`);
  }
}
