import * as Badges from './badges.js';
import Comment from './comment.js';
import * as Localizer from './localizer.js';
import * as Util from './util.js';

const OPENSTREETMAP_ELEMENT_REGEX = [
  /(?:https?:\/\/)?(?:www\.)?(?:osm|openstreetmap)\.org\/(node|way|relation)\/([0-9]+)/,
  /(node|way|relation)\/([0-9]+)/,
  /(node|way|relation)(?:\s)?#([0-9]+)/,
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
    if (feature.comments.length === 0) {
      throw new Error(`Note ${feature._id} can not be parsed because there are no comments.`);
    }

    this.id = feature._id;
    this.status = feature.status;
    this.coordinates = feature.coordinates.reverse();

    this.comments = feature.comments.map(comment => new Comment(comment));

    this.users = this.comments.filter(comment => comment.uid !== null).map(comment => comment.uid);
    this.anonymous = this.comments[0].anonymous;
    this.user = this.comments[0].user;

    this.created = this.comments[0].date;
    this.color = Util.parseDate(this.created);
  }

  /**
    * Parse a new note from the main OpenStreetMap API
    *
    * @function
    * @param {Object} note
    * @returns {Note}
    */
  static parse(note) {
    return new Note({
      _id: note.properties.id,
      coordinates: note.geometry.coordinates,
      status: note.properties.status,
      comments: note.properties.comments.map(comment => {
        /** The dashes in the date string need to be replaced with slashes
        * See {@link https://stackoverflow.com/a/3257513} for the reason */
        comment.date = comment.date.replace(/-/g, '/');
        return comment;
      })
    });
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
      deepl: {
        class: 'link-tool-deepl',
        link: `https://www.deepl.com/translator#auto/${Localizer.LANGUAGE}/${encodeURIComponent(this.comments[0].text).replace(/%2F/g, '\\%2F')}`,
        icon: 'external',
        text: Localizer.message('action.deepl')
      },
      comment: {
        class: 'comments-modal-trigger requires-authentication',
        icon: 'chat',
        text: Localizer.message('action.comment')
      }
    };

    if (this.comments.length > 1) {
      delete actions.comment;
    }

    if (this.linked) {
      const { id, type } = this.linked;
      actions.iD.link = `${OPENSTREETMAP_SERVER}/edit?editor=id&${type}=${id}`;
      actions.josm.link += `&select=${type}${id}`;
      actions.level0.link = `http://level0.osmz.ru/?url=${type}/${id}&center=${this.coordinates.join()}`;
    }

    return actions;
  }

  /**
    * Find the first linked OpenStreetMap element in the first comment
    *
    * @function
    * @returns {Object}
    */
  get linked() {
    if (!('html' in this.comments[0])) {
      return null;
    }

    for (const regex of OPENSTREETMAP_ELEMENT_REGEX) {
      const match = this.comments[0].html.match(regex);

      if (match && match.length >= 3) {
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

        return {
          type, id
        };
      }
    }
    return null;
  }

  /**
    * Create all necessary badges dynamically
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
}
