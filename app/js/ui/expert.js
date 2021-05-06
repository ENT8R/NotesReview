import UI from './ui.js';
import * as Util from '../util.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/note.hbs?raw';
const template = Handlebars.compile(t);

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

    let amount = 0;
    let average = 0;

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
      if (Util.isNoteVisible(note, query)) {
        amount++;
        average += note.created.getTime();

        const div = document.createElement('div');
        div.classList.add('column', 'col-4', 'col-md-6', 'col-sm-12', 'p-1');
        div.innerHTML = template({
          expert: true,
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
