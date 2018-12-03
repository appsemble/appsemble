# Appsemble API

The Appsemble API is distributed as a Docker image.

To pull the latest version, run

```sh
docker pull appsemble/appsemble
```

Also a Docker image is built for each release.

```sh
docker pull appsemble/appsemble:$VERSION
```

## Variables

The Appsemble Docker image can be configured using environment variables. Each variable can also be
passed as a command line parameter instead, if desired.

| Variable              | Default | Description                                                                                                            |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_HOST`       | `mysql` | The host of the database to connect to. This defaults to the connected MySQL container.                                |
| `DATABASE_PORT`       | `3306`  | The port of the database to connect to.                                                                                |
| `DATABASE_NAME`       |         | The name of the database to connect to.                                                                                |
| `DATABASE_USER`       |         | The user to use to login to the database.                                                                              |
| `DATABASE_PASSWORD`   |         | The password to use to login to the database.                                                                          |
| `DATABASE_URL`        |         | A connection string for the database to connect to. This is an alternative to the separate database related variables. |
| `SENTRY_DSN`          |         | The Sentry DSN to use for error reporting. See [Sentry](https://sentry.io) for details.                                |
| `OAUTH_GITLAB_KEY`    |         | The application key to be used for GitLab OAuth2.                                                                      |
| `OAUTH_GITLAB_SECRET` |         | The secret key to be used for GitLab OAuth2.                                                                           |
| `OAUTH_GOOGLE_KEY`    |         | The application key to be used for Google OAuth2.                                                                      |
| `OAUTH_GITLAB_SECRET` |         | The secret key to be used for Google OAuth2.                                                                           |

## Initializing the Database

A database can be initialized using the following command.

```sh
docker run -ti appsemble/appsemble --initialize-database
```

## Setting up Social Login

In order to use social logins using third parties like Google or GitLab, an _application key_ and an
_application secret_ must be provided. These can be created
[here](https://console.cloud.google.com/apis/credentials) for Google and
[here](https://gitlab.com/profile/applications) for GitLab. The expected scopes are `email` and
`profile` for Google and `read_user` for GitLab.
