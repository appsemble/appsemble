module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
  ],
  retainLines: true,
};
