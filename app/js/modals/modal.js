export default class Modal {
  /**
    * Initialize the modal open and close triggers
    *
    * @function
    * @private
    * @returns {void}
    */
  static init() {
    document.getElementsByClassName('modal-trigger').forEach(element => {
      element.addEventListener('click', () => {
        Modal.open(element.dataset.modal);
      });
    });

    document.getElementsByClassName('modal-close').forEach(element => {
      element.addEventListener('click', event => {
        Modal.close(event.target.closest('.modal'));
      });
    });
  }

  /**
    * Open a modal by its identifier
    *
    * @function
    * @param {String} id
    * @returns {void}
    */
  static open(id) {
    const modal = document.querySelector(`.modal[data-modal="${id}"]`);
    modal.classList.add('active');
    modal.getElementsByClassName('modal-body')[0].scrollTop = 0;
    modal.dispatchEvent(new Event('modal-open'));
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
  }
}
