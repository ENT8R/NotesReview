'use strict';

/* globals UI */
/* globals Permalink */
/* globals Mode */

const Expert = (function() { // eslint-disable-line no-unused-vars
  const me = {};

  me.search = function(query, limit, closed) {
    const url = Request.buildURL(query, limit, closed, false);

    Request.get(url, function(result) {
      if (result.features.length === 0) {
        UI.nothingFound();
      }

      let ids = [];
      let notes = [];

      for (let i = 0; i < result.features.length; i++) {
        const feature = result.features[i];
        if (ids.indexOf(feature.properties.id) === -1) {
          const note = feature.properties;
          const comment = note.comments[0];
          const geometry = feature.geometry;

          ids.push(note.id);
          notes.push({
            id: note.id,
            user: comment.user,
            text: comment.html,
            position: geometry.coordinates,
            comments: note.comments
          });
        }
      }

      notes.sort(function(a, b) {
        return a.id - b.id;
      });
      notes.reverse();

      const html = [];
      for (let i = 0; i < notes.length; i++) {
        html.push(
          '<div class="col s12 m6 l4">' +
            '<div class="card blue-grey darken-1">' +
              '<div class="card-content white-text">' +
                '<span class="card-title">' +
                  notes[i].id + ' (' + notes[i].user + ')' +
                  UI.getAmountOfCommentsBadge(notes[i].comments) +
                '</span>' +
                '<p>' + notes[i].text + '</p>' +
              '</div>' +
              '<div class="card-action">' +
                UI.getNoteActions(notes[i].text, notes[i].id, notes[i].position) +
              '</div>' +
            '</div>' +
          '</div>');
      }

      UI.toggleButtons();

      document.getElementById('notes').innerHTML = html.join('');
      //Display how much notes were found
      document.getElementById('found-notes').textContent = 'Found notes: ' + ids.length;
    });
  };

  return me;
})();

// init modules
Mode.set(Mode.EXPERT);
Permalink.update();
UI.init();
