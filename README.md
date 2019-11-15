# Appsemble

> The app building platform

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in the [server readme](server/README.md).

A live deployment is made for each branch. Each deployment has their own subdomain of
_appsemble.app_. The live preview for the master branch can be found on
https://staging.appsemble.app.

### Requirements

In order to run the Appsemble project in development mode, the following must be installed.

- [NodeJS 10][]
- [Yarn][]

### Getting started

Clone and setup the project.

```sh
git clone git@gitlab.com:appsemble/appsemble.git
cd appsemble
yarn
```

The project requires a PostgreSQL database. This project contains a [docker-compose][] configuration
to spin up a preconfigured database with ease.

```sh
docker-compose up -d
yarn appsemble migrate
```

The project can be served using the following command.

```sh
yarn start
```

To see additional options, run the following command.

```sh
yarn start --help
```

The front end project can be built using the following command.

```sh
yarn build
```

The result will be output in the _dist/_ directory. These will be served when the server is run in
production mode.

```sh
NODE_ENV=production yarn start
```

### Blocks

#### Building Blocks

The current blocks can be built using the following commands.

```sh
yarn block action
yarn block action-button
yarn block detail-viewer
yarn block list
yarn block feed
yarn block filter
yarn block form
yarn block map
yarn block markdown
yarn block navigation
yarn block splash
```

#### Publishing Blocks

The blocks can be published using the Appsemble CLI. Note that in order to publish blocks, you need
to be authenticated in the CLI. After having registered an Appsemble account, you can authenticate
yourself using `yarn appsemble login`.

```sh
yarn appsemble block register blocks/action
yarn appsemble block register blocks/action-button
yarn appsemble block register blocks/detail-viewer
yarn appsemble block register blocks/list
yarn appsemble block register blocks/feed
yarn appsemble block register blocks/filter
yarn appsemble block register blocks/form
yarn appsemble block register blocks/map
yarn appsemble block register blocks/markdown
yarn appsemble block register blocks/navigation
yarn appsemble block register blocks/splash
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

### Documentation

The Appsemble documentation can be built using `docz`. The documentation can be previewed by running
the following command.

```sh
yarn docz dev
```

The documentation can be compiled by running the following command.

```sh
yarn docz build
```

### Building

The resulting Docker image can be built using the Docker CLI.

```sh
docker build --tag appsemble .
```

### Contributing

Please read our [contributing guidelines](./CONTRIBUTING.md).

[docker-compose]: https://docs.docker.com/compose
[docker credentials store]:
  https://docs.docker.com/engine/reference/commandline/login/#credentials-store
[jest cli options]: https://jestjs.io/docs/en/cli
[nodejs 10]: https://nodejs.org
[yarn]: https://yarnpkg.com
