# Appsemble

> The Appsemble Amsterdam project

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in the [server readme](server/README.md).

### Requirements

In order to run the Appsemble project in development mode, the following must be installed.

- [NodeJS 10][]
- [Yarn][]

### Getting started

Clone and setup the project.

```sh
git clone git@gitlab.com:dcentralized/appsemble/appsemble.git
cd appsemble
yarn
```

The project requires a MySQL database. This project contains a [docker-compose][] configuration to
spin up a preconfigured database with ease.

```sh
docker-compose up -d
```

The database can be initialized using the following command.

```sh
yarn initialize
```

The project can be served using the following command.

```sh
yarn start
```

To see additional options, run the following command.

```sh
yarn start --help
```

The frontend project can be built using the following command.

```sh
yarn build
```

The result will be output in the _dist/_ directory. These will be served when the server is run in
production mode.

```sh
NODE_ENV=production yarn start
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
DATABASE_URL=mysql://root:password@localhost:3306 yarn test
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
