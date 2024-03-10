import { wait, waitForFocus } from './util.js';

export default class Toast {
  static DURATION_SHORT = 2000;
  static DURATION_DEFAULT = 4000;
  static DURATION_LONG = 8000;

  /**
    * Initialize a small toast notification with the given message
    *
    * @constructor
    * @param {String} message
    * @param {String} type
    */
  constructor(message, type) {
    this.container = document.getElementById('toast-container');

    this.toast = document.createElement('div');
    this.toast.classList.add('toast', type || 'toast-primary');

    // Add a close button
    this.close = document.createElement('button');
    this.close.classList.add('btn', 'btn-clear', 'float-right');
    this.close.addEventListener('click', () => {
      this.container.removeChild(this.toast);
    });
    this.toast.appendChild(this.close);

    // Add the message of the toast
    this.toast.appendChild(document.createTextNode(message));
  }

  /**
    * Show the toast notification
    *
    * @constructor
    * @param {Number} duration
    */
  async show(duration) {
    this.container.appendChild(this.toast);
    await waitForFocus();
    await wait(duration || Toast.DURATION_DEFAULT);
    if (this.container.contains(this.toast)) {
      this.container.removeChild(this.toast);
    }
  }
}
