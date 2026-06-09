import { STATUS } from '../query.js';

export default class UI {
  static #notes = new Map();
  static #query = null;

  static #views = {};
  static #currentView = null;

  static registerView(name, handler) {
    if (this.#views[name]) {
      throw new Error(`A view with the name ${name} is already registered`);
    }
    this.#views[name] = handler;
  }

  static set view(view) {
    const values = Object.keys(this.#views);
    if (!values.includes(view)) {
      throw new TypeError(`Argument must be one of ${values.join(', ')}`);
    }
    this.#currentView = {
      name: view,
      handler: this.#views[view]
    };
    this.reload();
  }

  static get view() {
    return this.#currentView.name;
  }

  /**
    * Delegate the information to all views
    *
    * @function
    * @param {Array} notes
    * @param {Query} query
    * @returns {Promise}
    */
  static show(notes, query) {
    this.#notes.clear();
    this.#currentView.handler.removeAll();

    this.#query = query;

    let visible = 0;
    let accumulator = 0;

    notes.forEach(note => {
      this.#notes.set(note.id, note);
      this.#currentView.handler.add(note, query);

      if (this.isNoteVisible(note, query)) {
        visible++;
        accumulator += note.created.getTime();
      } else {
        this.#currentView.handler.hide(note);
      }
    });
    this.#currentView.handler.apply();

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
  static isNoteVisible(note, query) {
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
  static get(id) {
    return this.#notes.get(id);
  }

  /**
    * Updates a single note with new data
    *
    * @function
    * @param {Number} id
    * @param {Note} note
    * @returns {void}
    */
  static update(id, note) {
    if (!this.#notes.has(id)) {
      throw new Error(`The note with the id ${id} could not be found`);
    }

    this.#notes.set(id, note);

    this.#currentView.handler.update(note);

    if (this.isNoteVisible(note, this.#query)) {
      this.#currentView.handler.show(note.id);
    } else {
      this.#currentView.handler.hide(note.id);
    }
  }

  /**
    * Reload all notes
    *
    * @function
    * @returns {Promise}
    */
  static reload() {
    return this.show(Array.from(this.#notes.values()), this.#query);
  }

  /**
    * Update note to reflect the new status as being hidden
    *
    * @param {Number} id
    * @returns {void}
    */
  static hide(id) {
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
  static unhide(id) {
    const note = this.get(id);
    note.hidden = false;
    this.update(id, note);
  }

  /**
    * Update all notes to reflect the new status as not being hidden anymore
    *
    * @returns {void}
    */
  static unhideAll() {
    this.#notes.forEach((note, id) => {
      note.hidden = false;
      this.update(id, note);
    });
  }

  /**
    * Update note to reflect the new status as being on the watchlist
    *
    * @param {Number} id
    * @returns {void}
    */
  static watch(id) {
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
  static unwatch(id) {
    const note = this.get(id);
    note.watchlist = false;
    this.update(id, note);
  }

  /**
    * Update all notes to reflect the new status as not being on the watchlist anymore
    *
    * @returns {void}
    */
  static unwatchAll() {
    this.#notes.forEach((note, id) => {
      note.watchlist = false;
      this.update(id, note);
    });
  }
}
