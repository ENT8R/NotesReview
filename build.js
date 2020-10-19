const mustache = require('mustache');
const { minify } = require('html-minifier');
const fs = require('fs');

const VERSION = require('./package.json').version;
const STRUCTURED_DATA = require('./includes/structuredData.json');
STRUCTURED_DATA.softwareVersion = VERSION;

const template = fs.readFileSync('./templates/index.mst', 'utf8');

const partials = {
  head: fs.readFileSync('./includes/head.mst', 'utf8'),
  header: fs.readFileSync('./includes/header.mst', 'utf8'),
  modals: fs.readFileSync('./includes/modals.mst', 'utf8'),
  nav: fs.readFileSync('./includes/nav.mst', 'utf8'),
  scripts: fs.readFileSync('./includes/scripts.mst', 'utf8'),
  structuredData: JSON.stringify(STRUCTURED_DATA)
};

const files = [
  'map',
  'expert'
];

files.forEach(file => {
  const values = {
    version: VERSION,
    [file]: true,
    mode: file
  };

  const rendered = minify(mustache.render(template, values, partials), {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true
  });

  const path = file === 'map' ? './index.html' : './expert/index.html';
  fs.writeFile(path, rendered, (error) => {
    return error ? console.log(error) : console.log(`${path} was saved!`);
  });
});
