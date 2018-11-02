import workerFarm from 'worker-farm';
import pify from 'pify';
import path from 'path';

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
