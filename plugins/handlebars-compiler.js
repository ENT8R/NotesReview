import fs from 'fs';
import { resolve } from 'path';

import Handlebars from 'handlebars';

import { normalizePath } from 'vite';

/**
 * Vite plugin for (pre-)compiling Handlebars templates into JavaScript modules.
 * Registering partials and global variables are supported as well
 *
 * @param {Object} options
 * @returns {Object}
 */
export default function handlebarsCompiler(options) {
  const __dirname = import.meta.dirname;
  const LOCALIZER_ID = normalizePath(resolve(__dirname, '../app/js/localizer.js'));

  // Precompile all partials and register them in the initialization code, so they are available in all templates
  let compiledPartials = '';
  if ('partials' in options) {
    for (const [name, path] of Object.entries(options.partials)) {
      const template = Handlebars.precompile(fs.readFileSync(path, 'utf-8'));
      compiledPartials += `Handlebars.registerPartial('${name}', Handlebars.template(${template}));\n`;
    }
  }

  // Define the initialization code for the first template, which registers the helpers and global variables.
  // This is only added once to the code, so all helpers and globals are available in
  // the subsequent templates without registering them multiple times.
  let initialized = false;
  const init = `
    import * as Localizer from '${LOCALIZER_ID}';

    Handlebars.registerHelper('localizer', (key, ...strings) => {
    return Localizer.message(key, ...strings);
    });

    const GLOBALS = ${JSON.stringify('globals' in options ? options.globals : {})};
    Handlebars.registerHelper('globals', key => {
    return key in GLOBALS ? GLOBALS[key] : '';
    });

    Handlebars.registerHelper('eq', (a, b) => a === b);

    ${compiledPartials}
  `;

  return {
    name: 'handlebars-compiler',
    transform: {
      filter: {
        id: /\.hbs$/,
      },
      handler(src, id) {
        // Compile the template with all helpers that were defined above
        const template = Handlebars.precompile(src, {
          knownHelpers: {
            globals: true,
            localizer: true,
            eq: true
          },
          knownHelpersOnly: true,
        });

        const compiled = `
          import Handlebars from 'handlebars/runtime';
          ${initialized ? '' : init}

          export default Handlebars.template(${template});
        `;

        if (!initialized) {
          initialized = true;
        }

        return {
          code: compiled,
          map: null,
        };
      },
    },
  };
};
