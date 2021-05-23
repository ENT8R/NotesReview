import MapView from './map.js';
import ListView from './list.js';
import * as Util from '../util.js';

const Views = {
  map: new MapView(),
  list: new ListView()
};

export default class UI {
  /**
    * Constructor for controlling the view (e.g. a map or a list)
    *
    * @constructor
    * @param {View} view
    */
  constructor(view) {
    this.notes = [];
    this.query = null;
    this.view = view;
  }

  set view(view) {
    const values = Object.keys(Views);
    if (!values.includes(view)) {
      throw new TypeError(`Argument must be one of ${values.join(', ')}`);
    }
    this._view = {
      name: view,
      handler: Views[view]
    };
    this.reload();
  }

  get view() {
    return this._view.name;
  }

  /**
    * Delegate the information to all views
    *
    * @function
    * @param {Array} notes
    * @param {Query} query
    * @param {Boolean} reload
    * @returns {Promise}
    */
  show(notes, query, reload) {
    this.query = query;
    this.notes = notes;

    notes = notes.filter(note => Util.isNoteVisible(note, query));

    const amount = notes.length;
    const average = notes.reduce((accumulator, current) => accumulator + current.created.getTime(), 0) / amount;

    notes.forEach(note => {
      this._view.handler.add(note, query);
    });
    this._view.handler.apply(reload);

    return Promise.resolve({
      amount,
      average: new Date(average)
    });
  }

  /**
    * Searches for the note with the specified id and returns it
    *
    * @function
    * @param {Number} id
    * @returns {Note}
    */
  get(id) {
    return this.notes.find(note => note.id === id);
  }

  /**
    * Updates a single note with new data
    *
    * @function
    * @param {Number} id
    * @param {Note} note
    * @returns {Promise}
    */
  update(id, note) {
    const index = this.notes.findIndex(element => element.id === id);
    if (index === -1) {
      throw new Error(`The note with the id ${id} could not be found in the array`);
    }
    this.notes[index] = note;
    return this.reload();
  }

  /**
    * Reload the notes because another event happened like a changed filter
    *
    * @function
    * @returns {Promise}
    */
  reload() {
    return this.show(this.notes, this.query, true);
  }
}
