import { PNG as pngEngine } from '../../extern/node-png';

export function compressImageWorker(taskData: any, callback: any) {
  // TODO: make these options via CompressionOptions class and remove usage of helper.extend, also remove extend at all

  const extend = function (origin: any, add: any) {
    // Don't do anything if add isn't an object
    if (!add || typeof add !== 'object') return origin;

    for (const key of Object.keys(add)) {
      origin[ key ] = add[ key ];
    }

    return origin;
  };

  const options = extend(extend({}, taskData.options), {
    filterType: taskData.filterType,
    width: taskData.width,
    height: taskData.height,
    fill: true,
  });

  const png = new pngEngine(options);
  taskData.textureArray.forEach(function (texture: any) {
    const texturePng = new pngEngine({
      width: texture.width,
      height: texture.height,
      fill: true,
    });

    texturePng.data = new Buffer(texture.bitmapSerialized); // bitmap.getRGBABuffer();
    texturePng.bitblt(png, 0, 0, texture.width, texture.height, texture.x, texture.y);
  });

  const stream = png.pack();
  const chunks: Buffer[] = [];

  stream.on('data', function (chunk: Buffer) {
    chunks.push(chunk);
  });

  stream.on('end', () => {
    callback(undefined, { compressedPNG: Array.prototype.slice.call(Buffer.concat(chunks), 0), filterType: options.filterType });
  });

}
