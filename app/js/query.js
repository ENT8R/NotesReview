import * as Localizer from './localizer.js';
import Note from './note.js';
import * as Request from './request.js';
import Toast from './toast.js';
import Users from './users.js';
import * as Util from './util.js';

const MAX_LIMIT = 100;

export const STATUS = {
  ALL: null,
  OPEN: 'open',
  CLOSED: 'closed'
};

const ANONYMOUS = {
  INCLUDE: 'include',
  HIDE: 'hide',
  ONLY: 'only'
};

const SORT = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

const ORDER = {
  DESCENDING: 'descending',
  ASCENDING: 'ascending'
};

const DEFAULTS = {
  bbox: null,
  limit: 50,
  // status: STATUS.OPEN, // TODO: The default of the API is STATUS.ALL
  anonymous: ANONYMOUS.INCLUDE,
  sort_by: SORT.UPDATED_AT, // eslint-disable-line camelcase
  order: ORDER.DESCENDING,
  // Search parameter defaults
  uncommented: false,
  sort: `${SORT.CREATED_AT}:${ORDER.DESCENDING}`
};

export default class Query {
  /**
    * Constructor for a new query
    *
    * @constructor
    * @param {Leaflet} map Current Leaflet map instance
    * @param {URLSearchParams} parameter Search parameters of the URL to initialize the query with
    */
  constructor(map, parameter) {
    this.map = map;
    this.data = {};

    this.input = [{
      id: 'query',
      permalink: 'query',
      handler: this.query
    }, {
      id: 'apply-bbox',
      permalink: 'bbox',
      handler: this.bbox
    }, {
      id: 'limit',
      permalink: 'limit',
      handler: this.limit
    }, {
      id: 'status',
      permalink: 'status',
      handler: this.status
    }, {
      id: 'user',
      permalink: 'author',
      handler: this.author
    }, {
      id: 'anonymous',
      permalink: 'anonymous',
      handler: this.anonymous
    }, {
      id: 'from',
      permalink: 'from',
      handler: this.after
    }, {
      id: 'to',
      permalink: 'to',
      handler: this.before
    }, {
      id: 'only-uncommented',
      permalink: 'uncommented',
      handler: this.uncommented
    }, {
      id: 'sort',
      permalink: 'sort',
      handler: this.sort
    }];

    this.input.forEach(input => {
      const element = document.getElementById(input.id);

      // Listen to changes of the query inputs
      // TODO: Maybe change the event type to input?
      element.addEventListener('change', () => {
        const value = element.type === 'checkbox' ? element.checked : element.value;
        input.handler.call(this, value);
      });

      // If the corresponding search parameter for an input is available, try to set it
      if (parameter.has(input.permalink)) {
        const value = parameter.get(input.permalink);
        element.type === 'checkbox' ? element.checked = value : element.value = value; // eslint-disable-line no-unused-expressions
      }

      // Call the handler by triggering a new change event on the element
      element.dispatchEvent(new Event('change'));
    }, this);

    // TODO: Find a better way to update the bounding box when moving the map
    // (Maybe an invisible input?)
    this.map.onMove(() => {
      this.bbox(this.data.bbox);
    });
  }

  /**
    * Search for a specific keyword
    *
    * @function
    * @param {String} query
    * @returns {Query}
    */
  query(query) {
    this.data.query = query;
    return this;
  }

  /**
    * Whether the search should only return notes in the current bounding box
    *
    * @function
    * @param {Boolean} bbox
    * @returns {Query}
    */
  bbox(bbox) {
    this.data.bbox = bbox ? this.map.bounds().toBBoxString() : null;
    return this;
  }

  /**
    * Limit the amount of results
    *
    * Also check if the limit does not exceed the maximum allowed value
    * and inform the user if a lower value was automatically selected
    *
    * @function
    * @param {Number} limit
    * @returns {Query}
    */
  limit(limit) {
    limit = Number.parseInt(limit);
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
      document.getElementById('limit').value = MAX_LIMIT;
      new Toast(Localizer.message('description.autoLimit'), 'toast-warning').show();
    }

    this.data.limit = limit;
    return this;
  }

  /**
    * Filter notes by their current status
    *
    * @function
    * @param {STATUS} status
    * @returns {Query}
    */
  status(status) {
    this.data.status = status;
    return this;
  }

  /**
    * Only search in a specific area
    *
    * If the user searches for 'anonymous' note creators,
    * change the query to only include anonymous notes
    *
    * @function
    * @param {String} author
    * @returns {Query}
    */
  author(author) {
    this.data.author = author;
    return this;
  }

  /**
    * Whether anonymous notes should be included, hidden or displayed as only results
    *
    * @function
    * @param {ANONYMOUS} anonymous
    * @returns {Query}
    */
  anonymous(anonymous) {
    this.data.anonymous = anonymous;
    return this;
  }

  /**
    * Only show notes created after the given date
    *
    * @function
    * @param {Date} after
    * @returns {Query}
    */
  after(after) {
    this.data.after = after;
    return this;
  }

  /**
    * Only show notes created before the given date
    *
    * @function
    * @param {Date} before
    * @returns {Query}
    */
  before(before) {
    this.data.before = before;
    return this;
  }

  /**
    * Filter notes by the amount of comments
    *
    * @function
    * @param {Number} comments
    * @returns {Query}
    */
  comments(comments) {
    this.data.comments = comments;
    return this;
  }

  /**
    * Whether to include only uncommented notes
    *
    * @function
    * @param {Boolean} uncommented
    * @returns {Query}
    */
  uncommented(uncommented) {
    this.comments(uncommented ? 0 : null);
    return this;
  }

  /**
    * Sort notes by their creation date or the date of the last update in the given order
    *
    * @function
    * @param {String} sort One of [created_at:descending, created_at:ascending, updated_at:descending, updated_at:ascending]
    * @returns {Query}
    */
  sort(sort) {
    const [ sort_by, order ] = sort.split(':'); // eslint-disable-line camelcase
    this.data.sort_by = sort_by; // eslint-disable-line camelcase
    this.data.order = order;
    return this;
  }

  /**
    * Build a URL from all given parameters
    *
    * @function
    * @returns {String}
    */
  get url() {
    const url = new URL(`${NOTESREVIEW_API_URL}/search`);
    url.search = Request.encodeQueryData(Util.clean(DEFAULTS, Object.assign({}, this.data)), true);
    return url.toString();
  }

  /**
    * Update the permalink with all given values
    *
    * @function
    * @returns {String}
    */
  permalink() {
    const url = new URL(window.location);
    url.hash = '';

    const data = Object.assign({
      view: document.body.dataset.view,
      map: `${this.map.zoom()}/${this.map.center().lat}/${this.map.center().lng}`,
    }, this.data, {
      // bbox: this.data.bbox !== null,
      uncommented: this.data.comments === 0,
      sort: `${this.data.sort_by}:${this.data.order}`
    });

    // Remove unused properties that are already set by another value
    delete data.bbox;
    delete data.sort_by;
    delete data.comments;

    if (!document.getElementById('show-map').checked) {
      delete data.map;
    }

    url.search = Request.encodeQueryData(Util.clean(DEFAULTS, data));
    return url.toString();
  }

  /**
    * Initiate a new query
    *
    * @function
    * @returns {Promise}
    */
  async search() {
    const notes = new Set();
    let users = new Set();

    const result = await Request.get(this.url);

    // Return as early as possible if there was no result
    if (!result || result.length === 0) {
      return notes;
    }

    result.forEach(feature => {
      try {
        const note = new Note(feature);
        notes.add(note);
        users = new Set([...users, ...note.users]);
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    });

    // Load additional information of all users
    await Users.load(users);
    return notes;
  }
}
