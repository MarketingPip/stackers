const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = {
  mode: 'development',

  entry: './src/game.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // This will be inlined and won't exist as a separate file in dist
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        // Added CSS support so it can be extracted and inlined
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/game.html',
      inject: 'body', // Ensures script is placed in the body for the inliner to find it
    }),
    // Order matters: Inline CSS usually works best before or during the HTML script inlining
    new HTMLInlineCSSWebpackPlugin(),
    new HtmlInlineScriptPlugin(),
  ],
};
