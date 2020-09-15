module.exports = (api) => {
  const env = api.env();

  const plugins = [
    env === 'test' && '@babel/plugin-transform-modules-commonjs',
    ['babel-plugin-react-intl-auto', { filebase: false, removePrefix: 'packages/' }],
  ];

  return {
    plugins: plugins.filter(Boolean),
    retainLines: true,
  };
};
