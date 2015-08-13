/// <reference path='../node.d.ts' />
///<reference path="../node.d.ts"/>
var MultiTask;
(function (MultiTask) {
    var Worker = (function () {
        function Worker() {
            var _this = this;
            process.on("message", function (data) {
                var d = require('domain').create();
                d.on('error', function (error) {
                    _this._sendError(error);
                });
                d.run(function () {
                    _this._onData(data);
                });
            });
            process.send("online");
        }
        Worker.prototype._onData = function (data) {
        };
        Worker.prototype._sendError = function (error) {
            var text = error.message + '\n' + error.stack;
            process.send({ error: text, data: null });
        };
        Worker.prototype._sendData = function (data) {
            process.send({ error: null, data: data });
        };
        return Worker;
    })();
    MultiTask.Worker = Worker;
})(MultiTask || (MultiTask = {}));
var Texturer;
(function (Texturer) {
    var Containers;
    (function (Containers) {
        var Rect = (function () {
            function Rect() {
            }
            return Rect;
        })();
        Containers.Rect = Rect;
    })(Containers = Texturer.Containers || (Texturer.Containers = {}));
})(Texturer || (Texturer = {}));
///<reference path="rect.ts"/>
var Texturer;
(function (Texturer) {
    var Containers;
    (function (Containers) {
        var FileDimensions = (function () {
            function FileDimensions(id, width, height) {
                this.id = id;
                this.width = width;
                this.height = height;
            }
            return FileDimensions;
        })();
        Containers.FileDimensions = FileDimensions;
        var TextureImage = (function () {
            function TextureImage() {
                this._realWidth = 0;
                this._realHeight = 0;
                this._bitmap = null;
                this._trim = null;
                this._opaque = false;
            }
            TextureImage.prototype.setData = function (realWidth, realHeight, bitmap, trim, isOpaque) {
                this._realWidth = realWidth;
                this._realHeight = realHeight;
                this._bitmap = bitmap;
                this._trim = trim;
                this._opaque = isOpaque;
            };
            TextureImage.prototype.getOpaque = function () {
                return this._opaque;
            };
            TextureImage.prototype.getTrim = function () {
                return this._trim;
            };
            TextureImage.prototype.getBitmap = function () {
                return this._bitmap;
            };
            TextureImage.prototype.getRealHeight = function () {
                return this._realHeight;
            };
            TextureImage.prototype.getRealWidth = function () {
                return this._realWidth;
            };
            return TextureImage;
        })();
        Containers.TextureImage = TextureImage;
        var Texture = (function () {
            function Texture() {
                this._x = 0;
                this._y = 0;
                this._width = 0;
                this._height = 0;
                this._image = null;
            }
            Texture.prototype.setData = function (x, y, width, height) {
                this._x = x;
                this._y = y;
                this._width = width;
                this._height = height;
            };
            Texture.prototype.getImage = function () {
                return this._image;
            };
            Texture.prototype.setTextureImage = function (textureImage) {
                this._image = textureImage;
            };
            Texture.prototype.getHeight = function () {
                return this._height;
            };
            Texture.prototype.getWidth = function () {
                return this._width;
            };
            Texture.prototype.getY = function () {
                return this._y;
            };
            Texture.prototype.getX = function () {
                return this._x;
            };
            return Texture;
        })();
        Containers.Texture = Texture;
        var TextureMap = (function () {
            function TextureMap() {
                this._width = 0;
                this._height = 0;
                this._file = null;
                this._dataURI = null;
                this._repeatX = false;
                this._repeatY = false;
                this._textures = {};
            }
            TextureMap.prototype.setData = function (file, width, height, repeatX, repeatY) {
                this._file = file;
                this._width = width;
                this._height = height;
                this._repeatX = repeatX;
                this._repeatY = repeatY;
            };
            TextureMap.prototype.setDataURI = function (dataURI) {
                this._dataURI = dataURI;
            };
            TextureMap.prototype.getDataURI = function () {
                return this._dataURI;
            };
            TextureMap.prototype.setTexture = function (id, texture) {
                this._textures[id] = texture;
            };
            TextureMap.prototype.getTexture = function (id) {
                return this._textures[id];
            };
            TextureMap.prototype.getTextureIds = function () {
                return Object.keys(this._textures);
            };
            TextureMap.prototype.getFile = function () {
                return this._file;
            };
            TextureMap.prototype.getRepeatX = function () {
                return this._repeatX;
            };
            TextureMap.prototype.getRepeatY = function () {
                return this._repeatY;
            };
            TextureMap.prototype.getWidth = function () {
                return this._width;
            };
            TextureMap.prototype.getHeight = function () {
                return this._height;
            };
            TextureMap.prototype.getArea = function () {
                return this._width * this._height;
            };
            return TextureMap;
        })();
        Containers.TextureMap = TextureMap;
    })(Containers = Texturer.Containers || (Texturer.Containers = {}));
})(Texturer || (Texturer = {}));
var Texturer;
(function (Texturer) {
    var binPackerNode = (function () {
        function binPackerNode(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.leftChild = null;
            this.rightChild = null;
            this.used = false;
        }
        return binPackerNode;
    })();
    var BinPacker = (function () {
        function BinPacker(binWidth, binHeight, makeCoordinatesDivisibleBy, minimalDistanceBetweenPackedRectanglesByX, minimalDistanceBetweenPackedRectanglesByY) {
            if (makeCoordinatesDivisibleBy === void 0) { makeCoordinatesDivisibleBy = 0; }
            if (minimalDistanceBetweenPackedRectanglesByX === void 0) { minimalDistanceBetweenPackedRectanglesByX = 0; }
            if (minimalDistanceBetweenPackedRectanglesByY === void 0) { minimalDistanceBetweenPackedRectanglesByY = 0; }
            this._divisibleBy = makeCoordinatesDivisibleBy;
            this._paddingX = minimalDistanceBetweenPackedRectanglesByX;
            this._paddingY = minimalDistanceBetweenPackedRectanglesByY;
            binWidth = BinPacker._makeDivisibleBy(binWidth, this._divisibleBy) + this._paddingX;
            binHeight = BinPacker._makeDivisibleBy(binHeight, this._divisibleBy) + this._paddingY;
            this._rootNode = new binPackerNode(0, 0, binWidth, binHeight);
        }
        BinPacker._recursiveFindPlace = function (node, width, height) {
            if (node.leftChild) {
                return BinPacker._recursiveFindPlace(node.leftChild, width, height) || BinPacker._recursiveFindPlace(node.rightChild, width, height);
            }
            else {
                if (node.used || width > node.width || height > node.height) {
                    return null;
                }
                if (width === node.width && height === node.height) {
                    node.used = true;
                    return { x: node.x, y: node.y };
                }
                if (node.width - width > node.height - height) {
                    node.leftChild = new binPackerNode(node.x, node.y, width, node.height);
                    node.rightChild = new binPackerNode(node.x + width, node.y, node.width - width, node.height);
                }
                else {
                    node.leftChild = new binPackerNode(node.x, node.y, node.width, height);
                    node.rightChild = new binPackerNode(node.x, node.y + height, node.width, node.height - height);
                }
                return BinPacker._recursiveFindPlace(node.leftChild, width, height);
            }
        };
        BinPacker._makeDivisibleBy = function (coordinate, divisibleBy) {
            if (divisibleBy > 0) {
                if (coordinate % divisibleBy > 0) {
                    coordinate += divisibleBy - (coordinate % divisibleBy);
                }
            }
            return coordinate;
        };
        BinPacker.prototype.placeNextRectangle = function (width, height) {
            width = BinPacker._makeDivisibleBy(width, this._divisibleBy) + this._paddingX;
            height = BinPacker._makeDivisibleBy(height, this._divisibleBy) + this._paddingY;
            return BinPacker._recursiveFindPlace(this._rootNode, width, height);
        };
        return BinPacker;
    })();
    Texturer.BinPacker = BinPacker;
})(Texturer || (Texturer = {}));
///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
///<reference path="../shared/containers/binPackerResult.ts"/>
///<reference path="../shared/containers/textureMap.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="binPackerAlgorithm.ts"/>
var BinPackerWorker = (function (_super) {
    __extends(BinPackerWorker, _super);
    function BinPackerWorker() {
        _super.apply(this, arguments);
    }
    BinPackerWorker.prototype._onData = function (data) {
        var best = null;
        for (var x = data.fromX; x <= data.toX; x += BinPackerWorker._binPackerSizeStep) {
            for (var y = data.fromY; y <= data.toY; y += BinPackerWorker._binPackerSizeStep) {
                if (data.totalPixels <= x * y) {
                    var binPackerResult = this._tryToPack(data.files, x, y, data.gridStep, data.paddingX, data.paddingY);
                    if (binPackerResult) {
                        if (!best || best.width * best.height > binPackerResult.width * binPackerResult.height) {
                            best = binPackerResult;
                        }
                        break;
                    }
                }
            }
        }
        this._sendData(best);
    };
    BinPackerWorker.prototype._tryToPack = function (fileDimensions, spriteWidth, spriteHeight, gridStep, paddingX, paddingY) {
        var packer = new Texturer.BinPacker(spriteWidth, spriteHeight, gridStep, paddingX, paddingY), rectangles = {}, width = 0, height = 0;
        for (var _i = 0; _i < fileDimensions.length; _i++) {
            var fileDimension = fileDimensions[_i];
            var placeCoordinates = packer.placeNextRectangle(fileDimension.width, fileDimension.height);
            if (placeCoordinates !== null) {
                rectangles[fileDimension.id] = {
                    x: placeCoordinates.x,
                    y: placeCoordinates.y,
                    width: fileDimension.width,
                    height: fileDimension.height
                };
                width = Math.max(width, placeCoordinates.x + fileDimension.width);
                height = Math.max(height, placeCoordinates.y + fileDimension.height);
            }
            else {
                return null;
            }
        }
        return { width: width, height: height, rectangles: rectangles };
    };
    BinPackerWorker._binPackerSizeStep = 16;
    return BinPackerWorker;
})(MultiTask.Worker);
new BinPackerWorker();
//# sourceMappingURL=binPackerWorker.js.map