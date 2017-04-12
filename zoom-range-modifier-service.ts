import { Injectable } from "@angular/core";

@Injectable()
export class ZoomRangeModifierService
{
	private originalSetFunc: Function;
	private zoomRangeModifier: any;

	public constructor()
	{

	}

	public enableSuperZoom(map: google.maps.Map, superZoomMax: number): void
	{
		// disable superzoom on any previous map
		this.disableSuperZoom();

		// allow max zoom beyond what Google says maxZoom is
		// http://stackoverflow.com/a/30315215/2118030
		this.zoomRangeModifier = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(map)));
		this.originalSetFunc = this.zoomRangeModifier.set;
		let originalSetFunc: any = this.zoomRangeModifier.set;
		let hijackedSetFunc: any = function(a: any, b: any): void {
			if (a === "zoomRange") {
				b.max = superZoomMax;
			}
			/* tslint:disable:no-invalid-this */
			originalSetFunc.call(this, a, b);
			/* tslint:enable:no-invalid-this */
		};
		this.zoomRangeModifier.set = hijackedSetFunc;
	}

	public disableSuperZoom(): void
	{
		if (!!this.zoomRangeModifier && !!this.originalSetFunc)
		{
			this.zoomRangeModifier.set = this.originalSetFunc;
		}
	}
}
