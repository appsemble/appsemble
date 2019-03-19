# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- App: Add support for app description field.
- Editor: Add support for app description field.
- Server: Add support for app description field.
- CLI: Add support for authentication.

## [0.4.2] - 2019-02-26

### Added

- Server: Add option to disable user registration. This is only implemented server side. The
  registration form still exists in the editor.

## [0.4.1] - 2019-02-20

### Removed

- Server: Remove the initialize subcommand. It only served to initialize a default user in
  development. This can now be done easily from the editor.

### Fixed

- App: Fix the crash when a splash action is dispatched.

## [0.4.0] - 2019-02-19

### Added

- Editor: Add link to external documentation.
- Extend documentation for creating blocks.
- Add LGPL.

### Changed

- Editor: Add significant changes to the GUI to make it more appealing.
- Editor: Host the editor on the root URL. Any other paths are available under subpaths of `/_`.

### Fixed

- App: Make sure the navigation menu button is always visible.

## [0.3.0] - 2019-01-25

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

## [0.2.0] - 2018-11-02

### Added

- Docker: Publish the appsemble/appsemble image on the public Docker Hub.
- Editor: Add support for uploading app icons.
- Frontend: Implement error reporting using Sentry.
- Frontend: Add logout button in the side menu.
- Server: Implement error reporting using Sentry.

### Changed

- Frontend: Show the page title instead of the app title.

## [0.1.0] - 2018-10-19

This is the initial release of the Appsemble platform.
