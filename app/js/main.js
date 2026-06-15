import 'spectre.css/dist/spectre.css';
// Experimental features are needed because of the progress bar https://picturepan2.github.io/spectre/experimentals/progress.html
import 'spectre.css/dist/spectre-exp.css';
/* -------------------------------------------------------------------------- */
import '../css/main.scss';
import 'virtual:svg-icons/register';
/* -------------------------------------------------------------------------- */
import './polyfills.js';

import Auth from './auth.js';
import Leaflet from './leaflet.js';
import * as Localizer from './localizer.js';
import Note from './note.js';
import NotesReview from './api/notesreview.js';
import OsmApi from './api/openstreetmap.js';
import Preferences from './preferences.js';
import Query from './query.js';
import * as Theme from './theme.js';
import Toast from './toast.js';
import Users from './users.js';

import Modal from './modals/modal.js';
import AreaSelector from './modals/area-selector.js';
import Comments from './modals/comments.js';
import Mapillary from './modals/mapillary.js';
import Panoramax from './modals/panoramax.js';
import Share from './modals/share.js';

import UI from './ui/ui.js';
import MapView from './ui/map.js';
import ListView from './ui/list.js';

// Custom elements
import SingleSelectionButtonGroup from './elements/SingleSelectionButtonGroup.js';
window.customElements.define('single-selection-button-group', SingleSelectionButtonGroup);

/**
  * Initiate a new query and do some UI changes before and after it
  *
  * @function
  * @private
  * @param {Query} query
  * @returns {void}
  */
function search(query) {
  document.getElementById('preloader').classList.remove('d-hide');
  query.search().then(notes => {
    UI.show(Array.from(notes), query).then(details);
  }).catch(error => {
    if (error.name === 'AbortError') {
      new Toast(Localizer.message('error.queryAbort'), Toast.TYPE_WARNING).show(Toast.DURATION_LONG);
    } else if (error.name === 'TimeoutError') {
      new Toast(Localizer.message('error.queryTimeout'), Toast.TYPE_ERROR).show(Toast.DURATION_LONG);
    } else if (error.name === 'RequestError') {
      new Toast(error.message, Toast.TYPE_ERROR).show(Toast.DURATION_LONG);
    } else {
      new Toast(Localizer.message('error.queryError'), Toast.TYPE_ERROR).show(Toast.DURATION_LONG);
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
    new Toast(Localizer.message('description.nothingFound'), Toast.TYPE_ERROR).show();
  } else {
    new Toast(Localizer.message('description.statistics', result.amount), Toast.TYPE_SUCCESS).show();
  }
}

/**
  * Initialize all listeners
  *
  * @function
  * @private
  * @param {Leaflet} map
  * @param {Query} query
  * @returns {void}
  */
function listener(map, query) {
  document.querySelectorAll('.search-trigger').forEach(element => {
    element.addEventListener('click', () => search(query));
  });
  document.getElementById('cancel').addEventListener('click', () => query.cancel());

  document.querySelectorAll('.reset-filter-trigger').forEach(element => {
    element.addEventListener('click', () => query.reset());
  });

  document.querySelectorAll('.reset-settings-trigger').forEach(element => {
    element.addEventListener('click', () => {
      Preferences.reset();
      settings();
    });
  });

  document.querySelectorAll('.save-feedback').forEach(element => {
    element.addEventListener('click', () => {
      new Toast(Localizer.message('success.saved'), Toast.TYPE_SUCCESS).show();
    });
  });

  document.getElementById('login').addEventListener('click', () => Auth.login());

  document.getElementById('logout').addEventListener('click', () => {
    NotesReview.logout();
    Auth.logout();
    Preferences.remove('uid');
    document.body.dataset.authenticatedOpenstreetmap = false;
    document.body.dataset.authenticatedBackend = false;
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
        content: {
          images: document.getElementById('content-image-options').value,
        },
        editors: {
          id: document.getElementById('editor-id').checked,
          rapid: document.getElementById('editor-rapid').checked,
          josm: document.getElementById('editor-josm').checked,
          level0: document.getElementById('editor-level0').checked
        },
        tools: {
          openstreetmap: document.getElementById('tool-openstreetmap').checked,
          mapillary: document.getElementById('tool-mapillary').checked,
          panoramax: document.getElementById('tool-panoramax').checked,
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
    UI.view = view;
    document.body.dataset.view = view;
  });

  document.addEventListener('keydown', event => {
    if (event.which === 13) {
      if (query.isSearching()) {
        // Cancel an ongoing search request (if there is any) if the return button is clicked
        query.cancel();
      } else if (document.querySelector('.modal[data-modal="filter"]').classList.contains('active')) {
        // Only start a new search if the filter modal is currently open and no search is currently ongoing
        search(query);
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
        view: UI.view,
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
    const commentAction = event.target.closest('.comment-action');
    if (commentAction) {
      commentAction.classList.add('loading');

      const id = Number.parseInt(commentAction.closest('[data-note-id]').dataset.noteId);
      const text = commentAction.parentElement.parentElement.querySelector('.note-comment').value.trim();

      OsmApi.comment(id, text, commentAction.dataset.action).then(note => {
        UI.update(id, Note.parse(note));
        Modal.open('comments', id);
      }).catch(() => {
        new Toast(Localizer.message('error.comment'), Toast.TYPE_ERROR).show();
      }).finally(() => {
        commentAction.classList.remove('loading');
      });
    }

    const watchNoteTrigger = event.target.closest('.watch-note-trigger');
    if (watchNoteTrigger) {
      const id = Number.parseInt(watchNoteTrigger.dataset.noteId);
      UI.watch(id);
      NotesReview.watch(id).then(() => {
        new Toast(Localizer.message('success.watchNote'), Toast.TYPE_SUCCESS, false).addAction(
          Localizer.message('action.undo'), 'icon-undo', (event, toast) => {
            toast.hide();
            UI.unwatch(id);
            NotesReview.unwatch(id);
          }
        ).show();
      }).catch(() => {
        UI.unwatch(id);
        new Toast(Localizer.message('error.watchNote'), Toast.TYPE_ERROR).show();
      });
    }

    const unwatchNoteTrigger = event.target.closest('.unwatch-note-trigger');
    if (unwatchNoteTrigger) {
      const id = Number.parseInt(unwatchNoteTrigger.dataset.noteId);
      UI.unwatch(id);
      NotesReview.unwatch(id).then(() => {
        new Toast(Localizer.message('success.unwatchNote'), Toast.TYPE_SUCCESS).show();
      }).catch(() => {
        UI.watch(id);
        new Toast(Localizer.message('error.unwatchNote'), Toast.TYPE_ERROR).show();
      });
    }

    const hideNoteTrigger = event.target.closest('.hide-note-trigger');
    if (hideNoteTrigger) {
      const id = Number.parseInt(hideNoteTrigger.dataset.noteId);
      UI.hide(id);
      NotesReview.hide(id).then(() => {
        new Toast(Localizer.message('success.hideNote'), Toast.TYPE_SUCCESS, false).addAction(
          Localizer.message('action.undo'), 'icon-undo', (event, toast) => {
            toast.hide();
            UI.unhide(id);
            NotesReview.unhide(id);
          }
        ).show();
      }).catch(() => {
        UI.unhide(id);
        new Toast(Localizer.message('error.hideNote'), Toast.TYPE_ERROR).show();
      });
    }

    const resetBlocklistTrigger = event.target.closest('.reset-blocklist-trigger');
    if (resetBlocklistTrigger) {
      NotesReview.deleteBlocklist().then(() => {
        UI.unhideAll();
        new Toast(Localizer.message('success.resetBlocklist'), Toast.TYPE_SUCCESS).show();
      }).catch(() => {
        new Toast(Localizer.message('error.resetBlocklist'), Toast.TYPE_ERROR).show();
      });
    }

    const resetWatchlistTrigger = event.target.closest('.reset-watchlist-trigger');
    if (resetWatchlistTrigger) {
      NotesReview.deleteWatchlist().then(() => {
        UI.unwatchAll();
        new Toast(Localizer.message('success.resetWatchlist'), Toast.TYPE_SUCCESS).show();
      }).catch(() => {
        new Toast(Localizer.message('error.resetWatchlist'), Toast.TYPE_ERROR).show();
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
  const theme = Preferences.get('theme');
  document.getElementById('theme-selection').value = theme;
  Theme.set(theme);

  const content = Preferences.get('content');
  document.getElementById('content-image-options').value = content.images;
  document.body.dataset.contentImages = content.images;

  const editors = Preferences.get('editors');
  const tools = Preferences.get('tools');

  document.getElementById('editor-id').checked = editors.id;
  document.getElementById('editor-rapid').checked = editors.rapid;
  document.getElementById('editor-josm').checked = editors.josm;
  document.getElementById('editor-level0').checked = editors.level0;
  document.getElementById('tool-openstreetmap').checked = tools.openstreetmap;
  document.getElementById('tool-mapillary').checked = tools.mapillary;
  document.getElementById('tool-panoramax').checked = tools.panoramax;
  document.getElementById('tool-deepl').checked = tools.deepl;

  document.body.dataset.editorId = editors.id;
  document.body.dataset.editorRapid = editors.rapid;
  document.body.dataset.editorJosm = editors.josm;
  document.body.dataset.editorLevel0 = editors.level0;
  document.body.dataset.toolOpenstreetmap = tools.openstreetmap;
  document.body.dataset.toolMapillary = tools.mapillary;
  document.body.dataset.toolPanoramax = tools.panoramax;
  document.body.dataset.toolDeepl = tools.deepl;
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
    console.log = () => {}; // eslint-disable-line no-console
    console.error = () => {}; // eslint-disable-line no-console
  }

  await import('@github/relative-time-element');

  await Localizer.init();

  settings();

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

  // Check whether parameters contains the OAuth2 redirect response and complete the login process
  if (parameter.has('oauth_redirect_url')) {
    const redirectUrl = decodeURIComponent(parameter.get('oauth_redirect_url'));
    parameter.delete('oauth_redirect_url');
    Auth.resume(redirectUrl).then(() => OsmApi.userDetails()).then(result => {
      const uid = result.user.id;
      Preferences.set({
        uid
      });

      Users.add(result.user);
      Users.avatar(uid);
    }).then(() => {
      document.body.dataset.authenticatedOpenstreetmap = true;
      NotesReview.login().then(() => {
        document.body.dataset.authenticatedBackend = true;
      }).catch(() => {
        document.body.dataset.authenticatedBackend = false;
      });
    }).catch(() => {
      new Toast(Localizer.message('error.login'), Toast.TYPE_ERROR).show();
      document.body.dataset.authenticatedOpenstreetmap = false;
    });
  }

  // Convert the URL search parameters to an object for further usage
  parameter = [...parameter.entries()].reduce(
    (object, [key, value]) => Object.assign(object, {[key]: value}),
    {}
  );

  // If there are no parameters available, use the query saved in the preferences,
  // which is the last used query before the page was closed the last time
  parameter = Object.keys(parameter).length > 0 ? parameter : Preferences.get('query');

  const map = new Leaflet('map-container', position, bounds);
  const query = new Query(map, parameter);

  // Check whether the user is already authenticated and update the UI accordingly
  Auth.isAuthenticated().then(authenticated => {
    document.body.dataset.authenticatedOpenstreetmap = authenticated;
    if (authenticated) {
      Users.avatar(Preferences.get('uid'));
    }
  });

  NotesReview.isAuthenticated().then(authenticated => {
    document.body.dataset.authenticatedBackend = authenticated;
  });

  // Initialize all modals used by this application
  const modals = { // eslint-disable-line no-unused-vars
    'area-selector': new AreaSelector(document.getElementById('countries'), document.getElementById('polygon')),
    'comments': new Comments(),
    'mapillary': new Mapillary(),
    'panoramax': new Panoramax(),
    'share': new Share(query)
  };

  UI.registerView('map', new MapView());
  UI.registerView('list', new ListView());
  UI.view = view;

  listener(map, query);
  search(query);
})();
