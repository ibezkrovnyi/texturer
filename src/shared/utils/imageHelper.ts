import { FSHelper } from './fsHelper';

var fs = require("fs"),
  path = require("path"),

  jpegEngine = require("jpeg-js"),
  bmpEngine = require("bmp-js"),
  supportedImageExtensions = [ "jpg", "jpeg", "png", "bmp" ],
  pngEngine = require("../../../extern/node-png").PNG;

export class ImageHelper {
  static isImageFileSupported(fileName: string) {
    var isFile = fs.statSync(fileName).isFile();
    return isFile && supportedImageExtensions.indexOf(FSHelper.getExtension(fileName).toLocaleLowerCase()) >= 0;
  }

  static readImageFile(file: string, callback: any, thisArg?: any) {
    var textureBmp,
      textureJpeg,
      texturePng,
      fileNameWithoutExt = FSHelper.getFileNameWithoutExtension(file),
      testFileNameForJavaScriptIdentifier = /^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g,
      i;

    if (testFileNameForJavaScriptIdentifier.test(fileNameWithoutExt)) {
      callback.call(thisArg, new Error("Incorrect file name " + fileNameWithoutExt + " (file: " + file + ")"), null);
    }

    if (!ImageHelper.isImageFileSupported(file)) {
      callback.call(thisArg, new Error("Supported files: *." + supportedImageExtensions.join(", *.") + ". File " + file + " is not supported."), null);
    }

    switch (FSHelper.getExtension(file).toUpperCase()) {
      case "JPEG":
      case "JPG":
        fs.readFile(file, function (error: any, data: any) {
          if (error) {
            callback.call(thisArg, new Error("FS: Can't read file " + file + ", error: " + error), null);
            return;
          }

          // read bmp
          try {
            textureJpeg = jpegEngine.decode(data);
          } catch (e) {
            callback.call(thisArg, new Error("JPG: Can't decode file " + file + ", error: " + e), null);
            return;
          }

          // create png
          texturePng = new pngEngine(
            {
              filterType: 0,
              width: textureJpeg.width,
              height: textureJpeg.height
            }
          );

          // convert data from jpg_plugin (rgb) to png_plugin (rgb)
          for (i = 0; i < textureJpeg.data.length; i += 4) {
            texturePng.data[ i ] = textureJpeg.data[ i ];
            texturePng.data[ i + 1 ] = textureJpeg.data[ i + 1 ];
            texturePng.data[ i + 2 ] = textureJpeg.data[ i + 2 ];
            texturePng.data[ i + 3 ] = textureJpeg.data[ i + 3 ];
          }
          callback.call(thisArg, null, texturePng);
        });
        break;

      case "PNG":
        fs.createReadStream(file)
          .pipe(new pngEngine({
            filterType: 0
          }))
          .on('parsed', function (this: any) {
            callback.call(thisArg, null, this);
          })
          .on('error', function (error: any) {
            callback.call(thisArg, new Error("PNG: Can't decode file " + file + ", error: " + error), null);
          });
        break;

      case "BMP":
        fs.readFile(file, function (error: any, data: any) {
          if (error) {
            callback.call(thisArg, new Error("File system error: Can't read file " + file + ", error: " + error), null);
            return;
          }

          // read bmp
          try {
            textureBmp = bmpEngine.decode(data);
          } catch (e) {
            callback.call(thisArg, new Error("BMP: Can't decode file " + file + ", error: " + e), null);
            return;
          }

          // create png
          texturePng = new pngEngine(
            {
              filterType: 0,
              width: textureBmp.width,
              height: textureBmp.height
            }
          );

          // convert data from bmp_plugin (bgr) to png_plugin (rgb)
          for (i = 0; i < textureBmp.data.length; i += 4) {
            texturePng.data[ i ] = textureBmp.data[ i + 2 ];
            texturePng.data[ i + 1 ] = textureBmp.data[ i + 1 ];
            texturePng.data[ i + 2 ] = textureBmp.data[ i ];
            texturePng.data[ i + 3 ] = textureBmp.data[ i + 3 ];
          }

          callback.call(thisArg, null, texturePng);
        });
        break;
    }
  }

  static trimImage(png: any, alphaThreshold: number) {
    var width = png.width,
      height = png.height,
      nonTransparentPixelsOpacity = alphaThreshold,
      left = 0,
      right = 0,
      top = 0,
      bottom = 0,
      foundNonTransparentPixel,
      base,
      x,
      y;

    // from left
    for (x = 0, foundNonTransparentPixel = false; x < width; x++, left++) {
      // vertical test
      for (y = 0; y < height; y++) {
        base = (width * y + x) << 2;
        if (png.data[ base + 3 ] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from right
    for (x = width - 1, foundNonTransparentPixel = false; x >= left; x--, right++) {
      // vertical test
      for (y = 0; y < height; y++) {
        base = (width * y + x) << 2;
        if (png.data[ base + 3 ] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from top
    for (y = 0, foundNonTransparentPixel = false; y < height; y++, top++) {
      // vertical test
      for (x = 0; x < width; x++) {
        base = (width * y + x) << 2;
        if (png.data[ base + 3 ] > nonTransparentPixelsOpacity) {
          foundNonTransparentPixel = true;
          break;
        }
      }
      if (foundNonTransparentPixel) {
        break;
      }
    }

    // from bottom
    for (y = height - 1, foundNonTransparentPixel = false; y >= top; y--, bottom++) {
      // vertical test
      for (x = 0; x < width; x++) {
        base = (width * y + x) << 2;
        if (png.data[ base + 3 ] > nonTransparentPixelsOpacity) {
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
    var texturePng = new pngEngine(
      {
        filterType: 0,
        width: width,
        height: height
      }
    );

    png.bitblt(texturePng, left, top, width, height, 0, 0);

    return {
      png: texturePng,
      width: width,
      height: height,
      trim: { left: left, right: right, top: top, bottom: bottom }
    }
  }

  static isOpaque(png: any) {
    var width = png.width,
      height = png.height,
      base,
      x,
      y;

    // from left
    for (x = 0; x < width; x++) {
      // vertical test
      for (y = 0; y < height; y++) {
        base = (width * y + x) << 2;
        if (png.data[ base + 3 ] < 255) {
          return false;
        }
      }
    }
    return true;
  }

}
