import { STATUS } from '../query.js';
import MapView from './map.js';
import ListView from './list.js';

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
    * @returns {Promise}
    */
  show(notes, query) {
    this.query = query;
    this.notes = notes;

    const amount = notes.length;
    const average = notes.reduce((accumulator, current) => accumulator + current.created.getTime(), 0) / amount;

    notes.forEach(note => {
      if (this.isNoteVisible(note, query)) {
        this._view.handler.add(note, query);
      }
    });
    this._view.handler.apply();

    return Promise.resolve({
      amount,
      average: new Date(average)
    });
  }

  /**
    * Check whether a note can be shown
    *
    * @function
    * @param {Note} note Single note which should be checked.
    * @param {Query} query The query which was used in order to find the note
    * @returns {Boolean}
    */
  isNoteVisible(note, query) {
    return !note.hidden &&
           (query.data.status === STATUS.OPEN ? note.status === STATUS.OPEN : true) &&
           (query.data.status === STATUS.CLOSED ? note.status === STATUS.CLOSED : true);
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
    return this.show(this.notes, this.query);
  }

  /**
   * Update note accordingly to reflect the new status as being hidden
   *
   * @param {Number} id
   * @returns {Promise}
   */
  hide(id) {
    const note = this.get(id);
    note.hidden = true;
    return this.update(id, note);
  }

  /**
   * Update note accordingly to reflect the new status as not being hidden anymore
   *
   * @param {Number} id
   * @returns {Promise}
   */
  unhide(id) {
    const note = this.get(id);
    note.hidden = false;
    return this.update(id, note);
  }

  /**
   * Update note accordingly to reflect the new status as being on the watchlist
   *
   * @param {Number} id
   * @returns {Promise}
   */
  watch(id) {
    const note = this.get(id);
    note.watchlist = true;
    return this.update(id, note);
  }

  /**
   * Update note accordingly to reflect the new status as not being on the watchlist anymore
   *
   * @param {Number} id
   * @returns {Promise}
   */
  unwatch(id) {
    const note = this.get(id);
    note.watchlist = false;
    return this.update(id, note);
  }
}
