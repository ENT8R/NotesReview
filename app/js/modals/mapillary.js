import Modal from './modal.js';
import * as Localizer from '../localizer.js';
import * as Request from '../request.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/mapillary.hbs?raw';
const template = Handlebars.compile(t);
Handlebars.registerHelper('localizer', key => {
  return Localizer.message(key);
});

export default class Mapillary extends Modal {
  /**
    * Show all Mapillary images near a given note in a modal
    *
    * @function
    * @param {Note} note
    * @returns {void}
    */
  static async load(note) {
    super.open('mapillary');

    const content = document.getElementById('mapillary');
    content.classList.add('loading', 'loading-lg');

    const coordinates = `${note.coordinates[1]},${note.coordinates[0]}`;
    const link = `https://www.mapillary.com/app/?lat=${note.coordinates[0]}&lng=${note.coordinates[1]}&z=17&focus=map`;
    document.getElementById('mapillary-link').href = link;

    // Search for all mapillary images at a given location in a 50m radius and return the first 20 results
    let images = await Request.get(
      `https://a.mapillary.com/v3/images?closeto=${coordinates}&radius=50&per_page=20&client_id=${MAPILLARY_CLIENT_ID}`,
      Request.MEDIA_TYPE.JSON
    );
    images = images.features.map(image => {
      return {
        key: image.properties.key,
        user: image.properties.username
      };
    });

    content.innerHTML = template({
      images,
      link
    });

    content.classList.remove('loading', 'loading-lg');
  }
}
