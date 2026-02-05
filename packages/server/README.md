# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.36.3-test.3/config/assets/logo.svg) Appsemble Server

> The official Appsemble Docker image

[![](https://img.shields.io/docker/v/appsemble/appsemble)](https://hub.docker.com/r/appsemble/appsemble)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.36.3-test.3/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.36.3-test.3)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Variables](#variables)
- [Setting up Social Login](#setting-up-social-login)
  - [GitHub](#github)
  - [GitLab](#gitlab)
  - [Google](#google)
  - [SMTP](#smtp)
    - [Server configuration](#server-configuration)
- [License](#license)

## Installation

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

| Variable                        | Default      | Description                                                                                                            |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_HOST`                 | `postgresql` | The host of the database to connect to. This defaults to the connected PostgreSQL container.                           |
| `DATABASE_PORT`                 | `3306`       | The port of the database to connect to.                                                                                |
| `DATABASE_NAME`                 |              | The name of the database to connect to.                                                                                |
| `DATABASE_USER`                 |              | The user to use to login to the database.                                                                              |
| `DATABASE_PASSWORD`             |              | The password to use to login to the database.                                                                          |
| `DATABASE_URL`                  |              | A connection string for the database to connect to. This is an alternative to the separate database related variables. |
| `SENTRY_DSN`                    |              | The Sentry DSN to use for error reporting. See [Sentry](https://sentry.io) for details.                                |
| `GITHUB_CLIENT_ID`              |              | The OAuth2 client ID used for logging in with GitHub in Appsemble Studio.                                              |
| `GITHUB_CLIENT_SECRET`          |              | The OAuth2 client secret used for logging in with GitHub in Appsemble Studio.                                          |
| `GITLAB_CLIENT_ID`              |              | The OAuth2 client ID used for logging in with GitLab in Appsemble Studio.                                              |
| `GITLAB_CLIENT_SECRET`          |              | The OAuth2 client secret used for logging in with GitLab in Appsemble Studio.                                          |
| `GOOGLE_CLIENT_ID`              |              | The OAuth2 client ID used for logging in with Google in Appsemble Studio.                                              |
| `GOOGLE_CLIENT_SECRET`          |              | The OAuth2 client secret used for logging in with Google in Appsemble Studio.                                          |
| `SMTP_HOST`                     |              | The host of the SMTP server to connect to.                                                                             |
| `SMTP_PORT`                     |              | The port of the SMTP server to connect to.                                                                             |
| `SMTP_SECURE`                   | `false`      | Use TLS when connecting to the SMTP server.                                                                            |
| `SMTP_USER`                     |              | The user to use to login to the SMTP server.                                                                           |
| `SMTP_PASS`                     |              | The password to use to login to the SMTP server.                                                                       |
| `SMTP_FROM`                     |              | The address to use when sending emails.                                                                                |
| `IMAP_HOST`                     |              | The host of the IMAP server to connect to.                                                                             |
| `IMAP_PORT`                     |              | The port of the IMAP server to connect to.                                                                             |
| `IMAP_SECURE`                   | `false`      | Use TLS when connecting to the IMAP server.                                                                            |
| `IMAP_USER`                     |              | The user to use to login to the IMAP server.                                                                           |
| `IMAP_PASS`                     |              | The password to use to login to the IMAP server.                                                                       |
| `IMAP_COPY_TO_SENT_FOLDER`      | `false`      | If specified, sent email will be copied to the IMAP server's "Sent" folder.                                            |
| `ENABLE_APP_EMAIL_QUOTA`        | `false`      | If specified, rate limiting will be applied to emails sent by apps without a custom mail server configured.            |
| `DAILY_APP_EMAIL_QUOTA`         | `10`         | The maximum number of emails an app can send per day without a custom mail server configured.                          |
| `ENABLE_APP_EMAIL_QUOTA_ALERTS` | `false`      | If specified, alerts will be sent to the Appsemble administrator when an app exceeds its daily quota.                  |
| `DISABLE_REGISTRATION`          | `false`      | If specified, user registration will be disabled on the server                                                         |
| `HOST`                          |              | The external host on which the server is available. This should include the protocol, hostname, and optionally port.   |
| `REMOTE`                        | `null`       | A remote Appsemble server to connect to in order to synchronize blocks.                                                |

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

### SMTP

To be able to send emails from your local environment, you need to set up or connect to an SMTP
server.

A project that provides an email testing environment for developers is
[Mailpit](https://github.com/axllent/mailpit). It acts as an SMTP server where you can view and test
captured emails.

For connecting to the SMTP server, you need to obtain the following settings:

- Host
- Port
- Username
- Password

#### Server configuration

In the project’s root `package.json` you can define the following properties under
`"appsembleServer"`:

```json
"smtp-host": "(SMTP Server)",
"smtp-port": "(SMTP Port)",
"smtp-user": "(SMTP Username)",
"smtp-pass": "(SMTP Password)",
"smtp-from": "(Standard email address to put as sender)"
```

These can also be used as CLI parameters.

## Stripe

Stripe is used as a payment provider and there are some things that need to be configured in order
to test it locally, but also so it can run in production. If you want to use Stripe in test mode,
all you need to do is replace the `Webhook secret` and `Private key` with the test versions (test
private key starts with `sk_test`).

### Live environment set-up

1. Grab a `private key` from Stripe dashboard
2. Configure a `webhook` by opening `Stripe dashboard` > `developer console` > `webhooks` >
   `add destination`
3. Select relevant events we want to receive webhooks for
   ('checkout.session.async_payment_failed`, `checkout.session.async_payment_succeeded`, `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`and`invoice.payment_succeeded`)
4. Destination type: `Webhook endpoint`
5. Provide our api endpoint - `https://appsemble.app/api/payments/accept-payment` for production
6. `Webhook secret` should now be shown
7. `Webhook secret` and `private key` need to be uploaded to `environment variables`

### Local testing

It is also possible to test Stripe locally. [Stripe CLI](https://docs.stripe.com/stripe-cli) needs
to be used for this. From here you can either install `VScode Stripe` extension which provides UI
for all the actions or use the CLI directly from the command line.

With the Stripe CLI you can expose an endpoint on your machine that will receive webhooks from
`Stripe` allowing you to test the full payment flow. You can also manually trigger different events.

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.36.3-test.3/LICENSE.md) ©
[Appsemble](https://appsemble.com)
