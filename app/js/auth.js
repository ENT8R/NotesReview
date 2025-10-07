import Preferences from './preferences.js';
import Request, { MEDIA_TYPE } from './request.js';

import { OAuth2Client, generateCodeVerifier } from '@badgateway/oauth2-client';

const client = new OAuth2Client({
  server: OPENSTREETMAP_SERVER,
  clientId: OPENSTREETMAP_OAUTH_CLIENT_ID,
  tokenEndpoint: '/oauth2/token',
  authorizationEndpoint: '/oauth2/authorize',
  discoveryEndpoint: '/.well-known/openid-configuration'
});

const REDIRECT_URI = `${window.location.origin}${window.location.pathname}landing.html`;

export default class Auth {
  /**
    * Start the authorization flow
    *
    * @function
    * @returns {void}
    */
  async login() {
    // Generate a security code which is needed for PKCE
    const codeVerifier = await generateCodeVerifier();
    // Generate a random state parameter
    const state = window.crypto.randomUUID();
    // Store both values temporarily in sessionStorage
    Preferences.set({
      codeVerifier,
      state
    }, true);

    // Generate a login URL and redirect the user to it
    client.authorizationCode.getAuthorizeUri({
      redirectUri: REDIRECT_URI,
      state,
      codeVerifier,
      scope: ['read_prefs', 'write_notes', 'openid']
    }).then(url => {
      window.location.href = url;
    });
  }

  /**
    * Resume the authorization flow after the redirect
    *
    * @function
    * @param {String} url
    * @returns {void}
    */
  async resume(url) {
    // Retrieve previously stored values that are needed for the verification
    const codeVerifier = Preferences.get('codeVerifier', true);
    const state = Preferences.get('state', true);
    const token = await client.authorizationCode.getTokenFromCodeRedirect(url, {
      redirectUri: REDIRECT_URI,
      state,
      codeVerifier,
    });

    // Store the OAuth and OIDC token for use in following requests
    Preferences.set({
      oauth2_access_token: token.accessToken, // eslint-disable-line camelcase
      oidc_token: token.idToken // eslint-disable-line camelcase
    });
  }

  /**
    * Check whether a user is currently logged in
    *
    * @function
    * @returns {Promise}
    */
  async isAuthenticated() {
    // Check whether there is a (valid) token in the localStorage
    const token = Preferences.get('oauth2_access_token');
    if (!token) {
      return false;
    }

    // And also verify that it works by fetching the /oauth2/userinfo endpoint
    try {
      await Request(`${OPENSTREETMAP_SERVER}/oauth2/userinfo`, MEDIA_TYPE.JSON, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
    * Log out the current user
    *
    * @function
    * @returns {void}
    */
  logout() {
    Preferences.remove('oauth2_access_token');
    Preferences.remove('oidc_token');
  }
}
