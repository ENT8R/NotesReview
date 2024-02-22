import * as Localizer from '../localizer.js';
import Modal from './modal.js';
import Toast from '../toast.js';

export default class Share extends Modal {
  /**
    * Initializes the sharing modal
    *
    * @constructor
    * @param {Query} query
    * @returns {void}
    */
  constructor(query) {
    super();

    // Update links if the share modal is opened
    document.querySelector('.modal[data-modal="share"]').addEventListener('modal-open', () => {
      document.getElementById('permalink').value = query.permalink;

      document.getElementById('download').href = URL.createObjectURL(new Blob([JSON.stringify(query.result, null, 2)], {
        type: 'application/json',
      }));
      document.getElementById('download').download = `NotesReview-${query.history[query.history.length - 1].time.toISOString()}.json`;
    });

    // Update links if a parameter changed
    Array.from(document.getElementsByClassName('update-permalink')).forEach(element => {
      element.addEventListener('change', () => {
        document.getElementById('permalink').value = query.permalink;
      });
    });

    document.getElementById('permalink').addEventListener('click', document.getElementById('permalink').select);
    document.getElementById('permalink').addEventListener('dblclick', () => this.copy());
    document.getElementById('permalink-copy').addEventListener('click', () => this.copy());

    // Free memory if the share modal is closed
    document.querySelector('.modal[data-modal="share"]').addEventListener('modal-close', () => {
      URL.revokeObjectURL(document.getElementById('download').href);
    });
  }

  /**
    * Copy permalink to clipboard
    *
    * @function
    * @returns {void}
    */
  copy() {
    document.getElementById('permalink').select();
    document.execCommand('copy');
    new Toast(Localizer.message('action.copyLinkSuccess'), 'toast-success').show();
  }
}
