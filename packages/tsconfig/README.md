# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.35.10/config/assets/logo.svg) Appsemble TypeScript presets

> Reusable TypeScript presets recommended by Appsemble

[![npm](https://img.shields.io/npm/v/@appsemble/sdk)](https://www.npmjs.com/package/@appsemble/sdk)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.35.10/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.35.10)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [DOM](#dom)
  - [Preact](#preact)
  - [Mini JSX](#mini-jsx)
- [License](#license)

## Installation

```sh
npm install @appsemble/tsconfig
```

## Usage

### DOM

The `dom` preset configures TypeScript for usage in the browser. This is the main export from this
package.

To use it, add the following to your `tsconfig.json` file.

```json
{
  "extends": "@appsemble/tsconfig"
}
```

### Preact

The `preact` preset configures TypeScript for usage with [Preact](https://preactjs.com/).

To use it, add the following to your `tsconfig.json` file.

```json
{
  "extends": "@appsemble/tsconfig/preact"
}
```

### Mini JSX

The `mini-jsx` preset configures TypeScript for usage with
[`mini-jsx`](https://github.com/remcohaszing/mini-jsx).

To use it, add the following to your `tsconfig.json` file.

```json
{
  "extends": "@appsemble/tsconfig/mini-jsx"
}
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.35.10/LICENSE.md) ©
[Appsemble](https://appsemble.com)
