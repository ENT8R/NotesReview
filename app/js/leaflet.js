/* -------------------------------------------------------------------------- */
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
/* -------------------------------------------------------------------------- */
import 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet.markercluster';
import '@geoman-io/leaflet-geoman-free';
/* -------------------------------------------------------------------------- */

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

// Set Leaflet-Geoman to opt-in mode, so it does not initialize itself
L.PM.setOptIn(true);

// Class with simplifies the interaction with the Leaflet map library
export default class Leaflet {
  /**
    * Constructor for a new map instance
    *
    * @constructor
    * @param {String} id The id of the map container
    * @param {Object} position The position the map should be centered in
    * @param {Array} bounds The boundary of the preferred view
    */
  constructor(id, position, bounds) {
    if (instances[id]) {
      this.map = instances[id];
    } else {
      this.map = L.map(id, {
        minZoom: OPTIONS.zoom.min,
        maxZoom: OPTIONS.zoom.max,
        maxBounds: L.latLngBounds(
          L.latLng(-90, -180),
          L.latLng(90, 180)
        )
      });

      if (position !== null && bounds === null) {
        this.setView(position.center, position.zoom);
      } else if (bounds !== null) {
        this.map.fitBounds(L.latLngBounds(
          L.latLng(bounds[1], bounds[0]),
          L.latLng(bounds[3], bounds[2])
        ));
      } else {
        throw new Error(`${id} can not be instantiated without a position or bounds to center the map`);
      }

      instances[id] = this.map;

      this.tiles();
      document.addEventListener('color-scheme-changed', () => this.tiles());
    }
  }

  /**
    * Add a geocoding control to the map
    *
    * @function
    * @returns {Control}
    */
  addGeocoding() {
    const geocoder = L.Control.geocoder({
      placeholder: Localizer.message('action.search'),
      errorMessage: Localizer.message('description.nothingFound'),
      defaultMarkGeocode: false
    }).on('markgeocode', event => {
      const { bbox } = event.geocode;
      this.map.fitBounds(bbox);
    }).addTo(this.map);
    // There is no other option to add a specific class to the input,
    // so the input needs to be found in a first step before applying the correct class
    geocoder.getContainer().getElementsByTagName('input')[0].classList.add('form-input');
    return geocoder;
  }

  /**
    * Add a (mutually exclusive) drawing and editing control to the map
    *
    * @function
    * @param {FeatureGroup} drawnItems
    * @param {Function} onChangeStart
    * @param {Function} onChangeStop
    * @returns {void}
    */
  addDraw(drawnItems, onChangeStart, onChangeStop) {
    // Initiliaze the map for usage with Geoman
    this.map.options.pmIgnore = false;
    L.PM.reInitLayer(this.map);

    this.map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: true,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: true,
      rotateMode: false,
    });

    this.map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      layerGroup: drawnItems,
    });

    this.map.pm.setLang(Localizer.LANGUAGE);

    // Hide the edit controls by default and show it only after a shape is drawn
    document.querySelector('.leaflet-pm-toolbar.leaflet-pm-edit').classList.add('d-hide');

    // Called when a shape is drawn/finished
    this.map.on('pm:create', event => {
      if (event.shape === 'Circle') {
        // Convert circles to polygons, because circles are internally stored as
        // simple points with a radius, but a polygon is required for all requests
        drawnItems.removeLayer(event.layer);
        event.layer = L.PM.Utils.circleToPolygon(event.layer);
        drawnItems.addLayer(event.layer);
      }

      event.layer.options.pmIgnore = false;
      event.layer.options.bubblingMouseEvents = false;
      L.PM.reInitLayer(event.layer);

      document.querySelector('.leaflet-pm-toolbar.leaflet-pm-draw').classList.add('d-hide');
      document.querySelector('.leaflet-pm-toolbar.leaflet-pm-edit').classList.remove('d-hide');
      onChangeStop('pm:create');
    });

    // Called when a layer is removed via Removal Mode
    this.map.on('pm:remove', () => {
      document.querySelector('.leaflet-pm-toolbar.leaflet-pm-draw').classList.remove('d-hide');
      document.querySelector('.leaflet-pm-toolbar.leaflet-pm-edit').classList.add('d-hide');
      onChangeStop('pm:remove');
    });

    // Called when Draw Mode is enabled
    this.map.on('pm:drawstart', () => {
      onChangeStart('pm:drawstart');
    });

    // Called when Draw Mode is disabled
    this.map.on('pm:drawend', () => {
      onChangeStop('pm:drawend');
    });

    // Called when Removal Mode is toggled
    this.map.on('pm:globalremovalmodetoggled', event => {
      event.enabled ? onChangeStart('pm:globalremovalmodetoggled') : onChangeStop('pm:globalremovalmodetoggled'); // eslint-disable-line no-unused-expressions
    });

    // Called when Edit Mode on a layer is enabled
    drawnItems.on('pm:enable', () => {
      onChangeStart('pm:enable');
    });

    // Called when Edit Mode on a layer is disabled
    drawnItems.on('pm:disable', () => {
      onChangeStop('pm:disable');
    });

    // Called when a layer is edited
    drawnItems.on('pm:edit', () => {
      onChangeStop('pm:edit');
    });

    // Called when Edit Mode is disabled and a layer is edited and its coordinates have changed
    drawnItems.on('pm:update', () => {
      onChangeStop('pm:update');
    });

    // Called when the layer is being cut
    drawnItems.on('pm:cut', event => {
      drawnItems.removeLayer(event.originalLayer);

      event.layer.options.pmIgnore = false;
      event.layer.options.bubblingMouseEvents = false;
      L.PM.reInitLayer(event.layer);

      drawnItems.addLayer(event.layer);

      onChangeStop('pm:cut');
    });
  }

  /**
    * Invalidate the map to trigger a redraw
    *
    * @function
    * @returns {void}
    */
  resize() {
    this.map.invalidateSize();
    this.map.fire('move');
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
    const retina = L.Browser.retina ? '@2x' : '';

    tileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${theme}/{z}/{x}/{y}${retina}.png`, {
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
    * Add another control to the map
    *
    * @function
    * @param {Control} control
    * @returns {void}
    */
  addControl(control) {
    this.map.addControl(control);
  }

  /**
    * Remove a control from the map
    *
    * @function
    * @param {Control} control
    * @returns {void}
    */
  removeControl(control) {
    this.map.removeControl(control);
  }

  /**
    * Fire an event with a specific name
    *
    * @function
    * @param {String} name
    * @param {Object} data
    * @returns {void}
    */
  fire(name, data) {
    this.map.fire(name, data);
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
    * @param {Array} padding
    * @returns {void}
    */
  flyToBounds(bounds, duration=1, padding=[0, 0]) {
    this.map.flyToBounds(bounds, {
      duration,
      padding,
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
