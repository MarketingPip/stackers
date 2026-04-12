const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    
    // Disable gross eval in dev, and keep production clean
    devtool: isProd ? false : 'source-map',

    entry: './src/game.js',

    output: {
      path: path.resolve(__dirname, '..', 'dist'),
      filename: 'bundle.js',
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.html$/,
          use: ['html-loader'],
        },
        {
          test: /\.css$/,
          use: ['css-loader', 'postcss-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/game.html',
        filename: 'game.html',
        inject: 'body',
        // Minify HTML only in production
        minify: isProd ? {
          collapseWhitespace: true,
          removeComments: true,
        } : false,
      }),
      new HTMLInlineCSSWebpackPlugin(),
      new HtmlInlineScriptPlugin(),
    ],
  };
};
