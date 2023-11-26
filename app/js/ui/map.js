import Leaflet from '../leaflet.js';
import { STATUS } from '../query.js';
import * as Util from '../util.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/comment.hbs?raw';
const template = Handlebars.compile(t);

export default class Map {
  constructor() {
    this.map = new Leaflet('map-container');
    this.container = document.getElementById('note-container');
    this.center = document.getElementById('center-map-to-results');

    this.active = null;

    this.map.addGeocoding();

    this.cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      showCoverageOnHover: false
    });
    this.map.addLayer(this.cluster);
    this.markers = [];

    this.halo = L.circleMarker([0, 0]);
    this.map.addLayer(this.halo);

    this.features = L.geoJSON();
    this.map.addLayer(this.features);

    this.map.onClick(() => this.clear());

    this.center.addEventListener('click', () => {
      const bounds = this.cluster.getBounds();
      if (bounds.isValid()) {
        this.map.flyToBounds(bounds);
      }
    });

    this.map.onMove(() => {
      const mapBounds = this.map.bounds();
      const clusterBounds = this.cluster.getBounds();
      if (!mapBounds.isValid() || !clusterBounds.isValid()) {
        return;
      }

      // Only show the button to center the map in case the screen covers less than 10% of the bounding box of all markers
      if (Util.overlap(mapBounds, clusterBounds) < 0.1) {
        this.center.classList.remove('d-hide');
      } else {
        this.center.classList.add('d-hide');
      }
    });
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
    let { color } = note;
    if (query.data.status === STATUS.ALL) {
      color = note.status === STATUS.OPEN ? 'green' : 'red';
    }

    const marker = L.marker(note.coordinates, {
      icon: new L.divIcon({
        html: `<svg class="marker ${color}"><use xlink:href="#marker-template"></use></svg>`,
        iconSize: [25, 40],// [width, height]
        iconAnchor: [25 / 2, 40], // [width / 2, height]
        popupAnchor: [0, -30],
        className: 'marker-icon'
      })
    });

    marker.on('click', () => {
      if (this.active === note) {
        return;
      }

      this.clear();
      this.active = note;

      this.container.innerHTML = template(note, {
        allowedProtoProperties: {
          actions: true,
          badges: true
        }
      });

      setTimeout(() => {
        this.container.classList.remove('out-of-view');
      }, 100);

      // Show halo with the correct style at the position of the note
      this.halo = L.circleMarker(note.coordinates, {
        color: window.getComputedStyle(document.documentElement).getPropertyValue(`--${color}-primary`),
        weight: 1
      });
      this.map.addLayer(this.halo);

      // If an element is linked in the note text, show the geometry of it on the map
      const { linked } = note;
      if (linked) {
        const overpass = `
          [out:json];
          ${linked.type}(id:${linked.id});
          convert Feature ::=::,::id=id(),::geom=geom();
          out geom tags;`;

        fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'data': overpass
          })
        }).then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`Error while fetching Overpass API: ${response.status} ${response.statusText}`);
          }
        }).then(json => {
          if (!('elements' in json) || json.elements.length === 0) {
            return;
          }

          const [ element ] = json.elements;
          // TODO: Points are ignored because they use a similar marker to the other markers by default which might lead to confusion
          if (element.geometry.type !== 'Point') {
            this.features.addData(element);
          }
        });
      }
    });

    this.markers.push(marker);
  }

  /**
    * Remove temporary layers from the map and reset values
    *
    * @function
    * @returns {void}
    */
  clear() {
    this.active = null;
    this.halo.remove();
    this.features.clearLayers();
    this.container.classList.add('out-of-view');
  }

  /**
    * Display all notes on the map and zoom the map to show them all
    *
    * @function
    * @returns {void}
    */
  apply() {
    this.map.resize();

    this.clear();
    this.cluster.clearLayers();
    this.cluster.addLayers(this.markers);

    this.markers = [];
  }
}
