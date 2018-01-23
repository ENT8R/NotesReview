$(document).ready(function() {
  $('.modal').modal();

  $('#search').click(function() {
    search();
  });
  $('#cancel').click(function() {
    cancelRequest();
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
  $('#show-map').change(function() {
    updateLink();
  });
  updateLink();

  $(document).keypress(function(e) {
    if (e.which == 13) {
      search();
    }
  });
});

const http = new XMLHttpRequest();

const map = L.map('map', {
  minZoom: 2,
  maxZoom: 22
});
setTileLayer();

let BBoxSize;

map.on('move', function(event) {
  updateLink();

  const bounds = map.getBounds();
  BBoxSize = BBoxToSquareDegree(bounds);
  if (BBoxSize < 0.25) {
    $('#search').tooltip('remove');
    $('#fast-search').show();
  } else {
    $('#fast-search').hide();
    $('#search').tooltip({
      delay: 50,
      tooltip: 'Worldwide query enabled. Zoom in further to get a faster query for a limited area.'
    });
  }
});

map.setView([40, 10], 3);

let watermark;

init();

//Get the URL params and use them to e.g. initiate a new search with the given values
function init() {
  const url = new URL(window.location.href);

  const query = url.searchParams.get('query');
  const limit = url.searchParams.get('limit');
  const start = url.searchParams.get('start');
  let position;
  if (url.searchParams.has('map')) {
    position = url.searchParams.get('map').split('/');
  }

  if (query) $('#query').val(query);
  if (limit) $('#limit').val(limit);
  if (position) map.setView([position[1], position[2]], position[0]);
  if (start) search();

  if (query || limit || position) {
    const uri = window.location.toString();
    if (uri.indexOf('?') > 0) {
      window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf('?')));
    }
  }
}

//Search for all notes with a specific keyword either worldwide of if the bounding box is smaller than 0.25 square degree, in that bbox
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
  $('#search').hide();
  $('#cancel').show();

  let useNormalApi = false;
  let url = 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;

  if (BBoxSize < 0.25) {
    useNormalApi = true;
    url = 'https://api.openstreetmap.org/api/0.6/notes.json?bbox=' + map.getBounds().toBBoxString() + '&limit=' + limit + '&closed=' + closed;
  }

  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      map.eachLayer(function(layer) {
        map.removeLayer(layer);
      });

      if (watermark) map.removeControl(watermark);

      setTileLayer();

      const markers = L.markerClusterGroup();

      const result = JSON.parse(this.responseText);

      if (result.features.length == 0) {
        toggleButtons();
        return Materialize.toast('Nothing found!', 6000);
      }

      let ids = [];

      //Prepare the GeoJSON layer and bind the popups
      const geoJSONLayer = L.geoJSON(result, {
        filter: filterGeoJSON,
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            ids.push(feature.properties.id);
            let comment = feature.properties.comments[0];
            layer.bindPopup('<p>' + comment.html + '</p><div class="divider"></div><a href="https://www.openstreetmap.org/note/' + feature.properties.id + '" target="_blank">' + feature.properties.id + ' on OSM</a>');
          }
        }
      });

      function filterGeoJSON(feature, layer) {
        if (useNormalApi) {
          return ids.indexOf(feature.properties.id) == -1 && feature.properties.comments[0].text.includes(query);
        }
        return ids.indexOf(feature.properties.id) == -1;
      }

      //Display how much notes were found
      L.Control.Watermark = L.Control.extend({
        onAdd: function(map) {
          const element = L.DomUtil.create('p');
          element.innerHTML = 'Found notes: ' + ids.length;
          return element;
        }
      });
      L.control.watermark = function(opts) {
        return new L.Control.Watermark(opts);
      }
      watermark = L.control.watermark({
        position: 'bottomleft'
      }).addTo(map);

      //Display all notes on the map and zoom the map to show them all
      markers.addLayer(geoJSONLayer);
      map.addLayer(markers);
      map.fitBounds(markers.getBounds());

      toggleButtons();
    }
  };

  http.open('GET', url, true);
  http.send();
}

function cancelRequest() {
  http.abort();
  toggleButtons();
}

function toggleButtons() {
  $('.progress').toggle();
  $('#search').toggle();
  $('#cancel').toggle();
}

function updateLink() {
  let url = "https://ent8r.github.io/NotesReview/?";
  const query = $('#query').val();
  const limit = $('#limit').val();
  const start = $('#start-query').is(':checked');
  const showMap = $('#show-map').is(':checked');
  const position = map.getZoom().toFixed(0) + '/' + map.getCenter().lat.toFixed(4) + '/' + map.getCenter().lng.toFixed(4);

  let data = {};
  if (query) data.query = query;
  if (limit) data.limit = limit;
  if (start) data.start = start;
  if (showMap && position) data.map = position;

  url += encodeQueryData(data);

  $('.link').attr('href', url);
  $('#permalink').val(url);
}

function encodeQueryData(data) {
  let ret = [];
  for (let d in data)
    ret.push(d + '=' + data[d]);
  return ret.join('&');
}

function setTileLayer() {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function BBoxToSquareDegree(bounds) {
  // (maxlat - minlat) * (maxlon - minlon) < 0.25
  return (bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest());
}
