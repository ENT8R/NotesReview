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
    this.notes = new Map();
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
    this.notes.clear();
    this._view.handler.removeAll();

    this.query = query;

    let visible = 0;
    let accumulator = 0;

    notes.forEach(note => {
      this.notes.set(note.id, note);
      this._view.handler.add(note, query);

      if (this.isNoteVisible(note, query)) {
        visible++;
        accumulator += note.created.getTime();
      } else {
        this._view.handler.hide(note);
      }
    });
    this._view.handler.apply();

    return Promise.resolve({
      amount: visible,
      average: new Date(accumulator / visible)
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
    return this.notes.get(id);
  }

  /**
    * Updates a single note with new data
    *
    * @function
    * @param {Number} id
    * @param {Note} note
    * @returns {void}
    */
  update(id, note) {
    if (!this.notes.has(id)) {
      throw new Error(`The note with the id ${id} could not be found`);
    }

    this.notes.set(id, note);

    this._view.handler.update(note);

    if (this.isNoteVisible(note, this.query)) {
      this._view.handler.show(note.id);
    } else {
      this._view.handler.hide(note.id);
    }
  }

  /**
    * Reload all notes
    *
    * @function
    * @returns {Promise}
    */
  reload() {
    return this.show(Array.from(this.notes.values()), this.query);
  }

  /**
    * Update note to reflect the new status as being hidden
    *
    * @param {Number} id
    * @returns {void}
    */
  hide(id) {
    const note = this.get(id);
    note.hidden = true;
    this.update(id, note);
  }

  /**
    * Update note to reflect the new status as not being hidden anymore
    *
    * @param {Number} id
    * @returns {void}
    */
  unhide(id) {
    const note = this.get(id);
    note.hidden = false;
    this.update(id, note);
  }

  /**
    * Update note to reflect the new status as being on the watchlist
    *
    * @param {Number} id
    * @returns {void}
    */
  watch(id) {
    const note = this.get(id);
    note.watchlist = true;
    this.update(id, note);
  }

  /**
    * Update note to reflect the new status as not being on the watchlist anymore
    *
    * @param {Number} id
    * @returns {void}
    */
  unwatch(id) {
    const note = this.get(id);
    note.watchlist = false;
    this.update(id, note);
  }
}
