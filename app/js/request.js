export const MEDIA_TYPE = {
  JSON: 'application/json',
  XML: 'text/xml',
  PROTOBUF: 'application/x-protobuf'
};

/**
  * Request an external ressource and return it using the specified media type
  *
  * @function
  * @private
  * @param {String} url
  * @param {MEDIA_TYPE} mediaType
  * @param {Object} options
  * @param {AbortController} controller
  * @returns {Promise}
  */
export default function request(url, mediaType = MEDIA_TYPE.JSON, options = {}, controller = new AbortController()) {
  return fetch(url, Object.assign({
    signal: controller.signal
  }, options)).then(response => {
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
      console.log(`Aborted request while fetching file at ${url}: ${error}`); // eslint-disable-line no-console
    } else {
      console.log(`Error while fetching file at ${url}: ${error}`); // eslint-disable-line no-console
    }
  });
}
