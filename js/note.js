import * as Badges from './badges.js';
import Linkify from './linkify.js';
import * as Localizer from './localizer.js';
import * as Util from './util.js';

const OPENSTREETMAP_ELEMENT_REGEX = [
  /(?:https?:\/\/)?(?:www\.)?(?:osm|openstreetmap)\.org\/(node|way|relation)\/([0-9]+)/,
  /(node|way|relation)\/([0-9]+)/,
  /(node|way|relation)(?:\\s)?#([0-9]+)/,
  /(n|w|r)\/([0-9]+)/
];

export default class Note {
  /**
    * Constructor for an OpenStreetMap note
    *
    * @constructor
    * @param {Object} feature
    */
  constructor(feature) {
    /** Exclude invalid notes
      * See {@link https://github.com/openstreetmap/openstreetmap-website/issues/2146} */
    if (feature.properties.comments.length === 0) {
      throw new Error(`Note ${feature.properties.id} can not be parsed because there are no comments.`);
    }

    this.id = feature.properties.id;
    this.status = feature.properties.status;
    this.coordinates = feature.geometry.coordinates.reverse();

    this.comments = this.parseComments(feature.properties.comments);
    this.users = this.comments.filter(comment => comment.uid !== null).map(comment => comment.uid);
    this.anonymous = this.comments[0].anonymous;
    this.user = this.comments[0].user;
    /** The dashes in the date string need to be replaced with slashes
      * See {@link https://stackoverflow.com/a/3257513} for the reason */
    this.created = new Date(feature.properties.date_created.replace(/-/g, '/'));
    this.updated = this.comments[this.comments.length - 1].date;
    this.color = Util.parseDate(this.created);
  }

  /**
    * Return possible note actions which are then added to the note template
    * Possible actions are e.g. to open an editor or open the note on openstreetmap.org
    *
    * @function
    * @returns {Array}
    */
  get actions() {
    const bbox = Util.buffer(this.coordinates);

    const actions = {
      osm: {
        class: 'link-osm',
        link: `${OPENSTREETMAP_SERVER}/note/${this.id}`,
        icon: 'external',
        text: Localizer.message('action.openstreetmap')
      },
      iD: {
        class: 'link-editor-id',
        link: `${OPENSTREETMAP_SERVER}/edit?editor=id#map=19/${this.coordinates.join('/')}`,
        icon: 'external',
        text: Localizer.message('action.edit.id')
      },
      josm: {
        class: 'link-editor-josm',
        link: `http://127.0.0.1:8111/load_and_zoom?left=${bbox.left}&bottom=${bbox.bottom}&right=${bbox.right}&top=${bbox.top}`,
        icon: 'external',
        text: Localizer.message('action.edit.josm'),
        remote: true
      },
      level0: {
        class: 'link-editor-level0',
        link: `http://level0.osmz.ru/?center=${this.coordinates.join()}`,
        icon: 'external',
        text: Localizer.message('action.edit.level0')
      },
      mapillary: {
        class: 'link-tool-mapillary',
        icon: 'mapillary',
        text: Localizer.message('action.mapillary')
      },
      comment: {
        class: 'comments-modal-trigger requires-authentication',
        icon: 'pencil',
        text: Localizer.message('action.comment')
      }
    };

    if (this.comments.length > 1) {
      delete actions.comment;
    }

    let match;
    OPENSTREETMAP_ELEMENT_REGEX.forEach(regex => {
      if (!match) {
        match = this.comments[0].html.match(regex);
        if (match && match.length > 1) {
          let [ , type, id ] = match; // eslint-disable-line prefer-const

          switch (type) {
          case 'n':
            type = 'node';
            break;
          case 'w':
            type = 'way';
            break;
          case 'r':
            type = 'relation';
            break;
          }

          actions.iD.link = `${OPENSTREETMAP_SERVER}/edit?editor=id&${type}=${id}`;
          actions.josm.link += `&select=${type}${id}`;
          actions.level0.link = `http://level0.osmz.ru/?url=${type}/${id}&center=${this.coordinates.join()}`;
        }
      }
    });

    return Object.values(actions);
  }

  /**
    * Dynamically creates all possible badges
    *
    * @function
    * @returns {Object}
    */
  get badges() {
    return {
      age: Badges.age(this.color, this.created),
      comments: Badges.comments(this.comments.length - 1),
      country: Badges.country(this.coordinates),
      user: Badges.user(this.comments[0].uid, this.anonymous),
      report: Badges.report(this.id)
    };
  }

  /**
    * Parses the existing comments
    *
    * @function
    * @param {Array} comments
    * @returns {Array}
    */
  parseComments(comments) {
    const texts = [];

    for (let i = comments.length - 1; i >= 0; i--) {
      const comment = comments[i];
      comment.anonymous = comment.user ? false : true;
      if (comment.anonymous) {
        comment.user = Localizer.message('note.anonymous');
        comment.uid = null;
      }
      comment.date = new Date(comment.date.replace(/-/g, '/'));
      comment.color = Util.parseDate(comment.date);

      const linkified = Linkify(comment.text);
      comment.html = linkified.html;
      comment.images = linkified.images;

      // TODO: in some cases the API might supply multiple, not unique comments,
      // see also https://github.com/ENT8R/NotesReview/issues/43#issuecomment-565805628
      if (texts.includes(comment.text)) {
        comments.splice(i, 1);
      } else if (comment.text !== '') {
        texts.push(comment.text);
      }
    }
    return comments;
  }
}
