const path = require('path');
const webpack = require('webpack');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = {
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
    publicPath: '/dist/'
  },
  devServer: {
    contentBase: __dirname,
    watchContentBase: true,
    publicPath: '/dist/',
    compress: true,
    port: 8000,
    watchOptions: {
      ignored: ['node_modules']
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require('./package.json').version)
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].min.css',
      chunkFilename: 'css/[id].min.css'
    })
  ],
  module: {
    rules: [
      {
        test: /\.mst/i,
        use: 'mustache-loader?minify'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          },
          {
            loader: 'sass-loader',
            options: {
              outputStyle: 'compressed'
            }
          }
        ]
      }
    ]
  }
};

module.exports = config;
