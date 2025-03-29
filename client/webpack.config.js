module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/face-api\.js/,
      },
    ],
  },
  ignoreWarnings: [
    {
      module: /face-api\.js/,
      message: /Failed to parse source map/,
    },
  ],
}; 