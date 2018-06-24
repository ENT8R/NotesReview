'use strict';

/* globals L */

/* globals UI */
/* globals Permalink */
/* globals Mode */

//Search for all notes with a specific keyword either worldwide or if the bounding box is smaller than 0.25 square degree, in that bbox
function search(query, limit, closed) {

  let useNormalApi = false;
  let url = Request.buildURL(query, limit, closed, false);

  if (Maps.getBBoxSize() < 0.25) {
    useNormalApi = true;
    url = Request.buildURL(Maps.getBBox(), limit, closed, true);
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
        const note = feature.properties;
        if (note) {
          ids.push(note.id);
          let comment = note.comments[0];
          layer.bindPopup(
            UI.getAmountOfCommentsBadge(note.comments) +
            '<p>' + comment.html + '</p>' +
            '<div class="divider"></div>' +
            UI.getNoteActions(comment.html, note.id, feature.geometry.coordinates)
          );

          if (closed === '-1') {
            let iconURL;
            if (note.status === 'open') {
              iconURL = 'assets/open.svg';
            } else if (note.status === 'closed') {
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

    if (geoJSONLayer.getLayers().length === 0) {
      return UI.nothingFound();
    }

    //Display how much notes were found
    document.getElementById('found-notes').textContent = 'Found notes: ' + ids.length;

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
    Maps.tiles();
  };

  me.BBoxToSquareDegree = function(bounds) {
    // (maxlat - minlat) * (maxlon - minlon) < 0.25
    return (bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest());
  };

  me.getBBox = function() {
    return map.getBounds().toBBoxString();
  };

  me.getBBoxSize = function() {
    const bounds = map.getBounds();
    return Maps.BBoxToSquareDegree(bounds);
  };

  me.init = function() {
    map = L.map('map', {
      minZoom: 2,
      maxZoom: 22
    }).setView([40, 10], 3);

    map.on('move', function() {
      Permalink.update();
      UI.tooltip();
    });

    Maps.tiles();
  };

  return me;
})();

// init modules
Mode.set(Mode.MAPS);
Maps.init();
Permalink.update();
UI.init();
