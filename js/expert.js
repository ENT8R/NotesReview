/* globals M */

/* globals UI */
/* globals Permalink */
/* globals Mode */

const Expert = (function() { // eslint-disable-line no-unused-vars
  const me = {};

  me.search = function() {
    const query = UI.queryInput.value;
    let limit = UI.limitInput.value;
    const searchClosed = document.getElementById('search-closed').checked;

    let closed = '0';
    if (searchClosed) closed = '-1';

    if (!query) {
      return M.toast({html: 'Please specify a query!'});
    }

    if (limit > 10000) {
      limit = 10000;
      UI.limitInput.value = 10000;
      M.toast({html: 'Automatically set limit to 10000, because higher values are not allowed'});
    }

    UI.toggleButtons();

    const url = 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;

    Request.get(url, function(result) {
      document.getElementById('notes').innerHTML = '';

      if (result.features.length === 0) {
        UI.nothingFound();
      }

      let ids = [];
      let notes = [];

      for (let i = 0; i < result.features.length; i++) {
        if (ids.indexOf(result.features[i].properties.id) === -1) {
          const note = result.features[i].properties;
          const comment = note.comments[0];
          ids.push(note.id);
          notes.push({
            id: note.id,
            user: comment.user,
            text: comment.html
          });
        }
      }

      notes.sort(function(a, b) {
        return a.id - b.id;
      });
      notes.reverse();

      for (let i = 0; i < notes.length; i++) {
        document.getElementById('notes').innerHTML +=
          '<div class="col s12 m6 l4">' +
            '<div class="card blue-grey darken-1">' +
              '<div class="card-content white-text">' +
                '<span class="card-title">' + notes[i].id + ' (' + notes[i].user + ')</span>' +
                '<p>' + notes[i].text + '</p>' +
              '</div>' +
              '<div class="card-action">' +
                '<a href="https://www.openstreetmap.org/note/' + notes[i].id + '" target="_blank">View Note ' + notes[i].id + ' on OSM</a>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      document.getElementById('found-notes').textContent = 'Found notes: ' + ids.length;

      UI.toggleButtons();
    });
  };

  return me;
})();

// init modules
Mode.set(Mode.EXPERT);
Permalink.update();
UI.searchParams();
