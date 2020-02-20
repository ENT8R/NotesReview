import { ENDPOINT } from './query.js';

let controller = new AbortController();
let running = false;

export const MEDIA_TYPE = {
  JSON: 'application/json',
  XML: 'text/xml'
};

/**
  * Build a URL from all given parameters
  *
  * @function
  * @param {Query} query
  * @param {String} bounds
  * @returns {String}
  */
export function build(query, bounds) {
  const url = new URL(OPENSTREETMAP_SERVER);
  url.pathname = query.endpoint === ENDPOINT.DEFAULT ? '/api/0.6/notes.json' : '/api/0.6/notes/search.json';

  const data = {
    q: query.query,
    limit: query.limit,
    display_name: query.user, // eslint-disable-line camelcase
    closed: query.closed ? '-1' : '0',
    from: query.from,
    to: query.to,
    sort: query.sort,
    order: query.order
  };

  if (query.endpoint === ENDPOINT.DEFAULT) {
    delete data.q;
    data.bbox = bounds;
  }

  url.search = encodeQueryData(data, true);
  return url.toString();
}

/**
  * Fetch an external ressource and return it using the specified media type
  *
  * @function
  * @param {String} url
  * @param {MEDIA_TYPE} mediaType
  * @returns {Promise}
  */
export function get(url, mediaType) {
  running = true;
  controller = new AbortController();

  return fetch(url, {
    signal: controller.signal
  }).then(response => {
    switch (mediaType) {
    case MEDIA_TYPE.JSON:
      return response.json();
    default:
      return response.text();
    }
  }).then(text => {
    switch (mediaType) {
    case MEDIA_TYPE.XML:
      return new DOMParser().parseFromString(text, 'text/xml');
    default:
      return text;
    }
  }).catch(e =>
    console.log(`Error while fetching file at ${url}: ${e}`) // eslint-disable-line no-console
  ).finally(() =>
    running = false
  );
}

/**
  * Whether a request is currently running
  *
  * @function
  * @returns {Boolean}
  */
export function isRunning() {
  return running;
}

/**
  * Cancel an ongoing request
  *
  * @function
  * @returns {void}
  */
export function cancel() {
  controller.abort();
}

/**
  * Stringify an object as a query string
  *
  * @function
  * @param {Object} data
  * @param {Boolean} strict
  * @returns {String}
  */
export function encodeQueryData(data, strict) {
  const query = [];
  for (const d in data) {
    if (data[d] === '' || (strict && data[d] === null)) {
      continue;
    }
    query.push(`${encodeURIComponent(d)}=${encodeURIComponent(data[d])}`);
  }
  return query.join('&');
}
