# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- CLI: Add `@appsemble/cli` for block developers.
- Editor: Implement login functionality.
- Editor: Implement social login functionality.
- Server: Add a user API, including email registration.
- Server: Secure the app API using OAuth2 / JWT.
- Server: Add a basic resource API.
- Server: Add new block API.
- Server: Add new block version API.

### Changed

- Server: API was renamed to server.
- Server: The `--initialize-database` flag was changed to the `initialize` subcommand.
- CLI: The `publish` and `register` commands are now subcommands of `block`.

## [0.2.0] - 2018-11-02

### Added

- Docker: Publish the appsemble/appsemble image on the public Docker Hub.
- Editor: Add support for uploading app icons.
- Frontend: Implement error reporting using Sentry.
- Frontend: Add logout button in the side menu
- Server: Implement error reporting using Sentry.

### Changed

- Frontend: Show the page title instead of the app title.

## [0.1.0] - 2018-10-19

This is the initial release of the Appsemble platform.
