export interface BinRectanglesDictionary {
  [id: string]: {
    x: number; y: number; width: number; height: number;
  }
}

export interface BinPackerResult {
  width: number;
  height: number;
  rectangles: BinRectanglesDictionary;
}
