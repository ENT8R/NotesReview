import * as Localizer from './localizer.js';
import { wait, waitForFocus } from './util.js';

export default class Toast {
  static DURATION_SHORT = 2000;
  static DURATION_DEFAULT = 4000;
  static DURATION_LONG = 8000;

  static TYPE_PRIMARY = 'toast-primary';
  static TYPE_SUCCESS = 'toast-success';
  static TYPE_WARNING = 'toast-warning';
  static TYPE_ERROR = 'toast-error';

  /**
    * Initialize a small toast notification with the given message
    *
    * @constructor
    * @param {String} message
    * @param {String} type
    * @param {Boolean} cancelable
    */
  constructor(message, type, cancelable=true) {
    this.container = document.getElementById('toast-container');

    this.toast = document.createElement('div');
    this.toast.classList.add('toast', type || this.TYPE_PRIMARY, 'text-pre');

    // Add the message of the toast
    this.toast.appendChild(document.createTextNode(message));

    // Add a close button
    if (cancelable) {
      this.close = document.createElement('button');
      this.close.classList.add('btn', 'btn-clear', 'float-right');
      this.close.setAttribute('aria-label', Localizer.message('accessibility.closeNotification'));
      this.close.addEventListener('click', () => {
        this.container.removeChild(this.toast);
      });
      this.toast.appendChild(this.close);
    }

    // Add a group for user-defined actions
    this.actions = document.createElement('div');
    this.actions.classList.add('flex-center-items');
    this.toast.appendChild(this.actions);
  }

  /**
   * Add a custom action
   *
   * @param {String} message
   * @param {String} icon
   * @param {Function} callback
   * @returns {Toast}
   */
  addAction(message, icon, callback) {
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'w-100');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon', 'icon-small');
    svg.innerHTML = `<use xlink:href="#svg-${icon}"></use>`;
    button.appendChild(svg);

    button.appendChild(document.createTextNode(message));
    button.addEventListener('click', event => callback(event, this));
    this.actions.appendChild(button);

    return this;
  }

  /**
    * Show the toast notification
    *
    * @constructor
    * @param {Number} duration
    * @returns {Toast}
    */
  async show(duration) {
    this.container.appendChild(this.toast);
    await waitForFocus();
    await wait(duration || Toast.DURATION_DEFAULT);
    this.hide();
    return this;
  }

  /**
    * Hide the toast notification
    *
    * @constructor
    * @returns {Toast}
    */
  hide() {
    if (this.container.contains(this.toast)) {
      this.container.removeChild(this.toast);
    }
    return this;
  }
}
