import anchorme from 'anchorme';

const IMAGE_HOSTING_REGEX = {
  imgur: /(http(s)?:\/\/)?(i\.)?imgur\.com\/\w+\.(jpg|png)/i,
  framapic: /(http(s)?:\/\/)?(www\.)?framapic\.org\/(random\?i=)?\w+\/\w+(\.(jpg|jpeg|png))?/i,
  westnordost: /https:\/\/westnordost\.de\/p\/[0-9]+\.jpg/i,
  wikimedia: /http(?:s)?:\/\/upload\.wikimedia\.org\/wikipedia\/(.+?)\/(?:thumb\/)?(\w\/\w\w)\/(.+?\.(?:jpg|jpeg|png))(?:\/.+?\.(?:jpg|jpeg|png))?/i,
  commons: /http(?:s)?:\/\/commons\.wikimedia\.org\/wiki\/File:(.+?\.(?:jpg|jpeg|png|svg))/i,
  openstreetmap: /http(?:s)?:\/\/wiki\.openstreetmap\.org\/wiki\/File:(.+?\.(?:jpg|jpeg|png|svg))/i,
  mapillary: /http(?:s)?:\/\/(?:www\.)?mapillary\.com\/map\/im\/(\w+)/i,
  all: /(http(s)?:\/\/)?(www\.)?.+\.(jpg|jpeg|png)/i
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
