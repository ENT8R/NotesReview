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

const COMMENTED = {
  INCLUDE: 'include',
  HIDE: 'hide',
  ONLY: 'only'
};

const AREA = {
  GLOBAL: 'global',
  VIEW: 'view',
  CUSTOM: 'custom'
}

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
    limit: 50,
    status: STATUS.OPEN,
    anonymous: ANONYMOUS.INCLUDE,
    commented: COMMENTED.INCLUDE,
    // Specific frontend values which are not send to the API but transformed to another value before
    sort: `${SORT.CREATED_AT}:${ORDER.DESCENDING}`,
    area: AREA.GLOBAL
  },
  API: {
    limit: 50,
    status: STATUS.ALL,
    anonymous: ANONYMOUS.INCLUDE,
    commented: COMMENTED.INCLUDE,
    // Specific API values which are not used for the permalink
    sort_by: SORT.UPDATED_AT, // eslint-disable-line camelcase
    order: ORDER.DESCENDING
  }
};

const NOT_MODIFIABLE_BY_USER = [
  'bbox', 'polygon', 'sort_by', 'order'
];

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
      id: 'polygon',
      handler: this.polygon
    }, {
      id: 'area',
      handler: this.area
    }, {
      id: 'limit',
      handler: this.limit
    }, {
      id: 'status',
      handler: this.status
    }, {
      id: 'author',
      handler: this.author
    }, {
      id: 'user',
      handler: this.user
    }, {
      id: 'anonymous',
      handler: this.anonymous
    }, {
      id: 'from',
      permalink: 'after',
      handler: this.after
    }, {
      id: 'to',
      permalink: 'before',
      handler: this.before
    }, {
      id: 'commented',
      handler: this.commented
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
    * Search only in the given polygon
    *
    * @function
    * @param {String} polygon
    * @returns {Query}
    */
  polygon(polygon) {
    this.data.polygon = polygon;
    return this;
  }

  /**
    * Whether the search should return notes globally, in the current view or a custom area
    *
    * @function
    * @param {AREA} area
    * @returns {Query}
    */
  area(area) {
    this.data.area = area;
    return this;
  }



  /**
    * Whether the search should only return notes in the current bounding box
    *
    * @function
    * @deprecated
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
    * Only show notes created by the given author
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
    * Only show notes with a comment of the given user
    *
    * @function
    * @param {String} user
    * @returns {Query}
    */
  user(user) {
    this.data.user = user;
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
    * @deprecated
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
    * @deprecated
    * @param {Boolean} uncommented
    * @returns {Query}
    */
  uncommented(uncommented) {
    this.data.uncommented = uncommented;
    this.comments(uncommented ? 0 : null);
    return this;
  }

  /**
    * Whether commented notes should be included, hidden or displayed as only results
    *
    * @function
    * @param {COMMENTED} commented
    * @returns {Query}
    */
  commented(commented) {
    this.data.commented = commented;
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
    * Remove parameters from the data object that are not necessary
    * for the request to the API either because they are not needed or
    * already defined implicitly through a different value
    *
    * @function
    * @returns {Object}
    */
  clean() {
    // Create a copy of the current values in order to make specific changes
    // that are necessary for the construction of the URL
    const data = Object.assign({}, this.data);

    // Do not use the bounding box/polygon if the user does not want to do the respective search
    if (data.area !== AREA.VIEW) {
      delete data.bbox;
    }
    if (data.area !== AREA.CUSTOM) {
      delete data.polygon;
    }

    if (data.before !== null) {
      // Increment the actual date by a single day, to simulate a closed interval [from, to]
      // because when setting two equal dates this would result in a half-closed interval [from, to)
      // as the specific time is not known, which leads to no results being shown
      // See also https://github.com/ENT8R/NotesReview/issues/81#issuecomment-948052553
      data.before = new Date(data.before);
      data.before.setUTCDate(data.before.getUTCDate() + 1);
      [ data.before ] = data.before.toISOString().split('T');
    }

    // Remove unused properties that are already set by another value
    delete data.sort;
    delete data.area;

    return Util.clean(data, DEFAULTS.API);
  }

  /**
    * Update the permalink with all given values
    *
    * @function
    * @returns {String}
    */
  get permalink() {
    const url = new URL(window.location);
    url.hash = '';

    const data = Object.assign({
      view: document.body.dataset.view,
      map: `${this.map.zoom()}/${this.map.center().lat}/${this.map.center().lng}`,
    }, this.data);

    // Do not use the bounding box/polygon if the user does not want to do the respective search
    if (data.area !== AREA.VIEW) {
      delete data.bbox;
    }
    if (data.area !== AREA.CUSTOM) {
      delete data.polygon;
    }

    // Remove unused properties that are already set by another value
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
      // A changed permalink means that the query changed in relation to the previous query
      // The current implementation adds another value to the data attributes
      // In the future it might be necessary to create a new event for it
      const previous = this.history[this.history.length - 1];
      document.body.dataset.queryChanged = previous.permalink !== this.permalink;
    }

    // Find all values that are not default values or null and can be changed by the user directly via the user interface
    const nonDefaults = Object.entries(Util.clean(this.data, DEFAULTS.UI))
                              .reduce((a, [key, value]) =>
                                        ((value == null || NOT_MODIFIABLE_BY_USER.includes(key))
                                          ? a : (a[key] = value, a)), {});
    const amountOfNonDefaults = Object.keys(nonDefaults).length;

    // Show a small badge with the amount of applied filters (that are not default)
    const filterBadge = document.getElementById('filter-badge');
    if (amountOfNonDefaults > 0) {
      filterBadge.classList.add('badge', 'badge-small');
      filterBadge.dataset.badge = amountOfNonDefaults;
    } else {
      filterBadge.classList.remove('badge', 'badge-small');
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

    const url = new URL(`${NOTESREVIEW_API_URL}/search`);
    const data = this.clean();

    this.controller = new AbortController();
    const result = await Request.post(url, Request.MEDIA_TYPE.JSON, this.controller, data);
    this.controller = null;

    this.history.push({
      time: new Date(),
      data: this.data,
      permalink: this.permalink
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
    * Checks whether a search request is currently ongoing
    *
    * @function
    * @returns {boolean}
    */
  isSearching() {
    return this.controller != null;
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
