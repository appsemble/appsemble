# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.28.11/config/assets/logo.svg) Appsemble

[![npm](https://img.shields.io/npm/v/appsemble)](https://www.npmjs.com/package/appsemble)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.28.11/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.28.11)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

It’s recommended to install `eslint-plugin-appsemble` during development.

```sh
npm install eslint-plugin-appsemble
```

## Usage

Add `appsemble` as plugin to the plugins in the eslint config.

**Rules**

- `enforce-index-decorator` has been made to enforce a consistent method of applying uniquess to
  columns in tables. The `@Unique` decorator does not sync any noticeable changes to the database
  when comparing with migrations using `npm run appsemble check-migrations`. `@Index` decorator does
  however show up in the diff, and is therefore enforced to ensure consistency. _This is based on
  how Sequelize v6 behaves, in v7 this is supposed to be different according to the docs:
  https://sequelize.org/docs/v7/models/indexes/._

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.28.11/LICENSE.md) ©
[Appsemble](https://appsemble.com)
