module.exports = (api) => {
  const env = api.env();
  const production = env === 'production';

  const presets = [
    '@babel/preset-typescript',
    ['@babel/preset-env', { spec: false, loose: true, useBuiltIns: 'usage', corejs: 3 }],
  ];

  const plugins = [
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-react-intl-auto',
    ['@babel/plugin-transform-runtime', { helpers: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    production && ['@babel/plugin-proposal-class-properties', { loose: true }],
  ];

  return {
    presets,
    plugins: plugins.filter(Boolean),
    retainLines: true,
  };
};
