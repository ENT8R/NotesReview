export const MEDIA_TYPE = {
  TEXT: 'text/plain',
  JSON: 'application/json',
  XML: 'text/xml',
  PROTOBUF: 'application/x-protobuf',
  MVT: 'application/vnd.mapbox-vector-tile'
};

export class RequestError extends Error {
  /**
   * Error class for failed reqeuests
   *
   * @constructor
   * @param {Number} status
   * @param {String} message
   * @param {...*} params
   */
  constructor(status, message, ...params) {
    super(...params);
    this.name = 'RequestError';
    this.status = status;
    this.message = message;
  }
}

export class TimeoutError extends Error {
  /**
   * Error class for timeout errors
   *
   * @constructor
   * @param {...*} params
   */
  constructor(...params) {
    super(...params);
    this.name = 'TimeoutError';
  }
}

/**
 * Read and return the content of a response object depending on the given media type
 *
 * @param {Response} response
 * @param {MEDIA_TYPE} mediaType
 * @returns {Promise}
 */
function readResponse(response, mediaType) {
  switch (mediaType) {
    case MEDIA_TYPE.JSON:
      return response.json();
    case MEDIA_TYPE.PROTOBUF:
    case MEDIA_TYPE.MVT:
      return response.arrayBuffer();
    case MEDIA_TYPE.XML:
      return response.text().then(text => new DOMParser().parseFromString(text, 'text/xml'));
    default:
      return response.text();
  }
}

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
  }, options)).then(async response => {
    const responseType = response.headers.get('Content-Type');

    if (!response.ok) {
      const body = await readResponse(response, responseType);

      // Use the textual representation of the status code as a simple error message
      let errorMessage = response.statusText;

      // Try to extract a more meaningful error message from the response
      switch (responseType) {
        case MEDIA_TYPE.JSON:
          if ('error' in body) {
            errorMessage = body.error;
          } else if ('message' in body) {
            errorMessage = body.message;
          }
          break;
      }

      // Throw a more specific error if there were no results due to a timeout
      // (i.e. when the backend does not yield a result after RESPONSE_TIMEOUT)
      // See https://sanic.dev/en/guide/running/configuration.md#responsetimeout
      if (response.status === 503 && errorMessage === 'Response Timeout') {
        throw new TimeoutError();
      } else {
        throw new RequestError(response.status, errorMessage);
      }
    }

    // Throw an error if the actual response type is different from the expected response type
    if (!responseType.includes(mediaType)) {
      throw new Error(`Expected Content-Type header with value ${mediaType}, but got ${responseType} instead`);
    }

    return readResponse(response, mediaType);
  }).catch(error => {
    // Catch aborted requests and ignore them, rethrow all other errors
    if (error.name === 'AbortError') {
      console.log(`Aborted request while fetching file at ${url}: ${error}`); // eslint-disable-line no-console
    } else {
      console.log(`Error while fetching file at ${url}: ${error}`); // eslint-disable-line no-console
      throw error;
    }
  });
}
