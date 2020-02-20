import * as Request from './request.js';
import * as Util from './util.js';

export default class Users {
  /**
    * Parses the XML document and returns all important information
    *
    * @constructor
    * @param {Set} ids
    * @returns {void}
    */
  static async load(ids) {
    if (!Users.all) {
      Users.all = new Set();
    }

    ids = Util.chunk(Array.from(ids), 500);
    for (let i = 0; i < ids.length; i++) {
      const url = `${OPENSTREETMAP_SERVER}/api/0.6/users?users=${ids[i].join(',')}`;
      const xml = await Request.get(url, Request.MEDIA_TYPE.XML);
      if (xml && xml.documentElement) {
        xml.documentElement.children.forEach(user => {
          Users.all.add({
            id: Number.parseInt(user.getAttribute('id')),
            name: user.getAttribute('display_name'),
            created: new Date(user.getAttribute('account_created')),
            description: user.getElementsByTagName('description')[0].innerText,
            image: user.querySelector('img[href]') ? user.getElementsByTagName('img')[0].getAttribute('href') : null,
            changesets: user.getElementsByTagName('changesets')[0].getAttribute('count')
          });
        });
      }
    }
  }

  /**
    * Get a user by its identifier
    *
    * @function
    * @param {Number} id
    * @returns {Object}
    */
  static get(id) {
    if (!id) {
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
