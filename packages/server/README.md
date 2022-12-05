# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.20.26/config/assets/logo.svg) Appsemble Server

> The official Appsemble Docker image

[![](https://img.shields.io/docker/v/appsemble/appsemble)](https://hub.docker.com/r/appsemble/appsemble)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.20.26/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.20.26)
[![Code coverage](https://codecov.io/gl/appsemble/appsemble/branch/0.20.26/graph/badge.svg)](https://codecov.io/gl/appsemble/appsemble)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

The Appsemble server is distributed as a Docker image.

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

| Variable               | Default      | Description                                                                                                            |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_HOST`        | `postgresql` | The host of the database to connect to. This defaults to the connected PostgreSQL container.                           |
| `DATABASE_PORT`        | `3306`       | The port of the database to connect to.                                                                                |
| `DATABASE_NAME`        |              | The name of the database to connect to.                                                                                |
| `DATABASE_USER`        |              | The user to use to login to the database.                                                                              |
| `DATABASE_PASSWORD`    |              | The password to use to login to the database.                                                                          |
| `DATABASE_URL`         |              | A connection string for the database to connect to. This is an alternative to the separate database related variables. |
| `SENTRY_DSN`           |              | The Sentry DSN to use for error reporting. See [Sentry](https://sentry.io) for details.                                |
| `GITHUB_CLIENT_ID`     |              | The OAuth2 client ID used for logging in with GitHub in Appsemble Studio.                                              |
| `GITHUB_CLIENT_SECRET` |              | The OAuth2 client secret used for logging in with GitHub in Appsemble Studio.                                          |
| `GITLAB_CLIENT_ID`     |              | The OAuth2 client ID used for logging in with GitLab in Appsemble Studio.                                              |
| `GITLAB_CLIENT_SECRET` |              | The OAuth2 client secret used for logging in with GitLab in Appsemble Studio.                                          |
| `GOOGLE_CLIENT_ID`     |              | The OAuth2 client ID used for logging in with Google in Appsemble Studio.                                              |
| `GOOGLE_CLIENT_SECRET` |              | The OAuth2 client secret used for logging in with Google in Appsemble Studio.                                          |
| `SMTP_HOST`            |              | The host of the SMTP server to connect to.                                                                             |
| `SMTP_PORT`            |              | The port of the SMTP server to connect to.                                                                             |
| `SMTP_SECURE`          | `false`      | Use TLS when connecting to the SMTP server.                                                                            |
| `SMTP_USER`            |              | The user to use to login to the SMTP server.                                                                           |
| `SMTP_PASS`            |              | The password to use to login to the SMTP server.                                                                       |
| `SMTP_FROM`            |              | The address to use when sending emails.                                                                                |
| `DISABLE_REGISTRATION` | `false`      | If specified, user registration will be disabled on the server                                                         |
| `HOST`                 |              | The external host on which the server is available. This should include the protocol, hostname, and optionally port.   |
| `REMOTE`               | `null`       | A remote Appsemble server to connect to in order to synchronize blocks.                                                |

## Setting up Social Login

In order to use social logins using third parties such as Google or GitLab, an _application key_ and
an _application secret_ must be provided. Follow instructions below to enable login using these
services.

When using social login, the `HOST` variable is required. This should be the full host on which the
Appsemble server is available.

### GitHub

Go to your [GitHub OAuth2 Apps](https://github.com/settings/developers) under _Developer settings_.

Add the following Authorization callback URL, where `HOST` is the actual value `HOST` variable.

```
{HOST}/callback
```

**Example**: `https://example.com/callback`.

Click _Register application_.

### GitLab

Go to your [GitLab profile applications page](https://gitlab.com/profile/applications).

Add the following redirect URL, where `HOST` is the actual value `HOST` variable.

```
{HOST}/callback
```

**Example**: `https://example.com/callback`.

Check the `read_user` scope, and click _Save application_.

### Google

Go to the
[Google Cloud console OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
Add the scopes `email` and `profile`. Under **_Authorized domains_**, add the `HOST` variable. Fill
in any missing information and click _Save_.

Now go to the
[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials). Click
_Create credentials_ → _OAuth client ID_ → _Web application_. Add the `HOST` variable under
**_Authorized JavaScript origins_**. Under **_Authorized redirect URIs_**, add the following URI.

```
{HOST}/callback
```

**Example**: `https://example.com/callback`.

Check the `read_user` scope, and click _Save application_.

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.20.26/LICENSE.md) ©
[Appsemble](https://appsemble.com)
