import UI from './ui.js';
import * as Util from '../util.js';

import card from '../../templates/notes/card.mst';

export default class Expert extends UI {
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

    const ids = [];
    let amount = 0;
    let average = 0;

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
      note.visible = Util.isNoteVisible(note);

      // TODO: the second check can be removed once https://github.com/openstreetmap/openstreetmap-website/pull/2381 is merged
      if (note.visible && !ids.includes(note.id)) {
        ids.push(note.id);
        amount++;
        average += note.date.getTime();

        const div = document.createElement('div');
        div.classList.add('column', 'col-4', 'col-md-6', 'col-sm-12', 'p-1');
        div.innerHTML = card({
          id: note.id,
          badges: note.badges,
          comment: note.comment.html,
          actions: note.actions
        });
        fragment.appendChild(div);
      }
    });

    const container = document.getElementById('notes');
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    document.getElementById('notes').appendChild(fragment);

    document.getElementsByClassName('more').forEach(element => {
      element.addEventListener('click', () => {
        this.information(notes[element.dataset.note]);
      });
    });

    return Promise.resolve({
      amount,
      average: new Date(average / amount)
    });
  }
}
