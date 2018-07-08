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

  //Get the URL params and use them to e.g. initiate a new search with the given values
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
    if (start) {
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

      if (Maps.getBBoxSize() < 0.25) {
        fastSearch.style.display = 'inline-block';
        if (tooltip) {
          tooltip.destroy();
        }
      } else {
        fastSearch.style.display = 'none';
        if (!tooltip) {
          M.Tooltip.init(UI.searchButton, {
            enterDelay: 50,
            html: 'Worldwide query enabled. Zoom in further to get a faster query for a limited area.'
          });
        }
      }
    }
  };

  me.nothingFound = function() {
    UI.toggleButtons();
    return M.toast({html: 'Nothing found!'});
  };

  me.getNoteActions = function(comment, id, position) {
    const regex = [
      /(?:https?:\/\/)?(?:www\.)?openstreetmap\.org\/(node|way|relation)\/[0-9]{0,}/,
      /(node|way|relation)\/[0-9]{0,}/,
      // TODO: this needs some more thoughts
      // /(node|way|relation) #[0-9]{0,}/,
      /(n|w|r)\/[0-9]{0,} /
    ];

    let text = '' +
    '<a href="https://www.openstreetmap.org/note/' + id + '" target="_blank">View Note ' + id + ' on OSM</a>';

    const matches = comment.match(regex[0]) || comment.match(regex[1]) || comment.match(regex[2]);

    if (matches) {
      const element = matches[0].match(regex[1])[0];
      // Level0
      text += '<br>' +
              '<a' +
              ' href="http://level0.osmz.ru/?url=' + element + '&center=' + position.reverse().join(',') + '"' +
              ' target="_blank">Edit ' + element + ' with Level0</a>';
      // iD
      text += '<br>' +
              '<a' +
              ' href="http://www.openstreetmap.org/edit?editor=id&' + element.replace('/', '=') + '"' +
              ' target="_blank">Edit ' + element + ' with iD</a>';
    }

    return text;
  };

  me.getAmountOfCommentsBadge = function(comments) {
    const length = comments.length - 1;
    let text = '';

    if (length > 0) {
      let caption = 'comments';
      if (length === 1) {
        caption = 'comment';
      }

      text = '<span class="new badge blue" data-badge-caption="' + caption + '">' + length + '</span>';
    }
    return text;
  };

  me.init = function() {
    // Buttons
    UI.searchButton.addEventListener('click', function() {
      startSearch();
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
      if (e.which === 13 && !Request.isRunning) {
        startSearch();
      } else if (Request.isRunning) {
        Request.cancel();
      }
    });

    // Materialize elements
    M.Modal.init(document.querySelectorAll('.modal'));

    // other things
    UI.tooltip();
    searchParams();
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

  let isRunning = false;
  me.isRunning = isRunning;

  const http = new XMLHttpRequest();

  me.buildURL = function(query, limit, closed, bbox) {
    if (!bbox) {
      return 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;
    } else {
      return 'https://api.openstreetmap.org/api/0.6/notes.json?bbox=' + query + '&limit=' + limit + '&closed=' + closed;
    }
  };

  me.get = function(url, callback) {
    isRunning = true;
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200) {
        isRunning = false;
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

  if (!query) {
    return M.toast({html: 'Please specify a query!'});
  }

  if (limit > 10000) {
    limit = 10000;
    UI.limitInput.value = 10000;
    M.toast({html: 'Automatically set limit to 10000, because higher values are not allowed'});
  }

  UI.toggleButtons();

  if (Mode.get() === Mode.EXPERT) {
    Expert.search(query, limit, closed);
  } else {
    Maps.search(query, limit, closed);
  }
}
