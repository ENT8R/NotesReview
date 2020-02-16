import Linkify from 'linkify-it';
const linkify = new Linkify();

const IMAGE_HOSTING_REGEX = {
  imgur: /(http(s)?:\/\/)?i\.imgur\.com\/\w+\.(jpg|png)/i,
  framapic: /(http(s)?:\/\/)?(www\.)?framapic\.org\/(random\?i=)?\w+\/\w+(\.(jpg|jpeg|png))?/i,
  westnordost: /https:\/\/westnordost\.de\/p\/[0-9]+\.jpg/i,
  wikimedia: /http(?:s)?:\/\/upload\.wikimedia\.org\/wikipedia\/(.+?)\/(?:thumb\/)?(\w\/\w\w)\/(.+?\.(?:jpg|jpeg|png))(?:\/.+?\.(?:jpg|jpeg|png))?/i,
  commons: /http(?:s)?:\/\/commons\.wikimedia\.org\/wiki\/File:(.+?\.(?:jpg|jpeg|png|svg))/i
};

const IMAGE_HOSTING_ADDITIONAL_FORMATTING = {
  wikimedia: 'https://upload.wikimedia.org/wikipedia/$1/thumb/$2/$3/300px-$3',
  commons: 'https://commons.wikimedia.org/wiki/Special:FilePath/$1?width=300'
};

/**
  * Linkify a given string
  *
  * @function
  * @param {String} string
  * @returns {String}
  */
export default function replace(string) {
  const links = linkify.match(string) || [];

  const result = [];
  const images = [];
  let last = 0;

  links.forEach(link => {
    // Test whether the link is actually an image
    const { image, formatted } = isImage(link.url);
    if (formatted) {
      link.url = formatted;
    }

    // Append everything which was before the link in the comment
    if (last < link.index) {
      let content = escape(string.slice(last, link.index));

      const isEmpty = link.index - 1 === last;
      // Only replace line breaks when there was no other link in between
      content = content.replace(/\r?\n/g, isEmpty ? '' : '<br>');
      // If it is the first image, add a new line break
      if (!isEmpty && image && !content.endsWith('<br>')) {
        content += '<br>';
      }
      result.push(content);
    }

    let text = decodeURI(link.text);
    if (image) {
      images.push(link.url);
      text = `<img class="img-responsive img-preview p-1" src="${escape(link.url)}" alt="${text}">`;
    }
    result.push(`<a href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">${text}</a>`);

    last = link.lastIndex;
  });

  // Append everything after the last found link
  if (last < string.length) {
    result.push(escape(string.slice(last)).replace(/\r?\n/g, '<br>'));
  }

  return {
    images,
    html: result.join('')
  };
}

/**
  * Check whether an URL is actually an image
  *
  * @function
  * @private
  * @param {String} url
  * @returns {Object}
  */
function isImage(url) {
  let image = false;
  let formatted = null;

  Object.entries(IMAGE_HOSTING_REGEX).forEach(entry => {
    const [ provider, regex ] = entry;
    const formatting = IMAGE_HOSTING_ADDITIONAL_FORMATTING[provider];

    if (regex.test(url)) {
      image = true;

      if (formatting) {
        formatted = url.replace(new RegExp(regex.source, 'gi'), formatting);
      }
    }
  });

  return {
    image,
    formatted
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
