const x2js = new X2JS();

$(document).ready(function() {
  $("#search").click(function() {
    query();
  });
});

const map = L.map('map').setView([40, 10], 3);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markers = L.markerClusterGroup();

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

  const url = 'https://api.openstreetmap.org/api/0.6/notes/search?q=' + query + '&limit=' + limit + '&closed=0';

  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      map.removeLayer(markers);

      const result = x2js.xml_str2json(this.responseText);
      let geoJSON = [];

      $('#found-notes').html('Found notes: ' + result.osm.note.length);

      for (let i = 0; i < result.osm.note.length; i++) {
        geoJSON.push({
          "type": "Feature",
          "properties": result.osm.note[i],
          "geometry": {
            "type": "Point",
            "coordinates": [result.osm.note[i]._lon, result.osm.note[i]._lat]
          }
        })
      }

      const geoJSONLayer = L.geoJSON(geoJSON, {
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            layer.bindPopup('<a href="https://www.openstreetmap.org/note/' + feature.properties.id + '" target="_blank">' + feature.properties.id + ' on OSM</a>');
          }
        }
      });

      markers.addLayer(geoJSONLayer);
      map.addLayer(markers);
      map.fitBounds(markers.getBounds());

      $('.progress').hide();
    }
  };

  http.open("GET", url, true);
  http.send();
}
