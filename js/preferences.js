const JSON_REGEX = /^({|\[)[\s\S]*(}|\])$/m;

const DEFAULTS = {
  map: {
    latitude: 0,
    longitude: 0,
    zoom: 2
  },
  theme: 'system',
  tools: {
    openstreetmap: true,
    mapillary: false
  },
  editors: {
    id: true,
    josm: false,
    level0: true
  }
};

export default class Preferences {
  /**
    * Get a specific preference by its key and if it's not available, return the default value
    *
    * @function
    * @param {String} key
    * @param {Boolean} temporary
    * @returns {String|Boolean|Object|Array}
    */
  static get(key, temporary) {
    const storage = temporary ? window.sessionStorage : window.localStorage;

    let value = storage.getItem(key);

    if (JSON_REGEX.test(value)) {
      value = JSON.parse(value);
    }

    return value || DEFAULTS[key];
  }

  /**
    * Set or change the value of a preference
    *
    * @function
    * @param {Object} preferences
    * @param {boolean} temporary
    * @returns {void}
    */
  static set(preferences, temporary) {
    const storage = temporary ? window.sessionStorage : window.localStorage;

    for (const key in preferences) {
      if (Object.prototype.hasOwnProperty.call(preferences, key)) {
        const preference = preferences[key];

        if (Array.isArray(preference)) {
          storage.setItem(key, JSON.stringify(preference));
        } else if (typeof preference === 'object') {
          let value = storage.getItem(key);

          if (JSON_REGEX.test(value)) {
            value = JSON.parse(value);
          } else {
            value = {};
          }

          storage.setItem(key, JSON.stringify(Object.assign(value, preference)));
        } else {
          storage.setItem(key, preference);
        }
      }
    }
  }

  /**
    * Remove a specific item from the storage
    *
    * @function
    * @param {String} key
    * @param {Boolean} temporary
    * @returns {void}
    */
  static remove(key, temporary) {
    const storage = temporary ? window.sessionStorage : window.localStorage;
    storage.removeItem(key);
  }

  /**
    * Set all values to the default values
    *
    * @function
    * @returns {void}
    */
  static reset() {
    window.sessionStorage.clear();
    window.localStorage.clear();
    Preferences.set(DEFAULTS);
  }
}
