// Copyright (c) 2012 Kuba Niegowski
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var util = require('util'),
  Stream = require('stream'),
  zlib = require('zlib'),
  Filter = require('./filter'),
  CrcStream = require('./crc'),
  constants = require('./constants'),
  RgbQuant = require('./rgbquant.js');

var Packer = (module.exports = function(options) {
  Stream.call(this);

  this._options = options;

  options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
  options.deflateLevel = options.deflateLevel || 9;
  options.deflateStrategy = options.deflateStrategy || 3;
  options.usePalette = false;
  if (typeof options.palette !== 'undefined') {
    if (typeof options.palette.colors === 'number') {
      options.usePalette = true;
    } else {
      throw 'options.palette.colors should be integer number [1..16M]';
    }

    if (typeof options.palette.quantizationMethod !== 'number') {
      options.palette.quantizationMethod = 2;
    }

    if (
      typeof options.palette.ditheringKernel === 'undefined' ||
      options.palette.ditheringKernel === null
    ) {
      options.palette.ditheringKernel = null;
    } else if (
      typeof options.palette.ditheringKernel !== 'string' ||
      !RgbQuant.kernels.hasOwnProperty(options.palette.ditheringKernel)
    ) {
      throw new Error(
        'Possible palette.ditheringKernel values: "' +
          Object.keys(RgbQuant.kernels).join('", "') +
          '"',
      );
    }

    if (typeof options.palette.useSerpentineDitheringPattern !== 'boolean') {
      options.palette.useSerpentineDitheringPattern = false;
    }

    if (typeof options.palette.minimumHueColors !== 'number') {
      options.palette.minimumHueColors = 0;
    }
  }

  if (options.usePalette) {
    if (options.palette.colors <= 256) {
      this._colorType = 3;
    } else {
      this._colorType = 6;
    }
  } else {
    this._colorType = 6;
  }

  this.readable = true;
});
util.inherits(Packer, Stream);

var colorTypeToBppMap = {
  0: 1,
  2: 3,
  3: 1,
  4: 2,
  6: 4,
};

Packer.prototype.pack = function(data, width, height) {
  // Signature
  this.emit('data', new Buffer(constants.PNG_SIGNATURE));
  this.emit('data', this._packIHDR(width, height));

  if (this._options.usePalette) {
    var q = new RgbQuant({
        method: this._options.palette.quantizationMethod,
        colors: this._options.palette.colors,
        initColors: this._options.palette.colors * 2,
        minHueCols: this._options.palette.minimumHueColors,
        dithSerp: this._options.palette.useSerpentineDitheringPattern,
        dithKern: this._options.palette.ditheringKernel,
      }),
      qInputImage = new Buffer(data),
      qData,
      i;

    /*
		var NeuQuant32 = require("./unstable/neuquant32.js");
		var q2=new NeuQuant32({
			samplefac : 30,
			colors : this._options.palette.colors
		});
		q2.sample(qInputImage, width);
		var qPalette = q2.palette(true),
			palette = [];
*/
    q.sample(qInputImage, width);
    var qPalette = q.palette(true),
      palette = [];

    qPalette.forEach(function(item) {
      palette.push([item[0], item[1], item[2], item[3]]);
    });

    switch (this._colorType) {
      case 3:
        var transparentEntriesCount = this._sortTransparentPaletteEntriesFirst(
          palette,
        );

        qData = q.getReduced8(palette, qInputImage, width);
        this.emit('data', this._packPLTE(palette));

        //check if we have transparent pixels inside palette??
        if (transparentEntriesCount > 0) {
          this.emit('data', this._packTRNS(palette, transparentEntriesCount));
        }
        break;

      case 6:
        qData = q.getReduced32(palette, qInputImage, width);
        break;
    }

    data = new Buffer(qData.length);
    for (i = 0; i < qData.length; i++) {
      if (typeof qData[i] === 'undefined') {
        qData[i] = 0;
      }
      data.writeUInt8(qData[i], i);
    }
  }

  // filter pixel data
  var filter = new Filter(
    width,
    height,
    colorTypeToBppMap[this._colorType],
    data,
    this._options,
  );
  data = filter.filter();

  var deflate = zlib.createDeflate({
    chunkSize: this._options.deflateChunkSize,
    level: zlib.Z_BEST_COMPRESSION, //this._options.deflateLevel,
    strategy: zlib.Z_DEFAULT_STRATEGY, //this._options.deflateStrategy
  });

  zlibBuffer(
    deflate,
    data,
    function(err, data) {
      if (!err) {
        this.emit('data', this._packIDAT(data));
        this.emit('data', this._packIEND());
        this.emit('end');
        //console.log(buffer.toString('base64'));
      } else {
        this.emit('error', err);
      }
    }.bind(this),
  );
};

Packer.prototype._sortTransparentPaletteEntriesFirst = function(palette) {
  palette.sort(function(a, b) {
    return a[3] - b[3];
  });

  for (var i = 0; i < palette.length; i++) {
    if (palette[i][3] === 255) {
      return i;
    }
  }
  return palette.length;
};

Packer.prototype._packChunk = function(type, data) {
  var len = data ? data.length : 0,
    buf = new Buffer(len + 12);

  buf.writeUInt32BE(len, 0);
  buf.writeUInt32BE(type, 4);

  if (data) {
    data.copy(buf, 8);
  }

  buf.writeInt32BE(
    CrcStream.crc32(buf.slice(4, buf.length - 4)),
    buf.length - 4,
  );
  return buf;
};

Packer.prototype._packIHDR = function(width, height) {
  var buf = new Buffer(13);
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  buf[8] = 8;
  buf[9] = this._colorType; //6 = truecolor, 3 = 8bit palette; // colorType
  buf[10] = 0; // compression
  buf[11] = 0; // filter
  buf[12] = 0; // interlace

  return this._packChunk(constants.TYPE_IHDR, buf);
};

Packer.prototype._packPLTE = function(palette) {
  var count = palette.length,
    buf = new Buffer(count * 3),
    index = 0;

  for (var i = 0; i < count; i++) {
    var color = palette[i];
    buf.writeUInt8(color[0], index++);
    buf.writeUInt8(color[1], index++);
    buf.writeUInt8(color[2], index++);
  }

  return this._packChunk(constants.TYPE_PLTE, buf);
};

Packer.prototype._packTRNS = function(palette, transparentEntriesCount) {
  var buf = new Buffer(transparentEntriesCount);
  for (var i = 0; i < transparentEntriesCount; i++) {
    var color = palette[i];
    buf.writeUInt8(color[3], i);
  }
  return this._packChunk(constants.TYPE_tRNS, buf);
};

Packer.prototype._packIDAT = function(data) {
  return this._packChunk(constants.TYPE_IDAT, data);
};

Packer.prototype._packIEND = function() {
  return this._packChunk(constants.TYPE_IEND, null);
};

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  engine.on('error', onError);
  engine.on('end', onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once('readable', flow);
  }

  function onError(err) {
    engine.removeListener('end', onEnd);
    engine.removeListener('readable', flow);
    callback(err);
  }

  function onEnd() {
    var buf = Buffer.concat(buffers, nread);
    buffers = [];
    callback(null, buf);
    engine.close();
  }
}
