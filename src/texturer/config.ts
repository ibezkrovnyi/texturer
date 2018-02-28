import Ajv from 'ajv';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parse } from 'jsonc-parser';
import schema from './configSchema.json';
import { FSHelper as fsHelper } from '../shared/utils/fsHelper';

export interface Config {
  folders: {
    source: string;
    target: string;
    wwwRoot: string;
  };
  excludePattern?: string;
  templates: string[];
  taskDefaults?: TaskDefaults;
  copyTasks?: CopyTask[];
  textureMapTasks?: TextureMapTask[];
  tinypngApiKeys?: Array<{
    used: number;
    month: number;
    year: number;
    key: string;
  }>;
}

export interface InternalConfig {
  folders: {
    source: string;
    target: string;
    wwwRoot: string;

    rootFrom: string;
    rootTo: string;
    rootToIndexHtml: string;
    root: string;
  };
  excludePattern?: string;
  templates: string[];
  copyTasks: InternalCopyTask[];
  textureMapTasks: InternalTextureMapTask[];
  tinypngApiKeys: Array<{
    used: number;
    month: number;
    year: number;
    key: string;
  }>;
}

export interface TaskDefaults {
  bruteForceTime?: number;
  trim?: Trim;
  dataURI?: DataURI;
  gridStep?: number;
  paddingX?: number;
  paddingY?: number;
  compression?: Compression;
  dimensions?: Dimensions;
}

export interface CopyTask {
  folder: string;
  dataURI?: DataURI;
}

export interface InternalCopyTask {
  folder: string;
  dataURI: InternalDataURI;
  files: string[];
}

export interface TextureMapTask {
  trim?: Trim;
  repeatX?: boolean;
  compression?: Compression;
  bruteForceTime?: number;
  repeatY?: boolean;
  dataURI?: DataURI;
  dimensions?: Dimensions;
  folder: string;
  gridStep?: number;
  paddingX?: number;
  paddingY: number;
  textureMapFile?: string;
}

export interface InternalTextureMapTask {
  trim: InternalTrim;
  repeatX: boolean;
  compression: Compression;
  bruteForceTime: number;
  repeatY: boolean;
  dataURI: InternalDataURI;
  dimensions: InternalDimensions;
  folder: string;
  gridStep: number;
  paddingX: number;
  paddingY: number;
  textureMapFile: string;
  files: string[];
}

export interface DataURI {
  enable?: boolean;
  maxSize?: number;
  createImageFileAnyway?: boolean;
}

export interface InternalDataURI {
  enable: boolean;
  maxSize: number;
  createImageFileAnyway: boolean;
}

export interface Compression {
  tinyPNG?: boolean;
}

export interface InternalCompression {
  tinyPNG: boolean;
}

export interface Dimensions {
  maxX?: number;
  maxY?: number;
}

export interface InternalDimensions {
  maxX: number;
  maxY: number;
}

export interface Trim {
  enable?: boolean;
  alpha?: number;
}

export interface InternalTrim {
  enable: boolean;
  alpha: number;
}

export function validateConfig(config: Config | string) {
  if (typeof config === 'string') {
    config = parse(config) as Config;
  }

  // fs.writeFileSync('__parsed.json', JSON.stringify(config, undefined, 2), 'utf8');

  const originalConfig = JSON.parse(JSON.stringify(config)) as Config;

  // new instance required for empty error list
  const ajv = new Ajv({ useDefaults: true, allErrors: true });
  const validate = ajv.compile(schema);

  // validate and apply default values from schema
  const valid = validate(config);
  if (!valid) {
    throw new Error(JSON.stringify(validate.errors, undefined, 2));
  }

  const internalConfig = getInternalConfig(config as any, originalConfig);

  // fs.writeFileSync('__validated.json', JSON.stringify(internalConfig, undefined, 2), 'utf8');

  return internalConfig;
}

function getInternalConfig(validatedConfig: InternalConfig, originalConfig: Config) {
  // set default textureMap filenames manually
  let id = 0;
  validatedConfig.textureMapTasks.forEach(task => task.textureMapFile = task.textureMapFile || `textureMap${id++}.png`);

  // apply task-defaults to each copy and textureMap task
  const originalTaskDefaults = originalConfig.taskDefaults || {};
  const originalTextureMapTasks = originalConfig.textureMapTasks;
  if (originalTextureMapTasks) {
    validatedConfig.textureMapTasks.forEach((task, index) => Object.keys(task).forEach(key => {
      const originalTextureMapTask = originalTextureMapTasks[index];
      const useDefaults = !(key in originalTextureMapTask) && key in originalTaskDefaults;
      if (useDefaults) {
        (task as any)[key] = (originalTaskDefaults as any)[key];
      }
    }));
  }

  const originalCopyTasks = originalConfig.copyTasks;
  if (originalCopyTasks) {
    validatedConfig.copyTasks.forEach((task, index) => Object.keys(task).forEach(key => {
      const originalCopyTask = originalCopyTasks[index];
      const useDefaults = !(key in originalCopyTask) && key in originalTaskDefaults;
      if (useDefaults) {
        (task as any)[key] = (originalTaskDefaults as any)[key];
      }
    }));
  }

  // add files
  for (const task of [...validatedConfig.copyTasks, ...validatedConfig.textureMapTasks]) {
    task.files = getFiles(task.folder, validatedConfig);
  }

  // add some folders
  const rootFolder = process.cwd();
  validatedConfig.folders.root = rootFolder;
  validatedConfig.folders.rootFrom = path.join(rootFolder, validatedConfig.folders.source);
  validatedConfig.folders.rootTo = path.join(rootFolder, validatedConfig.folders.target);
  validatedConfig.folders.rootToIndexHtml = path.join(rootFolder, validatedConfig.folders.target, validatedConfig.folders.wwwRoot);

  return validatedConfig;
}

function getFiles(folder: string, config: InternalConfig) {
  const fullFolder = path.resolve(path.join(config.folders.source, folder));

  let filter = null;
  if (config.excludePattern) {
    const regex = new RegExp(config.excludePattern, 'gi');
    filter = function (name: string) {
      regex.lastIndex = 0;
      return regex.test(name);
    };
  }

  const files = fsHelper.getFilesInFolder(fullFolder, filter, true).map(file => {
    return path.join(folder, file).replace(/\\/g, '/');
  });

  if (files.length <= 0) {
    throw new Error('no files in fullfolder ' + folder);
  }
  return files;
}
