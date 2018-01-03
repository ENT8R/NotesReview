const x2js = new X2JS();

$(document).ready(function() {
  $("#search").click(function() {
    query();
  });
});

init();

function init() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("query");
  const limit = url.searchParams.get("limit");
  if (query) $('#query').val(query);
  if (limit) $('#limit').val(limit);
  if (query || limit) {
    const uri = window.location.toString();
    if (uri.indexOf("?") > 0) {
      window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf("?")));
    }
  }
}

function query() {
  $('.progress').show();

  const query = $('#query').val();
  const limit = $('#limit').val();

  const url = 'http://api.openstreetmap.org/api/0.6/notes/search?q=' + query + '&limit=' + limit + '&closed=0';

  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      $('#notes').empty();

      const result = x2js.xml_str2json(this.responseText);

      $('#found-notes').html('Found notes: ' + result.osm.note.length);

      for (let i = 0; i < result.osm.note.length; i++) {
        let note = result.osm.note[i];
        let comment = note.comments.comment.html;
        if (!comment) {
          comment = note.comments.comment[0].html;
        }

        $('#notes').append(
        '<div class="col s12 m6 l4">' +
          '<div class="card blue-grey darken-1">' +
            '<div class="card-content white-text">' +
              '<span class="card-title">' + note.id + '</span>' +
              '<p>' + comment + '</p>' +
            '</div>' +
            '<div class="card-action">' +
              '<a href="http://www.openstreetmap.org/note/' + note.id + '" target="_blank">' + note.id + ' on OSM</a>' +
            '</div>' +
          '</div>' +
        '</div>')
      }

      $('.progress').hide();
    }
  };

  http.open("GET", url, true);
  http.send();
}
