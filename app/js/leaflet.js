import * as Localizer from './localizer.js';
import * as Theme from './theme.js';

const instances = {};
let tileLayer;

const OPTIONS = {
  zoom: {
    min: 2,
    max: 18
  }
};

// Class with simplifies the interaction with the Leaflet map library
export default class Leaflet {
  /**
    * Constructor for a new map instance
    *
    * @constructor
    * @param {String} id The id of the map container
    * @param {Object} position The position the map should be centered in
    */
  constructor(id, position) {
    if (instances[id]) {
      this.map = instances[id];
    } else {
      this.map = L.map(id, {
        center: position.center,
        minZoom: OPTIONS.zoom.min,
        maxZoom: OPTIONS.zoom.max,
        zoom: position.zoom,
        maxBounds: L.latLngBounds(
          L.latLng(-90, -180),
          L.latLng(90, 180)
        )
      });

      instances[id] = this.map;

      L.Control.geocoder({
        placeholder: Localizer.message('action.search'),
        errorMessage: Localizer.message('description.nothingFound')
      }).addTo(this.map);

      this.tiles();
      document.addEventListener('color-scheme-changed', () => this.tiles());
    }
  }

  /**
    * Invalidate the map to trigger a redraw
    *
    * @function
    * @returns {void}
    */
  resize() {
    this.map.invalidateSize();
  }

  /**
    * Set the default tile layer
    *
    * @function
    * @returns {void}
    */
  tiles() {
    if (tileLayer) {
      this.map.removeLayer(tileLayer);
    }

    const theme = Theme.get() === Theme.DARK ? 'dark_all' : 'light_all';
    const retina = L.Browser.retina ? '@2x.png' : '.png';

    tileLayer = L.tileLayer(`https://cartodb-basemaps-{s}.global.ssl.fastly.net/${theme}/{z}/{x}/{y}${retina}`, {
      maxZoom: OPTIONS.maxZoom,
      subdomains: 'abcd',
      attribution: Localizer.message('map.attribution')
    });

    this.map.addLayer(tileLayer);
  }

  /**
    * Add another layer to the map
    *
    * @function
    * @param {Layer} layer
    * @returns {void}
    */
  addLayer(layer) {
    this.map.addLayer(layer);
  }

  /**
    * Get the bouding box of the currently visible map area
    *
    * @function
    * @returns {LatLngBounds}
    */
  bounds() {
    return this.map.getBounds();
  }

  /**
    * Get the bounding box size in square degrees of the currently visible map area
    *
    * @function
    * @returns {void}
    */
  boundsSize() {
    const bounds = this.bounds();
    return (bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest());
  }

  /**
    * Get the center of the currently visible map area
    *
    * @function
    * @returns {LatLng}
    */
  center() {
    return L.latLng(
      this.map.getCenter().lat.toFixed(4),
      this.map.getCenter().lng.toFixed(4)
    );
  }

  /**
    * Get the zoom of the currently visible map area
    *
    * @function
    * @returns {Number}
    */
  zoom() {
    return this.map.getZoom().toFixed(0);
  }

  /**
    * Specify the current center of the map and the zoom
    *
    * @function
    * @param {LatLng} coordinates
    * @param {Number} zoom
    * @returns {void}
    */
  setView(coordinates, zoom) {
    this.map.setView(coordinates, zoom);
  }

  /**
    * Animate the map to fly to a given area
    *
    * @function
    * @param {LatLngBounds} bounds
    * @param {Number} duration
    * @returns {void}
    */
  flyToBounds(bounds, duration) {
    this.map.flyToBounds(bounds, {
      duration,
      maxZoom: OPTIONS.maxZoom
    });
  }

  /**
    * Register a new listener on map movement
    *
    * @function
    * @param {Function} listener
    * @returns {void}
    */
  onMove(listener) {
    this.map.on('move', listener);
  }

  /**
    * Register a new listener for a click action
    *
    * @function
    * @param {Function} listener
    * @returns {void}
    */
  onClick(listener) {
    this.map.on('click', listener);
  }
}
