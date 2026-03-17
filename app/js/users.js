import OsmApi from './api/openstreetmap.js';
import * as Util from './util.js';

export default class Users {
  static #all = new Set();
  static #ids = new Set();

  /**
    * Load the details of multiple users by their ids and add them to the internal cache
    *
    * @constructor
    * @param {Set} ids
    * @returns {Promise}
    */
  static load(ids) {
    const requests = [];
    ids = Util.chunk(Array.from(ids).filter(x => !Users.#ids.has(x)), 500);
    for (let i = 0; i < ids.length; i++) {
      const request = OsmApi.users(ids[i]).then(result => {
        result.users.map(user => user.user).forEach(user => Users.add(user));
      });
      requests.push(request);
    }
    return Promise.all(requests);
  }

  /**
    * Add a user to the internal cache sets
    *
    * @function
    * @param {Object} user
    * @returns {void}
    */
  static add(user) {
    Users.#all.add({
      id: Number.parseInt(user.id),
      name: user.display_name,
      created: new Date(user.account_created),
      description: user.description,
      image: ('img' in user && 'href' in user.img) ? user.img.href : null,
      changesets: user.changesets.count
    });
    Users.#ids.add(Number.parseInt(user.id));
  }

  /**
    * Get a user by its identifier
    *
    * @function
    * @param {Number} id
    * @returns {Object}
    */
  static get(id) {
    if (!id || !Users.#ids.has(id)) {
      return;
    }
    return Array.from(Users.#all).find(user => user.id === id);
  }

  /**
    * Load the current user and show the corresponding avatar
    *
    * @function
    * @param {Number|String} uid
    * @returns {void}
    */
  static async avatar(uid) {
    const avatar = document.getElementById('user-avatar');
    // Hide the avatar if no user is logged in
    if (!uid) {
      avatar.style.display = 'none';
      return;
    }
    // Load the user if it is not already in the cache
    if (!Users.#ids.has(uid)) {
      await Users.load(new Set([uid]));
    }
    // Show the avatar if the user and its details are in the cache
    const user = Users.get(Number.parseInt(uid));
    if (user) {
      avatar.style.display = 'inline-block';
      avatar.dataset.initial = Util.initials(user.name);
      avatar.innerHTML = user.image ? `<img src="${user.image}">` : '';
    }
  }
}
