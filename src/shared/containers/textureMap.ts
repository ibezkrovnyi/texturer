import { Rect, Margins } from './rect';

export interface FileDimensions {
  readonly width: number;
  readonly height: number;
}

export interface TextureImage {
  readonly realWidth: number;
  readonly realHeight: number;
  readonly bitmap: number[];
  readonly trim: Margins;
  readonly opaque: boolean;
}

export interface Texture {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly image?: TextureImage;
}

export interface TextureMap {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly repeatX: boolean;
  readonly repeatY: boolean;
  readonly textures: Record<string, Rect>;
  // TODO: make it readonly
  dataURI: string | null;
}
