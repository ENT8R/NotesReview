/* global require */

const Mustache = require('mustache');
const htmlMinify = require('html-minifier').minify;
const fs = require('fs');

const version = '1.2.0';

const files = [
  'index',
  'expert'
];

const templates = {
  index: fs.readFileSync('./templates/index.mst', 'utf8'),
  expert: fs.readFileSync('./templates/expert.mst', 'utf8')
};

const partials = {
  'modals': fs.readFileSync('./includes/modals.mst', 'utf8'),
  'nav': fs.readFileSync('./includes/nav.mst', 'utf8'),
  'head': fs.readFileSync('./includes/head.mst', 'utf8')
};

for (let i = 0; i < files.length; i++) {
  const name = files[i];
  let template = name;

  const values = {};
  values[name] = true;
  values.map = (name === 'index');
  values.version = `NotesReview ${version}`;

  const rendered = htmlMinify(Mustache.to_html(templates[template], values, partials), {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true
  });

  const indexPath = './index.html';
  const expertPath = './expert/index.html';
  let path = (name === 'index') ? indexPath : expertPath;

  fs.writeFile(path, rendered, (err) => {
    if (err) {
      return console.log(err); // eslint-disable-line no-console
    }
    return console.log(`${path} was saved!`); // eslint-disable-line no-console
  });
}
