export const MAPS = 'map';
export const EXPERT = 'expert';

/**
  * Return the current mode which is stored in the HTML document
  *
  * @function
  * @returns {String}
  */
export function get() {
  return document.body.dataset.mode;
}
