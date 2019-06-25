const mustache = require('mustache');
const { minify } = require('html-minifier');
const fs = require('fs');

const VERSION = require('./package.json').version;

const files = [
  'index',
  'expert'
];

const templates = {
  index: fs.readFileSync('./templates/index.mst', 'utf8'),
  expert: fs.readFileSync('./templates/expert.mst', 'utf8')
};

const partials = {
  head: fs.readFileSync('./includes/head.mst', 'utf8'),
  modals: fs.readFileSync('./includes/modals.mst', 'utf8'),
  nav: fs.readFileSync('./includes/nav.mst', 'utf8'),
  scripts: fs.readFileSync('./includes/scripts.mst', 'utf8')
};

for (let i = 0; i < files.length; i++) {
  const name = files[i];
  const template = name;

  const values = {
    version: VERSION,
    map: (name === 'index')
  };
  values[name] = true;

  const rendered = minify(mustache.to_html(templates[template], values, partials), {
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
  const path = (name === 'index') ? indexPath : expertPath;

  fs.writeFile(path, rendered, (err) => {
    if (err) {
      return console.log(err); // eslint-disable-line no-console
    }
    return console.log(`${path} was saved!`); // eslint-disable-line no-console
  });
}
