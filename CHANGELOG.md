# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Block(`data-notifier`): Add new the `data-notifier` block. This has the same functionality as the
  filter block for refreshing new data, but for general use.
- Block(`list`): Add `image` property.
- Block(`map`): Add `defaultLocation` property. This property is used to set the location of the map
  when the user’s location cannot be found. It defaults to Greenwich Park.

## [0.13.4] - 2020-06-29

### Added

- Block(`form`): Add `submitLabel` property for customizing the label on the submit button.
- Block(`form`): Add support for `requirements` in string fields. Please consult the block
  documentation for further details.
- Block(`form`): Add support for `radio` type fields.
- Block(`timer`): Add the timer block.
- Studio: Add new `InviteMember` permission to the maintainer role within an organization. They are
  allowed to invite members, resend invitations and delete pending invitations.
- Studio: Add `Default` column to block documentation.
- Server: Support optional display name upon registration.
- Studio: Support optional display name upon registration.

## [0.13.3] - 2020-06-11

### Added

- App: Add `onSuccess` and `onError` properties to actions. This allows for chaining actions
  together by defining additional actions that are dispatched depending on whether the parent action
  ran successfully or produced an error.
- App: Add `message` action. This action can be used to display messages to the user.

### Changed

- App: Redirect the user to a login page inside the app when logging in instead of linking to
  Appsemble Studio directly.
- Block(`button-list`): Change `label` property type from `string` to `Remapper`.

## [0.13.2] - 2020-06-03

### Added

- CLI: Extract descriptions from TSDoc.
- CLI: Normalize the `--remote` argument.
- Server: Add event descriptions.
- Studio: Add event descriptions.

## [0.13.1] - 2020-06-02

### Added

- Studio: Add support for login with GitHub.
- Studio: Add automated documentation rendering for blocks. This can be found at `/blocks`.

### Changed

- Server: Rename CLI arguments to be consistent with terminology used in OAuth2.
- Studio: Replace login button when not logged in with a dropdown. This allows access to
  documentation and other related links without having to log in beforehand.

### Fixed

- Studio: Fix login with OAuth2.

## [0.13.0] - 2020-05-15

### Added

- App: Allow to proxy requests through the Appsemble API.
- Appsemble: Add support for running `npx appsemble`.
- Block(`detail-viewer`): Implement remappers.
- Block(`list`): Add `icon` property. This can be used to display icons next to the header.
- Create: Add `mini-jsx` template based on the current stats block.
- SDK: Add support for remappers using the `util.remap` function.
- Server: Add support for using remappers in the notification data definition.

### Changed

- App: Proxy requests through the Appsemble API by default.
- App: The `remap` property of actions now uses the new remapper functionality.
- Block(`list`): Replace `name` with `value`.
- Block(`list`): Apply remapper to `value` and `label`.
- Block(`stats`): Replace `name` with `value`.
- Block(`stats`): Apply remapper to `value` and `label`.
- Server: Converted user IDs to use UUID instead of auto-incremented integers.

### Fixed

- Studio: Fix file upload components not displaying correctly.

## [0.12.8] - 2020-04-29

### Fixed

- Server: Fix connection to database with self-signed certificate.

## [0.12.7] - 2020-04-29

### Fixed

- CI: Fix the release process for production.

## [0.12.6] - 2020-04-29

### Added

- App: Add meta description tag.
- App: Add minimal `robots.txt`.
- CLI: Add support for block icons.
- Server: Add support for block icons.
- Studio: Add asset management page for apps. This can be used to preview, download, delete, and
  update assets.

### Fixed

- App: Fix app theme color.
- Studio: Add asset management page for apps. This can be used to preview, download, delete, and
  update assets.

## [0.12.5] - 2020-04-16

### Added

- Block(`@appsemble/detail-viewer`): Add support for icons in string fields.
- Block(`@appsemble/filter`): Add `exact` property for fields. When enabled, the values will be
  checked using equality instead of partial matches.
- Block(`@appsemble/list`): Add `base` property. This can be used when using initial data passed
  through from other actions.
- Block(`@appsemble/list`): Add support for receiving initial data.

### Changed

- Block(`@appsemble/filter`): Make `type` property for fields required.
- Server: Flatten the block publish API.
- CLI: Fix compatibility with the updated block publish API.

## [0.12.4] - 2020-04-06

### Added

- Block(`@appsemble/map`): Add support for custom markers.
- CLI: Publish `@appsemble/cli` on the `npm` registry.
- Server: Add support for outputting CSV in resource API.

### Changed

- Block(`@appsemble/detail-viewer`): Make `field.label` render no label instead of `field.name` if
  the label is undefined.
- Block(`@appsemble/map`): Change default marker from a custom icon to the Font Awesome
  `map-marker-alt` icon.
- Block(`@appsemble/form`): Make `field.label` render no label instead of `field.name` if the label
  is undefined.
- Block(`@appsemble/table`): Make `field.label` render no label in the header if the label is
  undefined. If no labels are defined at all, the table header won’t be displayed at all.
- CLI: Remove `block register` command. You can now always use `block publish` when publishing new
  blocks or new block versions.

## [0.12.3] - 2020-03-27

### Fixed

- App: Fix loading blocks.

## [0.12.2] - 2020-03-27

### Fixed

- App: Fix serving apps.
- Studio: Fix serving Appsemble studio.

## [0.12.1] - 2020-03-26

### Added

- App: Add support for custom `action` format for parameters. This can be used to refer to other
  actions by name, including custom defined actions.
- App: Handle unsupported browsers.
- Block(`@appsemble/button-list`): Add new button list block.
- SDK: Add support for index signature actions.
- Server: Handle unsupported browsers.
- Server: Serve block assets from the app host URL instead of the studio host URL.

## [0.12.0] - 2020-03-20

### Added

- App: Add `resource.subscription.toggle` action.
- App: Add `resource.subscription.status` action.
- App: Add `resource.subscription.unsubscribe` action.
- Preact: Publish `@appsemble/preact` on the `npm` registry.
- SDK: Add `asset` utility function.
- Server: Add option to toggle subscriptions.

### Changed

- App: Rename `resource.subscribe` action to `resource.subscription.subscribe`.
- CLI: Use explicit user agent.

### Fixed

- App: Fix invalid URLs when uploading assets.
- App: Pass data between flow pages.
- Server: Allow CLI to update app block themes if it has the `apps:write` scope.
- Server: Fix issue with invalid role validation for pages with sub pages.

### Changed

- SDK: Remove `block` from bootstrap parameters, `parameters` is now passed in directly.

## [0.11.6] - 2020-03-05

### Added

- App: Add support for block headers.

### Fixed

- Block(`@appsemble/form`): Fix issue where optional fields were marked as invalid.
- App: Fix leak of authorization header to third parties.

## [0.11.5] - 2020-03-03

### Added

- App: Add support for defining query parameters in resource definitions.
- App: Add support for query templates in `request` actions.
- Block(`@appsemble/form`): Add `data` listen event.
- Block(`@appsemble/list`): Add new list block.
- Block(`@appsemble/stats`): Add new stats block.
- CLI: Blocks can be published from parent and sibling directories.
- CLI: Blocks can be served from parent and sibling directories in development.

### Changed

- Block: Rename `@appsemble/list` to `@appsemble/table`.
- CLI: Each block now requires a Webpack configuration file.
- CLI: Enable the `--build` flag by default. Builds can be skipped by using `--no-build`.
- CLI: Replace the `--all` flag with glob support.
- SDK: Parameters, events, and actions are now defined by augmenting the `Parameters`, `Actions`,
  `EventListeners`, and `EventEmitters` interfaces from the `@appsemble/sdk` module. Overriding them
  from `.appsemblerc` is still possible.

### Removed

- Block(`@amsterdam/action`): Move this block into the
  [Amsterdam Appsemble repository](https://gitlab.com/appsemble/amsterdam).
- Block(`@amsterdam/navigation`): Move this block into the
  [Amsterdam Appsemble repository](https://gitlab.com/appsemble/amsterdam).
- Block(`@amsterdam/splash`): Move this block into the
  [Amsterdam Appsemble repository](https://gitlab.com/appsemble/amsterdam).

## [0.11.4] - 2020-02-18

### Added

- Block(`@appsemble/map`): Add marker clustering.
- Block(`@appsemble/map`): Add `disableClustering` parameter.
- Block(`@appsemble/map`): Add `maxClusterRadius` parameter. This can be used to determine when the
  map should cluster markers.

### Changed

- Studio: Hide login button on the login page.
- Studio: Redirect back to the previous page after logging in.

### Fixed

- Studio: Fix crash on the organization invite page.
- Studio: Fix login form not always being visible on protected routes.

## [0.11.3] - 2020-02-17

### Added

- Blocks(`@appsemble/data-loader`): Add `skipInitialLoad` parameter.
- Blocks(`@appsemble/map`): Make `move` emit event optional. When omitted, the map block won’t emit
  refresh events.

### Changed

- Server: Make the `AppId` column for `Asset` is required in the database.

### Fixed

- Server: Fix various issues when extracting app blocks.
- Studio: Fix various issues when extracting app blocks.

## [0.11.2] - 2020-02-12

### Fixed

- Helm: Use the named service port for linking app domains.
- Server: Add resource references to JSON schema.
- Server: Fix serving an app based on a custom domain name.

## [0.11.1] - 2020-02-12

### Fixed

- Server: Fix migration key for 0.10.0 migrations.

## [0.11.0] - 2020-02-12

### Added

- App: Add support for app roles.
- App: Add support for subscribing to resources.
- App: Use Appsemble studio as an OAuth2 authentication provider.
- App: Add simplified legacy fallback for a password login. Simply set `security.login` to
  `password`.
- Block(`@appsemble/data-loader`): Add new block for loading data using the event API.
- Block(`@appsemble/feed`): Add `data` listen event.
- Block(`@appsemble/filter`): Add `data` emit event.
- Block(`@appsemble/list`): Add `data` listen event.
- Block(`@appsemble/map`): Add `data` listen event.
- Block(`@appsemble/map`): Add `refresh` emit event.
- SDK: Add new event API.
- SDK: Add `event` action.
- Server: Add `$author` object to resources if an author is known.
- Studio: Work as an authentication provider for apps.

### Changed

- App: Move login functionality from side menu to top-right corner.
- Studio: Enforce verified email address before organizations can be created.

### Removed

- App: Remove custom authentication mechanisms.
- Block(`@appsemble/feed`): Remove `onLoad` action.
- Block(`@appsemble/list`): Remove `onLoad` action.
- Block(`@appsemble/map`): Remove `onLoad` action.

### Fixed

- App: A lot of stability improvements.

## [0.10.0] - 2019-12-20

### Added

- CLI: Add `--migrate-to` flag for the `start` command.
- CLI: Add support for `--build` flags for `appsemble block register`, and
  `appsemble block publish`.
- CLI: Add support for OAuth2 client credentials.
- CLI: Add support for the system key chain.
- Server: Allow `next` as a migration version. This will migrate to the latest version, even if it’s
  unreleased.
- Server: Add role support to organizations. All current organization members default to the “Owner”
  role.
- Server: Correct authentication for Studio API calls, fixing how OAuth2 was used incorrectly.
- Server: Add correct support for OAuth2 client credentials.
- Server: Add OpenID compatible user info endpoint.
- Studio: Add support for organization members with the “Owner” role to assign the roles of new
  members.
- Studio: Add role detection for several pages in order to ensure users can’t access pages their
  role does not allow the usage of.
- Studio: Add support for cloning apps.
- Studio: Use the new authentication mechanism for API calls.

### Removed

- CLI: email / password login.

## [0.9.5] - 2019-12-02

### Added

- App: Add `base` property for `request` actions.
- App: Add `closable` property to dialog actions.
- App: Add support for basic XML parsing.
- CLI: Add support for `--all` flags for `appsemble block register`, `appsemble block publish`, and
  `appsemble app create`.

### Changed

- Blocks(`@appsemble/filter`): Replace cancel button with clear button in dialog.

### Removed

- Blocks(`@appsemble/filter`): Remove clear filter button.

### Fixed

- App: Fix issue where full screen class was not applied correctly.

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
