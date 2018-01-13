const path = require("path");

module.exports = {
  entry: path.resolve(__dirname + "/src/index.js"),
  output: {
    path: path.resolve(__dirname + "/dist/"),
    filename: "index.js",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            presets: [
              [
                "env",
                {
                  modules: false,
                  targets: {
                    browsers: ["> 2%"],
                    uglify: true
                  }
                }
              ]
            ],
            plugins: ["transform-object-rest-spread"]
          }
        }
      },
      {
        test: /\.vue$/,
        use: "vue-loader"
      }
    ]
  }
};
