const mustache = require('mustache');
const { minify } = require('html-minifier');
const fs = require('fs');

const COLORS = require('./assets/colors.json');

const VERSION = require('./package.json').version;
const STRUCTURED_DATA = require('./src/templates/includes/structuredData.json');
STRUCTURED_DATA.softwareVersion = VERSION;

/**
  * Generate static HTML pages using Mustache as a templating system
  *
  * @function
  * @private
  * @returns {void}
  */
function html() {
  const template = fs.readFileSync('./src/templates/index.mst', 'utf8');
  const partials = {
    head: fs.readFileSync('./src/templates/includes/head.mst', 'utf8'),
    header: fs.readFileSync('./src/templates/includes/header.mst', 'utf8'),
    modals: fs.readFileSync('./src/templates/includes/modals.mst', 'utf8'),
    nav: fs.readFileSync('./src/templates/includes/nav.mst', 'utf8'),
    scripts: fs.readFileSync('./src/templates/includes/scripts.mst', 'utf8'),
    structuredData: JSON.stringify(STRUCTURED_DATA)
  };

  [ 'map', 'expert' ].forEach(file => {
    const rendered = minify(mustache.render(template, {
      version: VERSION,
      [file]: true,
      mode: file
    }, partials), {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true
    });

    const path = file === 'map' ? './index.html' : './expert/index.html';
    fs.writeFile(path, rendered, error => {
      return error ? console.log(error) : console.log(`${path} was saved!`);
    });
  });
}

/**
  * Generate SVG markers which are used to indicate the age of the notes
  * The original marker template is based on Leaflet's default markers
  * (see {@link https://github.com/Leaflet/Leaflet/blob/master/src/images/marker.svg})
  *
  * @function
  * @private
  * @returns {void}
  */
function markers() {
  const template = fs.readFileSync('./assets/markers/template.svg', 'utf8');

  for (const [name, properties] of Object.entries(COLORS)) {
    const rendered = mustache.render(template, properties);

    const path = `./assets/markers/${name}.svg`;
    fs.writeFile(path, rendered, error => {
      return error ? console.log(error) : console.log(`${path} was saved!`);
    });
  }
}

html();
markers();
