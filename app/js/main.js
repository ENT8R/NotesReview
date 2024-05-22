import '../css/main.scss';
import 'virtual:svg-icons-register';
/* -------------------------------------------------------------------------- */
import './polyfills.js';

import API from './api.js';
import AreaSelector from './modals/area-selector.js';
import Comments from './modals/comments.js';
import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import Mapillary from './modals/mapillary.js';
import Modal from './modals/modal.js';
import Note from './note.js';
import Preferences from './preferences.js';
import Query from './query.js';
import Share from './modals/share.js';
import * as Theme from './theme.js';
import Toast from './toast.js';
import Users from './users.js';

import * as Handlebars from 'handlebars';
import actions from '../templates/dynamic/actions.hbs?raw';

Handlebars.registerPartial('actions', actions);
Handlebars.registerHelper('localizer', key => {
  return Localizer.message(key);
});

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
function search() {
  document.getElementById('preloader').classList.remove('d-hide');
  query.search().then(notes => {
    ui.show(Array.from(notes), query).then(details);
  }).catch(error => {
    if (error.name === 'TimeoutError') {
      new Toast(Localizer.message('error.queryTimeout'), 'toast-error').show(Toast.DURATION_LONG);
    }
  }).finally(() => {
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
  } else {
    new Toast(Localizer.message('description.statistics', result.amount), 'toast-success').show();
  }
}

/**
  * Initialize all listeners
  *
  * @function
  * @private
  * @returns {void}
  */
function listener() {
  document.querySelectorAll('.search-trigger').forEach(element => {
    element.addEventListener('click', () => search());
  });
  document.getElementById('cancel').addEventListener('click', () => query.cancel());

  document.querySelectorAll('.reset-trigger').forEach(element => {
    element.addEventListener('click', () => query.reset());
  });

  document.getElementById('login').addEventListener('click', () => {
    const login = document.getElementById('login');
    login.classList.add('loading');

    api.login().then(result => {
      document.body.dataset.authenticated = true;

      const uid = result.getElementsByTagName('user')[0].getAttribute('id');
      Preferences.set({ uid });
      Users.avatar(uid);
    }).catch(() => {
      new Toast(Localizer.message('error.login'), 'toast-error').show();
      document.body.dataset.authenticated = false;
    }).finally(() => {
      login.classList.remove('loading');
    });
  });

  document.getElementById('logout').addEventListener('click', () => {
    api.logout();
    Preferences.remove('uid');
    document.body.dataset.authenticated = false;
  });

  document.addEventListener('input', event => {
    // Listen for changes of the note input and update the buttons accordingly
    if (event.target.classList.contains('note-comment')) {
      const text = event.target.value.trim();
      const actions = event.target.parentElement.querySelector('.note-comment-actions');
      if (text === '') {
        actions.classList.add('d-invisible');
      } else {
        actions.classList.remove('d-invisible');
      }
    }
  });

  Array.from(document.getElementsByClassName('setting')).forEach(element => {
    element.addEventListener('change', () => {
      Preferences.set({
        theme: document.getElementById('theme-selection').value,
        editors: {
          id: document.getElementById('editor-id').checked,
          rapid: document.getElementById('editor-rapid').checked,
          josm: document.getElementById('editor-josm').checked,
          level0: document.getElementById('editor-level0').checked
        },
        tools: {
          openstreetmap: document.getElementById('tool-openstreetmap').checked,
          mapillary: document.getElementById('tool-mapillary').checked,
          deepl: document.getElementById('tool-deepl').checked
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
      if (query.isSearching()) {
        // Cancel an ongoing search request (if there is any) if the return button is clicked
        query.cancel();
      } else if (document.querySelector('.modal[data-modal="filter"]').classList.contains('active')) {
        // Only start a new search if the filter modal is currently open and no search is currently ongoing
        search();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    // Remove the iframe in order to prevent a restoring of the content when reloading the page
    // which effectively leads to JOSM loading the content again
    document.getElementById('remote').remove();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Save the current state of the map and query which will be restored when visiting the page again
      const center = map.center();
      Preferences.set({
        view: ui.view,
        map: {
          center: [center.lat, center.lng],
          zoom: map.zoom()
        },
        query: query.data
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

    const commentAction = event.target.closest('.comment-action');
    if (commentAction) {
      commentAction.classList.add('loading');

      const id = Number.parseInt(commentAction.closest('[data-note-id]').dataset.noteId);
      const text = commentAction.parentElement.parentElement.querySelector('.note-comment').value.trim();

      api.comment(id, text, commentAction.dataset.action).then(note => {
        ui.update(id, Note.parse(JSON.parse(note))).then(details);
        Comments.load(ui.get(id));
      }).catch(() => {
        new Toast(Localizer.message('error.comment'), 'toast-error').show();
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
  document.getElementById('editor-rapid').checked = editors.rapid;
  document.getElementById('editor-josm').checked = editors.josm;
  document.getElementById('editor-level0').checked = editors.level0;
  document.getElementById('tool-openstreetmap').checked = tools.openstreetmap;
  document.getElementById('tool-mapillary').checked = tools.mapillary;
  document.getElementById('tool-deepl').checked = tools.deepl;

  document.body.dataset.editorId = editors.id;
  document.body.dataset.editorRapid = editors.rapid;
  document.body.dataset.editorJosm = editors.josm;
  document.body.dataset.editorLevel0 = editors.level0;
  document.body.dataset.toolOpenstreetmap = tools.openstreetmap;
  document.body.dataset.toolMapillary = tools.mapillary;
  document.body.dataset.toolDeepl = tools.deepl;

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

  if (import.meta.env.PROD) {
    console.log = () => {};
    console.error = () => {};
  }

  await import('@github/relative-time-element');

  await Localizer.init();
  Modal.init();

  let parameter = new URL(window.location.href).searchParams;
  // Remove the query parameters to have a cleaner looking URL
  const uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
  }

  const view = parameter.get('view') || Preferences.get('view');
  document.querySelector(`#toggle-view div[data-view="${view}"]`).classList.remove('d-hide');
  document.querySelector(`#${view}`).classList.remove('d-hide');
  document.body.dataset.view = view;

  // Get the desired centered position from the search parameters or the local storage
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

  // Get the desired bounds from the search parameters (will override the position retrieved above)
  const bounds =
    (parameter.has('bbox') && /.+,.+,.+,.+/.test(parameter.get('bbox')) ?
      parameter.get('bbox').split(',')
      : null);

  // Convert the URL search parameters to an object for further usage
  parameter = [...parameter.entries()].reduce(
    (object, [key, value]) => Object.assign(object, {[key]: value}),
    {}
  );

  // If there are no parameters available, use the query saved in the preferences,
  // which is the last used query before the page was closed the last time
  parameter = Object.keys(parameter).length > 0 ? parameter : Preferences.get('query');

  map = new Leaflet('map-container', position, bounds);
  query = new Query(map, parameter);

  const share = new Share(query); // eslint-disable-line no-unused-vars
  const areaSelector = new AreaSelector(document.getElementById('countries'), document.getElementById('polygon')); // eslint-disable-line no-unused-vars

  const authenticated = api.authenticated();
  document.body.dataset.authenticated = authenticated;
  if (authenticated) {
    Users.avatar(Preferences.get('uid'));
  }

  const { default: UI } = await import('./ui/ui.js');
  ui = new UI(view);

  listener();
  settings();
  search();
})();
