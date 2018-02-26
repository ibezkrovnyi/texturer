class binPackerNode {
  x: number;
  y: number;
  width: number;
  height: number;
  leftChild?: binPackerNode;
  rightChild?: binPackerNode;
  used: boolean;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.used = false;
  }
}

export class BinPacker {
  private _rootNode: binPackerNode;
  private _divisibleBy: number;
  private _paddingX: number;
  private _paddingY: number;

  private static _recursiveFindPlace(node: binPackerNode, width: number, height: number): { x: number; y: number; } | null {
    if (node.leftChild) {
      return BinPacker._recursiveFindPlace(node.leftChild, width, height) || BinPacker._recursiveFindPlace(node.rightChild!, width, height);
    } else {
      if (node.used || width > node.width || height > node.height) {
        return null;
      }

      // if it fits perfectly then use this gap
      if (width === node.width && height === node.height) {
        node.used = true;
        return { x: node.x, y: node.y };
      }

      // checks if we partition in vertical or horizontal
      if (node.width - width > node.height - height) {
        node.leftChild = new binPackerNode(node.x, node.y, width, node.height);
        node.rightChild = new binPackerNode(node.x + width, node.y, node.width - width, node.height);
      } else {
        node.leftChild = new binPackerNode(node.x, node.y, node.width, height);
        node.rightChild = new binPackerNode(node.x, node.y + height, node.width, node.height - height);
      }
      return BinPacker._recursiveFindPlace(node.leftChild, width, height);
    }
  }

  private static _makeDivisibleBy(coordinate: number, divisibleBy: number): number {
    if (divisibleBy > 0) {
      if (coordinate % divisibleBy > 0) {
        coordinate += divisibleBy - (coordinate % divisibleBy);
      }
    }
    return coordinate;
  }

  constructor(binWidth: number, binHeight: number, makeCoordinatesDivisibleBy: number = 0, minimalDistanceBetweenPackedRectanglesByX: number = 0, minimalDistanceBetweenPackedRectanglesByY: number = 0) {
    this._divisibleBy = makeCoordinatesDivisibleBy;
    this._paddingX = minimalDistanceBetweenPackedRectanglesByX;
    this._paddingY = minimalDistanceBetweenPackedRectanglesByY;

    //console.log("x", binWidth, binHeight, this._paddingX, this._paddingY, makeCoordinatesDivisibleBy);
    binWidth = BinPacker._makeDivisibleBy(binWidth, this._divisibleBy) + this._paddingX;
    binHeight = BinPacker._makeDivisibleBy(binHeight, this._divisibleBy) + this._paddingY;
    //console.log("y", binWidth, binHeight, this._paddingX, this._paddingY, makeCoordinatesDivisibleBy);
    this._rootNode = new binPackerNode(0, 0, binWidth, binHeight);
  }

  placeNextRectangle(width: number, height: number): { x: number; y: number } | null {
    width = BinPacker._makeDivisibleBy(width, this._divisibleBy) + this._paddingX;
    height = BinPacker._makeDivisibleBy(height, this._divisibleBy) + this._paddingY;
    return BinPacker._recursiveFindPlace(this._rootNode, width, height);
  }
}
