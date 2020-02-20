import Leaflet from '../leaflet.js';
import UI from './ui.js';
import * as Util from '../util.js';

import template from '../../templates/note.mst';

const map = new Leaflet('map');

export default class Map extends UI {
  /**
    * Show all notes on the map
    *
    * @function
    * @param {Array} notes
    * @param {Query} query
    * @param {Boolean} reload Indicates that this function has been called by a reload function
    * @returns {Promise}
    */
  show(notes, query, reload) {
    this.notes = notes;
    this.query = query;

    if (notes.length === 0) {
      return Promise.resolve();
    }

    let amount = 0;
    let average = 0;

    const markers = L.markerClusterGroup({
      maxClusterRadius: 40
    });

    notes.forEach(note => {
      if (Util.isNoteVisible(note, query)) {
        amount++;
        average += note.created.getTime();

        let icon;
        if (query.closed) {
          icon = note.status === 'open' ? 'assets/markers/green.svg' : 'assets/markers/red.svg';
        } else {
          icon = `assets/markers/${note.color}.svg`;
        }

        L.marker(note.coordinates, {
          icon: new L.divIcon({
            html: `<img alt="" src="${icon}" class="marker-icon">`,
            iconAnchor: [12.5, 40], // [width / 2, height]
            popupAnchor: [0, -30],
            className: 'marker-icon'
          })
        }).bindPopup(template({
          id: note.id,
          badges: note.badges,
          comment: note.comments[0].html,
          actions: note.actions
        }), {
          // Expand the width of the popup if there is more than one image
          maxWidth: note.comments[0].images.length > 1 ? document.getElementById('map').offsetWidth - 200 : 350,
        }).addTo(markers);
      }
    });

    // Display all notes on the map and zoom the map to show them all
    map.removeLayers();
    map.addLayer(markers);
    if (!reload && amount > 0) {
      map.flyToBounds(markers.getBounds(), 1);
    }

    return Promise.resolve({
      amount,
      average: new Date(average / amount)
    });
  }
}
