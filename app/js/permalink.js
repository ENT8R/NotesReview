import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import { ANONYMOUS } from './query.js';
import * as Request from './request.js';
import Toast from './toast.js';

const DEFAULTS = {
  limit: '50',
  closed: false,
  sort: 'created_at',
  order: 'descending',
  anonymous: ANONYMOUS.INCLUDE
};

export default class Permalink {
  /**
    * Initializes the permalink handler
    *
    * @constructor
    * @returns {void}
    */
  constructor() {
    document.querySelector('.modal-trigger[data-modal="share"]').addEventListener('click', () => this.update());

    document.getElementsByClassName('update-link').forEach(element =>
      element.addEventListener('change', () => this.update())
    );

    document.getElementById('permalink').addEventListener('click', document.getElementById('permalink').select);
    document.getElementById('permalink').addEventListener('dblclick', () => this.copy());
    document.getElementById('permalink-copy').addEventListener('click', () => this.copy());
  }

  /**
    * Copy the permalink to the clipboard
    *
    * @function
    * @returns {void}
    */
  copy() {
    document.getElementById('permalink').select();
    document.execCommand('copy');
    new Toast(Localizer.message('action.copyLinkSuccess'), 'toast-success').show();
  }

  /**
    * Update the permalink with all given values
    *
    * @function
    * @returns {void}
    */
  update() {
    const url = new URL(window.location);
    url.hash = '';

    // TODO: This is a lot of duplicated code which could be shared between the query module and this module...
    const data = this.clean({
      view: document.body.dataset.view,
      query: document.getElementById('query').value,
      // TODO: Add bounding box parameter
      limit: document.getElementById('limit').value,
      closed: document.getElementById('show-closed').checked,
      author: document.getElementById('user').value,
      anonymous: document.getElementById('hide-anonymous').checked ? ANONYMOUS.HIDE : ANONYMOUS.INCLUDE,
      after: document.getElementById('from').value,
      before: document.getElementById('to').value,
      // TODO: Add comments(/uncommented) parameter
      sort: document.getElementById('sort').value.split('-')[0],
      order: document.getElementById('sort').value.split('-')[1]
    });

    if (document.getElementById('show-map').checked) {
      const map = new Leaflet('map');
      data.map = `${map.zoom()}/${map.center().lat}/${map.center().lng}`;
    }

    url.search = Request.encodeQueryData(data);
    document.getElementById('permalink').value = url.toString();
  }

  /**
    * Removes all unnecessary default values
    *
    * @function
    * @param {Object} data
    * @returns {Object}
    */
  clean(data) {
    Object.entries(DEFAULTS).forEach(entry => {
      const [ key, value ] = entry;
      if (data[key] === value) {
        delete data[key];
      }
    });
    return data;
  }
}
