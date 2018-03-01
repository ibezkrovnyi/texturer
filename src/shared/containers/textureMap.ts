import { Rect, Margins } from './rect';

export class FileDimensions {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

export class TextureImage {
  private _realWidth: number;
  private _realHeight: number;
  private _bitmap: number[] | null;
  private _trim: Margins | null;
  private _opaque: boolean;

  constructor() {
    this._realWidth = 0;
    this._realHeight = 0;
    this._bitmap = null;
    this._trim = null;
    this._opaque = false;
  }

  // TODO: remove setData, move all initializers into constructor
  setData(realWidth: number, realHeight: number, bitmap: number[], trim: Margins, isOpaque: boolean) {
    this._realWidth = realWidth;
    this._realHeight = realHeight;
    this._bitmap = bitmap;
    this._trim = trim;
    this._opaque = isOpaque;
  }

  getOpaque() {
    return this._opaque;
  }

  /*
   setOpaque(value : boolean) : void {
   this._opaque = value;
   }

   */
  getTrim() {
    return this._trim;
  }

  /*
   setTrim(value : Rect) {
   this._trim = value;
   }
   */
  getBitmap() {
    return this._bitmap;
  }

  /*
   setBitmap(value : Array) : void {
   this._bitmap = value;
   }

   */
  getRealHeight() {
    return this._realHeight;
  }

  /*

   setRealHeight(value : number) {
   this._realHeight = value;
   }
   */

  getRealWidth() {
    return this._realWidth;
  }

  /*
   setRealWidth(value : number) : void {
   this._realWidth = value;
   }
   */
}

export class Texture {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
  private _image: TextureImage | null;

  constructor() {
    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;
    this._image = null;
  }

  setData(x: number, y: number, width: number, height: number) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
  }

  getImage() {
    return this._image;
  }

  setTextureImage(textureImage: TextureImage) {
    this._image = textureImage;
  }

  getHeight() {
    return this._height;
  }

  /*
   setHeight(value : number) : void {
   this._height = value;
   }
   */
  getWidth() {
    return this._width;
  }

  /*
   setWidth(value : number) : void {
   this._width = value;
   }

   */
  getY() {
    return this._y;
  }

  /*
   setY(value : number) : void {
   this._y = value;
   }

   */
  getX() {
    return this._x;
  }

  /*
   setX(value : number) : void {
   this._x = value;
   }
   */
}

export class TextureMap {
  protected _width: number;
  protected _height: number;

  protected _dataURI: string | null;

  // TODO: do we need this? we have id!
  protected _file!: string;

  protected _repeatX: boolean;
  protected _repeatY: boolean;

  protected _textures: { [id: string]: Texture };

  constructor() {
    this._width = 0;
    this._height = 0;
    this._dataURI = null;
    this._repeatX = false;
    this._repeatY = false;

    this._textures = {};
  }

  setData(file: string, width: number, height: number, repeatX: boolean, repeatY: boolean) {
    this._file = file;
    this._width = width;
    this._height = height;
    this._repeatX = repeatX;
    this._repeatY = repeatY;
  }

  setDataURI(dataURI: string | null) {
    this._dataURI = dataURI;
  }

  getDataURI() {
    return this._dataURI;
  }

  setTexture(id: string, texture: Texture) {
    this._textures[ id ] = texture;
  }

  getTexture(id: string) {
    return this._textures[ id ];
  }

  /*
   forEach(callback : (texture : Texture) => void, thisArg? : any) : void {
   Object.keys[this._textures].forEach(id => {
   callback.call(thisArg, this._textures[id]);
   });
   }
   */

  getTextureIds() {
    return Object.keys(this._textures);
  }

  getFile() {
    return this._file;
  }

  getRepeatX() {
    return this._repeatX;
  }

  getRepeatY() {
    return this._repeatY;
  }

  getWidth() {
    return this._width;
  }

  getHeight() {
    return this._height;
  }

  /*
   setWidth(width : number) : void {
   this._width = width;
   }

   setHeight(height : number) : void {
   this._height = height;
   }

   */
  getArea() {
    return this._width * this._height;
  }
}
