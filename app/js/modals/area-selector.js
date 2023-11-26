import Leaflet from '../leaflet.js';
import Modal from './modal.js';
import * as Util from '../util.js';

import * as CountryCoder from '@rapideditor/country-coder';
import { LocationConflation } from '@rapideditor/location-conflation';

const locationConflation = new LocationConflation();
locationConflation.strict = false;

export default class AreaSelector extends Modal {
  /**
    * Initializes the area selector
    *
    * @constructor
    * @param {HTMLElement} countryInput
    * @param {HTMLElement} polygonInput
    * @returns {void}
    */
  constructor(countryInput, polygonInput) {
    super();

    this.countryInput = countryInput;
    this.countries = countryInput.value === '' ? [] : countryInput.value.split(',');

    this.polygonInput = polygonInput;

    this.map = new Leaflet('modal-area-selector-content', null, [-180, -90, 180, 90]);

    this.features = new L.FeatureGroup();
    this.map.addLayer(this.features);

    this.drawnFeatures = new L.FeatureGroup();
    this.features.addLayer(this.drawnFeatures);
    this.selectedFeatures = new L.GeoJSON();
    this.features.addLayer(this.selectedFeatures);

    this.controls = this.map.addDraw(this.drawnFeatures, () => {
      this.currentlyDrawing = true;
    }, () => {
      this.currentlyDrawing = false;
      this.polygon();
    });

    // If the list of countries is empty, parse the polygon input and notify the draw control about a new layer
    if (this.countries.length === 0 && this.polygonInput.value !== '') {
      // See https://github.com/Leaflet/Leaflet.draw/issues/276
      const geojsonLayer = new L.GeoJSON(JSON.parse(this.polygonInput.value));
      geojsonLayer.eachLayer(layer => {
        this.map.fire(L.Draw.Event.CREATED, {
          layer: layer
        })
      });
    }

    // When clicking on the map, find the corresponding country and add it to the list
    this.map.onClick(event => {
      // Do not proceed if there is already a drawn shape or the event was fired while drawing
      if (this.drawnFeatures.getLayers().length > 0 || this.currentlyDrawing) {
        return;
      }

      const coordinates = event.latlng;
      const qid = CountryCoder.wikidataQID([coordinates.lng, coordinates.lat], {
        level: 'territory'
      });
      if (qid !== null) {
        this.countries = Util.toggle(this.countries, qid);
        this.update(this.countries);
      }
    });

    // Resize the map and zoom to the current selection if the modal is opened
    document.querySelector('.modal[data-modal="area-selector"]').addEventListener('modal-open', () => {
      this.map.resize();
      const bounds = this.features.getBounds();
      if (bounds.isValid()) {
        this.map.flyToBounds(bounds, null, [4, 4]);
      }
    });

    this.update(this.countries);
  }

  /**
  * Update the map with the current selection of countries
  *
  * @function
  * @param {Array} countries
  * @returns {void}
  */
  update(countries) {
    this.countryInput.value = countries.join(',');
    this.countryInput.dispatchEvent(new Event('change'));

    this.selectedFeatures.clearLayers();

    // Only resolve the location set if there are any entries,
    // otherwise the earth will be included by default
    if (countries.length > 0) {
      // Remove the drawing toolbar
      this.map.removeControl(this.controls.draw);

      const result = locationConflation.resolveLocationSet({
        include: countries
      });
      this.selectedFeatures.addData(Util.simplify(
        // It is necessary to create a deep copy of the resulting JSON because otherwise
        // the simplification (in place) would affect the cached version of the library
        JSON.parse(JSON.stringify(result.feature))
      ));
    } else if (this.drawnFeatures.getLayers().length === 0) {
      this.map.addControl(this.controls.draw);
    }

    this.polygon();
  }

  /**
  * Update the (hidden) polygon input which is used for the request
  *
  * @function
  * @returns {void}
  */
  polygon() {
    const geojson = this.features.toGeoJSON();
    if (typeof geojson === 'object' && 'features' in geojson &&
        Array.isArray(geojson.features) && geojson.features.length === 1) {
      // TODO: Maybe also check whether drawn features overlap (API will not return any results in that case)
      // For more resources (especially regarding the Shamos-Hoey Algorithm), see e.g.
      // https://web.archive.org/web/20210506140353/http://geomalgorithms.com/a09-_intersect-3.html#Shamos-Hoey-Algorithm
      // https://github.com/rowanwins/shamos-hoey and https://github.com/rowanwins/shamos-hoey/blob/master/ShamosHoey.pdf
      // https://github.com/mclaeysb/geojson-polygon-self-intersections
      // https://web.archive.org/web/20110604114853/https://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
      this.polygonInput.value = JSON.stringify(geojson.features[0].geometry);
    } else {
      this.polygonInput.value = '';
    }
    this.polygonInput.dispatchEvent(new Event('change'));
  }
}
