import * as Badges from '../badges.js';
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

    const { comments } = note;

    for (let i = 0; i < comments.length; i++) {
      comments[i].badges = {
        age: Badges.age(comments[i].color, comments[i].date),
        user: Badges.user(comments[i].uid, comments[i].anonymous),
        status: Badges.status(comments[i])
      };
    }

    document.getElementById('comments').innerHTML = template({ comments });
    document.getElementById('comments').dataset.noteId = note.id;
    document.getElementById('note-link').href = `${OPENSTREETMAP_SERVER}/note/${note.id}`;

    // Clear the note input
    const input = document.getElementById('note-comment');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();

    // Show different actions depending on the status of the note
    document.querySelector('.comment-action[data-action="comment"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="close"]').style.display = note.status === 'open' ? 'block' : 'none';
    document.querySelector('.comment-action[data-action="reopen"]').style.display = note.status === 'closed' ? 'block' : 'none';
  }
}
