import * as Localizer from './localizer.js';
import Toast from './toast.js';

export default class Permalink {
  /**
    * Initializes the permalink handler
    *
    * @constructor
    * @param {Query} query
    * @returns {void}
    */
  constructor(query) {
    // Update the permalink if the share modal is opened
    document.querySelector('.modal[data-modal="share"]').addEventListener('modal-open', () => {
      document.getElementById('permalink').value = query.permalink();
    });

    // Update the permalink if a parameter changed
    document.getElementsByClassName('update-permalink').forEach(element => {
      element.addEventListener('change', () => {
        document.getElementById('permalink').value = query.permalink();
      });
    });

    document.getElementById('permalink').addEventListener('click', document.getElementById('permalink').select);
    document.getElementById('permalink').addEventListener('dblclick', () => this.copy());
    document.getElementById('permalink-copy').addEventListener('click', () => this.copy());
  }

  /**
    * Copy the permalink to the clipboard
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
