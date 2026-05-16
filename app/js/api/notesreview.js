import Preferences from '../preferences.js';
import Request, { MEDIA_TYPE } from '../request.js';

export default class NotesReview {
  /**
    * Use the OIDC id token to initiate the login process for the backend
    *
    * @function
    * @returns {Promise}
    */
  static login() {
    return Request(`${NOTESREVIEW_API_URL}/auth/login`, MEDIA_TYPE.TEXT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Check whether a user is currently logged in
    *
    * @function
    * @returns {Promise}
    */
  static async isAuthenticated() {
    // Check whether there is a (valid) token in the localStorage
    const token = Preferences.get('oidc_token');
    if (!token) {
      return false;
    }

    // And also verify that it works by fetching the /auth/userinfo endpoint.
    // If this request is successful, it means that the token is in use by the current user
    try {
      await Request(`${NOTESREVIEW_API_URL}/auth/userinfo`, MEDIA_TYPE.JSON, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
    * Log out the current user from the backend
    *
    * @function
    * @returns {Promise}
    */
  static logout() {
    return Request(`${NOTESREVIEW_API_URL}/auth/logout`, MEDIA_TYPE.TEXT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Search for notes according to the query data
    *
    * @function
    * @param {Object} data
    * @param {AbortController} controller
    * @returns {Promise}
    */
  static search(data, controller) {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = Preferences.get('oidc_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return Request(`${NOTESREVIEW_API_URL}/search`, MEDIA_TYPE.JSON, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }, controller);
  }

  /**
    * Add a note to the blocklist
    *
    * @function
    * @param {Number} id
    * @returns {Promise}
    */
  static hide(id) {
    return Request(`${NOTESREVIEW_API_URL}/notes/blocklist/${id}`, MEDIA_TYPE.TEXT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Remove a note from the blocklist
    *
    * @function
    * @param {Number} id
    * @returns {Promise}
    */
  static unhide(id) {
    return Request(`${NOTESREVIEW_API_URL}/notes/blocklist/${id}`, MEDIA_TYPE.TEXT, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Add a note to the watchlist
    *
    * @function
    * @param {Number} id
    * @returns {Promise}
    */
  static watch(id) {
    return Request(`${NOTESREVIEW_API_URL}/notes/watchlist/${id}`, MEDIA_TYPE.TEXT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Remove a note from the watchlist
    *
    * @function
    * @param {Number} id
    * @returns {Promise}
    */
  static unwatch(id) {
    return Request(`${NOTESREVIEW_API_URL}/notes/watchlist/${id}`, MEDIA_TYPE.TEXT, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }

  /**
    * Get all notes that are currently on the watchlist
    *
    * @function
    * @returns {Promise}
    */
  static watchlist() {
    return Request(`${NOTESREVIEW_API_URL}/notes/watchlist`, MEDIA_TYPE.JSON, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oidc_token')}`
      }
    });
  }
}
