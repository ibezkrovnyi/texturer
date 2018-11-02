import { Rect } from './rect';

export interface Size {
  readonly width: number;
  readonly height: number;
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
