import Leaflet from './leaflet.js';
import * as Mode from './mode.js';
import Note from './note.js';
import * as Request from './request.js';
import Users from './users.js';

export const ANONYMOUS = {
  INCLUDE: 'include',
  HIDE: 'hide',
  ONLY: 'only'
};

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
    * @param {String} anonymous
    * @param {String} from
    * @param {String} to
    * @param {String} sort
    * @param {String} order
    */
  constructor(query, limit, closed, user, anonymous, from, to, sort, order) {
    this.query = query || null;
    this.limit = limit || null;
    this.closed = closed || false;
    this.user = user || null;
    this.anonymous = anonymous || ANONYMOUS.INCLUDE;
    this.from = from || null;
    this.to = to || null;
    this.sort = sort || null;
    this.order = order || null;

    // If there is an end date but no start date, set it automatically because otherwise the API is not able to handle this
    if (!this.from && this.to) {
      this.from = new Date(0).toISOString().slice(0, 10);
    }

    this.endpoint = ENDPOINT.SEARCH;
    this.url = this.build();
  }

  /**
    * Initiate a new query
    *
    * @function
    * @returns {Promise}
    */
  async search() {
    let notes = new Set();
    let users = new Set();

    const { url } = this;
    let result;
    if (typeof url === 'string') {
      result = await Request.get(url);
    } else if (Array.isArray(url)) {
      result = {
        type: 'FeatureCollection',
        features: []
      };

      for (let i = 0; i < url.length; i++) {
        const body = await Request.get(url[i]);
        if (body && body.features) {
          result.features = [...result.features, ...body.features];
        }
      }
    }

    // Return as early as possible if there was no result
    if (!result || result.features.length === 0) {
      return notes;
    }

    result.features.forEach(feature => {
      try {
        const note = new Note(feature);
        notes.add(note);
        users = new Set([...users, ...note.users]);
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    });

    if (this.endpoint === ENDPOINT.DEFAULT) {
      notes = Array.from(notes);
      notes.sort((a, b) => {
        const first = this.sort === 'updated_at' ? a.updated : a.created;
        const second = this.sort === 'updated_at' ? b.updated : b.created;
        return this.order === 'newest' ? first < second : first > second;
      });
      notes = notes.slice(0, this.limit);
    }

    // Load additional information of all users
    await Users.load(users);

    return notes;
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
        this.endpoint = ENDPOINT.DEFAULT;
        // Search only in a single bounding box
        result = Request.build(this, map.bounds().toBBoxString());
      } else if (size >= 0.25 && size <= 1) {
        this.endpoint = ENDPOINT.DEFAULT;
        result = [];
        // Split the bounding box into four parts
        const bounds = map.splitBounds(map.bounds(), 1);
        bounds.forEach(bbox => {
          result.push(Request.build(this, bbox.toBBoxString()));
        });
      } else if (size >= 1 && size <= 4) {
        this.endpoint = ENDPOINT.DEFAULT;
        result = [];
        // Split the bounding box into sixteen parts
        const bounds = map.splitBounds(map.bounds(), 2);
        bounds.forEach(bbox => {
          result.push(Request.build(this, bbox.toBBoxString()));
        });
      } else {
        this.endpoint = ENDPOINT.SEARCH;
        result = Request.build(this);
      }

    } else {
      this.endpoint = ENDPOINT.SEARCH;
      result = Request.build(this);
    }

    return result;
  }
}