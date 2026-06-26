# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.33.11/config/assets/logo.svg) Appsemble

Language Server

> A language server, enhancing `yaml-language-server`'s `languageService` with custom capabilities

Code forked from
[redhat-developer/yaml-language-server](https://github.com/redhat-developer/yaml-language-server),
under the MIT license.

[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.33.11/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.33.11)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Usage](#usage)
- [Building](#building)
- [License](#license)

## Usage

<!-- TODO: write -->

## Building

Build the language server bundle from the repository root:

```sh
npm --workspace @appsemble/appsemble-language-server run build
```

To test the built server through a globally installed executable, install the package from its
workspace directory after building:

```sh
sudo npm i -g
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.33.11/LICENSE.md) ©
[Appsemble](https://appsemble.com)
