import * as Localizer from './localizer.js';

/**
  * Generate a badge for the date a note was created on (the age of it)
  *
  * @function
  * @param {String} color
  * @param {Date} date A ISO 8601 date string (e.g. 2010-01-31)
  * @returns {String}
  */
export function age(color, date) {
  return `
  <span class="label label-${color} my-1 c-default tooltip tooltip-bottom" data-tooltip="${date.toLocaleString()}">
    <time-ago datetime="${date}" title="">
      ${date.toLocaleDateString()}
    </time-ago>
  </span>`;
}

/**
  * Generate a badge for the amount of comments
  *
  * @function
  * @param {Number} amount
  * @returns {String}
  */
export function comments(amount) {
  if (amount > 0) {
    const text = amount === 1 ? Localizer.message('note.comment') : Localizer.message('note.comments', amount);
    return `<span class="label label-primary my-1 comments c-hand">${text}</span>`;
  }
}

/**
  * Generate a badge for a user who commented or created the note
  *
  * @function
  * @param {String} name
  * @param {Boolean} anonymous
  * @returns {String}
  */
export function user(name, anonymous) {
  if (anonymous) {
    return `<span class="label label-error my-1">${name}</span>`;
  } else {
    return `<span class="label label-success my-1">
              <a href="https://openstreetmap.org/user/${name}" target="_blank" class="text-light">${name}</a>
            </span>`;
  }
}

/**
  * Generate a badge for the status which was set with a note (e.g. opened/reopened)
  *
  * @function
  * @param {Object} comment
  * @returns {String}
  */
export function status(comment) {
  if (comment.action === 'opened') {
    return `<span class="label label-success my-1">${Localizer.message('note.action.opened')}</span>`;
  } else if (comment.action === 'closed') {
    return `<span class="label label-error my-1">${Localizer.message('note.action.closed')}</span>`;
  } else if (comment.action === 'reopened') {
    return `<span class="label label-warning my-1">${Localizer.message('note.action.reopened')}</span>`;
  }
}
