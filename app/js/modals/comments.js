import Modal from './modal.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/comment.hbs?raw';
const template = Handlebars.compile(t);

export default class Comments extends Modal {
  /**
    * Show all comments of a given note in a modal
    *
    * @function
    * @private
    * @param {Note} note
    * @returns {void}
    */
  static load(note) {
    super.open('comments');

    const content = document.getElementById('modal-comments-content');
    content.innerHTML = template(note, {
      allowedProtoProperties: {
        // Explicitly disable the access to the actions property,
        // because the actions should not be shown (again) in the comments modal
        actions: false,
        badges: true
      }
    });
    content.dataset.noteId = note.id;
    document.getElementById('modal-comments-note-link').href = `${OPENSTREETMAP_SERVER}/note/${note.id}`;

    // Clear the note input
    const input = content.querySelector('.note-comment');
    input.value = '';
    input.dispatchEvent(new Event('input'));
  }
}
