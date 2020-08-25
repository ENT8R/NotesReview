/**
  * This file was modified from {@link https://github.com/TinyWebEx/Localizer/blob/master/Localizer.js} by @rugk
  */

const I18N_ATTRIBUTE = 'data-i18n';
const I18N_DATASET = 'i18n';

const LANGUAGE = navigator.language.split('-')[0] || navigator.userLanguage.split('-')[0];
const FALLBACK_LANGUAGE = 'en';

const STRINGS = {
  main: null,
  fallback: null
};

/**
  * Replace the content of a HTMLElement with the localized string
  *
  * @function
  * @param {HTMLElement} element
  * @param {String} tag
  * @returns {void}
  */
function replaceI18n(element, tag) {
  // Localize main content
  if (tag !== '') {
    replaceWith(element, null, message(tag));
  }

  // Localize attributes
  for (const [attribute, value] of Object.entries(element.dataset)) {
    if (attribute.substring(0, I18N_DATASET.length) !== I18N_DATASET || attribute === I18N_DATASET) {
      continue;
    }

    const replaceAttribute = convertDatasetToAttribute(attribute.slice(I18N_DATASET.length));
    replaceWith(element, replaceAttribute, message(value));
  }
}

/**
 * Converts a dataset value back to a real attribute.
 *
 * @private
 * @param  {String} dataSetValue
 * @returns {String}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#Name_conversion}
 */
function convertDatasetToAttribute(dataSetValue) {
  // if beginning of string is capital letter, only lowercase that
  /** {@link https://regex101.com/r/GaVoVi/1} **/
  dataSetValue = dataSetValue.replace(/^[A-Z]/, (char) => char.toLowerCase());

  // replace all other capital letters with dash in front of them
  /** {@link https://regex101.com/r/GaVoVi/3} **/
  dataSetValue = dataSetValue.replace(/[A-Z]/, (char) => {
    return `-${char.toLowerCase()}`;
  });

  return dataSetValue;
}

/**
 * Replaces attribute or inner text of a specified element with a string.
 *
 * @private
 * @param  {HTMLElement} element
 * @param  {String} attribute
 * @param  {String} translatedMessage
 * @returns {void}
 */
function replaceWith(element, attribute, translatedMessage) {
  if (!translatedMessage) {
    return;
  }

  const isHTML = translatedMessage.substring(0, 6) === '!HTML!';
  if (isHTML) {
    translatedMessage = translatedMessage.replace(/^!HTML!(\s+)?/, '');
  }

  if (attribute) {
    element.setAttribute(attribute, translatedMessage);
  } else {
    if (translatedMessage !== '') {
      if (isHTML) {
        element.innerHTML = translatedMessage;
      } else {
        element.textContent = translatedMessage;
      }
    }
  }
}

/**
  * Get the correct value of a given tag and optionally format the string to add dynamic data
  *
  * @function
  * @param {String} tag
  * @param {String} string
  * @returns {String}
  */
export function message(tag, string) {
  let value = STRINGS.main === null ? null : getProperty(tag, STRINGS.main);
  if (!value || (typeof value !== 'string')) {
    value = getProperty(tag, STRINGS.fallback);
  }
  if (!value || (typeof value !== 'string')) {
    return console.error( // eslint-disable-line no-console
      new Error(`String with the tag ${tag} could not be found in "${LANGUAGE}.json" and "${FALLBACK_LANGUAGE}.json"`)
    );
  }

  if (typeof string !== 'undefined' && typeof value === 'string') {
    return value.replace('%s', string);
  }

  if (typeof value === 'string') {
    // Replace values which can not be included in the hardcoded string
    return value.replace('{{version}}', VERSION).trim();
  } else {
    return value;
  }
}

/**
  * Get a value from a object using a string in the dot notation (e.g. 'action.cancel')
  *
  * @function
  * @param {String} propertyName
  * @param {Object} translations Translations in the right language
  * @returns {String}
  */
function getProperty(propertyName, translations) {
  const parts = propertyName.split('.');
  let property = translations;
  for (let i = 0; i < parts.length; i++) {
    if (typeof property[parts[i]] !== 'undefined') {
      property = property[parts[i]];
    }
  }
  return property;
}

/**
  * Localize all strings in a given container
  *
  * @function
  * @param {HTMLElement} container
  * @returns {void}
  */
export function localize(container) {
  container.querySelectorAll(`[${I18N_ATTRIBUTE}]`).forEach(element => {
    const string = element.dataset[I18N_DATASET];
    replaceI18n(element, string);
  });
}

/**
  * Start the localization process
  *
  * @function
  * @returns {Promise}
  */
export async function init() {
  try {
    const { default: main } = await import(/* webpackChunkName: "locales/[request]" */ `../locales/${LANGUAGE}`);
    STRINGS.main = main;
  } catch (error) {
    console.error( // eslint-disable-line no-console
      new Error(`${LANGUAGE}.json does not exist, ${FALLBACK_LANGUAGE}.json is used instead`)
    );
  }

  const { default: fallback } = await import(/* webpackChunkName: "locales/[request]" */ `../locales/${FALLBACK_LANGUAGE}`);
  STRINGS.fallback = fallback;

  localize(document.body);

  // Replace html lang attribute after translation
  document.querySelector('html').setAttribute('lang', LANGUAGE);

  /* Polyfill for Intl.RelativeTimeFormat
   * chrome >= 71, not edge all, firefox >= 65, not ie <= 11, opera >= 58, not safari all
   */
  if (!('Intl' in window) || !('RelativeTimeFormat' in window.Intl)) {
    let locale;
    switch (LANGUAGE) {
    case 'de':
      locale = await import(/* webpackChunkName: "relative-time-format/de" */ 'relative-time-format/locale/de');
      break;
    case 'es':
      locale = await import(/* webpackChunkName: "relative-time-format/es" */ 'relative-time-format/locale/es');
      break;
    case 'fr':
      locale = await import(/* webpackChunkName: "relative-time-format/fr" */ 'relative-time-format/locale/fr');
      break;
    case 'it':
      locale = await import(/* webpackChunkName: "relative-time-format/it" */ 'relative-time-format/locale/it');
      break;
    case 'pt':
      locale = await import(/* webpackChunkName: "relative-time-format/pt" */ 'relative-time-format/locale/pt');
      break;
    default:
      locale = await import(/* webpackChunkName: "relative-time-format/en" */ 'relative-time-format/locale/en');
    }

    const { default: RelativeTimeFormat } = await import(/* webpackChunkName: "relative-time-format" */ 'relative-time-format');
    RelativeTimeFormat.addLocale(locale.default);

    if (!('Intl' in window)) {
      window.Intl = {};
    }
    window.Intl.RelativeTimeFormat = RelativeTimeFormat;
  }

  return Promise.resolve();
}
