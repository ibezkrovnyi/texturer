import { FileDimensions } from '../../shared/containers/textureMap';
import { BinPacker } from './binPackerAlgorithm';
import { Rect } from '../../shared/containers/rect';

// there is no sense to try all possible width/height. width/height step = 16 is ok
const binPackerSizeStep = 16;

export interface Layout {
  width: number;
  height: number;
  rectangles: Rect[];
}


export function binPackerWorker(data: any, callback: any) {
  let best: Layout | null = null;

  for (let x = data.fromX; x <= data.toX; x += binPackerSizeStep) {
    for (let y = data.fromY; y <= data.toY; y += binPackerSizeStep) {
      if (data.totalPixels <= x * y) {
        const binPackerResult = tryToPack(data.files, x, y, data.gridStep, data.paddingX, data.paddingY);
        if (binPackerResult) {
          if (!best || best.width * best.height > binPackerResult.width * binPackerResult.height) {
            best = binPackerResult;
          }

          // TODO: check below comment
          // we found binPackerResult for 'x', 'y' => for 'x', 'y + 1' result will be the same, so go to next 'x'
          break;
        }
      }
    }
  }

  // send processed taskData back to cluster
  callback(undefined, best);
}

function tryToPack(fileDimensions: FileDimensions[], spriteWidth: number, spriteHeight: number, gridStep: number, paddingX: number, paddingY: number) {
  const packer = new BinPacker(spriteWidth, spriteHeight, gridStep, paddingX, paddingY);
  const rectangles: Rect[] = [];

  let width = 0;
  let height = 0;
  for (const fileDimension of fileDimensions) {
    const placeCoordinates = packer.placeNextRectangle(fileDimension.width, fileDimension.height);
    if (!placeCoordinates) return null;

    rectangles.push({
      x: placeCoordinates.x,
      y: placeCoordinates.y,
      width: fileDimension.width,
      height: fileDimension.height,
    });

    width = Math.max(width, placeCoordinates.x + fileDimension.width);
    height = Math.max(height, placeCoordinates.y + fileDimension.height);
  }

  return { width, height, rectangles };
}
