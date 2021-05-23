import * as Badges from './badges.js';
import Linkify from './linkify.js';
import * as Localizer from './localizer.js';
import * as Util from './util.js';

export default class Comment {
  /**
    * Parses a comment of a note and extract the needed information
    *
    * @constructor
    * @param {Object} comment
    */
  constructor(comment) {
    this.anonymous = comment.user ? false : true;
    this.user = this.anonymous ? Localizer.message('note.anonymous') : comment.user;
    this.uid = this.anonymous ? null : comment.uid;

    this.date = new Date(comment.date.replace(/-/g, '/'));
    this.color = Util.parseDate(this.date);
    this.action = comment.action;

    const linkified = Linkify(comment.text);
    this.html = linkified.html;
    this.images = linkified.images;
  }

  /**
    * Create all necessary badges dynamically
    *
    * @function
    * @returns {Object}
    */
  get badges() {
    return {
      age: Badges.age(this.color, this.date),
      user: Badges.user(this.uid, this.anonymous),
      status: Badges.status(this.action)
    };
  }
}
