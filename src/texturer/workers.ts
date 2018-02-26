import * as workerFarm from 'worker-farm';
import { TextureMap, Texture, FileDimensions } from '../shared/containers/textureMap';
import { TextureMapTask } from '../shared/config/tasks/textureMapTask';
import { Rect } from '../shared/containers/rect';
import { BinPackerResult } from '../shared/containers/binPackerResult';

export const workers = workerFarm(
  require.resolve('../workers/index'),
  [
    'copyFileWorker',
    'compressImageWorker',
    'writeFileWorker',
    'tinyPngWorker',
    'binPackerWorker',
  ],
) as any;
