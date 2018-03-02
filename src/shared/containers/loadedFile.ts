import { Rect, Margins } from './rect';

// TODO: what is the difference to TextureImage ?
export interface LoadedFile {
  readonly width: number;
  readonly height: number;
  readonly realWidth: number;
  readonly realHeight: number;
  readonly opaque: boolean;
  readonly trim: Margins; // TODO: trim basically means InternalTrim or Trim, but here trim is TrimMargins or Margins.
  readonly bitmap: number[]; // TODO: real type?
}
