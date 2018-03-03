import * as crypto from 'crypto';
import * as path from 'path';
import { TextureMap, Size } from '../shared/containers/textureMap';
import { Rect, Margins } from '../shared/containers/rect';
import { workers } from './workers';
import { InternalTextureMapTask } from './config';
import { stableSort, getHash } from '../shared/utils/fsHelper';
import { Layout } from '../workers/binPacker/binPackerWorker';
import { LoadedFile } from '../shared/containers/loadedFile';

// TODO: loadedFiles (Record<string, LoadedFile>) should have separate type
export async function generateTextureMap(task: InternalTextureMapTask, loadedFiles: Record<string, LoadedFile>) {
  const endTime = Date.now() + task.bruteForceTime;

  const sizes: Size[] = task.files.map(file => {
    const loadedFile = loadedFiles[file];
    return { width: loadedFile.width, height: loadedFile.height };
  });

  const targetRect = checkFiles(task, sizes);

  // calculate total pixels
  const totalPixels = sizes.reduce((sum, size) => {
    return sum + size.width * size.height;
  }, 0);

  // try different combinations
  const layouts = await Promise.all([
    arrangeRects(task, stableSort(Array.from(sizes), (a, b) => b.width * b.height - a.width * a.height), targetRect, totalPixels),
    arrangeRects(task, stableSort(Array.from(sizes), (a, b) => b.width - a.width), targetRect, totalPixels),
    arrangeRects(task, stableSort(Array.from(sizes), (a, b) => b.height - a.height), targetRect, totalPixels),
  ]);

  let bestLayout = findBestLayout(layouts);
  while (Date.now() < endTime) {
    const layout = await arrangeRects(task, getShuffledArray(sizes), targetRect, totalPixels);
    bestLayout = findBestLayout([bestLayout, layout]);
  }

  if (!bestLayout) {
    throw new Error('Texture Generator: Can\'t pack texture map for folder \'' + task.folder + '\' - too large art. Split images into 2 or more folders or increase maxX!');
  }

  return getTextureMap(task, loadedFiles, bestLayout);
}

async function arrangeRects(task: InternalTextureMapTask, sizes: Size[], targetRect: Margins, totalPixels: number) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(JSON.stringify({ task, targetRect, sizes }), 'binary' as any);
  const dig1 = sha1.digest('hex');

  return workers.binPackerWorker({
    sizes,
    totalPixels,
    fromX: targetRect.left,
    toX: targetRect.right,
    fromY: targetRect.top,
    toY: targetRect.bottom,
    gridStep: task.gridStep,
    paddingX: task.paddingX,
    paddingY: task.paddingY,
  });
}

function findBestLayout(layouts: (Layout | null)[]) {
  // remove nulls and layouts with empty area (width = 0, height = 0) <-- TODO: how can we have that?
  layouts = layouts.filter(layout => layout && getArea(layout) > 0);

  let bestLayout: Layout | null = null;
  for (const layout of layouts) {
    if (bestLayout) {
      const layoutArea = getArea(layout!);
      const bestLayoutArea = getArea(bestLayout);
      if (layoutArea < bestLayoutArea || (layoutArea === bestLayoutArea && getHash(layout) < getHash(bestLayout))) {
        bestLayout = layout;
      }
    } else {
      bestLayout = layout;
    }
  }

  return bestLayout;
}

function getTextureMap(task: InternalTextureMapTask, loadedFiles: Record<string, LoadedFile>, layout: Layout): TextureMap {
  const rects = Array.from(layout.rects);

  const files = task.files;
  const textures = files.reduce<TextureMap['textures']>((acc, file) => {
    const loadedFile = loadedFiles[file];
    const index = rects.findIndex(rect => rect.width === loadedFile.width && rect.height === loadedFile.height);
    if (index === -1) throw new Error(`Error: no placement for file ${file}`);
    acc[file] = rects.splice(index, 1)[0];
    return acc;
  }, {});

  return {
    file: task.textureMapFile,
    width: layout.width,
    height: layout.height,
    repeatX: task.repeatX,
    repeatY: task.repeatY,
    textures,
    dataURI: null,
  }
}

function getShuffledArray<T>(arr: ReadonlyArray<T>) {
  const shuffled = Array.from(arr);
  for (let i = 0; i < shuffled.length - 1; i++) {
    const l = shuffled.length;
    const index = ((Math.random() * (l - i)) | 0) + i;

    const tmp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = tmp;
  }

  return shuffled;
}

function checkFiles(task: InternalTextureMapTask, sizes: Size[]): Margins {
  if (task.repeatX && task.repeatY) {
    throw new Error('TextureMapGenerator#_checkFiles: Sprite can\'t be repeat-x and repeat-y at the same time');
  }

  let left = 4;
  let right = task.dimensions.maxX;
  let top = 4;
  let bottom = task.dimensions.maxY;

  if (task.repeatX) {
    left = right = sizes[0].width;
    sizes.forEach(file => {
      if (file.width !== left) {
        throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${task.folder} should have the same width to repeat by X axis`);
      }
    });
  }

  if (task.repeatY) {
    top = bottom = sizes[0].height;
    sizes.forEach(file => {
      if (file.height !== top) {
        throw new Error(`TextureMapGenerator#_checkFiles: All images in folder ${task.folder} should have the same height to repeat by Y axis`);
      }
    });
  }

  return { left, right, top, bottom };
}


function getArea(layout: Layout) {
  return layout.width * layout.height;
}