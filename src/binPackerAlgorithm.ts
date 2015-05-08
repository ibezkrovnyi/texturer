module Texturer {
	/*
	 * Project: Texturer
	 *
	 * User: Igor Bezkrovny
	 * Date: 18.10.2014
	 * Time: 19:36
	 * MIT LICENSE
	 */

	class _PackerNode {
		public x : number;
		public y : number;
		public width : number;
		public height : number;
		public leftChild : _PackerNode;
		public rightChild : _PackerNode;
		public used : boolean;
		constructor(x : number, y : number, width : number, height : number) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.leftChild = null;
			this.rightChild = null;
			this.used = false;
		}
	}

	export class BinPacker {

		private _node : _PackerNode;
		private _multipleOf : number;
		private _usedWidth : number;
		private _usedHeight : number;

		/**
		 * @param {number} width - The containing rectangle width
		 * @param {number} height - The containing rectangle height
		 * @param {number} multipleOf - use to make all coordinates/size to be multiply of
		 */
		constructor(width : number, height : number, multipleOf : number) {
			//this.multipleOf = typeof multipleOf !== 'number' ? 0 : multipleOf;

			width = this._fixCoordinate(width);
			height = this._fixCoordinate(height);

			this._node = new _PackerNode(0, 0, width, height);
			this._multipleOf = typeof multipleOf !== 'number' ? 0 : multipleOf;

			// initialize
			this._usedWidth = 0;
			this._usedHeight = 0;
		}

		public getRealDimensions () : {width : number; height : number} {
			return {width : this._usedWidth, height : this._usedHeight};
		}

		public placeNextRectangle (width : number, height : number) : {x : number; y : number} {
			width = this._fixCoordinate(width);
			height = this._fixCoordinate(height);

			function recursiveFindPlace(node, width, height) {
				node.visited = true;
				if (node.leftChild) {
					var place = recursiveFindPlace(node.leftChild, width, height);
					return place ? place : recursiveFindPlace(node.rightChild, width, height);
				} else {
					if (node.used || width > node.width || height > node.height)
						return null;

					// if it fits perfectly then use this gap
					if (width === node.width && height === node.height) {
						node.used = true;
						return {x : node.x, y : node.y};
					}

					// initialize children
					node.leftChild = new _PackerNode(node.x, node.y, node.width, node.height);
					node.rightChild = new _PackerNode(node.x, node.y, node.width, node.height);

					// checks if we partition in vertical or horizontal
					if (node.width - width > node.height - height) {
						node.leftChild.width = width;
						node.rightChild.x = node.x + width;
						node.rightChild.width = node.width - width;
					} else {
						node.leftChild.height = height;
						node.rightChild.y = node.y + height;
						node.rightChild.height = node.height - height;
					}

					return recursiveFindPlace(node.leftChild, width, height);
				}
			}

			// perform the search
			var place = recursiveFindPlace(this._node, width, height);

			// if fitted then recalculate the used dimensions
			if (place) {
				if (this._usedWidth < place.x + width)
					this._usedWidth = place.x + width;
				if (this._usedHeight < place.y + height)
					this._usedHeight = place.y + height;
			}
			return place;
		}

		private _fixCoordinate (coordinate : number) : number {
			if (this._multipleOf > 0) {
				if (coordinate % this._multipleOf > 0) {
					coordinate += this._multipleOf - (coordinate % this._multipleOf);
				}
			}
			return coordinate;
		}
	}
}
