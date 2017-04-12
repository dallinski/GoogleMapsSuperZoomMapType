// based heavily on https://github.com/tilemapjp/ZoomTMSLayer
export class SuperZoomMapType implements google.maps.MapType
{
	public maxZoom: number = null;
	public minZoom: number = 0;
	public opacity: number = 100;
	public visible: boolean;

	// most locations will have a tile max zoom of 17~20
	public tileMaxZoom: number = 20;

	public tileSize: google.maps.Size;

	private tiles: HTMLElement[];
	private map: google.maps.Map;

	public constructor(options: google.maps.ImageMapTypeOptions)
	{
		Object.keys(options).forEach((property: string) => {
			this[property] = options[property];
		});

		this.tiles = [];
		this.visible = true;
	}

	public setMap(map: google.maps.Map): void
	{
		this.map = map;
	}

	public setTileMaxZoom(maxZoom: number): void
	{
		this.tileMaxZoom = maxZoom;
	}

	public getTile(tileCoord: google.maps.Point, zoom: number, ownerDocument: Document): Element
	{
		if ((this.maxZoom !== null && zoom > this.maxZoom) || zoom < this.minZoom) {
			return null;
		}

		// If tile already exists then use it
		let tKey: string = "t_" + tileCoord.x + "_" + tileCoord.y + "_" + zoom;
		for (let n: number = 0; n < this.tiles.length; n++) {
			if (this.tiles[n].id === tKey) {
				this.setObjectOpacity(this.tiles[n]);
				return this.tiles[n];
			}
		}

		// If tile doesn't exist then create it
		let div: HTMLDivElement = ownerDocument.createElement("div");
		div.id  = tKey;
		div.style.width  = this.tileSize.width + "px";
		div.style.height = this.tileSize.height + "px";

		// http://stackoverflow.com/a/12215835/2118030
		// without this, the tiles aren't visible on initial load
		div.style.webkitTransform = "translateZ(0px)";

		let zoomDiff: number = zoom - this.tileMaxZoom;
		if (zoomDiff < 0)
		{
			zoomDiff = 0;
		}
		let normTile: any = {x: tileCoord.x, y: tileCoord.y};

		let img: HTMLImageElement = ownerDocument.createElement("img");
		img.style.width    = this.tileSize.width  + "px";
		img.style.height   = this.tileSize.height + "px";
		img.style.position = "absolute";
		img.style.filter   = "inherit";

		let imgBase: HTMLDivElement;

		if (zoomDiff > 0) {
			let dScale: number     = Math.pow(2, zoomDiff);
			let dTranslate: number = 256 * (dScale - 1) / (dScale * 2);
			let dSize: number      = 256 / dScale;
			let aX: number         = normTile.x % dScale;
			let dX: number         = dTranslate - aX * dSize;
			let aY: number         = normTile.y % dScale;
			let dY: number         = - aY * dSize;
			normTile.x             = Math.floor(normTile.x / dScale);
			normTile.y             = Math.floor(normTile.y / dScale);
			let transStr: string   = "scale(" + dScale + "," + dScale + ") translate(" + dX + "px," + dY + "px)";

			imgBase = ownerDocument.createElement("div");
			if (typeof (imgBase.style.transform)       === "string") { imgBase.style.transform       = transStr; }
			// if (typeof (imgBase.style.msTransform)     === "string") { imgBase.style.msTransform     = transStr; }
			if (typeof (imgBase.style.webkitTransform) === "string") { imgBase.style.webkitTransform = transStr; }
			// if (typeof (imgBase.style.MozTransform)    === "string") { imgBase.style.MozTransform    = transStr; }
			// if (typeof (imgBase.style.OTransform)      === "string") { imgBase.style.OTransform      = transStr; }
			imgBase.style.border = "0px";

			img.style.clip = "rect(" + (aY * dSize) + "px," + ((aX + 1) * dSize) + "px," + ((aY + 1) * dSize) + "px," + (aX * dSize) + "px)";

			div.appendChild(imgBase);
		} else {
			imgBase = div;
		}

		img.onload  = function(): void {
			imgBase.appendChild(img);
			img     = null;
			div     = null;
			imgBase = null;
		};
		img.onerror = function(): void {
			img     = null;
			div     = null;
			imgBase = null;
		};
		img.src = this.getTileUrl(normTile, zoom - zoomDiff);

		if (!this.visible) {
			div.style.display = "none";
		}

		this.tiles.push(div);
		this.setObjectOpacity(div);

		return div;
	}

	// Save memory / speed up the display by deleting tiles out of view
	// Essential for use on iOS devices such as iPhone and iPod!
	public deleteHiddenTiles(zoom: number): void
	{
		let bounds: google.maps.LatLngBounds = this.map.getBounds();
		let tileNE: google.maps.Point = this.getTileUrlCoordFromLatLng(bounds.getNorthEast(), zoom);
		let tileSW: google.maps.Point = this.getTileUrlCoordFromLatLng(bounds.getSouthWest(), zoom);

		let minX: number = tileSW.x - 1;
		let maxX: number = tileNE.x + 1;
		let minY: number = tileSW.y - 1;
		let maxY: number = tileNE.y + 1;

		let tilesToKeep: HTMLElement[] = [];
		let tilesLength: number = this.tiles.length;
		for (let i: number = 0; i < tilesLength; i++) {
			let idParts: string[] = this.tiles[i].id.split("_");
			let tileX: number = Number(idParts[1]);
			let tileY: number = Number(idParts[2]);
			let tileZ: number = Number(idParts[3]);
			if ((
					(minX < maxX && (tileX >= minX && tileX <= maxX))
					|| (minX > maxX && ((tileX >= minX && tileX <= (Math.pow(2, zoom) - 1)) || (tileX >= 0 && tileX <= maxX))) // Lapped the earth!
				)
				&& (tileY >= minY && tileY <= maxY)
				&& tileZ === zoom) {
				tilesToKeep.push(this.tiles[i]);
			}
			else {
				delete this.tiles[i];
			}
		}

		this.tiles = tilesToKeep;
	}

	public pointToTile(latlng: google.maps.LatLng, z: number): google.maps.Point
	{
		let projection: google.maps.Projection = this.map.getProjection();
		let worldCoordinate: google.maps.Point = projection.fromLatLngToPoint(latlng);
		let pixelCoordinate: google.maps.Point = new google.maps.Point(worldCoordinate.x * Math.pow(2, z), worldCoordinate.y * Math.pow(2, z));
		let tileCoordinate: google.maps.Point = new google.maps.Point(
			Math.floor(pixelCoordinate.x / this.tileSize.width),
			Math.floor(pixelCoordinate.y / this.tileSize.height));
		return tileCoordinate;
	}

	public getTileUrlCoordFromLatLng(latlng: google.maps.LatLng, zoom: number): google.maps.Point
	{
		return this.getTileUrlCoord(this.pointToTile(latlng, zoom), zoom);
	}

	public getTileUrlCoord(coord: google.maps.Point, zoom: number): google.maps.Point
	{
		let tileRange: number = Math.pow(2, zoom);
		let y: number = tileRange - coord.y - 1;
		let x: number = coord.x;
		if (x < 0 || x >= tileRange) {
			x = (x % tileRange + tileRange) % tileRange;
		}
		return new google.maps.Point(x, y);
	}

	// This gets overriden by the mapTypeOptions
	public getTileUrl(coord: google.maps.Point, zoom: number): string
	{
		return "";
	}

	public hide(): void
	{
		this.visible = false;

		let tileCount: number = this.tiles.length;
		for (let n: number = 0; n < tileCount; n++) {
			this.tiles[n].style.display = "none";
		}
	}

	public show(): void
	{
		this.visible = true;

		let tileCount: number = this.tiles.length;
		for (let n: number = 0; n < tileCount; n++) {
			this.tiles[n].style.display = "";
		}
	}

	public releaseTile(tile: Element): void
	{
		tile = null;
	}

	public getOpacity(): number
	{
		return this.opacity;
	}

	public setOpacity(op: number): void
	{
		this.opacity = op;

		let tileCount: number = this.tiles.length;
		for (let n: number = 0; n < tileCount; n++) {
			this.setObjectOpacity(this.tiles[n]);
		}
	}

	public setObjectOpacity(obj: any): void
	{
		if (typeof (obj.style.filter) === "string")
		{
			obj.style.filter = "alpha(opacity:" + this.opacity + ")";
		}
		if (typeof (obj.style.KHTMLOpacity) === "string")
		{
			obj.style.KHTMLOpacity = this.opacity / 100;
		}
		if (typeof (obj.style.MozOpacity) === "string")
		{
			obj.style.MozOpacity = this.opacity / 100;
		}
		if (typeof (obj.style.opacity) === "string")
		{
			obj.style.opacity = this.opacity / 100;
		}
	}
}
