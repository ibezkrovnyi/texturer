import pify from 'pify';
import * as crypto from 'crypto';
import * as path from 'path';
import { LoadedFiles } from '../containers/loadedFile';
import { generateTextureMap } from '../../texturer/textureMapGenerator';
import { Size, TextureMap } from '../containers/textureMap';
import { encodeBuffer } from './dataURI';
import { workers } from '../../texturer/workers';
import { InternalConfig, InternalTextureMapTask } from '../../texturer/config';

export async function runTextureMapTask(task: InternalTextureMapTask, loadedFiles: LoadedFiles, config: InternalConfig) {
  const textureMap = await generateTextureMap(task, loadedFiles);
  let compressedImage = await compressTextureMapImage(task, loadedFiles, config, textureMap);

  if (task.compression.tinyPNG) { 
    const result = await workers.tinyPngWorker({
      content: Array.prototype.slice.call(compressedImage, 0),
      // TODO: create property configFileName
      configFile: './config.json',
    })

    compressedImage = Buffer.from(result);
  }
  return createDataURI(task, config, textureMap, compressedImage);
}

async function compressTextureMapImage(task: InternalTextureMapTask, loadedFiles: LoadedFiles, config: InternalConfig, textureMap: TextureMap) {
  console.log(task.textureMapFile + ': w = ' + textureMap.width + ', h = ' + textureMap.height + ', area = ' + (textureMap.width * textureMap.height));

  // TODO: what type is here?
  const textureArray: any[] = [];
  Object.keys(textureMap.textures).forEach(id => {
    const loadedFile = loadedFiles[id];
    const texture = textureMap.textures[id];

    textureArray.push({
      ...texture,
      realWidth: loadedFile.realWidth,
      realHeight: loadedFile.realHeight,
      bitmapSerialized: loadedFile.bitmap,
    });
  });

  const promises = [0, 1, 2, 3, 4].map(async (filterType) => {
    const data = {
      // TODO: integrate with new compress object properties
      textureArray,
      options: task.compression,
      filterType,
      width: textureMap.width,
      height: textureMap.height,
    };

    return workers.compressImageWorker(data);
  });

  const results = await Promise.all(promises);

  // check which image is better compressed
  const compressedImages = results.map(result => Buffer.from(result.compressedPNG));
  const compressedImagesSortedByArea = compressedImages.sort((a, b) => a.length - b.length);
  return compressedImagesSortedByArea[0];
}

async function createDataURI(task: InternalTextureMapTask, config: InternalConfig, textureMap: TextureMap, compressedImage: Buffer) {
  let dataURI: string | null = null;
  if (task.dataURI.enable) {
    dataURI = encodeBuffer(compressedImage, 'image/png');
    if (task.dataURI.maxSize !== null) {
      if (dataURI.length >= task.dataURI.maxSize) {
        dataURI = null;
      }
    }
  }

  textureMap.dataURI = dataURI;

  const skipFileWrite = dataURI && !task.dataURI.createImageFileAnyway;
  if (!skipFileWrite) {
    // write png
    const file = path.join(config.folders.rootToIndexHtml, task.textureMapFile);
    const data = {
      file,
      content: Array.prototype.slice.call(compressedImage, 0),
    };

    await workers.writeFileWorker(data);
  }

  return [textureMap];
}

