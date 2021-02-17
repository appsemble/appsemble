# Appsemble Webpack Configuration

> An opinionated reusable Webpack configuration for block development

## Installation

```sh
npm install @appsemble/webpack-config
```

## Usage

No setup is needed to use this configuration. `@appsemble/cli` will automatically fall back to this
configuration if no `webpack` file has been specified in the `.appsemblerc.yaml` of the block and no
`webpack.config.js` file exists.

This Webpack preset features:

- [TypeScript](https://www.typescriptlang.org)
- [CSS modules](https://github.com/css-modules/css-modules) (`*.module.css`)
- Static files (`*.gif`, `*.jpg`, `*.jpeg`, `*.png`, `*.svg`, `*.woff`, `*.woff2`)
- [Case sensitive files](https://www.npmjs.com/package/case-sensitive-paths-webpack-plugin)
- Optimizations for [SVG](https://www.npmjs.com/package/svgo-loader) and
  [CSS](https://www.npmjs.com/package/optimize-css-assets-webpack-plugin)

### TypeScript

In order to add support for static assets and CSS modules, use the following `tsconfig.json`
options:

```json
{
  "compilerOptions": {
    "types": ["@appsemble/webpack-config/types"]
  }
}
```

### Manual Adjustments

Since a Webpack configuration is a function that returns a Webpack configuration, this preset can be
overridden by simply calling it from a file named `webpack.config.js` in the block root and
modifying the result.

```js
const createConfig = require('@appsemble/webpack-config');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = (blockConfig, options) => {
  const config = createConfig(blockConfig, options);

  // Example modification
  config.plugins.push(new ImageMinimizerPlugin());

  return config;
};
```
