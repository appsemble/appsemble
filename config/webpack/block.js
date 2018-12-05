const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin');
const merge = require('webpack-merge');

const shared = require('./shared');

module.exports = (env, argv) => {
  if (typeof env !== 'string') {
    throw new Error('Specify a block to build.');
  }
  const name = env.startsWith('@') ? env.split('/')[1] : env;
  const dir = path.resolve(__dirname, '../../blocks', name);
  const srcPath = path.join(dir, 'src');
  const outputPath = path.join(dir, 'dist');
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const pkg = require(`${dir}/package.json`);
  const { mode, publicPath = `/api/blocks/${pkg.name}/versions/${pkg.version}/` } = argv;
  const production = mode === 'production';

  return merge.smart(shared(name, { ...argv, publicPath }), {
    name: pkg.name,
    entry: [srcPath],
    output: {
      filename: `${name}.js`,
      publicPath,
      path: outputPath,
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: `${name}.css`,
      }),
      new UnusedFilesWebpackPlugin({
        failOnUnused: production,
        patterns: ['**/*.*'],
        globOptions: {
          cwd: srcPath,
          ignore: ['**/package.json', '**/*.test.{js,jsx}'],
        },
      }),
      production && new CleanWebpackPlugin([outputPath]),
    ].filter(Boolean),
  });
};
