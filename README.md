# Appsemble

> The app building platform

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in [here](docs/deployment/helm.md).

### Live Environments

Our production environment is available on [appsemble.app](https://appsemble.app).

Our staging environment is available on
[staging.appsemble.review](https://staging.appsemble.review). This environment hosts the latest
changes in the `master` branch. This environment is reset every night at 04:00 AM UTC.

For each of our internal merge requests a review environment is started at
`${CI_MERGE_REQUEST_IID}.appsemble.review`.

### Requirements

In order to run the Appsemble project in development mode, the following must be installed.

- [Docker][]
- [Docker Compose][]
- [NodeJS 14][nodejs]
- [Yarn][]

### Getting started

Clone and setup the project.

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

### Blocks

#### Publishing Blocks

The blocks can be published using the Appsemble CLI. Note that in order to publish blocks, you need
to be authenticated in the CLI. After having registered an Appsemble account, you can authenticate
yourself using `yarn appsemble login`.

To publish a new block version, the following command can be used.

```sh
yarn appsemble block publish blocks/*
```

Any block that is found within the workspaces listed in `package.json` will be hot-reloaded. More
information about block development and hot-reloading can be found
[here](https://appsemble.app/docs/development/developing-blocks).

### App templates

In order for users to create apps from within the Appsemble Studio, existing apps that can be used
as a starting point must be marked as templates. This can be done using the Appsemble CLI. Note that
in order to publish blocks, you need to be authenticated in the CLI and have proper permissions in
the organization. After having registered an Appsemble account, you can authenticate yourself using
`yarn appsemble login`.

```sh
yarn appsemble app create --organization appsemble --template apps/*
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
