export default class SingleSelectionButtonGroup extends HTMLElement {
  // Identify the element as a form-associated custom element
  static get formAssociated() {
    return true;
  }

  /* eslint-disable no-useless-constructor */
  constructor() {
    super();
    // TODO: This is not yet supported across major browsers: chrome >= 77, no firefox, edge >= 79, no safari, opera >= 64, no ie
    // See https://web.dev/more-capable-form-controls/#restoring-form-state
    this._internals = 'attachInternals' in this ? this.attachInternals() : null;
  }

  connectedCallback() {
    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        this.value = button.dataset.value || null;
      });
    });
    this.value = this.querySelector('button.active').dataset.value || null;
  }

  formStateRestoreCallback(state) {
    this.value = state;
  }

  get value() {
    return this._v;
  }

  set value(v) {
    // Reset the currently active button
    this.querySelector('button.active').classList.remove('active');

    // Find the next button to select
    const selector = v === null ? 'button:not([data-value])' : `button[data-value="${v}"]`;
    const button = this.querySelector(selector);
    button.classList.add('active');

    // Set the new value and fire events
    this._v = v;
    this._internals ? this._internals.setFormValue(this._v) : null; // eslint-disable-line no-unused-expressions
    this.dispatchEvent(new Event('change'));
    this.dispatchEvent(new Event('input'));
  }
}
