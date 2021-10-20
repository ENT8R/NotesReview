// chrome >= 66, edge >= 16, firefox >= 57, not ie <= 11, opera >= 53, safari >= 11.1
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

// Needed because of https://github.com/handlebars-lang/handlebars.js/pull/1692
window.global = window;
