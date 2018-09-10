# Appsemble

> The Appsemble Amsterdam project

## Usage

A Docker image is built for each version of Appsemble.

> To pull an image from our registry, a login to the GitLab registry is needed. Go to https://gitlab.com/profile/personal_access_tokens. Enter a name for your token, check the `read_registry` scope, and create the token. It is highly recommended to use a [credentials store][docker credentials store]. Now login using docker. Your GitLab username is the username, The token is the password.
>
> ```sh
> docker login registry.gitlab.com
> ```

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
| `MYSQL_PORT`          | `3306`        | The port on which the MySQL database is exposed.
| `MYSQL_DATABASE`      | `appsemble`   | The name of the MySQL database to connect to.
| `MYSQL_USER`          | `root`        | The username of the database user.
| `MYSQL_ROOT_PASSWORD` | `password`    | The password of the database user.

## Development

### Requirements

In order to run the Appsemble project in development mode, the following must be installed

- [NodeJS 10][]
- [Yarn][]

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

The database can be initialized using the following command
```sh
yarn setupdb
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
[docker credentials store]: https://docs.docker.com/engine/reference/commandline/login/#credentials-store
[nodejs 10]: https://nodejs.org
[yarn]: https://yarnpkg.com
