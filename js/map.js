/* globals L */
/* globals M */

/* globals UI */
/* globals Permalink */
/* globals Mode */

let BBoxSize;
let watermark;

//Search for all notes with a specific keyword either worldwide of if the bounding box is smaller than 0.25 square degree, in that bbox
function search() {
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

  let useNormalApi = false;
  let url = 'https://api.openstreetmap.org/api/0.6/notes/search.json?q=' + query + '&limit=' + limit + '&closed=' + closed;

  if (BBoxSize < 0.25) {
    useNormalApi = true;
    url = 'https://api.openstreetmap.org/api/0.6/notes.json?bbox=' + Maps.getBBox() + '&limit=' + limit + '&closed=' + closed;
  }

  Request.get(url, function(result) {
    if (result.features.length === 0) {
      return UI.nothingFound();
    }

    let ids = [];

    //Prepare the GeoJSON layer and bind the popups
    const geoJSONLayer = L.geoJSON(result, {
      filter: function(feature) {
        return filterGeoJSON(feature, useNormalApi, ids, query);
      },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          ids.push(feature.properties.id);
          let comment = feature.properties.comments[0];
          layer.bindPopup('<p>' + comment.html + '</p><div class="divider"></div><a href="https://www.openstreetmap.org/note/' + feature.properties.id + '" target="_blank">' + feature.properties.id + ' on OSM</a>');

          if (searchClosed) {
            let iconURL;
            if (feature.properties.status === 'open') {
              iconURL = 'assets/open.svg';
            } else if (feature.properties.status === 'closed') {
              iconURL = 'assets/closed.svg';
            }
            layer.setIcon(new L.Icon({
              iconUrl: iconURL,
              iconSize: [40, 40],
              iconAnchor: [20, 45],
              popupAnchor: [0, -30]
            }));
          }
        }
      }
    });

    //Display how much notes were found
    L.Control.Watermark = L.Control.extend({
      onAdd: function() {
        const element = L.DomUtil.create('p');
        element.textContent = 'Found notes: ' + ids.length;
        return element;
      }
    });
    L.control.watermark = function(opts) {
      return new L.Control.Watermark(opts);
    };
    watermark = L.control.watermark({
      position: 'bottomleft'
    }).addTo(Maps.get());

    if (geoJSONLayer.getLayers().length === 0) {
      return UI.nothingFound();
    }

    Maps.removeLayers();

    const markers = L.markerClusterGroup();
    markers.addLayer(geoJSONLayer);

    //Display all notes on the map and zoom the map to show them all
    const map = Maps.get();
    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

    UI.toggleButtons();
  });
}

function filterGeoJSON(feature, useNormalApi, ids, query) {
  if (useNormalApi) {
    return ids.indexOf(feature.properties.id) === -1 && feature.properties.comments[0].text.toLocaleUpperCase().includes(query.toLocaleUpperCase());
  }
  return ids.indexOf(feature.properties.id) === -1;
}

const Maps = (function() {
  const me = {};

  let map;

  me.get = function() {
    return map;
  };

  me.search = search;

  me.tiles = function() {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  };

  me.removeLayers = function() {
    map.eachLayer(function(layer) {
      map.removeLayer(layer);
    });
    if (watermark) {
      map.removeControl(watermark);
    }
    Maps.tiles();
  };

  me.BBoxToSquareDegree = function(bounds) {
    // (maxlat - minlat) * (maxlon - minlon) < 0.25
    return (bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest());
  };

  me.getBBox = function() {
    return map.getBounds().toBBoxString();
  };

  me.init = function() {
    map = L.map('map', {
      minZoom: 2,
      maxZoom: 22
    });

    map.on('move', function() {
      Permalink.update();

      const tooltip = M.Tooltip.getInstance(UI.searchButton);
      const fastSearch = document.getElementById('fast-search');

      const bounds = map.getBounds();
      BBoxSize = Maps.BBoxToSquareDegree(bounds);

      if (BBoxSize < 0.25) {
        if (tooltip) {
          tooltip.destroy();
        }
        fastSearch.style.display = 'block';
      } else {
        fastSearch.style.display = 'none';
        if (!tooltip) {
          M.Tooltip.init(UI.searchButton, {
            enterDelay: 50,
            html: 'Worldwide query enabled. Zoom in further to get a faster query for a limited area.'
          });
        }
      }
    });

    map.setView([40, 10], 3);

    Maps.tiles();
  };

  return me;
})();

// init modules
Mode.set(Mode.MAPS);
Maps.init();
Permalink.update();
UI.searchParams();
