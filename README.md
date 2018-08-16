# Appsemble

> The Appsemble Amsterdam project

## Getting started

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

## Contributing

Please read our [contributing guidelines](./CONTRIBUTING.md)

[docker-compose]: https://docs.docker.com/compose
