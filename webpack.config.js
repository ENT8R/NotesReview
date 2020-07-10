const config = require('./config/application.json');

const path = require('path');
const webpack = require('webpack');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');

module.exports = {
  // devtool: 'source-map',
  mode: 'production',
  watch: true,
  entry: [
    './css/main.scss',
    './js/main.js'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].min.js',
    chunkFilename: 'js/[name].min.js',
    publicPath: 'dist/'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  devServer: {
    contentBase: __dirname,
    watchContentBase: true,
    publicPath: '/dist/',
    compress: true,
    port: 8000,
    watchOptions: {
      ignored: ['.git', 'node_modules']
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require('./package.json').version),
      MAPILLARY_CLIENT_ID: JSON.stringify(config.mapillary.client_id),
      OPENSTREETMAP_SERVER: JSON.stringify(config.server),
      OPENSTREETMAP_OAUTH_KEY: JSON.stringify(config.oauth.key),
      OPENSTREETMAP_OAUTH_SECRET: JSON.stringify(config.oauth.secret)
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].min.css',
      chunkFilename: 'css/[id].min.css'
    }),
    new SVGSpritemapPlugin('icons/*.svg', {
      output: {
        filename: 'svg/icons.svg'
      },
      sprite: {
        generate: {
          title: false
        }
      }
    })
  ],
  module: {
    rules: [{
      test: /\.mst/i,
      use: 'mustache-loader?minify'
    }, {
      test: /\.js$/,
      include: /js/,
      exclude: /node_modules(?!(\/|\\)@github(\/|\\)time-elements)/,
      use: 'babel-loader'
    }, {
      test: /\.scss$/,
      include: /css/,
      use: [{
        loader: MiniCssExtractPlugin.loader
      }, {
        loader: 'css-loader',
        options: {
          url: false
        }
      }, {
        loader: 'sass-loader',
        options: {
          sassOptions: {
            outputStyle: 'compressed'
          }
        }
      }]
    }]
  }
};
