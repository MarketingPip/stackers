const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const tailwindcss = require('@tailwindcss/postcss'); // Import the v4 plugin

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: path.resolve(__dirname, 'js/main.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      clean: true,
    },
    devtool: isProd ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    tailwindcss(), // Required for Tailwind v4
                    require('autoprefixer')(),
                  ],
                },
              },
            },
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
        template: path.resolve(__dirname, 'pages/index.html'),
      }),
      new MiniCssExtractPlugin({
        filename: 'styles.[contenthash].css',
      }),
    ],
    mode: isProd ? 'production' : 'development',
  };
};
