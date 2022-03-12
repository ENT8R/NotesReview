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
    this.date = new Date(comment.date);
    this.color = Util.parseDate(this.date);
    this.action = comment.action;

    if ('text' in comment) {
      // Escape HTML tags in the comment before proceeding
      comment.text = Util.escape(comment.text);

      const { html, images } = Linkify(comment.text);
      this.html = html;
      this.images = images;
    }
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
