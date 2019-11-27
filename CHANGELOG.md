# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.4] - 2019-11-27

### Added

- Block(`@appsemble/filter`): Add support for check boxes.
- CLI: Add `app` subcommand for creating apps.
- Server: Add option to mark existing apps as templates.
- Studio: Add option to rate apps.
- Studio: Add app details page.
- Studio: Add rating indicators to index page. Apps are now sorted by rating.

### Removed

- Server: Remove file-based app templates.

## [0.9.3] - 2019-11-18

### Added

- App: Add support for absolute URLs in `link` actions.
- App: Add support for push notifications. Users can subscribe to notifications in the app’s
  settings page. More strategies for receiving push notifications will be added in the future.
- App: Add settings page
- Server: Add support for broadcasting push notifications.

## [0.9.2] - 2019-11-14

### Fixed

- Server: Add support connection to PostgreSQL databases over SSL.

## [0.9.1] - 2019-11-14

### Fixed

- Server: Reduce log size when creating blocks.
- Server: Remove old migrations that depended on MySQL.

## [0.9.0] - 2019-11-12

### Added

- Helm: Add support for self managed databases.
- Helm: Test ingress in the success hook.

### Changed

- Helm: Replace MySQL with PostgreSQL.
- Helm: Use Helm 3, dropping support for Helm 2.
- Server: Replace MySQL with PostgreSQL.

## [0.8.11] - 2019-11-01

### Added

- Editor: Add App settings page
- Server: Add support for editing app settings. These settings include `path`, `icon`, `private`,
  and `domain`.
- Server: Add support for customizing the domain at which the app is served.

### Removed

- Editor: Remove icon
- Server: Remove support for `private` and `path` properties in App. These have been moved to
  `/api/apps/{appId}/settings`.

## [0.8.10] - 2019-10-04

### Added

- App: Add `navigation` property to `page`.
- App: Add `hidden` and `left-menu` navigation types.
- Block(`@amsterdam/navigation`): Add navigation block.
- CLI: Add support for `@import` in organization style sheets.

### Fixed

- Block(`@appsemble/form`): Fix `maxLength` not being passed to string input fields.

## [0.8.9] - 2019-10-02

### Fixed

- Editor: Don’t require a login to reset a forgotten password.
- Server: Fix issues related to OData filtering.

## [0.8.8] - 2019-10-01

### Added

- Block(`@appsemble/form`): Add support for field icons.
- Editor: Add support for deleting apps.
- Server: Add support for deleting apps.

## [0.8.7] - 2019-09-16

### Fixed

- Server: Add missing migration from 0.8.6.

## [0.8.6] - 2019-09-16

### Added

- CLI: Convert TypeScript interfaces to JSON schema for block parameter validation.
- CLI: Upload a JSON schema to validate block parameters.
- Server: Blocks are now validated against a JSON schema.

## [0.8.5] - 2019-09-01

### Added

- Server: Log the IP address from which requests are made.
- Server: Partial support for SSL on localhost.

### Changed

- Block(`@appsemble/form`): Form labels inputs are now aligned vertically.

### Fixed

- App: Fix some caching issues in the service worker.
- Block(`@appsemble/form`): Fix issue where `defaultValue` was considered invalid by default.
- Block(`@appsemble/form`): Fix issue where `defaultValue` was not used if value was falsy.

## [0.8.4] - 2019-08-20

### Added

- App: Add `tabs` page type.
- Block(`@appsemble/form`): Add support for client-side validation by setting `required: true`.
- Server: `$created` and `$updated` are exposed in the API.

### Changed

- Block(`@appsemble/form`): Drop support for `bool`. Use `boolean` instead.
- Server: Remove `/_/` routing. Apps are now served from `@organization/appname` and all `/_/`
  routes serve from `/`. This allows for app names no longer being unique for the entirety of
  Appsemble but instead within the organization.

### Fixed

- App: Inverted Bulma colors are calculated properly.
- Editor: Regression causing Appsemble to crash when editing resources.

## [0.8.3] - 2019-08-16

### Added

- App: Add ability to specify different navigation types. Currently only `bottom` is supported,
  which renders a navigation pane at the bottom of the screen. The default is a side menu on the
  left.
- App: Support page icons. These will be rendered in the navigation menu.
- App: Make Leaflet `tileLayer` configurable using `theme` object.
- Editor: Add a toggle for making apps private by default.
- SDK: Add a `theme` object representing the combined theme of the base theme, app theme, page theme
  and block theme to the SDK.

### Fixed

- Editor: The password reset page no longer crashes.

## [0.8.2] - 2019-07-29

### Added

- App: Allow to load media from any source.
- App: Prepend every action with `on`, for example: `click` → `onClick`.
- Block(`@appsemble/form`): Add support for `number`, `integer`, and `boolean` input types.
- Block(`@appsemble/feed`): Add optional button.
- Block(`@appsemble/feed`): Make replies section optional.
- CLI: Parse JSON compatible values for `appsemble config set`.
- Editor: Allow viewing apps without logging in.
- Editor: Redirect back to previous page when logging in.
- Editor: Add support for automatically logging in and redirecting after registering.
- Editor: Allow inviting users without accounts to join an organization.
- Helm: Add health check.
- Helm: Add support for Sentry.
- React: Embrace the new `addCleanup` utility function to cleanup React based blocks automatically.
- SDK: Add a new `addCleanup` utility function.
- Server: Show the date in logs.
- Server: Add health check.
- Server: Support for partial HTTP responses.

### Fixed

- Editor: Fix issue where array or object fields could not be edited.

## [0.8.1] - 2019-06-26

### Fixed

- App: Adjust the toolbar items size. They no longer exceed the main element padding.

## [0.8.0] - 2019-06-25

### Added

- Block(`@appsemble/form`): Add support for hidden for hidden form field.
- Block(`@appsemble/form`): Add support for resolution limits for uploading images.
- Editor: Support basic organization management.
- Server: Support basic organization management.

### Fixed

- Editor: Fix issue where users were unable to verify their accounts when logged in.

## [0.7.0] - 2019-06-14

### Added

- Editor: Add version tag to the header.
- Editor: Display the current Appsemble version in the toolbar.
- Editor: Support for editing user profiles.
- Helm: Add official Helm chart.
- Server: Support database migrations.
- Server: Support editing user profiles.

### Changed

- Editor: Move app templates to the server side.
- Server: Move app templates to the server side.

### Fixed

- Server: Internal server error responses are now logged as such.

## [0.6.0] - 2019-05-20

### Added

- App: Add support for `private` flag in an app definition. Private apps are not included in
  `/api/apps`.
- App: Add support for the new `static` block layout.
- App: Allow `splash` actions to not be full screen. They can still be made full screen by passing
  `fullscreen: true` to the action.
- App: Rename `splash` action to `dialog`.
- Block(`@appsemble/feed`): Add new feed block for showing content similar to social media feeds.
- Editor: Render a user friendly error page if an unexpected error occurs.
- Editor: Report errors to Sentry if this is configured.
- SDK: Add support for the events API.
- Server: Add support for the new `static` block layout.
- Server: Add support for database migrations.

### Changed

- App: Rename a block `position` to `layout`.
- Editor: Remove controls for unconfigured login / registration methods.
- Server: Rename a block `position` to `layout`.
- Server: Move Resource endpoint from `/apps/{appId}/{resourceName}` to
  `/apps/{appId}/resources/{resourceName}`.
- Server: Make App endpoint `/apps` public.

## [0.5.0] - 2019-04-11

### Added

- App: Add support for app description field.
- App: Add ´resource´ action type. This further simplifies the data flow for retrieving and creating
  data.
- App: Add support for building query strings for `resource` and `request` actions.
- Block(`@appsemble/list`): Add List block.
- Block(`@appsemble/markdown`): Add Markdown block.
- CLI: Add support for authentication.
- Editor: Add support for app description field.
- Editor: Add `Person App`, `Holiday App`, and `Unlittered App` app templates.
- Server: Add support for app description field.

### Changed

- App: Rename ´definitions´ to ´resources´ in app definition.
- Block(`@appsemble/detail-viewer`): Rewrite and simplify block.
- Block(`@appsemble/map`): Replace usage of resource with a load action.
- Server: Add security scopes for API calls.

## [0.4.2] - 2019-02-26

### Added

- Server: Add option to disable user registration. This is only implemented server side. The
  registration form still exists in the editor.

## [0.4.1] - 2019-02-20

### Removed

- Server: Remove the initialize sub command. It only served to initialize a default user in
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
- Editor: Host the editor on the root URL. Any other paths are available under sub paths of `/_`.

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

- Docker: Publish the `appsemble/appsemble` image on the public Docker Hub.
- Editor: Add support for uploading app icons.
- Frontend: Implement error reporting using Sentry.
- Frontend: Add logout button in the side menu.
- Server: Implement error reporting using Sentry.

### Changed

- Frontend: Show the page title instead of the app title.

## [0.1.0] - 2018-10-19

This is the initial release of the Appsemble platform.
