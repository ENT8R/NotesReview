import UI from './ui.js';
import * as Util from '../util.js';

import template from '../../templates/note.mst';

export default class Expert extends UI {
  /**
    * Show all notes in a list as cards
    *
    * @function
    * @param {Array} notes
    * @param {Query} query
    * @returns {Promise}
    */
  show(notes, query) {
    this.notes = notes;
    this.query = query;

    if (notes.length === 0) {
      return Promise.resolve();
    }

    const ids = [];
    let amount = 0;
    let average = 0;

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
      // TODO: the second check can be removed once https://github.com/openstreetmap/openstreetmap-website/pull/2381 is merged
      if (Util.isNoteVisible(note, query.api) && !ids.includes(note.id)) {
        ids.push(note.id);
        amount++;
        average += note.created.getTime();

        const div = document.createElement('div');
        div.classList.add('column', 'col-4', 'col-md-6', 'col-sm-12', 'p-1');
        div.innerHTML = template({
          list: true,
          id: note.id,
          badges: note.badges,
          comment: note.comments[0].html,
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

    return Promise.resolve({
      amount,
      average: new Date(average / amount)
    });
  }
}
