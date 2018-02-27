import * as fs from 'fs';
import * as path from 'path';
import { FSHelper } from './fsHelper';
import * as jpegEngine from 'jpeg-js';
import * as bmpEngine from 'bmp-js';
import { PNG as pngEngine } from '../../../extern/node-png';
const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'bmp'];

export class ImageHelper {
  static isImageFileSupported(fileName: string) {
    const isFile = fs.statSync(fileName).isFile();
    return isFile && supportedImageExtensions.indexOf(FSHelper.getExtension(fileName).toLocaleLowerCase()) >= 0;
  }

  static readImageFile(file: string, callback: any, thisArg?: any) {
    const fileNameWithoutExt = FSHelper.getFileNameWithoutExtension(file);
    const testFileNameForJavaScriptIdentifier = /^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g;

    if (testFileNameForJavaScriptIdentifier.test(fileNameWithoutExt)) {
      callback.call(thisArg, new Error('Incorrect file name ' + fileNameWithoutExt + ' (file: ' + file + ')'), null);
    }

    if (!ImageHelper.isImageFileSupported(file)) {
      callback.call(thisArg, new Error('Supported files: *.' + supportedImageExtensions.join(', *.') + '. File ' + file + ' is not supported.'), null);
    }

    switch (FSHelper.getExtension(file).toUpperCase()) {
      case 'JPEG':
      case 'JPG':
        fs.readFile(file, function (error: any, data: any) {
          if (error) {
            callback.call(thisArg, new Error('FS: Can\'t read file ' + file + ', error: ' + error), null);
            return;
          }

          // read jpeg
          let textureJpeg;
          try {
            textureJpeg = jpegEngine.decode(data);
          } catch (e) {
            callback.call(thisArg, new Error('JPG: Can\'t decode file ' + file + ', error: ' + e), null);
            return;
          }

          // create png
          const texturePng = new pngEngine(
            {
              filterType: 0,
              width: textureJpeg.width,
              height: textureJpeg.height,
            },
          );

          // convert data from jpg_plugin (rgb) to png_plugin (rgb)
          for (let i = 0; i < textureJpeg.data.length; i += 4) {
            texturePng.data[i] = textureJpeg.data[i];
            texturePng.data[i + 1] = textureJpeg.data[i + 1];
            texturePng.data[i + 2] = textureJpeg.data[i + 2];
            texturePng.data[i + 3] = textureJpeg.data[i + 3];
          }
          callback.call(thisArg, null, texturePng);
        });
        break;

      case 'PNG':
        fs.createReadStream(file)
          .pipe(new pngEngine({
            filterType: 0,
          }))
          .on('parsed', function (this: any) {
            callback.call(thisArg, null, this);
          })
          .on('error', function (error: any) {
            callback.call(thisArg, new Error('PNG: Can\'t decode file ' + file + ', error: ' + error), null);
          });
        break;

      case 'BMP':
        fs.readFile(file, function (error: any, data: any) {
          if (error) {
            callback.call(thisArg, new Error('File system error: Can\'t read file ' + file + ', error: ' + error), null);
            return;
          }

          // read bmp
          let textureBmp;
          try {
            textureBmp = bmpEngine.decode(data);
          } catch (e) {
            callback.call(thisArg, new Error('BMP: Can\'t decode file ' + file + ', error: ' + e), null);
            return;
          }

          // create png
          const texturePng = new pngEngine(
            {
              filterType: 0,
              width: textureBmp.width,
              height: textureBmp.height,
            },
          );

          // convert data from bmp_plugin (bgr) to png_plugin (rgb)
          for (let i = 0; i < textureBmp.data.length; i += 4) {
            texturePng.data[i] = textureBmp.data[i + 2];
            texturePng.data[i + 1] = textureBmp.data[i + 1];
            texturePng.data[i + 2] = textureBmp.data[i];
            texturePng.data[i + 3] = textureBmp.data[i + 3];
          }

          callback.call(thisArg, null, texturePng);
        });
        break;
    }
  }

  static trimImage(png: any, alphaThreshold: number) {
    const nonTransparentPixelsOpacity = alphaThreshold;
    let width = png.width;
    let height = png.height;
    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    // from left
    for (let x = 0, foundNonTransparentPixel = false; x < width; x++ , left++) {
      // vertical test
      for (let y = 0; y < height; y++) {
        const base = (width * y + x) << 2;
        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from right
    for (let x = width - 1, foundNonTransparentPixel = false; x >= left; x-- , right++) {
      // vertical test
      for (let y = 0; y < height; y++) {
        const base = (width * y + x) << 2;
        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from top
    for (let y = 0, foundNonTransparentPixel = false; y < height; y++ , top++) {
      // vertical test
      for (let x = 0; x < width; x++) {
        const base = (width * y + x) << 2;
        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from bottom
    for (let y = height - 1, foundNonTransparentPixel = false; y >= top; y-- , bottom++) {
      // vertical test
      for (let x = 0; x < width; x++) {
        const base = (width * y + x) << 2;
        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // fix: if we have empty image - we should made width at least 1 px
    if (left + right === width) {
      if (left > 0) {
        left--;
      } else {
        right--;
      }
    }

    // fix: if we have empty image - we should made height at least 1 px
    if (top + bottom === height) {
      if (top > 0) {
        top--;
      } else {
        bottom--;
      }
    }

    width = width - left - right;
    height = height - top - bottom;

    // create png
    const texturePng = new pngEngine({
      width,
      height,
      filterType: 0,
    });

    png.bitblt(texturePng, left, top, width, height, 0, 0);

    return {
      png: texturePng,
      width,
      height,
      trim: { left, right, top, bottom },
    };
  }

  static isOpaque(png: any) {
    // from left
    for (let x = 0; x < png.width; x++) {
      // vertical test
      for (let y = 0; y < png.height; y++) {
        const base = (png.width * y + x) << 2;
        if (png.data[base + 3] < 255) {
          return false;
        }
      }
    }
    return true;
  }

}
