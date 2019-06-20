/* globals L */
import Leaflet from '../leaflet.js';
import * as Util from '../util.js';

import popup from '../../templates/notes/popup.mst';

export default class Map {
  constructor() {
    this.notes = [];
    this.query = null;
  }

  /**
    * Show all notes on the map
    *
    * @function
    * @param {Array} notes
    * @param {Query} query
    * @returns {Promise}
    */
  show(notes, query) {
    this.notes = notes;
    if (query) {
      this.query = query;
    } else if (this.query) {
      query = this.query; // eslint-disable-line prefer-destructuring
    }

    if (notes.length === 0) {
      return Promise.resolve();
    }

    let amount = 0;
    let average = 0;

    const markers = L.markerClusterGroup();
    notes.forEach(note => {
      note.visible = Util.isNoteVisible(note);

      if (note.visible) {
        amount++;
        average += note.date.getTime();

        let icon;
        if (query.closed) {
          icon = note.status === 'open' ? 'assets/markers/green.svg' : 'assets/markers/red.svg';
        } else {
          icon = `assets/markers/${note.color}.svg`;
        }

        const marker = L.marker(note.coordinates, {
          icon: new L.divIcon({
            html: `<div class="marker-container"><img src="${icon}" class="marker-icon"></div>`,
            iconAnchor: [12.5, 40], // [width / 2, height]
            popupAnchor: [0, -30],
            className: 'marker-icon'
          })
        });

        marker.bindPopup(
          popup({
            id: note.id,
            badges: note.badges,
            comment: note.comment.html,
            actions: note.actions
          })
        );

        marker.on('popupopen', event => {
          event.target.getElement().getElementsByClassName('marker-icon')[0].classList.add('popup-open');
        });
        marker.on('popupclose', event => {
          event.target.getElement().getElementsByClassName('marker-icon')[0].classList.remove('popup-open');
        });

        markers.addLayer(marker);
      }
    });

    // Display all notes on the map and zoom the map to show them all
    const map = new Leaflet('map');
    map.removeLayers();
    map.addLayer(markers);
    map.flyToBounds(markers.getBounds(), 1);

    return Promise.resolve({
      amount,
      average: new Date(average / amount)
    });
  }

  /**
    * Searches for the note with the specified id and returns it
    *
    * @function
    * @param {Number} id
    * @returns {Note}
    */
  get(id) {
    return this.notes.find(note => {
      return note.id === id;
    });
  }

  /**
    * Reload the notes because another event happened like a changed filter
    *
    * @function
    * @returns {Promise}
    */
  reload() {
    return this.show(this.notes);
  }
}
