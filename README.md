# Appsemble

> The app building platform

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in the [server readme](server/README.md).

A live deployment is made for each branch. Each deployment has their own subdomain of
_appsemble.app_. The live preview for the master branch can be found on
https://staging.appsemble.review.

### Requirements

In order to run the Appsemble project in development mode, the following must be installed.

- [Docker][]
- [Docker Compose][]
- [NodeJS 12][nodejs]
- [Yarn][]

### Getting started

Clone and setup the project.

```sh
git clone git@gitlab.com:appsemble/appsemble.git
cd appsemble
yarn
```

The project requires a PostgreSQL database. This project contains a Docker Compose configuration to
spin up a preconfigured database with ease.

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

#### Publishing Blocks

The blocks can be published using the Appsemble CLI. Note that in order to publish blocks, you need
to be authenticated in the CLI. After having registered an Appsemble account, you can authenticate
yourself using `yarn appsemble login`.

```sh
yarn appsemble block register --all --build blocks
```

To update a block without registering it as a new block, the following command can be used.

```sh
yarn appsemble block publish --all --build blocks
```

### App templates

In order for users to create apps from within the Appsemble Studio, existing apps that can be used
as a starting point must be marked as templates. This can be done using the Appsemble CLI. Note that
in order to publish blocks, you need to be authenticated in the CLI. After having registered an
Appsemble account, you can authenticate yourself using `yarn appsemble login`.

```sh
yarn appsemble app create --organization @appsemble --all --template apps
```

Note that `@appsemble` in the above scripts refer to the ID an organization that the authenticated
account is a member of.

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

[docker]: https://docker.com
[docker compose]: https://docs.docker.com/compose
[jest cli options]: https://jestjs.io/docs/en/cli
[nodejs 10]: https://nodejs.org
[yarn]: https://yarnpkg.com
