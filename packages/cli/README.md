# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.20.28/config/assets/logo.svg) Appsemble CLI

> Manage apps and blocks from the command line.

[![npm](https://img.shields.io/npm/v/@appsemble/cli)](https://www.npmjs.com/package/@appsemble/cli)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.20.28/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.20.28)
[![Code coverage](https://codecov.io/gl/appsemble/appsemble/branch/0.20.28/graph/badge.svg)](https://codecov.io/gl/appsemble/appsemble)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Installation

```sh
npm install @appsemble/cli
```

## Usage

A full list of functionalities can be achieved by running the following command:

```sh
appsemble --help
```

Every subcommand also supports the `--help` flag.

### Authentication

The Appsemble CLI uses OAuth2 client credentials to authenticate to the Appsemble server.

To login, run the following command and follow the instructions in the output:

```sh
appsemble login
```

To logout, run the following command and select the client credentials to remove:

```sh
apsemble logout
```

The Appsemble CLI also supports authentication using the `APPSEMBLE_CLIENT_CREDENTIALS` environment
variable. This is mostly useful for automation.

### Organizations

The Appsemble CLI can be used to create and update organizations. For example:

```sh
appsemble organization create my-organization --name 'My Organization' --icon icon.png
```

### Apps

The Appsemble CLI can be used to create and update apps. For example, to create an app in the
`apps/my-app` directory, run:

```sh
appsemble app create apps/my-app
```

For a more in depth explanation of how to build apps, use our
[app building guide](https://appsemble.app/docs/guide).

### Blocks

The Appsemble CLI can be used to publish Appsemble blocks. For example, to publish all blocks in the
`blocks` directory, run:

```sh
appsemble block publish blocks/*
```

Building blocks uses
[![](https://avatars.githubusercontent.com/u/2105791?s=16) Webpack](https://webpack.js.org). To use
this, install the additional dependencies
[`webpack`](https://www.npmjs.com/package/webpack/v/4.44.1) and
[`@appsemble/webpack-config`](https://www.npmjs.com/package/@appsemble/webpack-config)

```sh
npm install webpack@webpack-4 @appsemble/webpack-config
```

For a more in-depth explanation of how to build apps, use our
[block development guide](https://appsemble.app/docs/development/developing-blocks).

### Assets

The Appsemble CLI can be used to upload assets from disk. For example, the following command creates
an asset named `example-asset`:

```sh
appsemble asset create --app-id 1 path/to/example-asset.png
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.20.28/LICENSE.md) ©
[Appsemble](https://appsemble.com)
