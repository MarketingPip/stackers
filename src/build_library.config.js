const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/game.js',
  output: {
    path: path.resolve(__dirname, "..", "dist"),
    filename: 'openstacker.esm.js',
    
    // This tells webpack to treat the output as an ES Module
    library: {
      type: 'module',
    },
    // This ensures the CommonJS default export maps correctly to ESM default
    libraryTarget: 'module' 
  },
  experiments: {
    // Required for ESM output support
    outputModule: true,
  },
};
