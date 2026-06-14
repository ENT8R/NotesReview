import Modal from './modal.js';
import Request, { MEDIA_TYPE } from '../request.js';

import * as tilebelt from '@mapbox/tilebelt';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';

import template from '../../templates/dynamic/panoramax.hbs';

export default class Panoramax extends Modal {
  constructor() {
    super('panoramax');
  }

  /**
    * Show all Panoramax images near a given note in a modal
    *
    * @function
    * @param {Note} note
    * @returns {void}
    */
  async load(note) {
    const content = document.getElementById('modal-panoramax-content');
    content.classList.add('loading', 'loading-lg');

    const link = `https://api.panoramax.xyz/en/index?focus=map&map=17/${note.coordinates[0]}/${note.coordinates[1]}`;
    document.getElementById('modal-panoramax-link').href = link;

    // The Panoramax image layer is only available at zoom value 15
    const ZOOM = 15;
    const DISTANCE = 50;
    const LIMIT = 20;
    const tile = tilebelt.pointToTile(note.coordinates[1], note.coordinates[0], ZOOM);

    const data = await Request(
      // The documentation of this endpoint can be found here: https://docs.panoramax.fr/backend/api/openapi/
      `https://panoramax.openstreetmap.fr/api/map/${tile[2]}/${tile[0]}/${tile[1]}.pbf`,
      MEDIA_TYPE.PROTOBUF
    );

    let images = [];
    const vt = new VectorTile(new PbfReader(data));
    const layer = 'layers' in vt && 'pictures' in vt.layers ? vt.layers.pictures : [];

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      const geojson = feature.toGeoJSON(tile[0], tile[1], tile[2]);
      const coordinates = L.latLng(geojson.geometry.coordinates.reverse());

      // Filter the available images by their distance to the original note
      const distance = L.latLng(note.coordinates).distanceTo(coordinates);
      if (distance < DISTANCE) {
        images.push({
          id: feature.properties.id,
          src: `https://api.panoramax.xyz/api/pictures/${feature.properties.id}/thumb.jpg`,
          width: 500,
          height: 300,
          user: feature.properties.account_id,
          capturedAt: new Date(feature.properties.ts).toLocaleDateString(),
          distance
        });
      }
    }

    images.sort((a, b) => a.distance - b.distance);
    images = images.slice(0, LIMIT);

    const ids = Array.from(new Set(images.map(image => image.user)));
    let users = await Promise.allSettled(ids.map(user => {
      const url = `https://api.panoramax.xyz/api/users/${user}`;
      return Request(url);
    })).then(promises => {
      // Filter out rejected promises and only return the value of the fulfilled ones
      return promises.filter(promise => promise.status === 'fulfilled').map(promise => promise.value);
    });
    users = Object.fromEntries(users.map(user => [user.id, user]));

    images = images.map(image => {
      return Object.assign(image, {
        user: image.user in users ? users[image.user].label : null
      });
    });

    content.innerHTML = template({
      images,
      link
    });

    content.classList.remove('loading', 'loading-lg');
  }
}
