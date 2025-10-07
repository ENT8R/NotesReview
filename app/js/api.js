import Preferences from './preferences.js';
import Request, { MEDIA_TYPE } from './request.js';

export default class API {
  /**
    * Get the details of the user that is currently logged in
    *
    * @function
    * @returns {Promise}
    */
  userDetails() {
    return Request(`${OPENSTREETMAP_SERVER}/api/0.6/user/details.json`, MEDIA_TYPE.JSON, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Preferences.get('oauth2_access_token')}`
      }
    });
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
    if (!text) {
      return Promise.reject(new Error('No text was given'));
    }
    if (!action) {
      action = 'comment';
    }
    return Request(
      `${OPENSTREETMAP_SERVER}/api/0.6/notes/${id}/${action}.json`, MEDIA_TYPE.JSON, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Preferences.get('oauth2_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text
        })
      });
  }
}
