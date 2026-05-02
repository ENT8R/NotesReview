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
}
