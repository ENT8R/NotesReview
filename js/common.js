'use strict';

/* globals M */
/* globals Maps */
/* globals Expert */

const UI = (function() {
  const me = {};

  me.searchButton = document.getElementById('search');
  me.cancelButton = document.getElementById('cancel');

  me.queryInput = document.getElementById('query');
  me.limitInput = document.getElementById('limit');

  me.sortOrder = document.getElementById('sort-order');

  function storage() {
    if (Mode.get() === Mode.MAPS) {
      if (!new URL(window.location.href).searchParams.has('map')) {
        const lat = localStorage.getItem('lat');
        const lon = localStorage.getItem('lon');
        const zoom = localStorage.getItem('zoom');
        if (lat && lon && zoom) {
          Maps.get().setView([lat, lon], zoom);
        }
      }

      window.addEventListener('beforeunload', function() {
        const map = Maps.get();
        localStorage.setItem('lat', map.getCenter().lat.toFixed(4));
        localStorage.setItem('lon', map.getCenter().lng.toFixed(4));
        localStorage.setItem('zoom', map.getZoom().toFixed(0));
      });
    }
  }

  // get the URL params and use them to e.g. initiate a new search with the given values
  function searchParams() {
    const url = new URL(window.location.href);

    const query = url.searchParams.get('query');
    const limit = url.searchParams.get('limit');
    const start = url.searchParams.get('start');
    let position;
    if (url.searchParams.has('map')) {
      position = url.searchParams.get('map').split('/');
    }

    if (query) {
      UI.queryInput.value = query;
    }
    if (limit) {
      UI.limitInput.value = limit;
    }
    if (position && typeof Maps !== 'undefined') {
      Maps.get().setView([position[1], position[2]], position[0]);
    }
    if (start === 'true') {
      startSearch();
    }

    if (query || limit || position) {
      const uri = window.location.toString();
      if (uri.indexOf('?') > 0) {
        window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
      }
    }

    Permalink.update();
  }

  me.toggleButtons = function() {
    const preloader = document.getElementById('preloader');
    Effects.togglePreloader(preloader);
    Effects.toggle(UI.searchButton);
    Effects.toggle(UI.cancelButton);
  };

  me.tooltip = function() {
    if (Mode.get() === Mode.MAPS) {
      const tooltip = M.Tooltip.getInstance(UI.searchButton);
      const fastSearch = document.getElementById('fast-search');

      if (Maps.getBBoxSize() < 4) {
        fastSearch.style.display = 'inline-block';
        if (tooltip) {
          tooltip.destroy();
        }
      } else {
        fastSearch.style.display = 'none';
        if (!tooltip) {
          M.Tooltip.init(UI.searchButton, {
            enterDelay: 50,
            html: Localizer.getMessage('description.worldwideQuery')
          });
        }
      }
    }
  };

  me.nothingFound = function() {
    return M.toast({html: Localizer.getMessage('description.nothingFound')});
  };

  me.getNoteActions = function(comment, id, position) {
    const regex = [
      /(?:https?:\/\/)?(?:www\.)?openstreetmap\.org\/(node|way|relation)\/[0-9]{0,}/,
      /(?:https?:\/\/)?(?:www\.)?osm\.org\/(node|way|relation)\/[0-9]{0,}/,
      /(node|way|relation)\/[0-9]{0,}/,
      // TODO: this needs some more thoughts
      // /(node|way|relation) #[0-9]{0,}/,
      /(n|w|r)\/[0-9]{0,} /
    ];

    let text = '<a href="https://www.openstreetmap.org/note/' + id + '" target="_blank">'  + Localizer.getMessage('note.viewOnOsm', id) + '</a>';

    const matches = comment.match(regex[0]) || comment.match(regex[1]) || comment.match(regex[2]) || comment.match(regex[3]);
    if (matches !== null) {
      const element = matches[0].match(regex[2])[0];
      // Level0
      text += '<br>' +
              '<a' +
              ' href="http://level0.osmz.ru/?url=' + element + '&center=' + position.reverse().join(',') + '"' +
              ' target="_blank">' + Localizer.getMessage('note.edit.level0', element) + '</a>';
      // iD
      text += '<br>' +
              '<a' +
              ' href="http://www.openstreetmap.org/edit?editor=id&' + element.replace('/', '=') + '"' +
              ' target="_blank">' + Localizer.getMessage('note.edit.id', element) + '</a>';
    }

    return text;
  };

  me.getAmountOfCommentsBadge = function(comments) {
    const length = comments.length - 1;
    let text = '';

    if (length > 0) {
      let caption = Localizer.getMessage('note.comments');
      if (length === 1) {
        caption = Localizer.getMessage('note.comment');
      }

      text = '<span class="new badge blue" data-badge-caption="' + caption + '">' + length + '</span>';
    }
    return text;
  };

  me.getAgeOfNote = function(date) {
    const today = new Date();
    //see https://stackoverflow.com/a/3257513
    date = new Date(date.replace(/-/g, '/'));
    const difference = Math.abs(today.getTime() - date.getTime());

    const age = {
      seconds: Math.round(difference / (1000)),
      minutes: Math.round(difference / (1000 * 60)),
      hours: Math.round(difference / (1000 * 60 * 60)),
      days: Math.round(difference / (1000 * 60 * 60 * 24)),
      months: Math.round(difference / (1000 * 60 * 60 * 24 * 30)),
      years: Math.round(difference / (1000 * 60 * 60 * 24 * 365.25)),
    };

    let caption;
    let amount;
    let color = 'green darken-2';
    let icon = 'green-darken-2.svg';

    if (age.seconds < 60) {
      caption = age.seconds === 1 ? Localizer.getMessage('age.second') : Localizer.getMessage('age.seconds');
      amount = age.seconds;
    } else if (age.minutes < 60) {
      caption = age.minutes === 1 ? Localizer.getMessage('age.minute') : Localizer.getMessage('age.minutes');
      amount = age.minutes;
    } else if (age.hours < 24) {
      caption = age.hours === 1 ? Localizer.getMessage('age.hour') : Localizer.getMessage('age.hours');
      amount = age.hours;
    } else if (age.days <= 31) {
      caption = age.days === 1 ? Localizer.getMessage('age.day') : Localizer.getMessage('age.days');
      amount = age.days;
      color = 'green';
      icon = 'green.svg';
    } else if (age.months < 12) {
      caption = age.months === 1 ? Localizer.getMessage('age.month') : Localizer.getMessage('age.months');
      amount = age.months;
      if (amount < 6) {
        color = 'yellow darken-2';
        icon = 'yellow-darken-2.svg';
      } else {
        color = 'amber darken-2';
        icon = 'amber-darken-2.svg';
      }
    } else {
      caption = age.years === 1 ? Localizer.getMessage('age.year') : Localizer.getMessage('age.years');
      amount = age.years;
      if (amount <= 1) {
        color = 'orange';
        icon = 'orange.svg';
      } else {
        color = 'red';
        icon = 'red.svg';
      }
    }

    return {
      badge: '<span class="new badge ' + color + '" data-badge-caption="' + caption + '">' + amount + '</span>',
      icon: icon
    };
  };

  me.init = function() {
    // Buttons
    UI.searchButton.addEventListener('click', function() {
      startSearch();
    });
    UI.cancelButton.addEventListener('click', function() {
      Request.cancel();
    });
    if (UI.sortOrder) {
      UI.sortOrder.addEventListener('change', function() {
        Expert.changeOrder();
      });
    }

    // Permalink update triggers
    const updateLinkTriggers = document.getElementsByClassName('update-link');
    for (let i = 0; i < updateLinkTriggers.length; i++) {
      updateLinkTriggers[i].addEventListener('change', function() {
        Permalink.update();
      });
    }

    // Keyboard listeners
    document.addEventListener('keydown', function(e) {
      if (e.which === 13 && !Request.isRunning) {
        startSearch();
      } else if (Request.isRunning) {
        Request.cancel();
      }
    });

    // Materialize elements
    M.Modal.init(document.querySelectorAll('.modal'));

    // other things
    storage();
    searchParams();
    UI.tooltip();
  };

  return me;
})();

const Localizer = (function() {
  const me = {};

  const I18N_ATTRIBUTE = 'data-i18n';

  let translations;
  let fallback;

  function replaceI18n(elem, tag) {
    // localize main content
    if (tag !== '') {
      const isHTML = tag.startsWith('[html]');
      if (isHTML) {
        tag = tag.replace('[html]', '');
      }
      const translatedMessage = Localizer.getMessage(tag);
      if (translatedMessage !== '') {
        if (isHTML) {
          elem.innerHTML = translatedMessage;
        } else {
          elem.textContent = translatedMessage;
        }
      }
    }
  }

  me.getMessage = function(tag, string) {
    const value = getProperty(tag, translations, fallback);
    if (typeof string !== 'undefined') {
      return value.replace('%s', string);
    }
    return value;
  };

  function getLanguage() {
    const language = navigator.language || navigator.userLanguage;
    return language.split('-')[0];
  }

  function getProperty(propertyName, t, f) {
    const parts = propertyName.split('.');
    let property = t;
    for (let i = 0; i < parts.length; i++) {
      if (typeof property[parts[i]] !== 'undefined') {
        property = property[parts[i]];
      } else {
        property = f[parts[i]];
      }
    }
    return property;
  }

  me.init = function(callback) {
    const path = 'https://ent8r.github.io/NotesReview/locales/';
    Request.get(new XMLHttpRequest(), path + 'en.json', function(en) {
      let locale = 'en';
      fallback = en;
      Request.get(new XMLHttpRequest(), path + getLanguage() + '.json', function(strings, error) {
        if (!strings && error !== null) {
          translations = fallback;
        } else if (!translations) {
          translations = strings;
          locale = getLanguage();
        }

        document.querySelectorAll(`[${I18N_ATTRIBUTE}]`).forEach((currentElem) => {
          const contentString = currentElem.getAttribute(I18N_ATTRIBUTE);
          replaceI18n(currentElem, contentString);
        });

        // replace html lang attribut after translation
        document.querySelector('html').setAttribute('lang', locale);

        if (typeof callback === 'function') {
          callback();
        }
      });
    });
  };

  return me;
})();

const Effects = (function() {
  const me = {};

  me.toggle = function(element) {
    const display = (window.getComputedStyle ? getComputedStyle(element, null) : element.currentStyle).display;
    if (display === 'none') {
      element.style.display = 'inline-block';
    } else {
      element.style.display = 'none';
    }
  };

  me.togglePreloader = function(element) {
    const visibility = (window.getComputedStyle ? getComputedStyle(element, null) : element.currentStyle).visibility;
    if (visibility === 'hidden') {
      element.style.visibility = 'visible';
    } else {
      element.style.visibility = 'hidden';
    }
  };

  return me;
})();

const Request = (function() {
  const me = {};

  let isRunning = false;
  me.isRunning = isRunning;

  const result = {
    type: 'FeatureCollection',
    features: []
  };

  let http;

  me.buildURL = function(query, limit, closed, bbox) {
    if (!bbox) {
      return 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;
    } else {
      return 'https://api.openstreetmap.org/api/0.6/notes.json?bbox=' + query + '&limit=' + limit + '&closed=' + closed;
    }
  };

  me.get = function(req, url, callback) {
    http = req || new XMLHttpRequest();
    isRunning = true;
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        isRunning = false;
        if (http.status === 200) {
          const result = JSON.parse(http.responseText);
          if (callback && typeof callback === 'function') {
            callback(result);
          }
        } else if (http.status === 404) {
          if (callback && typeof callback === 'function') {
            callback(null, new Error('The file could not be found!'));
          }
        }
      }
    };

    http.open('GET', url, true);
    http.send();
  };

  me.getAsGeoJSON = function(urls, callback) {
    if (typeof urls === 'string') {
      urls = [urls];
    }

    if (urls.length > 0) {
      Request.get(new XMLHttpRequest(), urls[0], function(data) {
        result.features = result.features.concat(data.features);
        urls.shift();

        if (urls.length === 0) {
          if (callback && typeof callback === 'function') {
            callback(result);
          }
          result.features = [];
        } else {
          Request.getAsGeoJSON(urls, callback);
        }
      });
    }
  };

  me.cancel = function() {
    http.abort();
    UI.toggleButtons();
  };

  return me;
})();

const Mode = (function() {
  const me = {};

  let mode;

  me.MAPS = 'maps';
  me.EXPERT = 'expert';

  me.get = function() {
    return mode;
  };

  me.set = function(value) {
    mode = value;
  };

  return me;
})();

const Permalink = (function() { // eslint-disable-line no-unused-vars
  const me = {};

  me.update = function() {
    let url = 'https://ent8r.github.io/NotesReview/?';
    let expertUrl = 'https://ent8r.github.io/NotesReview/expert/?';

    const query = UI.queryInput.value;
    const limit = UI.limitInput.value;
    const start = document.getElementById('start-query').checked;

    let data = {};
    if (query) data.query = query;
    if (limit) data.limit = limit;
    if (start) data.start = start;

    if (Mode.get() === Mode.MAPS) {
      const showMap = document.getElementById('show-map').checked;

      const map = Maps.get();
      const position = map.getZoom().toFixed(0) + '/' + map.getCenter().lat.toFixed(4) + '/' + map.getCenter().lng.toFixed(4);

      if (showMap && position) data.map = position;
    }

    url += encodeQueryData(data);
    expertUrl += encodeQueryData(data);

    if (Mode.get() === Mode.EXPERT) {
      document.getElementById('link').href = url;
      document.getElementById('permalink').value = expertUrl;
    } else {
      document.getElementById('link').href = expertUrl;
      document.getElementById('permalink').value = url;
    }
  };

  function encodeQueryData(data) {
    let ret = [];
    for (let d in data) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
    return ret.join('&');
  }

  return me;
})();

function startSearch() {
  const query = UI.queryInput.value;
  let limit = UI.limitInput.value;
  const searchClosed = document.getElementById('search-closed').checked;

  let closed = '0';
  if (searchClosed) {
    closed = '-1';
  }

  // don't start a new search if the geocoding input is focused
  if (Mode.get() === Mode.MAPS && document.querySelector('.leaflet-control-geocoder-form input') == document.activeElement) {
    return;
  }

  if (!query) {
    if (Mode.get() === Mode.MAPS) {
      if (Maps.getBBoxSize() > 4) {
        return M.toast({html: Localizer.getMessage('description.specifyQuery')});
      }
    } else {
      return M.toast({html: Localizer.getMessage('description.specifyQuery')});
    }
  }

  if (limit > 10000) {
    limit = 10000;
    UI.limitInput.value = 10000;
    M.toast({html: Localizer.getMessage('description.autoLimit')});
  }

  UI.toggleButtons();

  if (Mode.get() === Mode.EXPERT) {
    Expert.search(query, limit, closed);
  } else {
    Maps.search(query, limit, closed);
  }
}
