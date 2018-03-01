import * as crypto from 'crypto';
import { BinPackerResult, BinRectanglesDictionary } from '../../shared/containers/binPackerResult';
import { FileDimensions } from '../../shared/containers/textureMap';
import { BinPacker } from './binPackerAlgorithm';

// there is no sense to try all possible width/height. width/height step = 16 is ok
const binPackerSizeStep = 16;

export function binPackerWorker(data: any, callback: any) {
  let best: BinPackerResult | null = null;
  
  var sha1 = crypto.createHash('sha1');
  sha1.update(JSON.stringify(data), 'binary' as any);
  const dig1 = sha1.digest('hex');
  
  for (let x = data.fromX; x <= data.toX; x += binPackerSizeStep) {
    for (let y = data.fromY; y <= data.toY; y += binPackerSizeStep) {
      if (data.totalPixels <= x * y) {
        const binPackerResult = tryToPack(data.files, x, y, data.gridStep, data.paddingX, data.paddingY);
        if (binPackerResult) {
          if (!best || best.width * best.height > binPackerResult.width * binPackerResult.height) {
            best = binPackerResult;
          }

          // we found binPackerResult for 'x', 'y' => for 'x', 'y + 1' result will be the same, so go to next 'x'
          break;
        }
      }
    }
  }

  var sha1 = crypto.createHash('sha1');
  sha1.update(JSON.stringify(best), 'binary' as any);
  const dig2 = sha1.digest('hex');

  const allowed = [ "0a656ae6d115fbf50785b3df9179bbe859b9e36a", "4e336aec90605d9f40d52f4e4b85bf31e8565993",
  "fcd46389be5f509ab61cc71ab5a690f539c00c83", "89661da312cb12f8dba2fc4cf4012b7d393e3f3d",
  "5a5e4aea37c43f8e0cb6a8414a126a01ef1dd1d1", "4ada2604f31e4e93a707ca06e3b36bb44fc99562",
  "d3d2d89e8e93971644c668db9e43e9cf8a7af1dd", "e03df5a2a17f228b17ae2ae269ea13a1d9950be2",
  "c9976ac348747440a652bd58a6baa7d6b130eb49", "ba6f037e0b052c22c06076a2a15716b4dc755170",
  "c9976ac348747440a652bd58a6baa7d6b130eb49", "ba6f037e0b052c22c06076a2a15716b4dc755170",
  "8ab2f0cf1b7917b0db97f2add7084651e5f3adc6", "164a9d540152b25a58513c08e26cdd5ac35a2dd8",
  "1b687dc41e4a696aea251bf4e838a3fed50ab50f", "a31c207554b368a45a950fb17e8ece8f3ce7fcf3",
  "d3d2d89e8e93971644c668db9e43e9cf8a7af1dd", "e03df5a2a17f228b17ae2ae269ea13a1d9950be2" ];

  let found = false;
  for(let i = 0; i < allowed.length; i+=2) {
    if (allowed[i] === dig1  && allowed[i+1] === dig2) {
      found = true;
      break;
    }
  }

  if (!found) {
    console.error('ERROR-!!!xxx', dig1, dig2, JSON.stringify(data, undefined, 2));
  }

  // send processed taskData back to cluster
  callback(undefined, best);
}

function tryToPack(fileDimensions: FileDimensions[], spriteWidth: number, spriteHeight: number, gridStep: number, paddingX: number, paddingY: number) {
  const packer = new BinPacker(spriteWidth, spriteHeight, gridStep, paddingX, paddingY);
  const rectangles: BinRectanglesDictionary = {};

  let width = 0;
  let height = 0;
  for (const fileDimension of fileDimensions) {
    const placeCoordinates = packer.placeNextRectangle(fileDimension.width, fileDimension.height);
    if (placeCoordinates !== null) {
      rectangles[fileDimension.id] = {
        x: placeCoordinates.x,
        y: placeCoordinates.y,
        width: fileDimension.width,
        height: fileDimension.height,
      };

      width = Math.max(width, placeCoordinates.x + fileDimension.width);
      height = Math.max(height, placeCoordinates.y + fileDimension.height);
    } else {
      return null;
    }
  }

  return { width, height, rectangles };
}
