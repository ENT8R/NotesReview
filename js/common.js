/* globals M */
/* globals Maps */
/* globals Expert */

const UI = (function() {
  const me = {};

  me.searchButton = document.getElementById('search');
  me.cancelButton = document.getElementById('cancel');

  me.queryInput = document.getElementById('query');
  me.limitInput = document.getElementById('limit');

  //Get the URL params and use them to e.g. initiate a new search with the given values
  me.searchParams = function() {
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
    if (start) {
      search();
    }

    if (query || limit || position) {
      const uri = window.location.toString();
      if (uri.indexOf('?') > 0) {
        window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
      }
    }
  };

  me.toggleButtons = function() {
    const preloader = document.getElementById('preloader');
    Effects.togglePreloader(preloader);
    Effects.toggle(UI.searchButton);
    Effects.toggle(UI.cancelButton);
  };

  me.nothingFound = function() {
    UI.toggleButtons();
    return M.toast({html: 'Nothing found!'});
  };

  me.init = function() {
    // Buttons
    UI.searchButton.addEventListener('click', function() {
      search();
    });
    UI.cancelButton.addEventListener('click', function() {
      Request.cancel();
    });

    // Permalink update triggers
    const updateLinkTriggers = document.getElementsByClassName('update-link');
    for (let i = 0; i < updateLinkTriggers.length; i++) {
      updateLinkTriggers[i].addEventListener('change', function() {
        Permalink.update();
      });
    }

    // Keyboard listeners
    document.addEventListener('keydown', function(e) {
      if (e.which === 13) {
        search();
      }
    });

    // Materialize elements
    M.Modal.init(document.querySelectorAll('.modal'));
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

const Request = (function() { // eslint-disable-line no-unused-vars
  const me = {};

  const http = new XMLHttpRequest();

  me.get = function(url, callback) {
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200) {
        const result = JSON.parse(http.responseText);
        if (callback && typeof callback === 'function') {
          callback(result);
        }
      }
    };

    http.open('GET', url, true);
    http.send();
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

  me.EXPERT = 'expert';
  me.MAPS = 'maps';

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
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return ret.join('&');
  }

  return me;
})();

function search() {
  if (Mode.get() === Mode.EXPERT) {
    Expert.search();
  } else {
    Maps.search();
  }
}

// init modules
UI.init();
