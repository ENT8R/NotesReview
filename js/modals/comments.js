import Modal from './modal.js';

import template from '../../templates/modals/comment.mst';

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

    document.getElementById('comments').innerHTML = template(note);
    document.getElementById('comments').dataset.noteId = note.id;
    document.getElementById('note-link').href = `${OPENSTREETMAP_SERVER}/note/${note.id}`;

    // Clear the note input
    document.getElementById('note-comment').value = '';
    document.getElementById('note-comment').dispatchEvent(new Event('input'));

    // Show different actions depending on the status of the note
    document.querySelector('.comment-action[data-action="comment"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="close"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="reopen"]').style.display = note.status === 'closed' ? 'block' : 'none';
  }
}
