Texturer
========
Texture Map Generator in JavaScript (node.js, multithreading) is image processing tool that generates texture maps for image sets. It also generates javascript texture maps description file and is able to copy whole directory without processing, but fills texture map description file with image parameters.

How To Install from GitHub
==========================
1) click `Download ZIP`, download and unpack zip archive with Texturer

2) run `npm install` in root folder of texturer (where package.json is located)

How To Install from npm
=======================
run `npm install -g texturer` from command-line

Usage
=====
run `texturer` in folder with config.json (see `example` folder)

Usage from Code
===============
```js
var fs         = require("fs"),
	Texturer   = require("<path to texturer src/index.js>"),
	configFile = "./config.json",
	texturer   = new Texturer(),
	configJSONString;

try {
	configJSONString = fs.readFileSync(configFile, "utf8");
} catch (e) {
	throw new Error("CFG: Can't read config file \"" + configFile + "\n");
}

texturer.generate(configJSONString, function (error) {
	if (error) {
		console.trace("\x1B[91m" + error + "\x1B[39m");
		process.exit(42);
	} else {
		process.exit(0);
	}
}, null);
```

Node-Webkit and Cluster Module
==============================
Due to issues in node-webkit you will need to do some [additional steps](https://groups.google.com/forum/#!topic/node-webkit/OEZxArpmLNo):
* in some node file (which is required from web javascript file) you should set execPath to node.exe instead of nw.exe
```js
var path = require("path");
process.execPath = path.join(path.dirname(process.execPath), '..', 'folder_with_node_exe', 'node.exe');
```
* on cluster initialization you will need to set `silent` attribute to `true`
```js
cluster.setupMaster({
    'exec': __dirname + '/worker.js',
    'silent': true
});
```

Supported file formats
======================
**input:** png, jpeg (.jpeg, .jpg), bmp

**output:** png (or original image file if `copy` task parameter is set to `true`)

TinyPNG.com Service
===================
[tinypng.com service](http://tinypng.com) does advanced lossy compression for PNG images that preserves full alpha transparency.

To use it you will need to receive [API key](https://tinypng.com/developers).
It is free of charge for convert up to 500 images per month. So, up to 500 texture maps, which is more than enough.

####License
create (or edit) next section in `config.json`:
```json
"tinypng-api-keys": [
	{
		"used": 0,
		"month": 0,
		"year": 0,
		"key": "fhdskaj89fdsfds8a7f89dsa78df7as-"
	}
]
```
> After first use of tinypng.com service this information will be updated with correct month/year/used values.

####Usage
To enable tinypng conversion you need to set `tinypng : true` in task for texture map generation

config.json format
==================
> _note: all folders described below are **relative to current working directory**_

property                    | value
--------------------------- | -----------
nameSpace                   | is just a javascript namespace to which array that represents all textures will be appended. See first line of generated texturePool.js for understanding
folders                     | specifies folders configuration
folders.resources(in)       | resources folder from which all input folders with images taken
folders.images(out)         | folder to which all generated textureMap files put. Also it receives folders with images that are just copied
folders.images(index.html)  | path to `folders.images(out)` relative to index.html (server's root)
base64                      | encode image files (just copied and textureMaps) using dataURI scheme if base64 size < 32K (global)
compression                 | set compression options (see below) for texture map images (global)
tasks                       | array of tasks to perform

## TASK FORMAT FOR COPYING FILES

property                    | value
--------------------------- | -----------
copy                        | `true` means _"turn copy-only mode ON"_, `false or omitted` - _"turn copy-only mode OFF"_ (`default: false`).
folder(in)                  | folder with images. all images will be copied to the `folders.resources(in)/folder(in)` folder

> Each image in `folder(in)` will be loaded, image width and height will be added to `description file`

## TASK FORMAT FOR TEXTURE MAP GENERATION

property                    | value
--------------------------- | -----------
folder(in)                  | folder with images. all images will be used to generate `folders.images(out)/folder(in)` folder
texture-map(out)            | file path and name to destination file for texture map image (`output format: png`)
repeat-x                    | `true` means images will be combined into **vertical** texture map to enable application to use _backgroundRepeat: repeatX_ for any of textures generated from `folders.resources(in)/folder(in)`
repeat-y                    | `true` means images will be combined into **horizontal** texture map to enable application to use _backgroundRepeat: repeatY_ for any of textures generated from `folders.resources(in)/folder(in)`.
n-pass                      | number of approaches to try for texture map after default algorithm is finished. `0 or omitted` means do not try non-default approaches. `positive value (1 - ∞)` will trigger additional passes with goal to find most optimal textures positioning on texture map.
base64                      | encode all copied image files (in case `copy : true;`) or texture map image using dataURI scheme (only if base64 size < 32K)
compression                 | set compression options (see below) for texture map image

> `repeat-x`: all images inside `folder(in)` folder should have the **same width**

> `repeat-y`: all images inside `folder(in)` folder should have the **same height**

compression
===========
`tinypng` - `false` (default) or `true` - use tinypng.com service (see above)

`palette` - `null` or `palette options object` (see below) (`default: null`)

palette options object
======================
option                          | description
--------------------------------|------------
`colors`                        | # of colors in desired palette. colors number <= 256 will result in 8bit indexed png.
`quantizationMethod`            | histogram method, `2`: min-population threshold within sub-regions; `1`: global top-population (`default: 2`)
`ditheringKernel`               | dithering kernel name, see available kernels below (`default: null`),
`useSerpentineDitheringPattern` | use serpentine dithering (`true` or `false`) (`default: false`)
`minimumHueColors`              | # of colors per hue group to evaluate regardless of counts, to retain low-count hues

dithering kernels
=================
* `"FloydSteinberg"`
* `"FalseFloydSteinberg"`
* `"Stucki"`
* `"Atkinson"`
* `"Jarvis"`
* `"Burkes"`
* `"Sierra"`
* `"TwoSierra"`
* `"SierraLite"`

config.json example
===================
```json
{
  "nameSpace"      : "MyGame",
  "folders"        : {
	"resources(in)"     : "app/resources",
  	"images(out)"       : "app/source/images"
  },
  "texturePool.js" : "app/source/js/texturePool.js",
  "tasks" : [
    {
      "folder(in)"       : "lviv-ukraine-backgrounds",
      "copy"             : true
    },
    {
      "folder(in)"       : "creative-nerds-wooden-icons",
      "texture-map(out)" : "creative-nerds-wooden-icons.png"
    },
    {
      "folder(in)"       : "woocons1",
      "texture-map(out)" : "woocons1.png"
    },
    {
      "folder(in)"       : "zoom-eyed-creatures",
      "texture-map(out)" : "zoom-eyed-creatures.png",
      "n-pass"           : 10
    },
    {
      "folder(in)"       : "buttons",
      "texture-map(out)" : "buttons.png",
      "repeat-x"         : true
    }
  ]
}
```

TODO
====
1) interlaced jpeg decoding (?)

2) ability to work only in memory without writing image files to disk. usable for ui tools

3) notify all maintainers of used js modules with fixed code

Change Log
============

### 0.0.10 - 2 Nov 2014
  - clusterQueue fixed
  - code cleanup
  - possibility to require `texturer` module from code
  - fixed copy files task - now it copies files, not just creates links

### 0.0.9 - 31 Oct 2014
  - published to npm

### 0.0.6 - 31 Oct 2014
  - tinypng.com service integrated
  - code cleanup

### 0.0.5 - 28 Oct 2014
  - trim support added

### 0.0.4 - 23 Oct 2014
  - image compression options added
  - small bugs fixed
  - code cleanup

### 0.0.3 - 22 Oct 2014
  - Code cleanup
  - texturePool.js: texture map image should be in url instead of image file name itself
  - url is now escaped (encodeURI)
  - handlebars templates implemented (/src/templates/*.hbs)
  - optional base64 encoding implemented

### 0.0.2 - 19 Oct 2014
  - Code cleanup, small fixes

### 0.0.1 - 19 Oct 2014
  - First version

Credits
=======

####Example Images were taken from:
* http://www.iconarchive.com/show/wooden-social-icons-by-creativenerds.html
* http://www.iconarchive.com/show/woocons-icons-by-janik-baumgartner.html
* http://www.iconarchive.com/show/zoom-eyed-creatures-icons-by-turbomilk.html

####Palette Quantization
* NeuQuant with alpha: https://github.com/stuart/pngnq/blob/master/src/neuquant32.c (ported to JavaScript, need more work...)

* RgbQuant with alpha: https://github.com/leeoniya/RgbQuant.js, modified to support alpha channel

* TinyPNG.com sevice: https://tinypng.com, API implemented

####Image decoders/encoders:
* node-png: https://github.com/leogiese/node-png (version "0.4.3" is used, but adopted to be able to save to 8bit png. Also implemented ability to reduce number of colors even for 32bit png)

* bmp-js: https://www.npmjs.org/package/bmp-js (fixed issues with 8bit indexed colorType read)

* jpeg-js: https://github.com/eugeneware/jpeg-js

License
=========

The MIT License (MIT)

Copyright (c) 2014 Igor Bezkrovny

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
