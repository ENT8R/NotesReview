import * as Localizer from './localizer.js';
import Note from './note.js';
import * as Request from './request.js';
import Toast from './toast.js';
import Users from './users.js';
import * as Util from './util.js';

const MAX_LIMIT = 100;

export const STATUS = {
  ALL: 'all',
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

// Default values which can be removed from the query string if needed.
// Values which are null by default are not included, because they are removed in a different step.
const DEFAULTS = {
  UI: {
    'apply-bbox': false,
    limit: 50,
    status: STATUS.OPEN,
    anonymous: ANONYMOUS.INCLUDE,
    // Specific frontend values which are not send to the API but transformed to another value before
    sort: `${SORT.CREATED_AT}:${ORDER.DESCENDING}`,
    uncommented: false
  },
  API: {
    'apply-bbox': false,
    limit: 50,
    status: STATUS.ALL,
    anonymous: ANONYMOUS.INCLUDE,
    // Specific API values which are not used for the permalink
    sort_by: SORT.UPDATED_AT, // eslint-disable-line camelcase
    order: ORDER.DESCENDING
  }
};

export default class Query {
  /**
    * Constructor for a new query
    *
    * @constructor
    * @param {Leaflet} map Current Leaflet map instance
    * @param {Object} values Default values to initialize the query with
    */
  constructor(map, values) {
    this.map = map;
    this.data = {};
    this.history = [];
    this.controller = null;

    this.input = [{
      id: 'query',
      handler: this.query
    }, {
      id: 'bbox',
      handler: this.bbox
    }, {
      id: 'apply-bbox',
      handler: this.applyBBox
    }, {
      id: 'limit',
      handler: this.limit
    }, {
      id: 'status',
      handler: this.status
    }, {
      id: 'user',
      permalink: 'author',
      handler: this.author
    }, {
      id: 'anonymous',
      handler: this.anonymous
    }, {
      id: 'from',
      handler: this.after
    }, {
      id: 'to',
      handler: this.before
    }, {
      id: 'only-uncommented',
      permalink: 'uncommented',
      handler: this.uncommented
    }, {
      id: 'sort',
      handler: this.sort
    }];

    // Add event listeners to every input field
    this.input.forEach(input => {
      const element = document.getElementById(input.id);

      // Listen to changes of the query inputs
      const update = () => {
        let value = element.type === 'checkbox' ? element.checked : element.value;
        value = value === '' ? null : value;
        input.handler.call(this, value);
        this.onChange();
      };
      // This event is triggered continuously during any input action
      element.addEventListener('input', update);
      // This event is triggered at the end of the action
      element.addEventListener('change', update);
    }, this);

    this.values = values;

    // Update the input which stores the current bounding box when moving the map
    // This triggers the assigned handler via the function implemented above
    this.map.onMove(() => {
      const bbox = document.getElementById('bbox');
      const bounds = this.map.bounds();
      bbox.value = [
        bounds.getWest().toFixed(4), bounds.getSouth().toFixed(4),
        bounds.getEast().toFixed(4), bounds.getNorth().toFixed(4)
      ].join(',');
      bbox.dispatchEvent(new Event('change'));
    });
  }

  /**
    * Set the values of the input fields
    *
    * @function
    * @param {Object} values
    * @returns {void}
    */
  set values(values) {
    this.input.forEach(input => {
      const element = document.getElementById(input.id);

      // If the corresponding value for an input field is available, try to set it
      const key = 'permalink' in input ? input.permalink : input.id;
      const value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : (DEFAULTS.UI[key] || null);
      element.type === 'checkbox' ? element.checked = (value === true || value === 'true') : element.value = value; // eslint-disable-line no-unused-expressions

      // Call the handler by triggering a new change event on the element
      element.dispatchEvent(new Event('change'));
    }, this);
  }

  /**
    * Reset the query to default values
    *
    * @function
    * @returns {void}
    */
  reset() {
    this.values = DEFAULTS.UI;
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
    * Search only in the current bounding box
    *
    * @function
    * @param {String} bbox
    * @returns {Query}
    */
  bbox(bbox) {
    this.data.bbox = bbox;
    return this;
  }

  /**
    * Whether the search should only return notes in the current bounding box
    *
    * @function
    * @param {Boolean} enabled
    * @returns {Query}
    */
  applyBBox(enabled) {
    this.data['apply-bbox'] = enabled;
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
    if (before !== null) {
      // Increment the actual date by a single day, to simulate a closed interval [from, to]
      // because when setting two equal dates this would result in a half-closed interval [from, to)
      // as the specific time is not known, which leads to no results being shown
      // See also https://github.com/ENT8R/NotesReview/issues/81#issuecomment-948052553
      before = new Date(before);
      before.setUTCDate(before.getUTCDate() + 1);
      [ before ] = before.toISOString().split('T');
    }
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
    this.data.uncommented = uncommented;
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
    this.data.sort = sort;
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

    const data = Object.assign({}, this.data);

    // Do not use the bounding box if the user wants to do a global search
    data['apply-bbox'] ? null : delete data.bbox; // eslint-disable-line no-unused-expressions

    // Remove unused properties that are already set by another value
    delete data.uncommented;
    delete data.sort;

    url.search = Request.encodeQueryData(Util.clean(data, DEFAULTS.API));
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
    }, this.data);

    // Do not use the bounding box if the user wants to do a global search
    data['apply-bbox'] ? null : delete data.bbox; // eslint-disable-line no-unused-expressions

    // Remove unused properties that are already set by another value
    delete data.comments;
    delete data.sort_by;
    delete data.order;

    if (!document.getElementById('show-map').checked) {
      delete data.map;
    }

    url.search = Request.encodeQueryData(Util.clean(data, DEFAULTS.UI));
    return url.toString();
  }

  /**
    * Handler for common logic in case of changed input values
    *
    * @function
    * @returns {void}
    */
  onChange() {
    if (this.history.length > 0) {
      // A changed URL means that the query changed in relation to the previous query
      // The current implementation adds another value to the data attributes
      // In the future it might be necessary to create a new event for it
      const previous = this.history[this.history.length - 1];
      document.body.dataset.queryChanged = previous.url !== this.url;
    }
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

    const { url } = this;
    this.controller = new AbortController();
    const result = await Request.get(url, Request.MEDIA_TYPE.JSON, this.controller);
    this.controller = null;

    this.history.push({
      time: new Date(),
      data: this.data,
      url
    });

    // Set the information that the query changed to false, because the request was just done moments ago
    document.body.dataset.queryChanged = false;

    // Return as early as possible if there was no result
    if (!result || !result.length || result.length === 0) {
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

  /**
    * Cancel an ongoing query
    *
    * @function
    * @returns {boolean}
    */
  cancel() {
    if (this.controller != null) {
      this.controller.abort();
      return true;
    }
    return false;
  }
}
