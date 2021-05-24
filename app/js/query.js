import * as Localizer from './localizer.js';
import Note from './note.js';
import * as Request from './request.js';
import Toast from './toast.js';
import Users from './users.js';

export const STATUS = {
  ALL: null,
  OPEN: 'open',
  CLOSED: 'closed'
};

export const ANONYMOUS = {
  INCLUDE: 'include',
  HIDE: 'hide',
  ONLY: 'only'
};

export default class Query {
  /**
    * Constructor for a new query
    *
    * @constructor
    * @param {Object} data
    * @param {String} data.query
    * @param {String} data.bbox
    * @param {Number} data.limit
    * @param {String} data.status
    * @param {String} data.author
    * @param {String} data.anonymous
    * @param {String} data.after
    * @param {String} data.before
    * @param {String} data.sort_by
    * @param {String} data.order
    */
  constructor(data) {
    this.data = data;

    // Check if the limit does not exceed the maximum allowed value
    // and inform the user if a lower value was automatically selected
    if (this.data.limit > 100) {
      this.data.limit = 100;
      document.getElementById('limit').value = 100;
      new Toast(Localizer.message('description.autoLimit'), 'toast-warning').show();
    }

    // If the user searches for 'anonymous' note creators, change the query to only include anonymous notes
    if (['anonymous', Localizer.message('note.anonymous')].includes(data.author)) {
      data.author = null;
      data.anonymous = ANONYMOUS.ONLY;
      document.getElementById('hide-anonymous').checked = false;
      document.getElementById('hide-anonymous').setAttribute('disabled', 'true');
    } else {
      document.getElementById('hide-anonymous').removeAttribute('disabled');
    }
  }

  /**
    * Build a URL from all given parameters
    *
    * @function
    * @returns {String}
    */
  get url() {
    const url = new URL(`${NOTESREVIEW_API_URL}/search`);
    url.search = Request.encodeQueryData(this.data, true);
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

    const { url } = this;
    const result = await Request.get(url);

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
