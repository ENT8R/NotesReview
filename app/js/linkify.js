import anchorme from 'anchorme';

const IMAGE_HOSTING_REGEX = {
  imgur: /(?:https?:\/\/)?(?:i\.)?imgur\.com\/\w+\.(?:jpe?g|png|webp)/i,
  framapic: /(?:https?:\/\/)?(?:www\.)?framapic\.org\/(?:random\?i=)?\w+\/\w+(?:\.(?:jpe?g|png|webp))?/i,
  westnordost: /(?:https?:\/\/)?(?:www\.)?westnordost\.de\/p\/[0-9]+\.(?:jpe?g|webp)/i,
  wikimedia: /(?:https?:\/\/)?upload\.wikimedia\.org\/wikipedia\/([^\/]+)\/(?:thumb\/)?(\w\/\w\w)\/([\w\:\-\_\.]+?\.(?:jpe?g|png|webp))(?:\/[\w\:\-\_\.]+?\.(?:jpe?g|png|webp))?/i,
  commons: /(?:https?:\/\/)?commons\.wikimedia\.org\/wiki\/File:([\w\-\_\.]+?\.(?:jpe?g|png|svg|webp))/i,
  openstreetmap: /(?:https?:\/\/)?wiki\.openstreetmap\.org\/wiki\/File:([\w\-\_\.]+?\.(?:jpe?g|png|svg|webp))/i,
  mapillary: /(?:https?:\/\/)?(?:www\.)?mapillary\.com\/map\/im\/(\w+)/i,
  all: /(?:https?:\/\/)?(?:www\.)?[\w\%\/@\-\_\;\.\&\+\=]+\.(?:jpe?g|png|webp)/i
};

const IMAGE_HOSTING_ADDITIONAL_FORMATTING = {
  wikimedia: 'https://upload.wikimedia.org/wikipedia/$1/thumb/$2/$3/300px-$3',
  commons: 'https://commons.wikimedia.org/wiki/Special:FilePath/$1?width=300',
  openstreetmap: 'https://wiki.openstreetmap.org/wiki/Special:FilePath/$1?width=300',
  mapillary: 'https://images.mapillary.com/$1/thumb-320.jpg'
};

/**
  * Linkify a given string
  *
  * @function
  * @param {String} input
  * @returns {String}
  */
export default function replace(input) {
  input = escape(input); // Sanitize the input

  const images = [];
  const specialTransform = Object.entries(IMAGE_HOSTING_REGEX).map(([ provider, regex ]) => {
    return {
      test: regex,
      transform: url => {
        images.push(url);
        const formatting = IMAGE_HOSTING_ADDITIONAL_FORMATTING[provider];
        if (formatting) {
          url = url.replace(regex, formatting);
        }
        const image = `<img class="img-responsive img-preview p-1" src="${escape(url)}" alt="${escape(url)}">`;
        return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${image}</a>`;
      }
    };
  });

  const result = anchorme({
    input,
    options: {
      attributes: {
        target: '_blank',
        rel: 'noopener noreferrer'
      },
      specialTransform
    }
  }).replace(/\r?\n/g, '<br>') // 1. Replace all newlines with the corresponding HTML element
    .replace(/(\/a>)(<br>)(<a)/g, '$1$3'); // 2. Remove all line breaks between multiple images

  return {
    images,
    html: result
  };
}

/**
  * Escapes a given string
  *
  * @function
  * @private
  * @param {String} string
  * @returns {String}
  */
function escape(string) {
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
