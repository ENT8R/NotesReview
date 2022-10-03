const EARTH_RADIUS = 6371000; // In meters. See https://en.wikipedia.org/wiki/Earth_radius#Mean_radius
const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;
const DISTANCE_BETWEEN_DEGREES = EARTH_CIRCUMFERENCE / 360;

/**
  * Determines the age of a note and
  * returns the colour which represents the age of the note
  *
  * @function
  * @param {String} date A ISO 8601 date string (e.g. 2010-01-31)
  * @returns {Object}
  */
export function parseDate(date) {
  const difference = Math.abs(new Date().getTime() - date.getTime());

  const age = {
    hours: Math.round(difference / (1000 * 60 * 60)),
    days: Math.round(difference / (1000 * 60 * 60 * 24)),
    months: Math.round(difference / (1000 * 60 * 60 * 24 * 30)),
    years: Math.round(difference / (1000 * 60 * 60 * 24 * 365.25)),
  };

  let color;

  if (age.hours <= 24) {
    color = 'green-dark';
  } else if (age.days <= 31) {
    color = 'green';
  } else if (age.months < 6) {
    color = 'lime';
  } else if (age.months < 12) {
    color = 'amber';
  } else if (age.years <= 1) {
    color = 'orange';
  } else {
    color = 'red';
  }

  return color;
}

/**
  * Try to extract the initials of the user which are shown when there is no user image available
  *
  * @function
  * @param {String} name
  * @returns {String}
  */
export function initials(name) {
  let initials = name.substring(0, 2);
  if (/^(.).*(?:\s|_)(.).*$/.test(name)) {
    const [, first, second] = /^(.).*(?:\s|_)(.).*$/.exec(name);
    initials = `${first}${second}`;
  } else if (/^(.).*[a-z]([A-Z]).*$/.test(name)) {
    const [, first, second] = /^(.).*[a-z]([A-Z]).*$/.exec(name);
    initials = `${first}${second}`;
  }
  return initials.toUpperCase();
}

/**
  * Convert degree to radian
  *
  * @function
  * @param {Number} deg
  * @returns {Number}
  */
export function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
  * Convert radian to degree
  *
  * @function
  * @param {Number} rad
  * @returns {Number}
  */
export function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

/**
  * Calculate a bounding box around the given coordinates within a given radius
  *
  * @function
  * @param {Array} coordinates
  * @param {Number} radius
  * @returns {Object}
  */
export function buffer(coordinates, radius) {
  if (!radius) {
    radius = 100;
  }
  const [ latitude, longitude ] = coordinates;
  return {
    left: longitude - radius / (DISTANCE_BETWEEN_DEGREES * Math.cos(deg2rad(latitude))),
    bottom: latitude - radius / DISTANCE_BETWEEN_DEGREES,
    right: longitude + radius / (DISTANCE_BETWEEN_DEGREES * Math.cos(deg2rad(latitude))),
    top: latitude + radius / DISTANCE_BETWEEN_DEGREES
  };
}

/**
  * Calculate the percentage that two bounding boxes overlap with each other
  *
  * @function
  * @param {LatLngBounds} rect1
  * @param {LatLngBounds} rect2
  * @returns {Number}
  */
export function overlap(rect1, rect2) {
  const area1 = area(rect1);
  const area2 = area(rect2);

  if (rect1.contains(rect2)) {
    return area2 / area1;
  }
  if (!rect1.overlaps(rect2)) {
    return 0;
  }

  // See e.g. https://stackoverflow.com/questions/9324339/how-much-do-two-rectangles-overlap and
  // https://math.stackexchange.com/questions/2449221/calculating-percentage-of-overlap-between-two-rectangles
  // on how to calculate the bounding box of the area where two rectangles intersect.
  // But keep in mind, that the coordinate system used in the examples above is different to the one that the map uses.
  const bounds = L.latLngBounds(
    L.latLng(Math.min(rect1.getNorth(), rect2.getNorth()), Math.max(rect1.getWest(), rect2.getWest())),
    L.latLng(Math.max(rect1.getSouth(), rect2.getSouth()), Math.min(rect1.getEast(), rect2.getEast()))
  );
  const intersection = area(bounds);
  const union = area1 + area2 - intersection;

  return intersection / union;
}

/**
  * Get the rectangle size/area in square meters of the given rectangle.
  * The calculation is based on a modified version of Gauss's area formula, also known as Shoelace formula
  * (see e.g. https://en.wikipedia.org/wiki/Shoelace_formula), which also works for arbitrary complex polygons.
  * This implementation is inspired by the algorithm which was presented in
  * "Chamberlain, R. G., Duquette, W. H. (2007). Some algorithms for polygons on a sphere. https://hdl.handle.net/2014/40409"
  *
  * @function
  * @param {LatLngBounds} rect
  * @returns {void}
  */
export function area(rect) {
  // This array contains all vertices of the bounding box in counter-clockwise orientation, in order to simplify further operations
  const vertices = [
    [rect.getWest(), rect.getSouth()],
    [rect.getEast(), rect.getSouth()],
    [rect.getEast(), rect.getNorth()],
    [rect.getWest(), rect.getNorth()]
  ];

  // TODO: In future versions Array.at() may be used to access elements at "negative" indices:
  // See https://caniuse.com/mdn-javascript_builtins_array_at and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at#browser_compatibility
  // chrome >= 92, edge >= 92, firefox >= 90, not ie <= 11 opera >= 78, safari >= 15.4
  let sum = (deg2rad(vertices[1][0]) - deg2rad(vertices[vertices.length - 1][0])) * Math.sin(deg2rad(vertices[0][1]));
  for (let i = 1; i < vertices.length; i++) {
    sum += (deg2rad(vertices[(i + 1) % vertices.length][0]) - deg2rad(vertices[i - 1][0])) * Math.sin(deg2rad(vertices[i][1]));
  }

  return -(EARTH_RADIUS*EARTH_RADIUS)/2 * sum;
}

/**
  * Get the rectangle size/area in square degrees of the given rectangle.
  *
  * @function
  * @param {LatLngBounds} rect
  * @returns {void}
  */
export function size(rect) {
  return (rect.getNorth() - rect.getSouth()) * (rect.getEast() - rect.getWest());
}

/**
  * Wait for a specific time and return a promise after that
  *
  * @function
  * @param {Number} time
  * @returns {Promise}
  */
export function wait(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

/**
  * Splits an array into parts of equal size
  *
  * @function
  * @param {Array} array
  * @param {Number} size
  * @returns {Array}
  */
export function chunk(array, size) {
  const result = [];
  for (let i = 0, len = array.length; i < len; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
  * Removes unnecessary default values from an object while preserving the state of the object when calling the function
  *
  * @function
  * @param {Object} data
  * @param {Object} defaults
  * @returns {Object}
  */
export function clean(data, defaults) {
  const result = Object.assign({}, data);
  Object.entries(defaults).forEach(entry => {
    const [ key, value ] = entry;
    if (result[key] === value) {
      delete result[key];
    }
  });
  return result;
}

/**
  * Escapes a given string
  *
  * @function
  * @param {String} string
  * @returns {String}
  */
export function escape(string) {
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
