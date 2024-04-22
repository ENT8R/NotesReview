import * as Localizer from './localizer.js';
import Users from './users.js';
import * as Util from './util.js';

import * as CountryCoder from '@rapideditor/country-coder';

/**
  * Generate a badge for the date a note was created on (the age of it)
  *
  * @function
  * @param {String} color
  * @param {Date} date A ISO 8601 date string (e.g. 2010-01-31)
  * @param {Boolean} navigation Whether the badge should be shown in the navigation bar
  * @returns {String}
  */
export function age(color, date, navigation) {
  const location = navigation ? 'top' : 'bottom';
  return `
  <span class="label label-${color} my-1 c-default tooltip tooltip-${location}" data-tooltip="${date.toLocaleString()}">
    <relative-time tense="past" datetime="${date}" title="">
      ${date.toLocaleDateString()}
    </relative-time>
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
    return `<span class="label label-primary my-1 comments-modal-trigger c-hand">${text}</span>`;
  }
}

/**
  * Generate a badge for the country the note is located in
  *
  * @function
  * @param {Number} coordinates in [ latitude, longitude ] format
  * @returns {String}
  */
export function country(coordinates) {
  const feature = CountryCoder.feature([...coordinates].reverse(), {
    level: 'territory',
    withProp: 'emojiFlag'
  });
  // Return no badge if the note is not inside a known country or there is no emoji associated with it
  if (!feature || !('properties' in feature) || !('emojiFlag' in feature.properties)) {
    return;
  }

  const emoji = [];
  for (const codePoint of feature.properties.emojiFlag) {
    emoji.push(codePoint.codePointAt(0).toString(16));
  }
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${emoji.join('-')}.svg`;
  return `<span><img class="country-flag" src="${url}" height="24" width="24"></span>`;
}

/**
  * Generate a badge for a user who commented or created the note
  *
  * @function
  * @param {Number} uid
  * @param {Boolean} anonymous
  * @returns {String}
  */
export function user(uid, anonymous) {
  if (anonymous) {
    return `<span class="label label-error my-1">${Localizer.message('note.anonymous')}</span>`;
  } else {
    const user = Users.get(uid);
    if (!user) {
      return `<span class="label label-secondary">${Localizer.message('note.unknown')}</span>`;
    }

    const image = user.image ? `<img src="${user.image}">` : '';
    const initials = Util.initials(user.name);
    return `<figure class="avatar" data-initial="${initials}">${image}</figure>
            <a href="${OPENSTREETMAP_SERVER}/user/${user.name}" target="_blank" rel="noopener">
              <span class="tooltip tooltip-bottom" data-tooltip="${Localizer.message('user.created', user.created.toLocaleDateString())}">
                ${user.name}
              </span>
            </a>`;
  }
}

/**
  * Generate a badge for the status which was set with a note (e.g. opened/reopened)
  *
  * @function
  * @param {String} action
  * @returns {String}
  */
export function status(action) {
  if (action === 'opened') {
    return `<span class="label label-success my-1">${Localizer.message('note.action.opened')}</span>`;
  } else if (action === 'closed') {
    return `<span class="label label-error my-1">${Localizer.message('note.action.closed')}</span>`;
  } else if (action === 'reopened') {
    return `<span class="label label-warning my-1">${Localizer.message('note.action.reopened')}</span>`;
  }
}

/**
  * Generate an icon to report a note
  *
  * @function
  * @param {Number} id
  * @returns {String}
  */
export function report(id) {
  return `<a href="${OPENSTREETMAP_SERVER}/reports/new?reportable_type=Note&reportable_id=${id}" target="_blank" rel="noopener">
            <span class="tooltip tooltip-bottom" data-tooltip="${Localizer.message('action.report')}">
              <svg class="icon"><use xlink:href="#icon-flag"></use></svg>
            </span>
          </a>`;
}
