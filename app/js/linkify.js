import linkify from 'linkify-string';

import Preferences from './preferences.js';
import * as Util from './util.js';

const IMAGE_HOSTING_REGEX = {
  imgur: /^(?:https?:\/\/)?(?:i\.)?imgur\.com\.?\/\w+\.(?:jpe?g|png|webp)/i,
  westnordost: /^https:\/\/westnordost\.de\.?\/p\/[0-9]+\.jpg/i,
  streetcomplete: /^https:\/\/streetcomplete\.app\.?\/p\/[0-9]+\.jpg/i,
  wikimedia: /^(?:https?:\/\/)?upload\.wikimedia\.org\.?\/wikipedia\/([^/]+)\/(?:thumb\/)?(([0-9a-fA-F])\/\3[0-9a-fA-F])\/(?<file>[\w\-%.]+?\.(?:jpe?g|png|webp))(?:\/[0-9]{3,}px-\k<file>(?:\.(?:jpe?g|png|webp))?)?/i,
  commons: /^(?:https?:\/\/)?commons\.(?:m\.)?wikimedia\.org\.?\/wiki\/File:(?<file>[\w\-%.(),:]+?\.(?:jpe?g|png|svg|webp))/i,
  openstreetmap: /^(?:https?:\/\/)?(?:osm\.wiki\.?|wiki\.openstreetmap\.org\.?\/wiki)\/File:(?<file>[\w\-%.(),;]+?\.(?:jpe?g|png|svg|webp))/i
};

const IMAGE_HOSTING_REGEX_ALL = {
  ...IMAGE_HOSTING_REGEX,
  all: /^(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)*(?:[\w-]+)\.(?:[a-z]{2,})\.?\/(?:(?:[\w\-.~%!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})\/?)+\.(jpe?g|png|svg|webp)/i
};

const IMAGE_HOSTING_ADDITIONAL_FORMATTING = {
  wikimedia: 'https://upload.wikimedia.org/wikipedia/$1/thumb/$2/$<file>/330px-$<file>',
  commons: 'https://commons.wikimedia.org/wiki/Special:FilePath/$<file>?width=300',
  openstreetmap: 'https://wiki.openstreetmap.org/wiki/Special:FilePath/$<file>?width=300'
};

/**
  * Linkify a given string (i.e. convert URLs to clickable links and images to image previews)
  *
  * @function
  * @param {String} input
  * @returns {String}
  */
export default function replace(input) {
  let regexps = {};
  const content = Preferences.get('content');
  if (content.images === 'trusted') {
    regexps = IMAGE_HOSTING_REGEX;
  } else if (content.images === 'always') {
    regexps = IMAGE_HOSTING_REGEX_ALL;
  }

  const images = [];
  const specialTransform = Object.entries(regexps).map(([ provider, regex ]) => {
    return {
      test: regex,
      transform: url => {
        images.push(url);
        const formatting = IMAGE_HOSTING_ADDITIONAL_FORMATTING[provider];
        if (formatting) {
          url = url.replace(regex, formatting);
        }
        url = Util.escape(url);
        return {
          url,
          image: `<img class="img-responsive img-preview p-1" src="${url}" alt="${url}" referrerpolicy="no-referrer" loading="lazy">`
        };
      }
    };
  });

  const result = linkify(input, {
    nl2br: true,
    rel: 'noopener noreferrer',
    target: '_blank',
    render: ({ tagName, attributes, content }) => {
      // Check if any of the regexes match the link and transform accordingly
      for (const { test, transform } of specialTransform) {
        if (test.test(encodeURI(attributes.href))) {
          const result = transform(attributes.href);
          attributes.href = result.url;
          content = result.image;
          break;
        }
      }
      // Convert attributes object to string
      attributes = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tagName} ${attributes}>${content}</${tagName}>`;
    }
  }).replace(/(\/a>)(<br>\n?)(<a)/g, '$1 $3'); // Remove all line breaks between consecutive links/images

  return {
    images,
    html: result
  };
}
