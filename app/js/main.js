import '../css/main.scss';
import 'vite-plugin-svg-icons/register';
/* -------------------------------------------------------------------------- */
import './polyfills.js';

import API from './api.js';
import * as Badges from './badges.js';
import Comments from './modals/comments.js';
import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import Mapillary from './modals/mapillary.js';
import Modal from './modals/modal.js';
import Note from './note.js';
import Permalink from './permalink.js';
import Preferences from './preferences.js';
import Query from './query.js';
import * as Request from './request.js';
import * as Theme from './theme.js';
import Toast from './toast.js';
import Users from './users.js';
import * as Util from './util.js';

// Custom elements
import SingleSelectionButtonGroup from './elements/SingleSelectionButtonGroup.js';
window.customElements.define('single-selection-button-group', SingleSelectionButtonGroup);

let map, ui, query;

const api = new API();

/**
  * Initiate a new query and do some UI changes before and after it
  *
  * @function
  * @private
  * @returns {void}
  */
async function search() {
  document.getElementById('preloader').classList.remove('d-hide');
  const notes = await query.search();
  ui.show(Array.from(notes), query).then(details).finally(() => {
    document.getElementById('preloader').classList.add('d-hide');
  });
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
    new Toast(Localizer.message('description.nothingFound'), 'toast-error').show();
    document.getElementById('details').classList.add('d-hide');
  } else {
    document.getElementById('details').classList.remove('d-hide');
  }

  document.getElementById('found-notes').textContent = Localizer.message('note.amount', result.amount);
  const badge = Badges.age(Util.parseDate(result.average), result.average, true);
  document.getElementById('average-date').innerHTML = Localizer.message('note.average', badge);
}

/**
  * Initialize all listeners
  *
  * @function
  * @private
  * @returns {void}
  */
function listener() {
  document.getElementById('search').addEventListener('click', () => search());
  document.getElementById('cancel').addEventListener('click', () => Request.cancel());

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

  document.addEventListener('input', event => {
    // Listen for changes of the note input and update the buttons accordingly
    if (event.target.classList.contains('note-comment')) {
      const text = event.target.value.trim();
      const actions = event.target.parentElement.querySelector('.note-comment-actions');
      if (text === '') {
        actions.classList.add('d-hide');
      } else {
        actions.classList.remove('d-hide');
      }
    }
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

  // Change the view based on the currently visible view
  document.getElementById('toggle-view').addEventListener('click', () => {
    const active = document.querySelector('#toggle-view div:not(.d-hide)');
    const next = document.querySelector('#toggle-view div.d-hide');
    active.classList.add('d-hide');
    next.classList.remove('d-hide');

    const { view } = next.dataset;
    document.querySelector(`#${active.dataset.view}`).classList.add('d-hide');
    document.querySelector(`#${view}`).classList.remove('d-hide');
    ui.view = view;
    document.body.dataset.view = view;
  });

  document.addEventListener('keydown', event => {
    if (event.which === 13) {
      // Stop an ongoing request if it is already running
      if (Request.isRunning()) {
        return Request.cancel();
      }

      // Only start a new search if the event was triggered inside the filter modal
      if (document.querySelector('.modal[data-modal="filter"]').contains(event.target)) {
        search();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    // Remove the iframe in order to prevent a restoring of the content when reloading the page
    document.getElementById('remote').remove();

    // Save the state of the view
    const center = map.center();
    Preferences.set({
      view: ui.view,
      map: {
        center: [center.lat, center.lng],
        zoom: map.zoom()
      }
    });
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

    const commentAction = event.target.closest('.comment-action');
    if (commentAction) {
      commentAction.classList.add('loading');

      const id = Number.parseInt(commentAction.closest('[data-note-id]').dataset.noteId);
      const text = commentAction.parentElement.parentElement.querySelector('.note-comment').value.trim();

      api.comment(id, text, commentAction.dataset.action).then(note => {
        ui.update(id, Note.parse(JSON.parse(note))).then(details);
        Comments.load(ui.get(id));
      }).catch(error => {
        console.log(error); // eslint-disable-line no-console
      }).finally(() => {
        commentAction.classList.remove('loading');
      });
    }
  });
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

  await import('@github/time-elements');

  await Localizer.init();
  Modal.init();

  // Show a modal informing about the new backend
  const noticeShown = Preferences.get('new-api-backend-notice-shown');
  if (!noticeShown || Number.parseInt(noticeShown) < 2) {
    Modal.open('notice');
    document.querySelector('.modal[data-modal="notice"]').addEventListener('modal-close', () => {
      Preferences.set({
        'new-api-backend-notice-shown': (Number.parseInt(noticeShown) || 0) + 1
      });
    });
  }

  const parameter = new URL(window.location.href).searchParams;
  // Remove the query parameters to have a cleaner looking URL
  const uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
  }

  // Get the desired position from the search parameters or the local storage
  const position =
    (parameter.has('map') && /.+\/.+\/.+/.test(parameter.get('map')) ?
      (p => {
        return {
          center: [p[1], p[2]],
          zoom: p[0]};
      })(parameter.get('map').split('/'))
      : null)
    ||
    Preferences.get('map');

  map = new Leaflet('map', position);
  query = new Query(map, parameter);
  const permalink = new Permalink(query); // eslint-disable-line no-unused-vars

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

  const view = parameter.get('view') || Preferences.get('view');
  document.querySelector(`#toggle-view div[data-view="${view}"]`).classList.remove('d-hide');
  document.querySelector(`#${view}`).classList.remove('d-hide');
  document.body.dataset.view = view;

  const { default: UI } = await import('./ui/ui.js');
  ui = new UI(view);

  search();
})();
