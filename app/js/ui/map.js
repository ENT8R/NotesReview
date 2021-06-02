import COLORS from '../../../assets/markers/colors.json';

import Leaflet from '../leaflet.js';
import { STATUS } from '../query.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/comment.hbs?raw';
const template = Handlebars.compile(t);

export default class Map {
  constructor() {
    this.map = new Leaflet('map-container');
    this.container = document.getElementById('note-container');

    this.active = null;

    this.cluster = L.markerClusterGroup({
      maxClusterRadius: 40
    });
    this.map.addLayer(this.cluster);
    this.markers = [];

    this.halo = L.circleMarker([0, 0], {
      weight: 2,
      opacity: 0
    });
    this.map.addLayer(this.halo);

    this.features = L.geoJSON();
    this.map.addLayer(this.features);

    this.map.onClick(() => this.clear());
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
      icon = note.status === STATUS.OPEN ? 'markers/green.svg' : 'markers/red.svg';
    } else {
      icon = `markers/${note.color}.svg`;
    }

    const marker = L.marker(note.coordinates, {
      icon: new L.divIcon({
        html: `<img alt="" src="${icon}">`,
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
      this.halo.setLatLng(note.coordinates);
      this.halo.setStyle({
        color: COLORS[note.color].fill,
        opacity: 1
      });

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
    this.halo.setStyle({
      opacity: 0
    });
    this.features.clearLayers();
    this.container.classList.add('out-of-view');
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

    this.clear();
    this.cluster.clearLayers();
    this.cluster.addLayers(this.markers);

    // TODO: Leave this choice to the user by implementing a button which offers to zoom to contain all features
    if (!reload && this.markers.length > 0) {
      this.map.flyToBounds(this.cluster.getBounds(), 1);
    }

    this.markers = [];
  }
}
