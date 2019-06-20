import Linkify from 'linkify-it';
const linkify = new Linkify();

const IMAGE_HOSTING_REGEX = {
  imgur: /(http(s)?:\/\/)?i\.imgur\.com\/\w+\.(jpg|png)/,
  framapic: /(http(s)?:\/\/)?(www\.)?framapic\.org\/(random\?i=)?\w+\/\w+(\.(jpg|jpeg|png))?/,
  westnordost: /https:\/\/westnordost\.de\/p\/[0-9]+\.jpg/,
  wikimedia: /https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?(\w\/\w\w)\/(.+?\.(?:jpg|png))(?:\/.+?\.(?:jpg|png))?/
};

const IMAGE_HOSTING_ADDITIONAL_FORMATTING = {
  wikimedia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/$1/$2/300px-$2'
};


/**
  * Linkify a given string
  *
  * @function
  * @param {String} string
  * @returns {String}
  */
export default function replace(string) {
  const links = linkify.match(string);

  if (links) {
    const result = [];
    let last = 0;

    links.forEach(link => {
      // Append everything which was before the link in the comment
      if (last < link.index) {
        result.push(escape(string.slice(last, link.index)).replace(/\r?\n/g, '<br>'));
      }

      // Test whether the link is actually an image
      const { image, formatted } = isImage(link.url);
      if (formatted) {
        link.url = formatted;
      }

      if (image) {
        result.push(`
          <a href="${escape(link.url)}" target="_blank">
            <img class="img-responsive img-preview m-1" src="${escape(link.url)}" alt="${escape(link.text)}">
          </a>`);
      } else {
        result.push(`<a target="_blank" href="${escape(link.url)}">${escape(link.text)}</a>`);
      }

      last = link.lastIndex;
    });

    // Append everything after the last found link
    if (last < string.length) {
      result.push(escape(string.slice(last)).replace(/\r?\n/g, '<br>'));
    }

    string = result.join('');
  } else {
    string = escape(string);
  }

  return string;
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
