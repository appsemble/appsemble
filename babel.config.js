module.exports = api => {
  const env = api.env();
  const production = env === 'production';
  const development = env === 'development';

  const presets = [
    '@babel/preset-typescript',
    ['@babel/preset-env', { spec: false, loose: true, useBuiltIns: 'usage', corejs: 3 }],
    ['@babel/preset-react', { useBuiltIns: true, development, corejs: 3 }],
  ];

  const plugins = [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-react-jsx',
    production && '@babel/plugin-transform-react-inline-elements',
    'babel-plugin-react-intl-auto',
    ['@babel/plugin-transform-runtime', { helpers: true }],
    production && ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }],
    'babel-plugin-transform-react-class-to-function',
    '@babel/plugin-proposal-function-bind',
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ];

  return {
    presets,
    plugins: plugins.filter(Boolean),
    retainLines: true,
  };
};
