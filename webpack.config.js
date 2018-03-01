var path = require('path');

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    texturer: './src/texturer/index.ts',
    workers: './src/workers/index.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: [
    'jsonc-parser',
    'handlebars',
    'worker-farm',
  ],
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  }
};