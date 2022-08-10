# ![](config/assets/logo.svg) Appsemble

> The app building platform

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in [here](docs/deployment/helm.md).

### Live Environments

Our production environment is available on [appsemble.app](https://appsemble.app).

Our staging environment is available on
[staging.appsemble.review](https://staging.appsemble.review). This environment hosts the latest
changes in the `main` branch. This environment is reset every night at 04:00 AM UTC.

For each of our internal merge requests a review environment is started at
`${CI_MERGE_REQUEST_IID}.appsemble.review`.

### Requirements

In order to run the Appsemble project in development mode, the following must be installed.

- [Docker][]
- [Docker Compose][]
- [NodeJS 18][nodejs]
- [Yarn][]

### Getting started

Clone and setup the project.

> Note: your CLI should have elevated privileges when setting up and starting the app

```sh
git clone https://gitlab.com/appsemble/appsemble.git
cd appsemble
yarn
```

The project requires a PostgreSQL database. This project contains a Docker Compose configuration to
spin up a preconfigured database with ease.

```sh
docker-compose up -d
```

The project can be served using the following command.

```sh
yarn start
```

To see additional options, run the following command.

```sh
yarn start --help
```

A new account can be registered by going to `http://localhost:9999/register`, or you can login on
`http://localhost:9999/login`. If you use email registration to register an account, the email
containing the verification link will be printed in the server logs.

#### CLI Login

To login using the Appsemble CLI, run the following command, then follow the instructions.

```sh
yarn appsemble login
```

#### Registering an Organization

To get started developing locally, an `appsemble` organization named “appsemble” needs to be
created. This organization can be created either in Appsemble Studio, or using the following CLI
command.

```sh
yarn appsemble organization create --name Appsemble appsemble
```

#### Publishing Blocks

After logging in to the CLI, Appsemble blocks can be published locally by running the following
command.

```sh
yarn appsemble block publish blocks/*
```

Any block that is found within the workspaces listed in `package.json` will be hot-reloaded. More
information about block development and hot-reloading can be found
[here](https://appsemble.app/docs/development/developing-blocks).

#### Publishing App templates

In order for users to create apps from within the Appsemble Studio, existing apps that can be used
as a starting point must be marked as templates. This can be done using the Appsemble CLI, after
logging in. To publish these apps, run the following command.

```sh
yarn appsemble app create --context development apps/*
```

### Tests

Tests can be run using the following command.

```sh
yarn test
```

The tests are ran using jest, meaning all [jest CLI options][] can be passed.

By default, database tests are run against the database as specified in
[docker-compose.yml](docker-compose.yml). The database can be overridden by setting the
`DATABASE_URL` environment variable. Note that this should **not** include the database name.
Multiple test databases are created at runtime.

```sh
DATABASE_URL=postgres://admin:password@localhost:5432 yarn test
```

### Building

The resulting Docker image can be built using the Docker CLI.

```sh
docker build --tag appsemble .
```

### Contributing

Please read our [contributing guidelines](./CONTRIBUTING.md).

[docker]: https://docker.com
[docker compose]: https://docs.docker.com/compose
[jest cli options]: https://jestjs.io/docs/en/cli
[nodejs]: https://nodejs.org
[yarn]: https://yarnpkg.com
