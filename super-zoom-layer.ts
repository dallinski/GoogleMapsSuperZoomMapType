import {SuperZoomMapType} from "./super-zoom-map-type";

export class SuperZoomLayer
{
	public constructor(map: google.maps.Map, tileMaxZoom: number, superZoomMaxZoom: number)
	{
		let zoomMapType: SuperZoomMapType = new SuperZoomMapType({
			tileSize: new google.maps.Size(256, 256),
			maxZoom: superZoomMaxZoom,
			name: "Satellite",
			getTileUrl: (tileCoord: google.maps.Point, zoom: number): string => {
				if (zoom > superZoomMaxZoom)
				{
					return "";
				}
				let zoomDiff: number = zoom - tileMaxZoom;
				let normTile: any = {x: tileCoord.x, y: tileCoord.y};
				if (zoomDiff > 0)
				{
					let dScale: number = Math.pow(2, zoomDiff);
					normTile.x = Math.floor(normTile.x / dScale);
					normTile.y = Math.floor(normTile.y / dScale);
				}
				else
				{
					zoomDiff = 0;
				}
				return "https://khms1.googleapis.com/kh?v=713&hl=en-US&&x=" + normTile.x + "&y=" + normTile.y + "&z=" + (zoom - zoomDiff);
			}
		});
		zoomMapType.setMap(map);
		zoomMapType.setTileMaxZoom(tileMaxZoom);

		// fired when the user has stopped panning/zooming
		map.addListener("idle", () => {
			this.showOrHideZoomLayer(zoomMapType, map);
		});
		map.addListener("maptypeid_changed", () => {
			this.showOrHideZoomLayer(zoomMapType, map);
		});
	}

	private showOrHideZoomLayer(zoomMapType: SuperZoomMapType, map: google.maps.Map): void
	{
		if (map.getZoom() > zoomMapType.tileMaxZoom &&
			map.getMapTypeId() === google.maps.MapTypeId.SATELLITE)
		{
			if (map.overlayMapTypes.getLength() === 0)
			{
				map.overlayMapTypes.push(zoomMapType);
			}
			zoomMapType.show();
		}
		else
		{
			zoomMapType.hide();
			if (map.overlayMapTypes.getLength() > 0)
			{
				map.overlayMapTypes.pop();
			}
		}
	}
}
