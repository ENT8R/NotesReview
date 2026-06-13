export default class SingleSelectionButtonGroup extends HTMLElement {
  // Identify the element as a form-associated custom element
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();

    this.currentButton = this.querySelector('button.active');

    // Create a new selection indicator that will be used to highlight the currently selected button
    this.selectionIndicator = document.createElement('div');
    this.selectionIndicator.classList.add('selection-indicator');
    this.prepend(this.selectionIndicator);
  }

  connectedCallback() {
    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', this.#onClick.bind(this));
    });
    this.value = this.currentButton.dataset.value || null;

    // Use a ResizeObserver to update the indicator as well when the button group is resized
    this.resizeObserver = new ResizeObserver(() => {
      this.updateIndicator();
    });
    this.resizeObserver.observe(this);
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
    this.currentButton.classList.remove('active');

    // Set the next button to an active state
    this.currentButton = nextButton;
    this.currentButton.classList.add('active');
    this.updateIndicator();

    // Set the new value internally and update the form value
    this._v = v;
    this._internals.setFormValue(this._v);
  }

  updateIndicator() {
    if (!this.currentButton || this.currentButton.offsetWidth === 0 || this.currentButton.offsetHeight === 0) {
      return;
    }

    this.selectionIndicator.style.left = `${this.currentButton.offsetLeft}px`;
    this.selectionIndicator.style.top = `${this.currentButton.offsetTop}px`;
    this.selectionIndicator.style.width = `${this.currentButton.offsetWidth}px`;
    this.selectionIndicator.style.height = `${this.currentButton.offsetHeight}px`;
  }
}
