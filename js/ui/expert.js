import Leaflet from '../leaflet.js';
import * as Localizer from '../localizer.js';
import * as Util from '../util.js';

import card from '../../templates/notes/card.mst';

export default class Expert {
  constructor() {
    this.notes = [];
  }

  /**
    * Show all notes in a list as cards
    *
    * @function
    * @param {Array} notes
    * @returns {Promise}
    */
  show(notes) {
    this.notes = notes;

    if (notes.length === 0) {
      return Promise.resolve();
    }

    let amount = 0;
    let average = 0;

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
      note.visible = Util.isNoteVisible(note);

      if (note.visible) {
        amount++;
        average += note.date.getTime();

        const div = document.createElement('div');
        div.classList.add('column', 'col-4', 'col-md-6', 'col-sm-12', 'p-1');
        div.innerHTML = card({
          id: note.id,
          badges: note.badges,
          comment: note.comment.html,
          actions: note.actions,
          more: Localizer.message('action.more')
        });
        fragment.appendChild(div);
      }
    });

    const container = document.getElementById('notes');
    while (container.hasChildNodes()) {
      container.removeChild(container.lastChild);
    }
    document.getElementById('notes').appendChild(fragment);

    Array.from(document.getElementsByClassName('more')).forEach(element => {
      element.addEventListener('click', () => {
        this.information(notes[element.dataset.note]);
      });
    });

    return Promise.resolve({
      amount,
      average: new Date(average / amount)
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
    return this.notes.find(note => {
      return note.id === id;
    });
  }

  /**
    * Reload the notes because another event happened like a changed filter
    *
    * @function
    * @returns {Promise}
    */
  reload() {
    return this.show(this.notes);
  }

  /**
    * Reverse the order of all notes and sort them before
    * to make sure they are in the right order
    *
    * @function
    * @returns {Promise}
    */
  reverse() {
    this.notes.sort((a, b) => {
      return a.id - b.id;
    });
    if (document.getElementById('sort-order').checked === true) {
      this.notes.reverse();
    }

    return this.show(this.notes);
  }

  /**
    * Show some details of the note in a modal dialog
    * e.g. it shows the position on a map
    *
    * @function
    * @param {Note} note
    * @returns {void}
    */
  information(note) {
    document.getElementById('information').classList.add('active');

    const map = new Leaflet('information-map');
    map.removeLayers();
    map.marker(note.coordinates);
    map.setView(note.coordinates, 14);
  }
}
