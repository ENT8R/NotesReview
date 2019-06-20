import Leaflet from './leaflet.js';
import * as Mode from './mode.js';
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

  const query = document.getElementById('query').value;
  const limit = document.getElementById('limit').value;
  const closed = document.getElementById('show-closed').checked;
  const user = document.getElementById('user').value;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const hideAnonymous = document.getElementById('hide-anonymous').checked;

  let data = {
    query,
    limit,
    user,
    from,
    to
  };

  if (closed) {
    data.closed = true;
  }
  if (hideAnonymous) {
    data.anonymous = false;
  }

  if (Mode.get() === Mode.MAPS) {
    const map = new Leaflet('map');
    const showMap = document.getElementById('show-map').checked;

    const position = `${map.zoom()}/${map.center().lat}/${map.center().lng}`;

    if (showMap && position) {
      data.map = position;
    }
  }

  url.search = Request.encodeQueryData(data);
  // Map position and zoom is not needed as an URL parameter to switch between views
  delete data.map;
  data = Request.encodeQueryData(data);

  document.getElementById('link').href = Mode.get() === Mode.MAPS ? `./expert/?${data}` : `../?${data}`;
  document.getElementById('permalink').value = url.toString();
}
