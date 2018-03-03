import pify from 'pify';
import * as crypto from 'crypto';
import * as path from 'path';
import { LoadedFile } from '../containers/loadedFile';
import { TextureMapGenerator } from '../../texturer/textureMapGenerator';
import { FileDimensions, Texture, TextureMap } from '../containers/textureMap';
import { encodeBuffer } from './dataURI';
import { workers } from '../../texturer/workers';
import { InternalConfig, InternalTextureMapTask } from '../../texturer/config';

interface Callback {
  (error: string | Error | null, result: null): void;
  (error: null, result: TextureMap[] | null): void;
}

// TODO: refactor
export async function textureMapTaskRunner(config: InternalConfig, textureMapTask: InternalTextureMapTask, loadedFiles: { [fileName: string]: LoadedFile }) {
  // private _textureMapTask: InternalTextureMapTask;
  // private _loadedFiles: { [fileName: string]: LoadedFile };
  // private _callback: Callback;
  // private _globalConfig: InternalConfig;

  // constructor(globalConfig: InternalConfig, textureMapTask: InternalTextureMapTask, loadedFiles: { [fileName: string]: LoadedFile }, callback: Callback) {
  //   this._globalConfig = globalConfig;
  //   this._textureMapTask = textureMapTask;
  //   this._loadedFiles = loadedFiles;
  //   this._callback = callback;
  // }

  // run() {

  let textureMap;
  try {
    const textureMapGenerator = new TextureMapGenerator();
    // TODO: temporary promisify
    textureMap = await pify(textureMapGenerator.generateTextureMap.bind(textureMapGenerator))(loadedFiles, textureMapTask);
  } catch (error) {
    // TODO: do texture map size configurable!!
    throw new Error('Texture Generator: Can\'t pack texture map for folder \'' + textureMapTask.folder + '\' - too large art. Split images into 2 or more folders!');
  }
  return await compressTextureMapImage(textureMap, textureMapTask, loadedFiles, config);
}

async function compressTextureMapImage(textureMap: TextureMap, textureMapTask: InternalTextureMapTask, loadedFiles: { [fileName: string]: LoadedFile }, config: InternalConfig) {
  console.log(textureMapTask.textureMapFile + ': w = ' + textureMap.width + ', h = ' + textureMap.height + ', area = ' + (textureMap.width * textureMap.height));

  // TODO: what type here?
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

  const filterTypes = [0, 1, 2, 3, 4];
  let filterCount = 0;

  const promises = filterTypes.map(async (filterType) => {
    const data = {
      // TODO: integrate with new compress object properties
      textureArray,
      options: textureMapTask.compression,
      filterType,
      width: textureMap.width,
      height: textureMap.height,
    };

    return workers.compressImageWorker(data);
  });

  const results = await Promise.all(promises)

  // check which image is better compressed
  const compressedImages = results.map(result => new Buffer(result.compressedPNG));
  const bestCompressedImage = compressedImages.sort((a, b) => a.length - b.length)[0];
  return await onTextureMapImageCompressed(textureMap, bestCompressedImage, textureMapTask, config);
}

async function onTextureMapImageCompressed(textureMapImage: TextureMap, compressedImage: Buffer, textureMapTask: InternalTextureMapTask, config: InternalConfig) {
  if (textureMapTask.compression.tinyPNG) {
    const result = await workers.tinyPngWorker({
      content: Array.prototype.slice.call(compressedImage, 0),
      // TODO: create property configFileName
      configFile: './config.json',
    })

    compressedImage = new Buffer(result);
  }
  return await createDataURI(textureMapImage, compressedImage, textureMapTask, config);
}

async function createDataURI(textureMap: TextureMap, compressedImage: Buffer, textureMapTask: InternalTextureMapTask, config: InternalConfig) {
  let dataURI: string | null = null;
  if (textureMapTask.dataURI.enable) {
    dataURI = encodeBuffer(compressedImage, 'image/png');
    if (textureMapTask.dataURI.maxSize !== null) {
      if (dataURI.length >= textureMapTask.dataURI.maxSize) {
        dataURI = null;
      }
    }
  }

  textureMap.dataURI = dataURI;

  const skipFileWrite = dataURI && !textureMapTask.dataURI.createImageFileAnyway;
  if (!skipFileWrite) {
    // write png
    const file = path.join(config.folders.rootToIndexHtml, textureMapTask.textureMapFile);
    const data = {
      file,
      content: Array.prototype.slice.call(compressedImage, 0),
    };

    await workers.writeFileWorker(data);
  }

  return [textureMap];
}

