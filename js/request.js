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
  * @param {String} query
  * @param {Number} limit
  * @param {Boolean} closed
  * @param {String} user
  * @param {String} from
  * @param {String} to
  * @param {String} endpoint Which endpoint should be used to search the notes
  * @returns {String}
  */
export function build(query, limit, closed, user, from, to, endpoint) {
  const url = new URL(OPENSTREETMAP_SERVER);
  url.pathname = endpoint === ENDPOINT.DEFAULT ? '/api/0.6/notes.json' : '/api/0.6/notes/search.json';

  const data = {
    q: query,
    limit,
    display_name: user, // eslint-disable-line camelcase
    closed: closed ? '-1' : '0',
    from,
    to
  };

  if (endpoint === ENDPOINT.DEFAULT) {
    delete data.q;
    data.bbox = query;
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
  }).catch(e => {
    console.log(`Error while fetching file at ${url}: ${e}`); // eslint-disable-line no-console
  }).finally(() => {
    running = false;
  });
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
