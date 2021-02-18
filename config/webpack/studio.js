const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const shared = require('./shared');

/**
 * This webpack configuration is used by the Appsemble studio.
 */
module.exports = (env, argv) => {
  const config = shared('studio', argv);
  config.plugins.push(new MonacoWebpackPlugin({ languages: ['css', 'json', 'yaml'] }));

  return config;
};
