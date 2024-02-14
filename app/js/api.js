import { osmAuth } from 'osm-auth';

const auth = osmAuth({
  url: OPENSTREETMAP_SERVER,
  client_id: OPENSTREETMAP_OAUTH_CLIENT_ID, // eslint-disable-line camelcase
  client_secret: OPENSTREETMAP_OAUTH_CLIENT_SECRET, // eslint-disable-line camelcase
  redirect_uri: `${window.location.origin}${window.location.pathname}landing.html`, // eslint-disable-line camelcase
  scope: 'read_prefs write_notes',
  auto: true
});

export default class API {
  /**
    * Authenticate the user
    *
    * @function
    * @returns {Promise}
    */
  login() {
    return new Promise((resolve, reject) => {
      auth.authenticate(error => {
        if (error) {
          reject(error);
        } else {
          resolve(this.request('GET', 'user/details'));
        }
      });
    });
  }

  /**
    * Perform a logout action
    *
    * @function
    * @returns {void}
    */
  logout() {
    auth.logout();
  }

  /**
    * Check whether a user is already logged in
    *
    * @function
    * @returns {Boolean}
    */
  authenticated() {
    return auth.authenticated();
  }

  /**
    * Post a new comment to a note
    *
    * @function
    * @param {Number} id
    * @param {String} text
    * @param {String} action
    * @returns {Promise}
    */
  comment(id, text, action) {
    if (!this.authenticated()) {
      return Promise.reject(new Error('User is not authenticated'));
    }
    if (!text) {
      return Promise.reject(new Error('No text was given'));
    }
    if (!action) {
      action = 'comment';
    }
    return this.request('POST', `notes/${id}/${action}.json?text=${encodeURIComponent(text)}`);
  }

  /**
    * Do an authenticated request to the OpenStreetMap API
    *
    * @function
    * @param {String} method
    * @param {String} path
    * @private
    * @returns {Promise}
    */
  request(method, path) {
    const options = {
      method,
      path: `/api/0.6/${path}`
    };

    return new Promise((resolve, reject) => {
      auth.xhr(options, (error, details) => {
        if (error) {
          reject(error);
        } else {
          resolve(details);
        }
      });
    });
  }
}
