///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="../containers/textureMap.ts"/>
namespace Texturer.Utils {

	let fs = require("fs"),
	path   = require("path");

	export class TexturePoolWriter {

		writeTexturePoolFile(folderRootTo : string, configParser : Config.GlobalConfig, loadedFiles : { [fileName : string] : Containers.LoadedFile }, textureMapImages : Containers.TextureMap[]) : string[] {
			var templateTexturesArray = [],
				templateMapsArray     = [],
				usedPixels            = 0,
				trimmedPixels         = 0;

			// for each Texture Map
			textureMapImages.forEach(function (map : Containers.TextureMap, mapIndex : number) {
					console.log("map file = " + map.getFile());
					var url              = path.join(configParser.folders.indexHtmlFolder, map.getFile()).replace(/\\/g, "/"),
						dataURI          = map.getDataURI(),
						textureIds       = map.getTextureIds(),
						isLastTextureMap = mapIndex + 1 === textureMapImages.length;

					//console.log("map.textureMapImages = " + map.textureMapImages);
					templateMapsArray.push(
						{
							"url"          : url,
							"dataURI"      : dataURI,
							"is-last-item" : isLastTextureMap,
							"width"        : map.getWidth(),
							"height"       : map.getHeight(),
							"repeat-x"     : map.getRepeatX(),
							"repeat-y"     : map.getRepeatY()
						}
					);

					// for each Texture
					textureIds.forEach((id : string, textureIndex : number) => {
						const texture                            = map.getTexture(id),
							  loadedFile : Containers.LoadedFile = loadedFiles[ id ],
							  trim                               = loadedFile.getTrim(),
							  isLastTexture                      = textureIndex + 1 === textureIds.length;

						usedPixels += texture.getWidth() * texture.getHeight();
						trimmedPixels += (trim.left + trim.right) * (trim.top + trim.bottom);

						templateTexturesArray.push({
								//							"css-id"    : this.getFileNameWithoutExtension(texture.id).replace(/^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, ""),
								"id"           : Utils.FSHelper.getFileNameWithoutExtension(id),
								"file"         : id,
								"map-index"    : mapIndex,
								"url"          : url,
								"dataURI"      : dataURI,
								"x"            : texture.getX(),
								"y"            : texture.getY(),
								"width"        : texture.getWidth(),
								"height"       : texture.getHeight(),
								"real-width"   : loadedFile.getRealWidth(),
								"real-height"  : loadedFile.getRealHeight(),
								"trim"         : trim,
								"opaque"       : loadedFile.isOpaque(),
								"repeat-x"     : map.getRepeatX(),
								"repeat-y"     : map.getRepeatY(),
								"is-last-item" : isLastTexture && isLastTextureMap
							}
						);
					});
				}
			);

			var duplicateFileNamesArray : string[] = [];
			templateTexturesArray.forEach(function (d1, i1) {
				templateTexturesArray.forEach(function (d2, i2) {
					if (d1[ "id" ] === d2[ "id" ] && i1 !== i2) {
						duplicateFileNamesArray.push(d1[ "file" ]);
					}
				});
			});

			console.log("used pixels: " + usedPixels);
			console.log("trimmed pixels: " + trimmedPixels);

			var data = {
				maps     : templateMapsArray,
				textures : templateTexturesArray
			};

			var folder = path.join(__dirname, "..", "templates");
			configParser.templates.forEach((templateFile : string) => {
				if (fs.existsSync(path.join(folder, templateFile))) {
					this._exportTexturePoolViaHandlebarsTemplate(folderRootTo, templateFile, folder, data);
				}
			});

			return duplicateFileNamesArray;
		}

		private _exportTexturePoolViaHandlebarsTemplate(folderRootTo : string, file, folder, data) : void {
			var Handlebars = require("Handlebars");

			if (Utils.FSHelper.getExtension(file).toLowerCase() === "hbs") {
				var text = fs.readFileSync(path.join(folder, file), 'utf8');
				if (text && text.length > 0) {
					text = text.replace(/\r/g, "");

					var lines = text.split("\n"),
						template;

					if (lines.length > 1 && lines[ 0 ]) {
						var resultFile = path.join(folderRootTo, lines[ 0 ]);
						text           = lines.slice(1).join("\n");

						template = Handlebars.compile(text);
						if (template) {
							Utils.FSHelper.createDirectory(path.dirname(resultFile));
							fs.writeFileSync(resultFile, template(data));
						} else {
							console.log("template error in " + resultFile);
						}
					}
				}
			}
		}

	}
}
