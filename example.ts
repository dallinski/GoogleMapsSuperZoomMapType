private maxZoomService: google.maps.MaxZoomService = new google.maps.MaxZoomService();

...

// map: google.maps.Map
let centerLatLng: google.maps.LatLng = map.getCenter();
this.maxZoomService.getMaxZoomAtLatLng(centerLatLng, (maxZoomResult: google.maps.MaxZoomResult) => {
	let superZoomMaxZoom: number = 24;
	new SuperZoomLayer(map, maxZoomResult.zoom, superZoomMaxZoom);
	this.zoomRangeModifierService.enableSuperZoom(map, superZoomMaxZoom);
});
