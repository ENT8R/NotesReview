import OsmApi from './api/openstreetmap.js';
import NotesReview from './api/notesreview.js';
import * as Util from './util.js';

export default class Users {
  static #all = new Map();
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
    ids = Util.chunk(Array.from(ids).filter(x => !Users.#ids.has(x)), 100);
    for (let i = 0; i < ids.length; i++) {
      const request = OsmApi.users(ids[i]).then(result => {
        result.users.map(user => user.user).forEach(user => Users.add(user));
      }).then(() => {
        return NotesReview.stats(ids[i]);
      }).then(result => {
        result.forEach(stats => {
          Users.addStats(stats);
        });
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
    Users.#all.set(Number.parseInt(user.id), {
      id: Number.parseInt(user.id),
      name: user.display_name,
      created: new Date(user.account_created),
      description: user.description,
      company: ('company' in user) ? user.company : null,
      image: ('img' in user && 'href' in user.img) ? user.img.href : null,
      changesets: user.changesets.count,
      stats: null,
    });
    Users.#ids.add(Number.parseInt(user.id));
  }

  /**
   * Add statistics to an already cached user.
   * If the user is not in the cache, the stats are ignored.
   *
   * @param {Object} stats
   * @returns {void}
   */
  static addStats(stats) {
    const id = stats._id;
    const user = Users.#all.get(id);
    // Skip the user if it is not in the cache (i.e., if it was not returned by the OSM API)
    if (!user) {
      return;
    }

    // Merge the stats into the existing user object
    Users.#all.set(id, Object.assign(user, {
      stats: {
        notes: stats.notes,
        firstNote: new Date(stats.first),
        lastNote: new Date(stats.last),
      }
    }));
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
    return Users.#all.get(id);
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
