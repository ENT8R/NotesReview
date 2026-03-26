export default class SingleSelectionButtonGroup extends HTMLElement {
  // Identify the element as a form-associated custom element
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();

    this.activeButton = this.querySelector('button.active');
  }

  connectedCallback() {
    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', this.#onClick.bind(this));
    });
    this.value = this.activeButton.dataset.value || null;
  }

  formStateRestoreCallback(state) {
    this.value = state;
  }

  #onClick(event) {
    this.value = event.target.dataset.value || null;
    this.dispatchEvent(new Event('change'));
    this.dispatchEvent(new Event('input'));
  }

  get value() {
    return this._v;
  }

  set value(v) {
    // Find the next button to select
    const selector = v === null ? 'button:not([data-value])' : `button[data-value="${v}"]`;
    const nextButton = this.querySelector(selector);
    // If the button does not exist, the value can not be selected
    if (nextButton == null) {
      return;
    }

    // Reset the currently active button
    this.activeButton.classList.remove('active');

    // Set the next button to an active state
    this.activeButton = nextButton;
    this.activeButton.classList.add('active');

    // Set the new value internally and update the form value
    this._v = v;
    this._internals.setFormValue(this._v);
  }
}
