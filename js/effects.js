/**
  * Toggle the display style to either hide or show an element.
  *
  * @function
  * @param {HTMLElement} element
  * @returns {void}
  */
export function toggleDisplay(element) {
  const { display } = (window.getComputedStyle ? getComputedStyle(element, null) : element.currentStyle);
  if (display === 'none') {
    element.classList.remove('d-hide');
  } else {
    element.classList.add('d-hide');
  }
}

/**
  * Toggle the visibility of a preloader element.
  *
  * @function
  * @param {HTMLElement} element
  * @returns {void}
  */
export function toggleVisibility(element) {
  const { visibility } = (window.getComputedStyle ? getComputedStyle(element, null) : element.currentStyle);
  if (visibility === 'hidden') {
    element.classList.remove('d-invisible');
  } else {
    element.classList.add('d-invisible');
  }
}

/**
  * Fade an element from the current state to full opacity in a given time.
  *
  * @function
  * @param {HTMLElement} element
  * @param {Number} duration Time in milliseconds.
  * @returns {Promise}
  */
export function fadeOut(element, duration) {
  return new Promise(resolve => {
    const step = 25 / (duration || 300);
    element.style.opacity = element.style.opacity || 1;
    (function fade() {
      const opacity = element.style.opacity -= step;
      if (opacity < 0) {
        element.style.display = 'none';
        return resolve();
      } else {
        setTimeout(fade, 25);
      }
    })();
  });
}

/**
  * Fade out an element from the current state to full transparency in a given time
  *
  * @function
  * @param {HTMLElement} element
  * @param {Number} duration Time in milliseconds.
  * @param {String} display Display style of the element after the animation.
  * @returns {Promise}
  */
export function fadeIn(element, duration, display) {
  return new Promise(resolve => {
    const step = 25 / (duration || 300);
    element.style.opacity = element.style.opacity || 0;
    element.style.display = display || 'block';
    (function fade() {
      const opacity = parseFloat(element.style.opacity) + step;
      element.style.opacity = opacity;
      if (opacity > 1) {
        element.style.opacity = 1;
        return resolve();
      } else {
        setTimeout(fade, 25);
      }
    })();
  });
}
