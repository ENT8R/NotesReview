import Leaflet from './leaflet.js';
import * as Mode from './mode.js';
import Note from './note.js';
import * as Request from './request.js';

export const ENDPOINT = {
  DEFAULT: 'default',
  SEARCH: 'search'
};

export default class Query {
  /**
    * Constructor for a new query
    *
    * @constructor
    * @param {String} query
    * @param {Number} limit
    * @param {Boolean} closed
    * @param {String} user
    * @param {String} from
    * @param {String} to
    */
  constructor(query, limit, closed, user, from, to) {
    this.query = query || null;
    this.limit = limit || null;
    this.closed = closed || false;
    this.user = user || null;
    this.from = from || null;
    this.to = to || null;
    this.notes = [];
    this.ids = [];
    this.api = ENDPOINT.SEARCH;
    this.url = this.build();
  }

  /**
    * Initiate a new query
    *
    * @function
    * @returns {Promise}
    */
  async search() {
    this.notes = [];
    this.ids = [];

    const { url } = this;
    let result;
    if (typeof url === 'string') {
      result = await Request.get(url, Request.MEDIA_TYPE.JSON);
    } else if (Array.isArray(url)) {
      result = {
        type: 'FeatureCollection',
        features: []
      };

      for (let i = 0; i < url.length; i++) {
        const body = await Request.get(url[i], Request.MEDIA_TYPE.JSON);
        if (body && body.features) {
          result.features = result.features.concat(body.features);
        }
      }
    }

    // Return as early as possible if there was no result
    if (!result || result.features.length === 0) {
      return this.notes;
    }

    result.features.forEach(feature => {
      try {
        const note = new Note(feature, this.api);
        if (this.ids.indexOf(note.id) === -1) {
          this.notes.push(note);
          this.ids.push(note.id);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    });

    this.notes.sort((a, b) => {
      return a.id - b.id;
    });

    if (document.getElementById('sort-order') && document.getElementById('sort-order').checked === true) {
      this.notes.reverse();
    }

    return this.notes;
  }

  /**
    * Build a URL or a list of URLs
    *
    * @function
    * @returns {String|Array}
    */
  build() {
    let result;

    if (Mode.get() === Mode.MAPS) {
      const map = new Leaflet('map');
      const size = map.boundsSize();

      if (size < 0.25) {
        this.api = ENDPOINT.DEFAULT;
        // Search only in a single bounding box
        result = Request.build(map.bounds().toBBoxString(), this.limit, this.closed, this.user, this.from, this.to, this.api);
      } else if (size >= 0.25 && size <= 1) {
        this.api = ENDPOINT.DEFAULT;
        result = [];
        // Split the bounding box into four parts
        const bounds = map.splitBounds(map.bounds(), 1);
        bounds.forEach(bbox => {
          result.push(Request.build(bbox.toBBoxString(), this.limit, this.closed, this.user, this.from, this.to, this.api));
        });
      } else if (size >= 1 && size <= 4) {
        this.api = ENDPOINT.DEFAULT;
        result = [];
        // Split the bounding box into sixteen parts
        const bounds = map.splitBounds(map.bounds(), 2);
        bounds.forEach(bbox => {
          result.push(Request.build(bbox.toBBoxString(), this.limit, this.closed, this.user, this.from, this.to, this.api));
        });
      } else {
        this.api = ENDPOINT.SEARCH;
        result = Request.build(this.query, this.limit, this.closed, this.user, this.from, this.to, this.api);
      }

    } else {
      this.api = ENDPOINT.SEARCH;
      result = Request.build(this.query, this.limit, this.closed, this.user, this.from, this.to, this.api);
    }

    return result;
  }
}
