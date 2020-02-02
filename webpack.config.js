const path = require("path");

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: ["./index.js"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    publicPath: ""
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }]
  },
  devServer: {
    contentBase: "./dist",
    hot: true
  }
};
