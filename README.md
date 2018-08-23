# Appsemble

> The Appsemble Amsterdam project

## Usage

A Docker image is built for each version of Appsemble.

To pull the latest version, run

```sh
docker pull registry.gitlab.com/appsemble/amsterdam
```

Also a Docker image is built for each release.

```sh
docker pull registry.gitlab.com/appsemble/amsterdam:$GIT_VERSION
```

It is also possible to pull a version matching a specific git commit.

```sh
docker pull registry.gitlab.com/appsemble/amsterdam:$GIT_COMMIT_HASH
```

The Docker image uses the following environment variables

| Variable              | Default value | Description
| --------------------- | ------------- | -----------
| `MYSQL_HOST`          | `localhost`   | The host of the MySQL database to connect to.
| `MYSQL_DATABASE`      | `appsemble`   | The name of the MySQL database to connect to.
| `MYSQL_USER`          | `root`        | The username of the database user.
| `MYSQL_ROOT_PASSWORD` | `password`    | The password of the database user.

## Development

### Getting started

Clone and setup the project

```sh
git clone git@gitlab.com:appsemble/amsterdam.git
cd amsterdam
yarn
```

The project requires a MySQL database. This project contains a [docker-compose][] configuration to spin up a preconfigured database with ease.

```sh
docker-compose up -d
```

The project can be served using the following command

```sh
yarn start
```

The project can be built using the following command

```sh
yarn build
```

The result will be output in the *dist/* directory.

### Contributing

Please read our [contributing guidelines](./CONTRIBUTING.md)

[docker-compose]: https://docs.docker.com/compose
