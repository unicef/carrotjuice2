var path = require("path");
var webpack = require("webpack");

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
  },
  resolve: {
    root: [path.join(__dirname, "bower_components")],
    extensions: ['', '.js', '.jsx'],
    alias: {
      "react$": "react/react.js"
    }
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
    )
  ]
};
