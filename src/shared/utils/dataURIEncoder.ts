import { FSHelper } from './fsHelper';

let fs = require("fs"),
  // TODO: gif support?
  extensionToMimeTypeMap = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "bmp": "image/bmp"
  };

export class DataURIEncoder {
  encodeBuffer(buffer: Buffer, mimeType: string): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  encodeFile(file: string): string {
    return this.encodeBuffer(fs.readFileSync(file), this._getImageMimeTypeByFileName(file));
  }

  private _getImageMimeTypeByFileName(file: string): string {
    const extension = FSHelper.getExtension(file).toLowerCase() as keyof typeof extensionToMimeTypeMap;

    if (extension in extensionToMimeTypeMap) {
      return extensionToMimeTypeMap[ extension ];
    }

    throw new Error(`DataURIEncoder#_getImageMimeTypeByFileName: extension .${extension} is unsupported`);
  }
}
