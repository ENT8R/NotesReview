export const MEDIA_TYPE = {
  JSON: 'application/json',
  XML: 'text/xml',
  PROTOBUF: 'application/x-protobuf'
};

/**
  * Fetch an external ressource and return it using the specified media type
  *
  * @function
  * @param {String} url
  * @param {MEDIA_TYPE} mediaType
  * @param {AbortController} controller
  * @returns {Promise}
  */
export function get(url, mediaType = MEDIA_TYPE.JSON, controller = new AbortController()) {
  return fetch(url, {
    signal: controller.signal
  }).then(response => {
    switch (mediaType) {
    case MEDIA_TYPE.JSON:
      return response.json();
    case MEDIA_TYPE.PROTOBUF:
      return response.arrayBuffer();
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
  }).catch(error => {
    if (error.name === 'AbortError') {
      console.log(`Aborted request while fetching file at ${url}: ${error}`);
    } else {
      console.log(`Error while fetching file at ${url}: ${error}`); // eslint-disable-line no-console
    }
  });
}

/**
  * Stringify an object as a query string
  *
  * @function
  * @param {Object} data
  * @returns {String}
  */
export function encodeQueryData(data) {
  const query = [];
  for (const d in data) {
    if (data[d] === '' || data[d] === null || typeof data[d] === 'undefined') {
      continue;
    }
    query.push(`${encodeURIComponent(d)}=${encodeURIComponent(data[d])}`);
  }
  return query.join('&');
}
