import Leaflet from '../leaflet.js';
import { STATUS } from '../query.js';

export default class Map {
  constructor() {
    this.cluster = L.markerClusterGroup({
      maxClusterRadius: 40
    });
    this.markers = [];

    this.map = new Leaflet('map');
    this.map.addLayer(this.cluster);
  }

  /**
    * Add a note to the marker layer
    *
    * @function
    * @param {Note} note
    * @param {Query} query
    * @returns {Promise}
    */
  add(note, query) {
    let icon;
    if (query.data.status === STATUS.ALL) {
      icon = note.status === 'open' ? 'markers/green.svg' : 'markers/red.svg';
    } else {
      icon = `markers/${note.color}.svg`;
    }

    const marker = L.marker(note.coordinates, {
      icon: new L.divIcon({
        html: `<img alt="" src="${icon}" class="marker-icon comments-modal-trigger" data-note-id="${note.id}">`,
        iconSize: [25, 40],// [width, height]
        iconAnchor: [25 / 2, 40], // [width / 2, height]
        popupAnchor: [0, -30],
        className: 'marker-icon'
      })
    });
    this.markers.push(marker);
  }

  /**
    * Display all notes on the map and zoom the map to show them all
    *
    * @function
    * @param {Boolean} reload Indicates that this function has been called by a reload function
    * @returns {void}
    */
  apply(reload) {
    this.map.resize();
    this.cluster.clearLayers();
    this.cluster.addLayers(this.markers);

    // TODO: Leave this choice to the user by implementing a button which offers to zoom to contain all features
    if (!reload && this.markers.length > 0) {
      this.map.flyToBounds(this.cluster.getBounds(), 1);
    }

    this.markers = [];
  }
}
