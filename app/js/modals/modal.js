import UI from '../ui/ui.js';

export default class Modal {
  static {
    // Dynamic event listener for opening and closing the modal dialogs,
    // This allows to open a modal dialog by adding the "modal-trigger" class
    // together with a corresponding data attribute to any element in the DOM
    document.addEventListener('click', event => {
      const trigger = event.target.closest('.modal-trigger');
      // Open the modal if a modal trigger button with a corresponding data attribute is clicked
      if (trigger && trigger.dataset.modal) {
        // Additionally check if the modal trigger button is located near a note entry and pass the note id to the modal
        const note = trigger.closest('[data-note-id]');
        const id = note ? Number.parseInt(note.dataset.noteId) : null;
        Modal.open(trigger.dataset.modal, id);
      }

      // Close the modal if a modal close button or the modal background is clicked
      if (event.target.classList.contains('modal-close')) {
        Modal.close(event.target.closest('.modal'));
      }
    });
  }

  /**
    * Initialize the modal and its event listeners for opening and closing the modal
    *
    * @constructor
    * @param {String} id
    */
  constructor(id) {
    this.id = id;
    this.modal = document.querySelector(`.modal[data-modal="${id}"]`);

    if (this.modal == null) {
      throw new Error(`No modal was found in the DOM with the id ${id}`);
    }

    // Listen for the custom event that is dispatched when the modal is opened and
    // load the content of the modal if the event contains the correct id
    this.modal.addEventListener('modal-open', event => {
      if (event.detail.id === id && typeof this.load === 'function') {
        // Check if the modal requires note context and pass the note to the modal if possible
        if (event.detail.note == null) {
          this.load();
        } else {
          const note = UI.get(event.detail.note);
          if (note) {
            this.load(note);
          } else {
            console.error(`Could not find note with id ${event.detail.note} for the ${id} modal!`); // eslint-disable-line no-console
            Modal.close(this.modal);
          }
        }
      }
    });
  }

  /**
   * Load the content of the modal and perform any additional setup when a specific modal is opened.
   * This method will be called with a note as an argument if the modal trigger button is located
   * near an element with data-note-id, otherwise it will be called without any arguments
   *
   * @function
   * @returns {void}
   */
  load() {
    // This method should be implemented by the individual modal dialogs to load the content into the modal
    // and perform any additional setup when the modal is opened
    // throw new Error(`The load method is not implemented for the ${this.id} modal!`);
  }

  /**
    * Open a modal by its identifier and pass additional context information to the modal if available
    *
    * @function
    * @param {String} id
    * @param {Number|null} note
    * @returns {void}
    */
  static open(id, note) {
    const modal = document.querySelector(`.modal[data-modal="${id}"]`);
    modal.classList.add('active');
    modal.getElementsByClassName('modal-body')[0].scrollTop = 0;
    modal.dispatchEvent(new CustomEvent('modal-open', {
      detail: {
        id,
        note
      }
    }));
    document.body.style.overflow = 'hidden';
  }

  /**
    * Close a specified modal
    *
    * @function
    * @param {HTMLElement} modal
    * @returns {void}
    */
  static close(modal) {
    modal.classList.remove('active');
    modal.querySelectorAll('.clear-on-modal-close').forEach(element => element.innerHTML = '');
    modal.dispatchEvent(new Event('modal-close'));
    document.body.style.overflow = '';
  }
}
