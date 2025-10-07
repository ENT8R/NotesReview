import * as Localizer from '../localizer.js';
import Modal from './modal.js';
import Request, { MEDIA_TYPE } from '../request.js';

import * as tilebelt from '@mapbox/tilebelt';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';

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

    const link = `https://www.mapillary.com/app/?lat=${note.coordinates[0]}&lng=${note.coordinates[1]}&z=17&focus=map`;
    document.getElementById('mapillary-link').href = link;

    // The Mapillary image layer is only available at a zoom value of 14
    const ZOOM = 14;
    const DISTANCE = 50;
    const LIMIT = 20;
    const tile = tilebelt.pointToTile(note.coordinates[1], note.coordinates[0], ZOOM);

    const data = await Request(
      // The documentation of this endpoint can be found here: https://www.mapillary.com/developer/api-documentation/#coverage-tiles
      `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${tile[2]}/${tile[0]}/${tile[1]}?access_token=${MAPILLARY_CLIENT_ID}`,
      MEDIA_TYPE.PROTOBUF
    );

    let images = [];
    const vt = new VectorTile(new Protobuf(data));
    const layer = 'layers' in vt && 'image' in vt.layers ? vt.layers.image : [];

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      const geojson = feature.toGeoJSON(tile[0], tile[1], tile[2]);
      const coordinates = L.latLng(geojson.geometry.coordinates.reverse());

      // Filter the available images by their distance to the original note
      const distance = L.latLng(note.coordinates).distanceTo(coordinates);
      if (distance < DISTANCE) {
        images.push({
          id: feature.properties.id,
          distance
        });
      }
    }

    images.sort((a, b) => a.distance - b.distance);
    images = images.slice(0, LIMIT);
    images = await Promise.all(images.map(async image => {
      const url = `https://graph.mapillary.com/${image.id}?access_token=${MAPILLARY_CLIENT_ID}&fields=thumb_1024_url,width,height,creator,captured_at`;
      const data = await Request(url);
      return Object.assign(image, {
        src: data.thumb_1024_url,
        width: data.width,
        height: data.height,
        user: data.creator.username,
        capturedAt: new Date(data.captured_at).toLocaleDateString()
      });
    }));

    content.innerHTML = template({
      images,
      link
    });

    content.classList.remove('loading', 'loading-lg');
  }
}
