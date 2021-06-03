// chrome >= 66, edge >= 16, firefox >= 57, not ie <= 11, opera >= 53, safari >= 11.1
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

/* chrome >= 51, edge >= 16, firefox >= 50, not ie <= 11, opera >= 38, safari >= 10.1 (Only for NodeList)
 * Also allows to iterate over HTMLCollection which is what is mostly needed in this project
 * This is especially useful for the results of document.getElementsByClassName() and document.children
 * https://github.com/zloirock/core-js#iterable-dom-collections */
import 'core-js/stable/dom-collections/for-each';

// Needed because of https://github.com/handlebars-lang/handlebars.js/pull/1692
window.global = window;
