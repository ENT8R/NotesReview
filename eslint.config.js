import globals from 'globals';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
  js.configs.recommended, {
    plugins: {
      '@stylistic/js': stylisticJs,
      jsdoc: jsdoc
    },
    settings: {
      jsdoc: {
        tagNamePreference: {
            returns: 'return'
        }
      }
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        L: 'readonly',
        __VERSION__: 'readonly',
        NOTESREVIEW_API_URL: 'readonly',
        OPENSTREETMAP_SERVER: 'readonly',
        OPENSTREETMAP_OAUTH_CLIENT_ID: 'readonly',
        OPENSTREETMAP_OAUTH_CLIENT_SECRET: 'readonly',
        MAPILLARY_CLIENT_ID: 'readonly',
      },
      ecmaVersion: 2023,
      sourceType: 'module',
    },

    rules: {
      '@stylistic/js/semi': 'warn',
      '@stylistic/js/semi-style': 'error',
      '@stylistic/js/semi-spacing': 'warn',
      '@stylistic/js/quotes': ['warn', 'single', {
        avoidEscape: true,
        allowTemplateLiterals: false,
      }],
      '@stylistic/js/brace-style': 'error',
      '@stylistic/js/indent': ['error', 2],

      'no-eval': 'error',
      'no-implied-eval': 'error',

      'camelcase': 'error',
      'prefer-const': 'error',
      'no-var': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'warn',
      'template-curly-spacing': 'warn',
      'symbol-description': 'error',
      'object-shorthand': 'warn',
      'prefer-promise-reject-errors': 'error',
      'prefer-destructuring': 'warn',
      'prefer-numeric-literals': 'warn',

      'no-new-object': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all'],
      'dot-location': ['error', 'property'],
      'dot-notation': 'error',
      'no-array-constructor': 'error',
      'no-throw-literal': 'error',
      'no-self-compare': 'error',
      'no-useless-call': 'warn',
      'spaced-comment': 'warn',
      'no-multi-spaces': 'warn',
      'no-new-wrappers': 'error',
      'no-script-url': 'error',
      'no-void': 'warn',
      'vars-on-top': 'warn',
      yoda: ['error', 'never'],
      'require-await': 'warn',

      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: false,
        },
      }],
      'jsdoc/require-returns-type': 'warn',
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',

      'wrap-iife': ['error', 'inside'],
      'no-unused-expressions': 'error',
      'no-useless-constructor': 'error',
      'no-console': 'error',
      'require-atomic-updates': 'warn',
    },
  }];
