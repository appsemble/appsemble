# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.33.11/config/assets/logo.svg) Appsemble Webpack Configuration

> An opinionated reusable Webpack configuration for block development

[![npm](https://img.shields.io/npm/v/@appsemble/webpack-config)](https://www.npmjs.com/package/@appsemble/webpack-config)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.33.11/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.33.11)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [TypeScript](#typescript)
  - [Manual Adjustments](#manual-adjustments)
- [License](#license)

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
import createConfig from '@appsemble/webpack-config';
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';

export default function webpackConfig(blockConfig, options) {
  const config = createConfig(blockConfig, options);

  // Add a plugin for example
  config.plugins.push(new ImageMinimizerPlugin());

  // Or configure a fallback
  config.resolve.alias.fallback.fs = false;

  return config;
}
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.33.11/LICENSE.md) ©
[Appsemble](https://appsemble.com)
