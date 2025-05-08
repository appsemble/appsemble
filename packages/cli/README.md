# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.32.2-test.4/config/assets/logo.svg) Appsemble CLI

> Manage apps and blocks from the command line.

[![npm](https://img.shields.io/npm/v/@appsemble/cli)](https://www.npmjs.com/package/@appsemble/cli)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.32.2-test.4/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.4)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Development server](#development-server)
  - [Authentication](#authentication)
  - [Organizations](#organizations)
  - [Apps](#apps)
  - [Blocks](#blocks)
  - [Groups](#groups)
  - [Assets](#assets)
  - [Resources](#resources)
  - [Cronjobs](#cronjobs)
- [License](#license)

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

### Development server

The development server can create an app from a specified folder containing an `app-definition.yml`
file. It will check what blocks are needed for the app and will try to load them from the local
workspaces, listed in the `package.json` file in the root of the project, if they are present. This
way, all default Appsemble blocks shipped with Appsemble are loaded automatically.

Once the development server is started, making a change to a block’s code or styles will reflect in
the browser immediately after refreshing the page, without the need of increasing the block’s
version. Running docker database containers, creating a user account and creating an organization
are not needed.

The Appsemble CLI can be used to start the development server. For example, the following command
serves `my-app`:

```sh
appsemble serve <path-to-app-directory>
```

This will serve the app on `http://localhost:9090`.

A different port can be specified with the `--port` parameter.

The following option allows you to view the app with a specified role:

```sh
appsemble serve <path-to-app-directory> --user-role test
```

The following option allows you to view the app as a Manager of a group:

```sh
appsemble serve <path-to-app-directory> --group-role Manager
```

App data is stored within a `db.json` file in your machine’s cache directory. Each app has their own
directory `<my-app>`.

```sh
MacOS - /Users/<my-name>/Library/Caches/appsemble/<my-app>
Linux - /home/<my-name>/.cache/appsemble/<my-app>
Windows - C:\Users\<my-name>\AppData\Local\appsemble\Cache\<my-app>
```

App assets will be served from the local file system.

The development server will automatically fetch all blocks that are needed for the served app but
are missing from the local workspaces. These are typically third-party or proprietary blocks. The
development server will use `http://localhost:9999` as the default remote server to fetch blocks
from. The following option allows you to specify a different remote (e.g. `https://appsemble.app`):

```sh
appsemble serve <path-to-app-directory> --remote <remote>
```

The development server will use the corresponding block directory in your machine’s cache directory
to store and read block manifests and assets.

```sh
MacOS - /Users/<my-name>/Library/Caches/appsemble/blocks/<organisation>/<block-name>/<block-version>
Linux - /home/<my-name>/.cache/appsemble/blocks/<organisation>/<block-name>/<block-version>
Windows - C:\Users\<my-name>\AppData\Local\appsemble\Cache\blocks\<organisation>\<block-name>\<block-version>
```

You can overwrite the existing block cache with the following option:

```sh
appsemble serve <path-to-app-directory> --remote <remote> --overwrite-block-cache
```

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

The Appsemble CLI allows you to bootstrap an Appsemble app into a standard Appsemble project layout.
The command is followed by a series of interactive questions. You can also pass the values as
arguments.

```sh
appsemble app create
```

The Appsemble CLI can be used to create, export, import and update apps. For example, to create an
app in the `apps/my-app` directory, run:

```sh
appsemble app publish apps/my-app
```

Similarly, to update an app using an app directory, run the following command:

```sh
appsemble app update --id <app-id> <path/to/updated app>.
```

If you want to update settings for an app, run the following command:

```sh
appsemble app patch --id <app-id>
```

Use `--help` flag with the above command to view the supported arguments.

---

**🛈NOTE**

> The `app patch` command supports updating the `locked` property of an app, locked property is
> updated before other properties. If you set the locked property to `fullLock`, any other changes
> won’t be applied unless you are using `--force` flag.

---

To delete an app using the CLI use the following command:

```sh
appsemble app delete --id <appId>
```

To export an app as a zip file, run the following:

```sh
appsemble app export --id <app-id>
```

Supported arguments for this command are `resources`, `assets` and `path`. Resources is used to
specify whether to include the resources in the exported file, the same can be applied to assets and
path is the path of the folder where you want to put your downloaded file. The default path is
`./apps`, and resources and assets are by default `false`.

To import an app from a zip file, use the following command:

```sh
appsemble app import <path-of-zip-file> --organization <organizationId>
```

For a more in depth explanation of how to build apps, use our
[app building guide](https://appsemble.app/docs/guides).

### Blocks

The Appsemble CLI allows you to bootstrap an Appsemble block into a standard Appsemble project
layout. The command is followed by a series of interactive questions.

```sh
appsemble block create
```

The Appsemble CLI can also be used to publish and delete (although we don’t recommend doing it in
production) Appsemble blocks. For example, to publish all blocks in the `blocks` directory, run:

```sh
appsemble block publish blocks/*
```

or to publish a single block located in some other directory, run

```sh
appsemble block publish path/to/block/directory
```

Blocks can be deleted if they are not in use by any apps. To delete a block, run

```sh
appsemble block delete <block-name:block-version>
```

Organization id can be passed as an argument(default for which is “appsemble”).

To know more about the block related commands, run

```sh
appsemble block --help
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

### Groups

The Appsemble CLI can be used to manage groups for apps. For example, the following command creates
a new group named `My Group`:

```sh
appsemble group create 'My Group' --app-id 1 --context development
```

### Assets

The Appsemble CLI can be used to upload assets from disk. For example, the following command creates
an asset named `example-asset`:

```sh
appsemble asset publish --app-id 1 path/to/example-asset.png
```

### Resources

The Appsemble CLI can be used to create a resource from a JSON file or directory:

```json
[
  {
    "title": "My Resource",
    "description": "This record is an example."
  }
]
```

```sh
appsemble resource publish --app-id 1 --context development --app path/to/my-app my-resource path/to/resources/my-resource.json
```

```sh
appsemble resource publish --app-id 1 --context development --app path/to/my-app my-resource path/to/resources/*
```

And resources can also be updated when they contain an id in the JSON file.

```json
[
  {
    "id": 1,
    "title": "My Updated Resource",
    "description": "This will be the updated content of the first my-resource record."
  }
]
```

```sh
appsemble resource update --app-id 1 --context development --app path/to/my-app my-resource path/to/resources/*
```

### Cronjobs

The Appsemble CLI can be used to run app cronjobs. The following command runs all cronjobs that were
scheduled to run in the past 5 minutes:

```sh
appsemble run-cronjobs
```

How often jobs are run (more accurately how far back the job can be scheduled for it to run) the
time interval (in minutes) can also be set with:

```sh
appsemble run-cronjobs --interval 30
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.32.2-test.4/LICENSE.md) ©
[Appsemble](https://appsemble.com)
