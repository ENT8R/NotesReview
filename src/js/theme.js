import Preferences from './preferences.js';

export const LIGHT = 'light';
export const DARK = 'dark';
export const SYSTEM = 'system';

let theme = Preferences.get('theme') || SYSTEM;

const query = window.matchMedia('(prefers-color-scheme: dark)');
document.body.dataset.theme = get();

/**
  * Set the new theme and apply the changes
  *
  * @function
  * @param {String} newTheme
  * @returns {void}
  */
export function set(newTheme) {
  if (newTheme === theme) {
    return;
  }

  theme = newTheme;
  changed();

  if (theme === SYSTEM) {
    query.addListener(changed);
  } else {
    query.removeListener(changed);
  }
}

/**
  * Get the current theme
  *
  * @function
  * @returns {String}
  */
export function get() {
  switch (theme) {
  case LIGHT:
    return LIGHT;
  case DARK:
    return DARK;
  case SYSTEM:
    return query.matches ? DARK : LIGHT;
  default:
    return LIGHT;
  }
}

/**
  * Listener function which is called when the theme changed
  *
  * @function
  * @returns {void}
  */
function changed() {
  document.body.dataset.theme = get();
  document.dispatchEvent(new Event('color-scheme-changed'));
}
