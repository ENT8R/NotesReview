/* globals OPENSTREETMAP_SERVER */

import '@github/time-elements';
import './polyfills.js';

import API from './api.js';
import * as Badges from './badges.js';
import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import * as Mode from './mode.js';
import Note from './note.js';
import Permalink from './permalink.js';
import * as Preferences from './preferences.js';
import Query from './query.js';
import * as Request from './request.js';
import * as Theme from './theme.js';
import * as Util from './util.js';

import comment from '../templates/notes/comment.mst';

__webpack_public_path__ = Mode.get() === Mode.MAPS ? 'dist/' : '../dist/'; // eslint-disable-line

let map;
let ui;
let query;

const api = new API();

/**
  * Initiate a new query and do some UI changes before and after it
  *
  * @function
  * @private
  * @returns {void}
  */
async function search() {
  const q = document.getElementById('query').value;
  let limit = document.getElementById('limit').value;
  const closed = document.getElementById('show-closed').checked;
  let user = document.getElementById('user').value;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;

  if (limit > 10000) {
    limit = 10000;
    document.getElementById('limit').value = 10000;
    toast(Localizer.message('description.autoLimit'), 'toast-warning');
  }

  if (['anonymous', Localizer.message('note.anonymous')].includes(user)) {
    user = null;
    document.getElementById('hide-anonymous').checked = false;
    document.getElementById('hide-anonymous').setAttribute('disabled', 'true');
  } else {
    document.getElementById('hide-anonymous').removeAttribute('disabled');
  }

  document.getElementById('preloader').classList.remove('d-invisible');
  document.getElementById('search').classList.add('d-hide');
  document.getElementById('cancel').classList.remove('d-hide');

  query = new Query(q, limit, closed, user, from, to);

  const previous = Preferences.get('previous', true);
  if (previous) {
    query.url = previous.url;
    query.api = previous.api;
    Preferences.remove('previous', true);
  }

  const notes = await query.search();
  ui.show(notes, query).then(details).finally(() => {
    document.getElementById('preloader').classList.add('d-invisible');
    document.getElementById('search').classList.remove('d-hide');
    document.getElementById('cancel').classList.add('d-hide');
  });
}

/**
  * Show a small toast notification with the given message
  *
  * @function
  * @private
  * @param {String} message
  * @param {String} type
  * @param {Number} duration
  * @returns {void}
  */
async function toast(message, type, duration) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.classList.add('toast', type || 'toast-primary');

  const close = document.createElement('button');
  close.classList.add('btn', 'btn-clear', 'float-right');
  close.addEventListener('click', () => {
    document.getElementById('toast-container').removeChild(toast);
  });

  toast.appendChild(close);
  toast.appendChild(document.createTextNode(message));

  container.appendChild(toast);
  await Util.wait(duration || 4000);
  if (container.contains(toast)) {
    container.removeChild(toast);
  }
}

/**
  * Show a hint (tooltip) to the user that the worldwide query is used
  * if the bounding box is too large
  *
  * @function
  * @private
  * @returns {void}
  */
function tooltip() {
  const search = document.getElementById('search');
  const fastSearch = document.getElementById('fast-search');

  if (map.boundsSize() < 4) {
    fastSearch.classList.remove('d-hide');
    search.classList.remove('tooltip');
  } else {
    fastSearch.classList.add('d-hide');
    search.classList.add('tooltip');
  }
}

/**
  * Show some details for the currently shown notes
  *
  * @function
  * @private
  * @param {Object} result
  * @returns {void}
  */
function details(result) {
  if (result) {
    if (result.amount) {
      if (result.amount === 0) {
        toast(Localizer.message('description.nothingFound'), 'toast-error');
      } else {
        // Display how much notes are shown
        document.getElementById('found-notes').textContent = Localizer.message('note.amount', result.amount);
      }
    }

    if (result.average) {
      document.getElementById('average-date').innerHTML =
        Localizer.message('note.average', Badges.age(Util.parseDate(result.average), result.average));
    }
  }
}

/**
  * Show all comments of a given note in a modal
  *
  * @function
  * @private
  * @param {Number} id
  * @returns {void}
  */
function comments(id) {
  const note = ui.get(id);
  document.getElementById('comments').innerHTML = comment(note);
  document.getElementById('comments').dataset.noteId = id;
  document.getElementById('note-link').href = `${OPENSTREETMAP_SERVER}/note/${note.id}`;

  // Clear the note input
  document.getElementById('note-comment').value = '';
  document.getElementById('note-comment').dispatchEvent(new Event('input'));

  // Show different actions depending on the status of the note
  document.querySelector('.comment-action[data-action="comment"]').style.display = note.status === 'open' ? 'block' : 'none';
  document.querySelector('.comment-action[data-action="close"]').style.display = note.status === 'open' ? 'block' : 'none';
  document.querySelector('.comment-action[data-action="reopen"]').style.display = note.status === 'closed' ? 'block' : 'none';

  // Finally show the modal with the comments in it
  const modal = document.querySelector('.modal[data-modal="comments"]');
  modal.classList.add('active');
  modal.getElementsByClassName('modal-body')[0].scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

/**
  * Initialize all listeners
  *
  * @function
  * @private
  * @returns {void}
  */
function listener() {
  document.querySelector('[href="#share"]').addEventListener('click', () => Permalink());

  document.getElementById('search').addEventListener('click', () => search());
  document.getElementById('cancel').addEventListener('click', () => Request.cancel());

  document.getElementById('sort-order').addEventListener('change', () => {
    ui.reverse().then(details);
  });

  document.getElementById('hide-anonymous').addEventListener('change', () => {
    ui.reload().then(details);
  });

  document.getElementById('login').addEventListener('click', () => {
    const login = document.getElementById('login');
    login.classList.add('loading');

    api.login().then(() => {
      login.classList.remove('loading');
      login.classList.add('d-hide');
      document.getElementById('logout').classList.remove('d-hide');
      document.body.dataset.authenticated = true;
    }).catch(error => {
      console.log(error); // eslint-disable-line no-console
    });
  });

  document.getElementById('logout').addEventListener('click', () => {
    api.logout();
    document.getElementById('logout').classList.add('d-hide');
    document.getElementById('login').classList.remove('d-hide');
    document.body.dataset.authenticated = false;
  });

  document.getElementById('note-comment').addEventListener('input', () => {
    const text = document.getElementById('note-comment').value.trim();
    if (text === '') {
      document.getElementById('note-comment-actions').classList.add('d-hide');
    } else {
      document.getElementById('note-comment-actions').classList.remove('d-hide');
    }
  });

  Array.from(document.getElementsByClassName('comment-action')).forEach(element => {
    element.addEventListener('click', () => {
      element.classList.add('loading');

      const id = parseInt(document.getElementById('comments').dataset.noteId);
      const text = document.getElementById('note-comment').value.trim();

      api.comment(id, text, element.dataset.action).then(async () => {
        const note = await Request.get(`${OPENSTREETMAP_SERVER}/api/0.6/notes/${id}.json`, Request.MEDIA_TYPE.JSON);
        ui.update(id, new Note(note, query.api)).then(details);
        comments(id);
      }).catch(error => {
        console.log(error); // eslint-disable-line no-console
      }).finally(() => {
        element.classList.remove('loading');
      });
    });
  });

  Array.from(document.getElementsByClassName('setting')).forEach(element => {
    element.addEventListener('change', () => {
      Preferences.set({
        theme: document.getElementById('theme-selection').value,
        editor: {
          id: document.getElementById('editor-id').checked,
          josm: document.getElementById('editor-josm').checked,
          level0: document.getElementById('editor-level0').checked
        }
      });
      settings();
    });
  });

  Array.from(document.getElementsByClassName('update-link')).forEach(element => {
    element.addEventListener('change', () => Permalink());
  });

  document.getElementById('permalink').addEventListener('click', document.getElementById('permalink').select);

  document.getElementById('permalink').addEventListener('dblclick', () => {
    document.getElementById('permalink').select();
    document.execCommand('copy');
    toast(Localizer.message('action.copyLinkSuccess'), 'toast-success');
  });

  document.getElementById('link').addEventListener('click', () => {
    Preferences.set({
      previous: {
        url: query.url,
        api: query.api
      }
    }, true);
  });

  Array.from(document.getElementsByClassName('modal-close')).forEach(element => {
    element.addEventListener('click', event => {
      document.body.style.overflow = '';
      event.target.closest('.modal').classList.remove('active');
    });
  });

  document.addEventListener('keydown', e => {
    // Start a new search if the enter button was pressed and there is no ongoing request
    if (e.which === 13) {
      // Don't start a new search if the geocoding input is focused
      if (Mode.get() === Mode.MAPS && document.querySelector('.leaflet-control-geocoder-form input') === document.activeElement) {
        return;
      }

      if (Request.isRunning()) {
        Request.cancel();
        document.getElementById('preloader').classList.add('d-invisible');
        document.getElementById('search').classList.remove('d-hide');
        document.getElementById('cancel').classList.add('d-hide');
      } else {
        search();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    if (Mode.get() === Mode.MAPS) {
      const center = map.center();
      Preferences.set({
        map: {
          latitude: center.lat,
          longitude: center.lng,
          zoom: map.zoom()
        }
      });
    }

    Preferences.set({
      lastVisit: new Date().getTime()
    });
  });

  // Dynamic listeners
  document.addEventListener('click', event => {
    const commentsModalTrigger = event.target.closest('.comments-modal-trigger');
    if (commentsModalTrigger) {
      const id = parseInt(commentsModalTrigger.closest('[data-note-id]').dataset.noteId);
      comments(id);
    }
  });
}

/**
  * Use the URL search parameters to e.g. start a new search with the given values
  *
  * @function
  * @private
  * @returns {void}
  */
function searchParameter() {
  new URL(window.location.href).searchParams.forEach((value, key) => {
    switch (key) {
    case 'map':
      if (Mode.get() === Mode.MAPS) {
        const position = value.split('/');
        map.setView([position[1], position[2]], position[0]);
      }
      break;
    case 'query':
      document.getElementById('query').value = value;
      break;
    case 'limit':
      document.getElementById('limit').value = value;
      break;
    case 'user':
      document.getElementById('user').value = value;
      break;
    case 'from':
      document.getElementById('from').value = value;
      break;
    case 'to':
      document.getElementById('to').value = value;
      break;
    case 'closed':
      document.getElementById('show-closed').checked = value === 'true' ? true : false;
      break;
    case 'anonymous':
      document.getElementById('hide-anonymous').checked = value === 'true' ? false : true;
      break;
    }
  });

  const uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
  }

  Permalink();
}

/**
  * Get the preferences and update the UI accordingly
  *
  * @function
  * @private
  * @returns {void}
  */
function settings() {
  const editors = Preferences.get('editor');
  document.getElementById('editor-id').checked = editors.id;
  document.getElementById('editor-josm').checked = editors.josm;
  document.getElementById('editor-level0').checked = editors.level0;
  document.body.dataset.editorId = editors.id;
  document.body.dataset.editorJosm = editors.josm;
  document.body.dataset.editorLevel0 = editors.level0;

  const theme = Preferences.get('theme');
  document.getElementById('theme-selection').value = theme;
  Theme.set(theme);
}

/**
  * Initialize all necessary things for the user interface
  *
  * @function
  * @private
  * @returns {void}
  */
async function init() {
  await Localizer.init();

  const mode = Mode.get() === Mode.MAPS ? 'map' : 'expert';
  const { default: UI } = await import(/* webpackChunkName: "ui/[request]" */ `./ui/${mode}`);
  ui = new UI();

  if (Preferences.get('lastVisit') === null) {
    Preferences.reset();
    Preferences.set({
      lastVisit: new Date().getTime()
    });
  }

  if (Mode.get() === Mode.MAPS) {
    map = new Leaflet('map', tooltip);

    if (!new URL(window.location.href).searchParams.has('map')) {
      const { latitude, longitude, zoom } = Preferences.get('map') || {};

      if (latitude && longitude && zoom) {
        map.setView([latitude, longitude], zoom);
      }
    }
  }

  const authenticated = api.authenticated();
  document.body.dataset.authenticated = authenticated;
  if (authenticated) {
    document.getElementById('login').classList.add('d-hide');
    document.getElementById('logout').classList.remove('d-hide');
  } else {
    document.getElementById('login').classList.remove('d-hide');
    document.getElementById('logout').classList.add('d-hide');
  }

  listener();
  searchParameter();
  settings();
  search();
}

init();
