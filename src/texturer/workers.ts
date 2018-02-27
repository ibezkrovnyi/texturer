import workerFarm from 'worker-farm';
import * as path from 'path';
import { TextureMap, Texture, FileDimensions } from '../shared/containers/textureMap';
import { TextureMapTask } from '../shared/config/tasks/textureMapTask';
import { Rect } from '../shared/containers/rect';
import { BinPackerResult } from '../shared/containers/binPackerResult';

export const workers = workerFarm(
  path.join(__dirname, 'workers.js'),
  [
    'copyFileWorker',
    'compressImageWorker',
    'writeFileWorker',
    'tinyPngWorker',
    'binPackerWorker',
  ],
) as any;
