module.exports = {
  entry: "./public/entry.js",
  output: {
    path: __dirname,
    filename: "./public/bundle.js"
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: "style!css"},
      {
        test: /\.jsx$/,
        loader: "babel-loader",
        query: {
          presets: ['react']
        }
      }
    ]
  }
};
