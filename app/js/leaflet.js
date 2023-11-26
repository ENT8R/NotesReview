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
    * Add a drawing and editing control to the map
    *
    * @function
    * @param {FeatureGroup} layer
    * @param {Function} onChangeStart
    * @param {Function} onChangeStop
    * @returns {Object}
    */
  addDraw(drawnItems, onChangeStart, onChangeStop) {
    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        marker: false,
        circle: false,
        circlemarker: false
      },
      edit: false
    });
    this.map.addControl(drawControl);

    const editControl = new L.Control.Draw({
      draw: false,
      edit: {
        allowIntersection: false,
        featureGroup: drawnItems
      }
    });

    this.map.on(L.Draw.Event.CREATED, event => {
      drawnItems.addLayer(event.layer);
      this.map.removeControl(drawControl);
      this.map.addControl(editControl);
    });

    this.map.on(L.Draw.Event.DELETED, () => {
      this.map.removeControl(editControl);
      this.map.addControl(drawControl);
    });

    this.map.on(L.Draw.Event.DRAWSTART, () => {
      onChangeStart(L.Draw.Event.DRAWSTART);
    });

    this.map.on(L.Draw.Event.DRAWSTOP, () => {
      onChangeStop(L.Draw.Event.DRAWSTOP);
    });

    this.map.on(L.Draw.Event.EDITSTART, () => {
      onChangeStart(L.Draw.Event.EDITSTART);
    });

    this.map.on(L.Draw.Event.EDITSTOP, () => {
      onChangeStop(L.Draw.Event.EDITSTOP);
    });

    this.map.on(L.Draw.Event.DELETESTART, () => {
      onChangeStart(L.Draw.Event.DELETESTART);
    });

    this.map.on(L.Draw.Event.DELETESTOP, () => {
      onChangeStop(L.Draw.Event.DELETESTOP);
    });

    return {
      draw: drawControl,
      edit: editControl
    };
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
