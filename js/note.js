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
    * @param {String} api The API which was used to find the note
    */
  constructor(feature, api) {
    /** Exclude invalid notes
      * See {@link https://github.com/openstreetmap/openstreetmap-website/issues/2146} */
    if (feature.properties.comments.length === 0) {
      throw new Error(`Note ${feature.properties.id} can not be parsed because there are no comments.`);
    }

    this.id = feature.properties.id;
    this.status = feature.properties.status;
    this.coordinates = feature.geometry.coordinates.reverse();
    /** The dashes in the date string need to be replaced with slashes
      * See {@link https://stackoverflow.com/a/3257513} for the reason */
    this.date = new Date(feature.properties.date_created.replace(/-/g, '/'));
    this.color = Util.parseDate(this.date);
    this.anonymous = feature.properties.comments[0].user ? false : true;
    this.comments = this.parseComments(feature.properties.comments);
    [ this.comment ] = this.comments;
    this.user = this.comment.user;
    this.api = api;
    this.badges = {
      age: Badges.age(this.color, this.date),
      comments: Badges.comments(this.comments.length - 1),
      user: Badges.user(this.user, this.anonymous)
    };
    this.visible = true;
  }

  /**
    * Return possible note actions as a formatted HTML String
    * Possible actions are e.g. to open an editor or open the note on openstreetmap.org
    *
    * @function
    * @returns {String}
    */
  get actions() {
    const actions = {
      osm: {
        class: 'link-osm',
        link: `https://www.openstreetmap.org/note/${this.id}`,
        text: Localizer.message('action.openstreetmap')
      },
      iD: {
        class: 'link-editor-id',
        link: `https://www.openstreetmap.org/edit?editor=id&map=17/${this.coordinates.join('/')}`,
        text: Localizer.message('action.edit.id')
      },
      josm: {
        class: 'link-editor-josm',
        link: `https://localhost:8112/import?url=https://overpass-api.de/api/interpreter/?data=nwr(around:100,${this.coordinates.join(',')});out;`,
        text: Localizer.message('action.edit.josm')
      },
      level0: {
        class: 'link-editor-level0',
        link: `http://level0.osmz.ru/?center=${this.coordinates.join(',')}`,
        text: Localizer.message('action.edit.level0')
      }
    };

    let match;
    OPENSTREETMAP_ELEMENT_REGEX.forEach(regex => {
      if (!match) {
        match = this.comment.html.match(regex);
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

          actions.iD = {
            class: 'link-editor-id',
            link: `https://www.openstreetmap.org/edit?editor=id&${type}=${id}`,
            text: Localizer.message('action.edit.id')
          };
          actions.josm = {
            class: 'link-editor-josm',
            link: `https://localhost:8112/import?url=https://overpass-api.de/api/interpreter/?data=${type}(${id});out;`,
            text: Localizer.message('action.edit.josm')
          };
          actions.level0 = {
            class: 'link-editor-level0',
            link: `http://level0.osmz.ru/?url=${type}/${id}&center=${this.coordinates.join(',')}`,
            text: Localizer.message('action.edit.level0')
          };
        }
      }
    });

    return Object.values(actions);
  }

  /**
    * Parses the existing comments
    *
    * @function
    * @param {Array} comments
    * @returns {Array}
    */
  parseComments(comments) {
    for (let i = 0; i < comments.length; i++) {
      comments[i].anonymous = comments[i].user ? false : true;
      if (comments[i].anonymous) {
        comments[i].user = Localizer.message('note.anonymous');
      }
      comments[i].date = new Date(comments[i].date.replace(/-/g, '/'));
      comments[i].color = Util.parseDate(comments[i].date);
      comments[i].badges = {
        age: Badges.age(comments[i].color, comments[i].date),
        user: Badges.user(comments[i].user, comments[i].anonymous),
        status: Badges.status(comments[i])
      };
      comments[i].html = Linkify(comments[i].text);
    }
    return comments;
  }
}
