import * as Request from './request.js';
import * as Util from './util.js';

export default class Users {
  // TODO: This could be a private static property of this class
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields#browser_compatibility
  // chrome >= 74, edge >= 79, firefox >= 90 (!), not ie <= 11, opera >= 62, safari >= 14.1
  static all = new Set();
  static ids = new Set();

  /**
    * Parses the XML document and returns all important information
    *
    * @constructor
    * @param {Set} ids
    * @returns {Promise}
    */
  static load(ids) {
    const requests = [];
    ids = Util.chunk(Array.from(ids).filter(x => !Users.ids.has(x)), 500);
    for (let i = 0; i < ids.length; i++) {
      const url = `${OPENSTREETMAP_SERVER}/api/0.6/users?users=${ids[i].join(',')}`;
      const request = Request.get(url, Request.MEDIA_TYPE.XML).then(xml => {
        if (xml && xml.documentElement && xml.querySelector('parsererror') == null) {
          Array.from(xml.documentElement.children).forEach(user => {
            Users.all.add({
              id: Number.parseInt(user.getAttribute('id')),
              name: user.getAttribute('display_name'),
              created: new Date(user.getAttribute('account_created')),
              description: user.getElementsByTagName('description')[0].innerText,
              image: user.querySelector('img[href]') ? user.getElementsByTagName('img')[0].getAttribute('href') : null,
              changesets: user.getElementsByTagName('changesets')[0].getAttribute('count')
            });
            Users.ids.add(Number.parseInt(user.getAttribute('id')));
          });
        }
      });
      requests.push(request);
    }
    return Promise.all(requests);
  }

  /**
    * Get a user by its identifier
    *
    * @function
    * @param {Number} id
    * @returns {Object}
    */
  static get(id) {
    if (!id || !Users.ids.has(id)) {
      return;
    }
    return Array.from(Users.all).find(user => user.id === id);
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
    if (!uid) {
      avatar.style.display = 'none';
      return;
    }
    await Users.load(new Set([uid]));
    const user = Users.get(Number.parseInt(uid));
    if (user) {
      avatar.style.display = 'inline-block';
      avatar.dataset.initial = Util.initials(user.name);
      avatar.innerHTML = user.image ? `<img src="${user.image}">` : '';
    }
  }
}
