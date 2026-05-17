import template from '../../templates/dynamic/note.hbs';

export default class ListView {
  constructor() {
    this.fragment = new DocumentFragment();
    this.divs = new Map();
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
    this.divs.set(note.id, div);
  }

  /**
    * Update a single note (changes the content of the card)
    *
    * @param {Note} note
    */
  update(note) {
    this.divs.get(note.id).innerHTML = template(note, {
      allowedProtoProperties: {
        actions: true,
        badges: true
      }
    });
  }

  /**
   * Show a note in the list of results (again)
   *
   * @param {Number} id
   */
  show(id) {
    this.divs.get(id).classList.remove('d-hide');
  }

  /**
    * Hide a note from the list of results
    *
    * @param {Number} id
    */
  hide(id) {
    this.divs.get(id).classList.add('d-hide');
  }

  /**
    * Show all notes in the list
    *
    * @function
    * @returns {void}
    */
  apply() {
    const container = document.getElementById('list');
    container.replaceChildren(this.fragment);
  }

  /**
    * Remove all notes from the list
    *
    * @function
    * @returns {void}
    */
  removeAll() {
    const container = document.getElementById('list');
    container.replaceChildren();
  }
}
