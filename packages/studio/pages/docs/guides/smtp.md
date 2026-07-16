# SMTP

## Table of Contents

- [Introduction](#introduction)
- [Configuration](#configuration)
  - [Settings](#settings)
- [Fallback behavior](#fallback-behavior)
- [Notes](#notes)

## Introduction

Apps send email for a number of built-in flows, such as app member registration and email
verification, password resets, group invites, and the [`email`](../actions/miscellaneous.mdx#email)
action.

By default these emails are sent through the SMTP server configured for the whole Appsemble instance
(see [Docker Compose](../deployment/docker-compose.md)). You can instead configure a dedicated SMTP
server for a single app, so its emails are sent from your own mail server.

## Configuration

App SMTP settings can only be configured after the app has been published. They are not part of the
app definition, cannot be set when creating an app, and cannot be configured through
`.appsemblerc.yaml` or the Appsemble CLI. Configure them in the Studio, or through the
[API](/api-explorer) using `PATCH /api/apps/{appId}`.

In the Studio, select your app, then **Secrets**, then find the **Email settings** segment. Fill in
the fields below and submit to connect the app to your SMTP server.

### Settings

| Field          | Description                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Email name     | The name displayed as sender for emails sent from this app. For example: `John Doe <test@example.com>`, or `test@example.com`. |
| Email host     | The hostname of the custom SMTP server. For example: `smtp.gmail.com`.                                                         |
| Email username | The username used to authenticate against the SMTP server. This address is also used as the sender address of the emails.      |
| Email password | The password used to authenticate against the SMTP server. It is encrypted when stored and is never returned by the API.       |
| Email port     | The port used for the SMTP server. Defaults to `587` when left empty. Common alternatives are `465` and `25`.                  |
| Secure         | Whether TLS is used for the connection. Leave this checked if you're not sure.                                                 |

## Fallback behavior

An app only uses its own SMTP server when the **host**, **username**, and **password** are all set.
If any of these is missing, the app falls back to the instance-wide SMTP server. If neither is
configured, no real email is sent.

## Notes

- The email password is encrypted at rest. The email settings endpoint reports only whether a
  password is set, never its value.
- The current settings can be retrieved with `GET /api/apps/{appId}/email`.
