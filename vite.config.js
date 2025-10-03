/* eslint-env node */
import { resolve } from 'path';

import dotenv from 'dotenv';

import handlebars from 'vite-plugin-handlebars';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

import { version } from './package.json';
import structuredData from './app/templates/includes/structuredData.json';
structuredData.softwareVersion = version;

export default () => {
  const root = resolve(__dirname, 'app');
  dotenv.config({
    path: resolve(root, '.env'),
    quiet: true
  });

  const globals = {
    __VERSION__: JSON.stringify(version),
    NOTESREVIEW_API_URL: JSON.stringify(process.env.NOTESREVIEW_API_URL),
    OPENSTREETMAP_SERVER: JSON.stringify(process.env.OPENSTREETMAP_SERVER),
    OPENSTREETMAP_OAUTH_CLIENT_ID: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_CLIENT_ID),
    OPENSTREETMAP_OAUTH_CLIENT_SECRET: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_CLIENT_SECRET),
    MAPILLARY_CLIENT_ID: JSON.stringify(process.env.MAPILLARY_CLIENT_ID)
  };

  return {
    base: '/NotesReview/',
    root,
    define: globals,
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            countryCoder: ['@rapideditor/country-coder', '@rapideditor/location-conflation'],
            leaflet: ['leaflet', 'leaflet-control-geocoder', 'leaflet-draw', 'leaflet.markercluster'],
          }
        }
      }
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
          version,
          api: process.env.NOTESREVIEW_API_URL
        }
      }),
      createSvgIconsPlugin({
        iconDirs: [resolve(root, 'svg')],
        symbolId: '[dir]-[name]'
      })
    ]
  };
};
