# Appsemble Server

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
| `OAUTH_GITLAB_KEY`     |              | The application key to be used for GitLab OAuth2.                                                                      |
| `OAUTH_GITLAB_SECRET`  |              | The secret key to be used for GitLab OAuth2.                                                                           |
| `OAUTH_GOOGLE_KEY`     |              | The application key to be used for Google OAuth2.                                                                      |
| `OAUTH_GOOGLE_SECRET`  |              | The secret key to be used for Google OAuth2.                                                                           |
| `SMTP_HOST`            |              | The host of the SMTP server to connect to.                                                                             |
| `SMTP_PORT`            |              | The port of the SMTP server to connect to.                                                                             |
| `SMTP_SECURE`          | `false`      | Use TLS when connecting to the SMTP server.                                                                            |
| `SMTP_USER`            |              | The user to use to login to the SMTP server.                                                                           |
| `SMTP_PASS`            |              | The password to use to login to the SMTP server.                                                                       |
| `SMTP_FROM`            |              | The address to use when sending emails.                                                                                |
| `DISABLE_REGISTRATION` | `false`      | If specified, user registration will be disabled on the server                                                         |
| `HOST`                 |              | The external host on which the server is available. This should include the protocol, hostname, and optionally port.   |

## Setting up Social Login

In order to use social logins using third parties such as Google or GitLab, an _application key_ and
an _application secret_ must be provided. Follow instructions below to enable login using these
services.

When using social login, the `HOST` variable is required. This should be the full host on which the
Appsemble server is available.

### GitLab

Go to your [GitLab profile applications page](https://gitlab.com/profile/applications).

Add the following redirect URL, where `HOST` is the actual value `HOST` variable.

```
{HOST}/api/oauth/connect/gitlab/callback
```

**Example**: `https://example.com/api/oauth/connect/gitlab/callback`.

Check the `read_user` scope, and click _Save application_.

### Google

Go to the
[Google Cloud console OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
Add the scopes `email` and `profile`. Under _**Authorized domains**_, add the `HOST` variable. Fill
in any missing information and click _Save_.

Now go to the
[Google Cloud console credentials page](https://console.cloud.google.com/apis/credentials). Click
_Create credentials_ → _OAuth client ID_ → _Web application_. Add the `HOST` variable under
_**Authorized JavaScript origins**_. Under _**Authorized redirect URIs**_, add the following URI.

```
{HOST}/api/oauth/connect/google/callback
```

**Example**: `https://example.com/api/oauth/connect/google/callback`.

Check the `read_user` scope, and click _Save application_.
