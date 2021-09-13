import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/note.hbs?raw';
const template = Handlebars.compile(t);

export default class List {
  constructor() {
    this.fragment = new DocumentFragment();
  }

  /**
    * Add a note to the list as a card
    *
    * @function
    * @param {Note} note
    * @returns {Promise}
    */
  add(note) {
    const div = document.createElement('div');
    div.classList.add('column', 'col-4', 'col-md-6', 'col-sm-12', 'p-1');
    div.innerHTML = template(note, {
      allowedProtoProperties: {
        actions: true,
        badges: true
      }
    });
    this.fragment.appendChild(div);
  }

  /**
    * Shows all notes
    *
    * @function
    * @todo Use {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment/replaceChildren} if this becomes more established
    * @returns {void}
    */
  apply() {
    const container = document.getElementById('list');
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    document.getElementById('list').appendChild(this.fragment);
  }
}
