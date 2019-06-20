export const MAPS = 'maps';
export const EXPERT = 'expert';

/**
  * Return the current mode which is stored in the HTML document
  *
  * @function
  * @returns {String}
  */
export function get() {
  return document.querySelector('body').dataset.mode;
}
