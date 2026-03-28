import template from '../../templates/dynamic/note.hbs';

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
    div.classList.add('column', 'col-3', 'col-xl-4', 'col-md-6', 'col-sm-12', 'p-1');
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
    * @returns {void}
    */
  apply() {
    const container = document.getElementById('list');
    container.replaceChildren(this.fragment);
  }
}
