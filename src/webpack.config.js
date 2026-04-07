const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // change to 'production' later

  entry: './src/game.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'game.js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/game.html',
    }),
  ],

  devServer: {
    static: './dist',
    open: true,
    hot: true,
  },
};
