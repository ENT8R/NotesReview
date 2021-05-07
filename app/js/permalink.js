import Leaflet from './leaflet.js';
import * as Request from './request.js';

/**
  * Update the permalink with all given values
  *
  * @function
  * @returns {void}
  */
export default function update() {
  const url = new URL(window.location);
  url.hash = '';

  const [ sort, order ] = document.getElementById('sort').value.split('-');

  const data = clean({
    view: document.body.dataset.view,
    query: document.getElementById('query').value,
    limit: document.getElementById('limit').value,
    closed: document.getElementById('show-closed').checked,
    user: document.getElementById('user').value,
    from: document.getElementById('from').value,
    to: document.getElementById('to').value,
    sort,
    order,
    anonymous: !document.getElementById('hide-anonymous').checked
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
  * @param  {Object} data
  * @returns {Object}
  */
function clean(data) {
  const DEFAULTS = {
    limit: '100',
    closed: false,
    sort: 'created_at',
    order: 'newest',
    anonymous: true
  };

  Object.entries(DEFAULTS).forEach(entry => {
    const [ key, value ] = entry;
    if (data[key] === value) {
      delete data[key];
    }
  });

  return data;
}
