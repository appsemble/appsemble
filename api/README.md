# Appsemble API

The Appsemble API is distributed as a Docker image.

> To pull an image from our registry, a login to the GitLab registry is needed. Go to
> https://gitlab.com/profile/personal_access_tokens. Enter a name for your token, check the
> `read_registry` scope, and create the token. It is highly recommended to use a [credentials
> store][docker credentials store]. Now login using docker. Your GitLab username is the username,
> The token is the password.
>
> ```sh
> docker login registry.gitlab.com
> ```

To pull the latest version, run

```sh
docker pull registry.gitlab.com/dcentralized/appsemble/appsemble
```

Also a Docker image is built for each release.

```sh
docker pull registry.gitlab.com/dcentralized/appsemble/appsemble:$VERSION
```

## Variables

The Appsemble Docker image can be configured using environment variables. Each variable can also be
passed as a command line parameter instead, if desired.

| Variable            | Default | Description                                                                                                            |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_HOST`     | `mysql` | The host of the database to connect to. This defaults to the connected MySQL container.                                |
| `DATABASE_PORT`     | `3306`  | The port of the database to connect to.                                                                                |
| `DATABASE_NAME`     |         | The name of the database to connect to.                                                                                |
| `DATABASE_USER`     |         | The user to use to login to the database.                                                                              |
| `DATABASE_PASSWORD` |         | The password to use to login to the database.                                                                          |
| `DATABASE_URL`      |         | A connection string for the database to connect to. This is an alternative to the separate database related variables. |
| `SENTRY_DSN`        |         | The Sentry DSN to use for error reporting. See [Sentry](https://sentry.io) for details.                                |

## Initializing the Database

A database can be initialized using the following command.

```sh
docker run -ti registry.gitlab.com/dcentralized/appsemble/appsemble:$VERSION --initialize-database
```
