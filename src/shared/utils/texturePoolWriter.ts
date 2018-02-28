import * as fs from 'fs-extra';
import * as path from 'path';
import handlebars from 'handlebars';
import { FSHelper } from './fsHelper';
import { LoadedFile } from '../containers/loadedFile';
import { TextureMap } from '../containers/textureMap';
import { InternalConfig } from '../../texturer/config';

interface TemplateMap {
  url: string;
  'data-uri': string | null;
  'is-last-item': boolean;
  width: number;
  height: number;
  'repeat-x': boolean;
  'repeat-y': boolean;
}

interface TemplateTexture {
  // "css-id"    : this.getFileNameWithoutExtension(texture.id).replace(/^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, ""),
  id: string;
  file: string;
  'map-index': number;
  url: string;
  'data-uri': string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  'real-width': number;
  'real-height': number;
  trim: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  opaque: boolean;
  'repeat-x': boolean;
  'repeat-y': boolean;
  'is-last-item': boolean;
}

export class TexturePoolWriter {

  writeTexturePoolFile(folderRootTo: string, configParser: InternalConfig, loadedFiles: { [fileName: string]: LoadedFile }, textureMapImages: TextureMap[]) {
    const templateTexturesArray: TemplateTexture[] = [];
    const templateMapsArray: TemplateMap[] = [];
    let usedPixels = 0;
    let trimmedPixels = 0;

    // for each Texture Map
    textureMapImages.forEach(function (map: TextureMap, mapIndex) {
      console.log('map file = ' + map.getFile());
      const url = path.join(configParser.folders.wwwRoot, map.getFile()!).replace(/\\/g, '/');
      const dataURI = map.getDataURI();
      const textureIds = map.getTextureIds();
      const isLastTextureMap = mapIndex + 1 === textureMapImages.length;

      // console.log("map.textureMapImages = " + map.textureMapImages);
      templateMapsArray.push(
        {
          url,
          'data-uri': dataURI,
          'is-last-item': isLastTextureMap,
          width: map.getWidth(),
          height: map.getHeight(),
          'repeat-x': map.getRepeatX(),
          'repeat-y': map.getRepeatY(),
        },
      );

      // for each Texture
      textureIds.forEach((id: string, textureIndex) => {
        const texture = map.getTexture(id);
        const loadedFile = loadedFiles[id];
        const trim = loadedFile.getTrim();
        const isLastTexture = textureIndex + 1 === textureIds.length;

        usedPixels += texture.getWidth() * texture.getHeight();
        trimmedPixels += (trim.left + trim.right) * (trim.top + trim.bottom);

        templateTexturesArray.push({
          // "css-id"    : this.getFileNameWithoutExtension(texture.id).replace(/^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, ""),
          id: FSHelper.getFileNameWithoutExtension(id),
          file: id,
          'map-index': mapIndex,
          url,
          'data-uri': dataURI,
          x: texture.getX(),
          y: texture.getY(),
          width: texture.getWidth(),
          height: texture.getHeight(),
          'real-width': loadedFile.getRealWidth(),
          'real-height': loadedFile.getRealHeight(),
          trim,
          opaque: loadedFile.isOpaque(),
          'repeat-x': map.getRepeatX(),
          'repeat-y': map.getRepeatY(),
          'is-last-item': isLastTexture && isLastTextureMap,
        },
        );
      });
    },
    );

    stableSort(templateMapsArray, (a, b) => {
      return a.url > b.url ? 1 : a.url < b.url ? -1 : 0;
    });
    stableSort(templateTexturesArray, (a, b) => {
      return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
    });
    templateTexturesArray.forEach(texture => templateMapsArray.some((map, mapIndex) => {
      if (map.url === texture.url) {
        texture['map-index'] = mapIndex;
        return true;
      }
      return false;
    }));

    const duplicateFileNamesArray: string[] = [];
    templateTexturesArray.forEach(function (d1, i1) {
      templateTexturesArray.forEach(function (d2, i2) {
        if (d1.id === d2.id && i1 !== i2) {
          duplicateFileNamesArray.push(d1.file);
        }
      });
    });

    console.log('used pixels: ' + usedPixels);
    console.log('trimmed pixels: ' + trimmedPixels);

    const data = {
      maps: templateMapsArray,
      textures: templateTexturesArray,
    };

    console.log('');
    console.log('Template Generation:');

    const templatesFolder = path.join(__dirname, '..', 'templates');
    configParser.templates.forEach(templateFile => {
      // check if template file exists relatively to config.json root folder
      let templateFolderAndFile = path.resolve(configParser.folders.root, templateFile);
      if (!fs.existsSync(templateFolderAndFile)) {

        // check if template file exists relatively texturer/templates
        templateFolderAndFile = path.resolve(templatesFolder, templateFile);
        if (!fs.existsSync(templateFolderAndFile)) {
          console.log(`WARNING: Template ${templateFile} not found in ${configParser.folders.root} nor in ${templatesFolder}`);
          return;
        }
      }

      // if template file is found, use it
      this._exportTexturePoolViaHandlebarsTemplate(folderRootTo, templateFolderAndFile, data);
    });

    return duplicateFileNamesArray;
  }

  private _exportTexturePoolViaHandlebarsTemplate(folderRootTo: string, templateFolderAndFile: string, data: any) {
    let text = fs.readFileSync(templateFolderAndFile, 'utf8');
    if (text && text.length > 0) {
      text = text.replace(/\r/g, '');

      const lines = text.split('\n');
      if (lines.length > 1 && lines[0]) {
        const resultFile = path.resolve(folderRootTo, lines[0]);
        text = lines.slice(1).join('\n');

        console.log(`${templateFolderAndFile} => ${resultFile}`);
        const template = handlebars.compile(text);
        if (template) {
          fs.ensureDirSync(path.dirname(resultFile));
          fs.writeFileSync(resultFile, template(data));
        } else {
          console.log('template error in ' + resultFile);
        }
      }
    }
  }
}

// TODO: extract to utils
function stableSort<T>(arr: T[], compare: (a: T, b: T) => number) {
  var original = arr.slice(0);

  arr.sort((a, b) => {
      const result = compare(a, b);
      return result === 0 ? original.indexOf(a) - original.indexOf(b) : result;
  });

  return arr;
}
