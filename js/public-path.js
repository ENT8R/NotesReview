import * as Mode from './mode.js';

// https://webpack.js.org/guides/public-path/#on-the-fly
__webpack_public_path__ = Mode.get() === Mode.MAPS ? 'dist/' : '../dist/'; // eslint-disable-line camelcase, no-undef
