const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
 
  return {
    entry: path.resolve(__dirname, '/js/main.js'),

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      clean: true,
    },

    devtool: isProd ? false : 'source-map',

    devServer: {
      static: './dist',
      hot: true,
      open: true,
      port: 3000,
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.html$/i,
          loader: 'html-loader',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new MiniCssExtractPlugin({
        filename: 'styles.[contenthash].css',
      }),
    ],

    mode: isProd ? 'production' : 'development',
  };
};
