import { ANONYMOUS, ENDPOINT } from './query.js';

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
  * Check whether a note/marker can be shown
  *
  * @function
  * @param {Note} note Single note which should be checked.
  * @param {Query} query The query which was used in order to find the note
  * @returns {Boolean}
  */
export function isNoteVisible(note, query) {
  let visible = true;

  // If the default endpoint has been used, some additional checks are necessary to make sure only the right notes are returned
  if (query.endpoint === ENDPOINT.DEFAULT) {
    const date = query.sort === 'updated_at' ? note.updated : note.created;
    const from = query.from === null ? new Date(0) : new Date(query.from);
    const to = query.to === null ? new Date() : new Date(query.to);
    // Check whether the note is in the correct date range
    visible = (date > from && date < to);

    // Check whether the query is included in the comments
    if (query.query && !containsQuery(note.comments, query.query)) {
      visible = false;
    }
    // Check whether the specified user also created the note
    if (query.user && query.anonymous !== ANONYMOUS.ONLY) {
      visible = query.user.localeCompare(note.user) === 0;
    }
  }

  return visible &&
         (query.closed ? true : note.status === 'open') &&
         (document.getElementById('hide-anonymous').checked ? !note.anonymous : true) &&
         (query.anonymous === ANONYMOUS.ONLY ? note.anonymous : true);
}

/**
  * Check whether the comments of a note contain the specified query
  *
  * @function
  * @param {Array} comments
  * @param {String} query
  * @returns {Boolean}
  */
function containsQuery(comments, query) {
  comments = comments.map(comment => comment.text).join(' '); // Extract text from the comments array
  comments = comments.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase(); // Normalize the comments in order to remove all diacritics
  query = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase(); // Normalize the query in order to remove all diacritics too
  return comments.includes(query);
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
    left: longitude - radius / (DISTANCE_BETWEEN_DEGREES * Math.cos(latitude * Math.PI / 180)),
    bottom: latitude - radius / DISTANCE_BETWEEN_DEGREES,
    right: longitude + radius / (DISTANCE_BETWEEN_DEGREES * Math.cos(latitude * Math.PI / 180)),
    top: latitude + radius / DISTANCE_BETWEEN_DEGREES
  };
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
