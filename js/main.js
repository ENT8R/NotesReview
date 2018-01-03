const x2js = new X2JS();

$(document).ready(function() {
  $('.modal').modal();

  $('#search').click(function() {
    query();
  });

  $('#list-view').click(function() {
    window.open("https://ent8r.github.io/NotesReview/expert/?query=" + $('#query').val() + "&limit=" + $('#limit').val());
  });

  $(document).keypress(function(e) {
    if (e.which == 13) {
      query();
    }
  });
});

const map = L.map('map').setView([40, 10], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markers = L.markerClusterGroup();

init();

function init() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get('query');
  const limit = url.searchParams.get('limit');
  if (query) $('#query').val(query);
  if (limit) $('#limit').val(limit);
  if (query || limit) {
    const uri = window.location.toString();
    if (uri.indexOf('?') > 0) {
      window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
    }
  }
}

function query() {
  const query = $('#query').val();
  const limit = $('#limit').val();
  const searchClosed = $('#search-closed').is(':checked');

  let closed = '0';
  if (searchClosed) closed = '-1';

  if (!query) return Materialize.toast('Please specify a query!', 6000);

  $('.progress').show();

  const url = 'https://api.openstreetmap.org/api/0.6/notes/search?q=' + query + '&limit=' + limit + '&closed=' + closed;

  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      markers.remove();
      map.removeLayer(markers);

      const result = x2js.xml_str2json(this.responseText);
      let geoJSON = [];

      if (!result.osm.note) {
        $('.progress').hide();
        return Materialize.toast('Nothing found!', 6000);
      }

      L.Control.Watermark = L.Control.extend({
        onAdd: function(map) {
          const element = L.DomUtil.create('p');
          element.innerHTML = 'Found notes: ' + result.osm.note.length;
          return element;
        }
      });
      L.control.watermark = function(opts) {
        return new L.Control.Watermark(opts);
      }
      L.control.watermark({
        position: 'bottomleft'
      }).addTo(map);

      for (let i = 0; i < result.osm.note.length; i++) {
        geoJSON.push({
          'type': 'Feature',
          'properties': result.osm.note[i],
          'geometry': {
            'type': 'Point',
            'coordinates': [result.osm.note[i]._lon, result.osm.note[i]._lat]
          }
        });
      }

      const geoJSONLayer = L.geoJSON(geoJSON, {
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            let comment = feature.properties.comments.comment;
            if (!comment.html) {
              comment = feature.properties.comments.comment[0];
            }
            layer.bindPopup('<p>' + comment.html + '</p><div class="divider"></div><a href="https://www.openstreetmap.org/note/' + feature.properties.id + '" target="_blank">' + feature.properties.id + ' on OSM</a>');
          }
        }
      });

      markers.addLayer(geoJSONLayer);
      map.addLayer(markers);
      map.fitBounds(markers.getBounds());

      $('.progress').hide();
    }
  };

  http.open('GET', url, true);
  http.send();
}
