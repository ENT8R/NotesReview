/* eslint-env node */
import fs from 'fs';
import { resolve } from 'path';

import dotenv from 'dotenv';

import * as Handlebars from 'handlebars';
import handlebars from 'vite-plugin-handlebars';
import svg from 'vite-plugin-svg-icons';

import COLORS from './assets/markers/colors.json';
import { version } from './package.json';
import structuredData from './app/templates/includes/structuredData.json';
structuredData.softwareVersion = version;

/**
  * Generate SVG markers which are used to indicate the age of the notes
  * The original marker template is based on Leaflet's default markers
  * (see {@link https://github.com/Leaflet/Leaflet/blob/master/src/images/marker.svg})
  *
  * @function
  * @todo Implement this function as a plugin
  * @returns {void}
  */
function markers() {
  let template = fs.readFileSync('./assets/markers/template.svg', 'utf8');
  template = Handlebars.compile(template);

  for (const [name, properties] of Object.entries(COLORS)) {
    const rendered = template(properties);

    const path = `./app/public/markers/${name}.svg`;
    fs.writeFile(path, rendered, error => {
      return error ? console.log(error) : console.log(`${path} was saved!`);
    });
  }
}
markers();

export default () => {
  const root = resolve(__dirname, 'app');
  dotenv.config({
    path: resolve(root, '.env')
  });

  const globals = {
    __VERSION__: JSON.stringify(version),
    NOTESREVIEW_API_URL: JSON.stringify(process.env.NOTESREVIEW_API_URL),
    OPENSTREETMAP_SERVER: JSON.stringify(process.env.OPENSTREETMAP_SERVER),
    OPENSTREETMAP_OAUTH_KEY: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_KEY),
    OPENSTREETMAP_OAUTH_SECRET: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_SECRET),
    MAPILLARY_CLIENT_ID: JSON.stringify(process.env.MAPILLARY_CLIENT_ID),
  };

  return {
    base: '/NotesReview/',
    root,
    define: globals,
    plugins: [
      handlebars({
        partialDirectory: [
          resolve(root, 'templates'),
          resolve(root, 'templates/includes'),
          resolve(root, 'templates/modals')
        ],
        context: {
          structuredData: JSON.stringify(structuredData)
        }
      }),
      svg({
        iconDirs: [resolve(root, 'svg')],
        symbolId: '[dir]-[name]'
      })
    ]
  };
};
