import * as Localizer from '../localizer.js';
import Modal from './modal.js';

import * as Handlebars from 'handlebars';
import t from '../../templates/dynamic/comment.hbs?raw';
const template = Handlebars.compile(t);
Handlebars.registerHelper('localizer', key => {
  return Localizer.message(key);
});

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
        badges: true
      }
    });
    content.dataset.noteId = note.id;
    document.getElementById('modal-comments-note-link').href = `${OPENSTREETMAP_SERVER}/note/${note.id}`;

    // Clear the note input
    const input = content.querySelector('.note-comment');
    input.value = '';
    input.dispatchEvent(new Event('input'));

    // Show different actions depending on the status of the note
    document.querySelector('.comment-action[data-action="comment"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="close"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="reopen"]').style.display = note.status === 'closed' ? 'block' : 'none';
  }
}
