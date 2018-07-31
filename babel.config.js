module.exports = (api) => {
  const env = api.env();
  const production = env === 'production';
  const development = env === 'development';
  const testing = env === 'jest';

  const presets = [
    ['@babel/preset-env', {
      spec: false,
      loose: true,
      modules: testing && 'commonjs',
      useBuiltIns: 'usage',
    }],
    ['@babel/preset-react', {
      useBuiltIns: true,
      development,
    }],
  ];

  const plugins = [
    production && '@babel/plugin-transform-react-inline-elements',
    'babel-plugin-react-intl-auto',
    ['@babel/plugin-transform-runtime', {
      helpers: true,
      useBuiltIns: true,
      useESModules: false,
    }],
    production && ['babel-plugin-transform-react-remove-prop-types', {
      removeImport: true,
    }],
    'babel-plugin-transform-react-class-to-function',
    '@babel/plugin-proposal-function-bind',
    ['@babel/plugin-proposal-optional-chaining', {
      loose: true,
    }],
    ['@babel/plugin-proposal-object-rest-spread', {
      loose: true,
      useBuiltIns: true,
    }],
    ['@babel/plugin-proposal-class-properties', {
      loose: true,
    }],
  ];

  return {
    presets,
    plugins: plugins.filter(Boolean),
  };
};
