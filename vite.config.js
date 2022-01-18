/* eslint-env node */
import { resolve } from 'path';

import dotenv from 'dotenv';

import handlebars from 'vite-plugin-handlebars';
import svg from 'vite-plugin-svg-icons';

import { version } from './package.json';
import structuredData from './app/templates/includes/structuredData.json';
structuredData.softwareVersion = version;

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
    MAPILLARY_CLIENT_ID: JSON.stringify(process.env.MAPILLARY_CLIENT_ID)
  };

  return {
    base: '/NotesReview/',
    root,
    define: globals,
    build: {
      sourcemap: true
    },
    plugins: [
      handlebars({
        partialDirectory: [
          resolve(root, 'templates'),
          resolve(root, 'templates/includes'),
          resolve(root, 'templates/modals')
        ],
        context: {
          structuredData: JSON.stringify(structuredData),
          version
        }
      }),
      svg({
        iconDirs: [resolve(root, 'svg')],
        symbolId: '[dir]-[name]'
      })
    ]
  };
};
