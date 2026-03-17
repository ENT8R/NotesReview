/* global process */
import { resolve } from 'path';

import dotenv from 'dotenv';

import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import handlebars from 'vite-plugin-handlebars';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

import pkg from './package.json' with { type: 'json' };
import structuredData from './app/templates/includes/structuredData.json' with { type: 'json' };
structuredData.softwareVersion = pkg.version;

export default () => {
  const __dirname = import.meta.dirname;
  const root = resolve(__dirname, 'app');
  dotenv.config({
    path: resolve(root, '.env'),
    quiet: true
  });

  const globals = {
    __VERSION__: JSON.stringify(pkg.version),
    NOTESREVIEW_API_URL: JSON.stringify(process.env.NOTESREVIEW_API_URL),
    OPENSTREETMAP_SERVER: JSON.stringify(process.env.OPENSTREETMAP_SERVER),
    OPENSTREETMAP_OAUTH_CLIENT_ID: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_CLIENT_ID),
    OPENSTREETMAP_OAUTH_CLIENT_SECRET: JSON.stringify(process.env.OPENSTREETMAP_OAUTH_CLIENT_SECRET),
    MAPILLARY_CLIENT_ID: JSON.stringify(process.env.MAPILLARY_CLIENT_ID)
  };

  return defineConfig({
    base: '/',
    root,
    define: globals,
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{
              test: /node_modules\/@rapideditor\/country-coder/,
              name: 'country-coder',
            }, {
              test: /node_modules\/@rapideditor\/location-conflation/,
              name: 'location-conflation',
            }, {
              test: /node_modules\/leaflet/,
              name: 'leaflet',
            }],
          }
        }
      }
    },
    plugins: [
      basicSsl(),
      handlebars({
        partialDirectory: [
          resolve(root, 'templates'),
          resolve(root, 'templates/includes'),
          resolve(root, 'templates/modals')
        ],
        context: {
          structuredData: JSON.stringify(structuredData),
          version: pkg.version,
          api: process.env.NOTESREVIEW_API_URL
        }
      }),
      createSvgIconsPlugin({
        iconDirs: [resolve(root, 'svg')],
        symbolId: '[dir]-[name]'
      })
    ]
  });
};
