import * as Localizer from './localizer.js';
import { ENDPOINT } from './query.js';

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
    color = 'yellow';
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
  * @returns {Boolean}
  */
export function isNoteVisible(note) {
  const query = document.getElementById('query').value;
  const user = document.getElementById('user').value;
  let from = document.getElementById('from').value;
  let to = document.getElementById('to').value;

  let visible = true;

  // If the default endpoint has been used, some additional checks are necessary to make sure only the right notes are returned
  if (note.api === ENDPOINT.DEFAULT) {
    from = from === '' ? new Date(0) : new Date(from);
    to = to === '' ? new Date() : new Date(to);
    const created = new Date(note.date);

    // Check whether the query is included in the comment
    visible = (note.comments.map(comment => comment.text).join(' ').toLocaleUpperCase().includes(query.toLocaleUpperCase())) &&
              // Check whether the note was created during the correct range
              (created > from && created < to) &&
              // Check whether the specified user also created the note
              (!['', 'anonymous', Localizer.message('note.anonymous')].includes(user) ? user.localeCompare(note.user.name) === 0 : true);
  }

  return visible &&
         (document.getElementById('show-closed').checked ? true : note.status === 'open') &&
         (document.getElementById('hide-anonymous').checked ? !note.anonymous : true) &&
         (['anonymous', Localizer.message('note.anonymous')].includes(user) ? note.anonymous : true);
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
