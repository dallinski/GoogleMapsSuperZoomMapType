# GoogleMapsSuperZoomMapType
A map type for Google maps that allows artificially zooming in beyond max zoom level

I've just taken applicable files from an Angular 2 app.

#### Example usage

```javascript
private maxZoomService: google.maps.MaxZoomService = new google.maps.MaxZoomService();

...

// map: google.maps.Map
let centerLatLng: google.maps.LatLng = map.getCenter();
this.maxZoomService.getMaxZoomAtLatLng(centerLatLng, (maxZoomResult: google.maps.MaxZoomResult) => {
	let superZoomMaxZoom: number = 24;
	new SuperZoomLayer(map, maxZoomResult.zoom, superZoomMaxZoom);
	this.zoomRangeModifierService.enableSuperZoom(map, superZoomMaxZoom);
});
```