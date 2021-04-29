import './polyfills.js';
import './public-path.js';

import API from './api.js';
import * as Badges from './badges.js';
import Comments from './modals/comments.js';
import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import Mapillary from './modals/mapillary.js';
import Modal from './modals/modal.js';
import * as Mode from './mode.js';
import Note from './note.js';
import Permalink from './permalink.js';
import Preferences from './preferences.js';
import Query, { ANONYMOUS } from './query.js';
import * as Request from './request.js';
import * as Theme from './theme.js';
import Users from './users.js';
import * as Util from './util.js';

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
  let anonymous = ANONYMOUS.INCLUDE;
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const [ sort, order ] = document.getElementById('sort').value.split('-');

  if (limit > 10000) {
    limit = 10000;
    document.getElementById('limit').value = 10000;
    toast(Localizer.message('description.autoLimit'), 'toast-warning');
  }

  if (['anonymous', Localizer.message('note.anonymous')].includes(user)) {
    user = null;
    anonymous = ANONYMOUS.ONLY;
    document.getElementById('hide-anonymous').checked = false;
    document.getElementById('hide-anonymous').setAttribute('disabled', 'true');
  } else {
    document.getElementById('hide-anonymous').removeAttribute('disabled');
  }

  document.getElementById('preloader').classList.remove('d-hide');

  query = new Query(q, limit, closed, user, anonymous, from, to, sort, order);

  const previous = Preferences.get('previous', true);
  if (previous) {
    query.url = previous.url;
    query.endpoint = previous.endpoint;
    Preferences.remove('previous', true);
  }

  const notes = await query.search();
  ui.show(Array.from(notes), query).then(details).finally(() => {
    document.getElementById('preloader').classList.add('d-hide');
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
  if (result.amount === 0) {
    toast(Localizer.message('description.nothingFound'), 'toast-error');
    document.getElementById('details').classList.add('d-hide');
  } else {
    document.getElementById('details').classList.remove('d-hide');
  }

  document.getElementById('found-notes').textContent = Localizer.message('note.amount', result.amount);
  document.getElementById('average-date').innerHTML = Localizer.message('note.average', Badges.age(Util.parseDate(result.average), result.average, true));
}

/**
  * Initialize all listeners
  *
  * @function
  * @private
  * @returns {void}
  */
function listener() {
  document.querySelector('.modal-trigger[data-modal="share"]').addEventListener('click', () => Permalink());

  document.getElementById('search').addEventListener('click', () => search());
  document.getElementById('cancel').addEventListener('click', () => Request.cancel());

  document.getElementById('hide-anonymous').addEventListener('change', () => {
    ui.reload().then(details);
  });

  document.getElementById('login').addEventListener('click', () => {
    const login = document.getElementById('login');
    login.classList.add('loading');

    api.login().then(result => {
      login.classList.add('d-hide');
      document.getElementById('logout').classList.remove('d-hide');
      document.body.dataset.authenticated = true;

      const uid = result.getElementsByTagName('user')[0].getAttribute('id');
      Preferences.set({ uid });
      Users.avatar(uid);
    }).catch(error => {
      console.log(error); // eslint-disable-line no-console
      document.body.dataset.authenticated = false;
    }).finally(() => {
      login.classList.remove('loading');
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

  document.getElementsByClassName('comment-action').forEach(element => {
    element.addEventListener('click', () => {
      element.classList.add('loading');

      const id = Number.parseInt(document.getElementById('comments').dataset.noteId);
      const text = document.getElementById('note-comment').value.trim();

      api.comment(id, text, element.dataset.action).then(note => {
        ui.update(id, new Note(JSON.parse(note))).then(details);
        Comments.load(ui.get(id));
      }).catch(error => {
        console.log(error); // eslint-disable-line no-console
      }).finally(() => {
        element.classList.remove('loading');
      });
    });
  });

  document.getElementsByClassName('setting').forEach(element => {
    element.addEventListener('change', () => {
      Preferences.set({
        theme: document.getElementById('theme-selection').value,
        editors: {
          id: document.getElementById('editor-id').checked,
          josm: document.getElementById('editor-josm').checked,
          level0: document.getElementById('editor-level0').checked
        },
        tools: {
          openstreetmap: document.getElementById('tool-openstreetmap').checked,
          mapillary: document.getElementById('tool-mapillary').checked
        }
      });
      settings();
    });
  });

  document.getElementsByClassName('update-link').forEach(element => {
    element.addEventListener('change', () => Permalink());
  });

  document.getElementById('permalink').addEventListener('click', document.getElementById('permalink').select);

  document.getElementById('permalink').addEventListener('dblclick', () => {
    document.getElementById('permalink').select();
    document.execCommand('copy');
    toast(Localizer.message('action.copyLinkSuccess'), 'toast-success');
  });

  document.getElementById('permalink-copy').addEventListener('click', () => {
    document.getElementById('permalink').select();
    document.execCommand('copy');
    toast(Localizer.message('action.copyLinkSuccess'), 'toast-success');
  });

  document.getElementById('link').addEventListener('click', () => {
    Preferences.set({
      previous: {
        url: query.url,
        endpoint: query.endpoint
      }
    }, true);
  });

  document.addEventListener('keydown', event => {
    if (event.which === 13) {
      // Stop an ongoing request if it is already running
      if (Request.isRunning()) {
        return Request.cancel();
      }

      // Start a new search if the event was triggered inside the navigation
      if (document.getElementById('navigation-container').contains(event.target)) {
        search();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    // Remove the iframe in order to prevent a restoring of the content when reloading the page
    document.getElementById('remote').remove();

    // Save the map state
    if (Mode.get() === Mode.MAPS) {
      const center = map.center();
      Preferences.set({
        map: {
          center: [center.lat, center.lng],
          zoom: map.zoom()
        }
      });
    }
  });

  // Dynamic listeners
  document.addEventListener('click', event => {
    const commentsModalTrigger = event.target.closest('.comments-modal-trigger');
    if (commentsModalTrigger) {
      const id = Number.parseInt(commentsModalTrigger.closest('[data-note-id]').dataset.noteId);
      Comments.load(ui.get(id));
    }

    const mapillaryModalTrigger = event.target.closest('.link-tool-mapillary');
    if (mapillaryModalTrigger) {
      const id = Number.parseInt(mapillaryModalTrigger.closest('[data-note-id]').dataset.noteId);
      Mapillary.load(ui.get(id));
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
  const params = new URL(window.location.href).searchParams;
  params.forEach((value, key) => {
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
    case 'sort':
      document.getElementById('sort').value =
        `${value === 'updated_at' ? 'updated_at' : 'created_at'}-${params.get('order') === 'oldest' ? 'oldest' : 'newest'}`;
      break;
    case 'order':
      document.getElementById('sort').value =
        `${params.get('sort') === 'updated_at' ? 'updated_at' : 'created_at'}-${value === 'oldest' ? 'oldest' : 'newest'}`;
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
}

/**
  * Get the preferences and update the UI accordingly
  *
  * @function
  * @private
  * @returns {void}
  */
function settings() {
  const editors = Preferences.get('editors');
  const tools = Preferences.get('tools');

  document.getElementById('editor-id').checked = editors.id;
  document.getElementById('editor-josm').checked = editors.josm;
  document.getElementById('editor-level0').checked = editors.level0;
  document.getElementById('tool-openstreetmap').checked = tools.openstreetmap;
  document.getElementById('tool-mapillary').checked = tools.mapillary;

  document.body.dataset.editorId = editors.id;
  document.body.dataset.editorJosm = editors.josm;
  document.body.dataset.editorLevel0 = editors.level0;
  document.body.dataset.toolOpenstreetmap = tools.openstreetmap;
  document.body.dataset.toolMapillary = tools.mapillary;

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
(async function() {
  // Detect either the use of the Internet Explorer
  // or the absence of "modern" browser features like Promise or fetch
  // and show a deprecation warning
  if (
    window.navigator.userAgent.indexOf('MSIE ') !== -1 ||
    window.navigator.userAgent.match(/Trident.*rv:11\./) ||
    !window.Promise ||
    !window.fetch
  ) {
    document.body.classList.add('deprecated-browser');
  }

  await import(/* webpackChunkName: "@github/time-elements" */ '@github/time-elements');

  await Localizer.init();
  Modal.init();

  const mode = Mode.get() === Mode.MAPS ? 'map' : 'expert';
  const { default: UI } = await import(/* webpackChunkName: "ui/[request]" */ `./ui/${mode}`);
  ui = new UI();

  if (mode === Mode.MAPS) {
    map = new Leaflet('map', tooltip);
  }

  const authenticated = api.authenticated();
  document.body.dataset.authenticated = authenticated;
  if (authenticated) {
    document.getElementById('login').classList.add('d-hide');
    document.getElementById('logout').classList.remove('d-hide');
    Users.avatar(Preferences.get('uid'));
  } else {
    document.getElementById('login').classList.remove('d-hide');
    document.getElementById('logout').classList.add('d-hide');
  }

  listener();
  settings();
  searchParameter();
  Permalink();
  search();
})();
