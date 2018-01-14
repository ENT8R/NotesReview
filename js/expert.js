$(document).ready(function() {
  $('.modal').modal();

  $('#search').click(function() {
    search();
  });

  $('#query').change(function() {
    updateLink();
  });
  $('#limit').change(function() {
    updateLink();
  });
  $('#start-query').change(function() {
    updateLink();
  });
  updateLink();

  $(document).keypress(function(e) {
    if (e.which == 13) {
      search();
    }
  });
});

init();

function init() {
  const url = new URL(window.location.href);

  const query = url.searchParams.get('query');
  const limit = url.searchParams.get('limit');
  const start = url.searchParams.get('start');

  if (query) $('#query').val(query);
  if (limit) $('#limit').val(limit);
  if (start) search();

  if (query || limit) {
    const uri = window.location.toString();
    if (uri.indexOf('?') > 0) {
      window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
    }
  }
}

function search() {
  const query = $('#query').val();
  let limit = $('#limit').val();
  const searchClosed = $('#search-closed').is(':checked');

  let closed = '0';
  if (searchClosed) closed = '-1';

  if (!query) return Materialize.toast('Please specify a query!', 6000);

  if (limit > 10000) {
    limit = 10000;
    $('#limit').val(10000);
    Materialize.toast('Automatically set limit to 10000, because higher values are not allowed', 6000);
  }

  $('.progress').show();

  const url = 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;

  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      $('#notes').empty();

      const result = JSON.parse(this.responseText);

      if (result.features.length == 0) {
        $('.progress').hide();
        return Materialize.toast('Nothing found!', 6000);
      }

      let ids = [];
      let notes = [];

      for (let i = 0; i < result.features.length; i++) {
        if (ids.indexOf(result.features[i].properties.id) == -1) {
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
        return a.id - b.id
      });
      notes.reverse();

      for (let i = 0; i < notes.length; i++) {
        $('#notes').append(
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
          '</div>');
      }

      $('#found-notes').html('Found notes: ' + ids.length);

      $('.progress').hide();
    }
  };

  http.open('GET', url, true);
  http.send();
}

function updateLink() {
  let url = "https://ent8r.github.io/NotesReview/?";
  const query = $('#query').val();
  const limit = $('#limit').val();
  const start = $('#start-query').is(':checked')

  let data = {};
  if (query) data.query = query;
  if (limit) data.limit = limit;
  if (start) data.start = start;

  url += encodeQueryData(data);

  $('.link').attr('href', url);
  $('#permalink').val(url);
}

function encodeQueryData(data) {
  let ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
  return ret.join('&');
}
