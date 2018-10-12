# Appsemble

> The Appsemble Amsterdam project

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in the [API readme](api/README.md).

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
yarn start --initialize-database
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

The result will be output in the _dist/_ directory. These will be served when the API is run in
production mode.

```sh
NODE_ENV=production yarn start
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
[nodejs 10]: https://nodejs.org
[yarn]: https://yarnpkg.com
