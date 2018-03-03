import workerFarm from 'worker-farm';
import pify from 'pify';
import * as path from 'path';
import { TextureMap, Size } from '../shared/containers/textureMap';
import { Rect } from '../shared/containers/rect';
import { binPackerWorker } from '../workers/binPacker/binPackerWorker';

const exportNames = [
  'copyFileWorker',
  'compressImageWorker',
  'writeFileWorker',
  'tinyPngWorker',
  'binPackerWorker',
];

const workerFarmWorkers = workerFarm(
  path.join(__dirname, 'workers.js'),
  exportNames,
) as any;

export const workers = pify(workerFarmWorkers);

export const workerFarmEnd = () => workerFarm.end(workerFarmWorkers);
