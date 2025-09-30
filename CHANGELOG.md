# ![](config/assets/logo.svg) Changelog

All notable changes to this project will be documented in this file.

## \[[0.35.0](https://gitlab.com/appsemble/appsemble/-/releases/0.35.0)] - 2025-09-30

## \[[0.34.22-test.6](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.6)] - 2025-09-30

### Changed

- Utils: **Breaking** All app groups related endpoints are now prefixed by `/apps/<app-id>`.
- Utils: **Breaking** All app invite related endpoints are now prefixed by `/apps/<app-id>`.
- Utils: **Breaking** All app member related endpoints are now prefixed by `/apps/<app-id>`.

## \[[0.34.22-test.5](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.5)] - 2025-09-26

## \[[0.34.22-test.4](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.4)] - 2025-09-26

## \[[0.34.22-test.3](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.3)] - 2025-09-26

### Added

- E2e: Added `addAppToAppCollection` fixture.
- E2e: Added `aliasAppDomain` fixture.
- E2e: Added `clickAppSideMenuItemOnPage` fixture.
- E2e: Added `clickAppSideMenuItem` fixture.
- E2e: Added `createOrganization` fixture.
- E2e: Added `deleteApp` fixture.
- E2e: Added `deleteOrganization` fixture.
- E2e: Added `loginUserOnPage` fixture.
- E2e: Added `uploadAppMessages` fixture.

### Changed

- E2e: Added `level` parameter to the `randomTestId` fixture to choose the level of detail.
- E2e: The `visitApp` fixture now returns the URL of the live app.

## \[[0.34.22-test.2](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.2)] - 2025-09-25

## \[[0.34.22-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.1)] - 2025-09-25

## \[[0.34.22-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.22-test.0)] - 2025-09-25

## \[[0.34.21](https://gitlab.com/appsemble/appsemble/-/releases/0.34.21)] - 2025-09-19

## \[[0.34.20](https://gitlab.com/appsemble/appsemble/-/releases/0.34.20)] - 2025-09-19

## \[[0.34.19](https://gitlab.com/appsemble/appsemble/-/releases/0.34.19)] - 2025-09-19

## \[[0.34.18](https://gitlab.com/appsemble/appsemble/-/releases/0.34.18)] - 2025-09-19

### Fixed

- React-components: Invert `allowPristine` field for the `SimpleSubmit` and `SimpleModalFooter`
  components.

## \[[0.34.18-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.34.18-test.1)] - 2025-09-19

## \[[0.34.18-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.18-test.0)] - 2025-09-18

### Fixed

- Server: Importing resources from CSV files with assetIds fail.

## \[[0.34.17](https://gitlab.com/appsemble/appsemble/-/releases/0.34.17)] - 2025-09-18

### Added

- Block(`table`): Add new field `checkbox` to select data.

### Fixed

- App: Close the modal in `dialog` action without errors.
- React-components: Use sentry api URL from the sentryDSN.
- Service-worker: Clear cache on resource position updates.

## \[[0.34.16](https://gitlab.com/appsemble/appsemble/-/releases/0.34.16)] - 2025-09-11

### Added

- App: Add debug button to app navigation. Improve app debug page.

### Fixed

- Block(`form`): Fix selection option min-width.

## \[[0.34.15](https://gitlab.com/appsemble/appsemble/-/releases/0.34.15)] - 2025-09-09

### Changed

- Server: Invert dry-run logic for commands to be on by default, replacing the confusing
  \--no-dry-run flag with the more standard --dry-run.

## \[[0.34.15-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.34.15-test.1)] - 2025-09-04

## \[[0.34.15-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.15-test.0)] - 2025-09-04

## \[[0.34.14](https://gitlab.com/appsemble/appsemble/-/releases/0.34.14)] - 2025-09-04

### Changed

- Block(`list`): Grey area (list item content) in big list block items (e.g. ones containing an
  image) is now clickable.

## \[[0.34.13](https://gitlab.com/appsemble/appsemble/-/releases/0.34.13)] - 2025-09-03

## \[[0.34.12](https://gitlab.com/appsemble/appsemble/-/releases/0.34.12)] - 2025-09-03

### Added

- Block(`feed`): Support dropdown with options.
- App: Add `profileDropdown` option to page navigation enum.
- App: Add phone number support for `app.member.register` and `app.member.current.patch` actions.
- App: Make settings page customisable.

### Fixed

- Block(`form`): Allow images to be captured from the camera for file inputs.
- Server: Apply filters to the demo app member query.
- Service-worker: Don't cache opaque responses.

## \[[0.34.11](https://gitlab.com/appsemble/appsemble/-/releases/0.34.11)] - 2025-08-19

### Added

- Block(`button-list`): Add new parameter `alignment` to allow aligning buttons left, right or
  center.

### Changed

- Block(`cards`): Renamed `itemDefinition` field to `card`.

### Removed

- Block(`cards`): Remove option `actionButton` from card definition.
- Block(`cards`): Remove option `dropdown` from card definition.

## \[[0.34.10](https://gitlab.com/appsemble/appsemble/-/releases/0.34.10)] - 2025-08-18

### Fixed

- Service-worker: pass data correctly to notifications.

## \[[0.34.10-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.10-test.0)] - 2025-08-15

## \[[0.34.9](https://gitlab.com/appsemble/appsemble/-/releases/0.34.9)] - 2025-08-13

### Fixed

- Block(`list`): Properly toggle collapsed lists. Handle header button click only once.

## \[[0.34.9-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.9-test.0)] - 2025-08-12

### Fixed

- Block(`list`): Fix buttons in header and footer.

## \[[0.34.8](https://gitlab.com/appsemble/appsemble/-/releases/0.34.8)] - 2025-08-11

### Added

- Block(`button-list`): Add option to disable clicking for a button.
- Block(`button-list`): Add option to hide a button.
- Block(`cards`): New block cards.
- Block(`list`): Handle scroll to item after back navigation.

## \[[0.34.7](https://gitlab.com/appsemble/appsemble/-/releases/0.34.7)] - 2025-08-08

### Changed

- Block(`list`): Show buttons for drag and drop on mobile.

### Fixed

- Block(`list`): Handle clicks also when clicking outside the button in the header.
- Block(`list`): Handle expanding collapsed lists by clicking outside the button itself.

## \[[0.34.6](https://gitlab.com/appsemble/appsemble/-/releases/0.34.6)] - 2025-08-04

## \[[0.34.5](https://gitlab.com/appsemble/appsemble/-/releases/0.34.5)] - 2025-08-04

## \[[0.34.5-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.34.5-test.0)] - 2025-08-02

## \[[0.34.4](https://gitlab.com/appsemble/appsemble/-/releases/0.34.4)] - 2025-08-01

### Added

- Lang-sdk: Add new remapper `array.join` which joins an array using the provided separator.

### Fixed

- Server: Add email attachments from assets with names.

## \[[0.34.3](https://gitlab.com/appsemble/appsemble/-/releases/0.34.3)] - 2025-07-29

### Added

- E2e: Added `loginAppAppsembleLogin` fixture.
- E2e: Added `patchApp` fixture.
- E2e: Added `randomTestId` fixture.
- Types: Added types for end-to-end fixtures.

### Changed

- E2e: Allow assets to be uploaded together with resources.
- E2e: Allow more options for app fixtures.
- E2e: Rename `loginDemoApp` to `createAndLoginDemoAppMember` and make it more robust.

## \[[0.34.2](https://gitlab.com/appsemble/appsemble/-/releases/0.34.2)] - 2025-07-25

## \[[0.34.1](https://gitlab.com/appsemble/appsemble/-/releases/0.34.1)] - 2025-07-25

## \[[0.33.12](https://gitlab.com/appsemble/appsemble/-/releases/0.33.12)] - 2025-07-25

## \[[0.33.11](https://gitlab.com/appsemble/appsemble/-/releases/0.33.11)] - 2025-07-25

## \[[0.33.12](https://gitlab.com/appsemble/appsemble/-/releases/0.33.12)] - 2025-07-25

### Added

- Server: New endpoint `updateAppMemberProperties` using put mechanism to update the app member
  properties.

## \[[0.33.11](https://gitlab.com/appsemble/appsemble/-/releases/0.33.11)] - 2025-07-17

### Added

- App: Auto update apps when a new version is available.
- App: Clicking on the logo in the navbar takes you to the default page.

### Changed

- App: Render the logo on the left side of header text.

### Fixed

- Server: Fix updating an app with resource positions unique index.

## \[[0.33.10](https://gitlab.com/appsemble/appsemble/-/releases/0.33.10)] - 2025-07-14

## \[[0.33.9](https://gitlab.com/appsemble/appsemble/-/releases/0.33.9)] - 2025-07-11

### Fixed

- Block(`form`): Fieldset now correctly handles undefined arrays.

## \[[0.33.8](https://gitlab.com/appsemble/appsemble/-/releases/0.33.8)] - 2025-07-11

## \[[0.33.7](https://gitlab.com/appsemble/appsemble/-/releases/0.33.7)] - 2025-07-09

### Changed

- App: Hide the app logo from the title bar by default.

### Fixed

- Block(`list`): Items outside a group are now rendered only once.
- Lang-sdk: App validation fails for resource actions that are used only in cron job.

## \[[0.33.6](https://gitlab.com/appsemble/appsemble/-/releases/0.33.6)] - 2025-07-07

### Added

- App: Add support for app logos for all apps.

### Fixed

- App: Handle service worker error.
- Cli: Use the referencing property if it's present instead of the dynamic `$` one when publishing
  seed resources.
- Server: Assets' uniqueness now only applies to not deleted assets.
- Server: Generate correct query for `is null` and `is not null` queries.

## \[[0.33.5](https://gitlab.com/appsemble/appsemble/-/releases/0.33.5)] - 2025-07-04

### Fixed

- Server: Server actions not working as expected with the history remapper.
- Server: `app.member.query` action not applying roles correctly in the sequelize query.

## \[[0.33.4](https://gitlab.com/appsemble/appsemble/-/releases/0.33.4)] - 2025-07-03

### Added

- App: Add new option `query` to `app.member.query` action, which allows filtering using oData
  standard.
- Server: Add new option `query` to `app.member.query` action, which allows filtering using oData
  standard.

### Changed

- Block(`list`): New styling for collapsible lists.

### Fixed

- Block(`form`): Handle form submission errors better.
- Server: Dynamic resource indexes are now created correctly.
- Server: Show all app member emails in resource history.
- Utils: The `filter.from` remapper now correctly casts to string for `String` entries and works
  with remappers that resolve to null.

## \[[0.33.3](https://gitlab.com/appsemble/appsemble/-/releases/0.33.3)] - 2025-06-27

### Added

- Block(`filter`): New parameter `defaultFilter` which allows you to define a default filter for
  every request.
- Server: Support the `app.member.query` action on the server.

### Fixed

- App: Count blocks filtered by app roles towards block prefix indexes.

## \[[0.33.2](https://gitlab.com/appsemble/appsemble/-/releases/0.33.2)] - 2025-06-26

### Added

- Block(`list`): Allow downloading assets by clicking on the asset name or icon.

### Changed

- Block(`filter`): Support dynamic values in enum options for enum and list filters.

### Fixed

- Block(`list`): Fix header styles with icons and images.
- App: Tabs page security roles not working for the entire page.
- Server: Fix server side `notify` action.

## \[[0.33.1](https://gitlab.com/appsemble/appsemble/-/releases/0.33.1)] - 2025-06-26

## \[[0.33.0](https://gitlab.com/appsemble/appsemble/-/releases/0.33.0)] - 2025-06-25

### Added

- Preact-components: Support icon class name in the dropdown component.
- Studio: Allow a training chapter to be blocked by multiple chapters.

### Changed

- Block(`list`): Support defining header, content and footer separately. Mutually exclude images and
  icons, buttons and dropdowns in headers and footers.
- Types: Allow array of strings in `TrainingChapter` and `TrainingChapterProperties` types'
  `blockedBy` properties.

## \[[0.32.3](https://gitlab.com/appsemble/appsemble/-/releases/0.32.3)] - 2025-06-18

### Added

- Block(`form`): Add action support in the selection input field for removing existing items.
- Server: Support adding group members directly without sending a confirmation email.

### Fixed

- Server: Translate app name in reset password emails.

## \[[0.32.3-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.32.3-test.1)] - 2025-06-13

### Fixed

- Block(`detail-viewer`): Fix hiding bullet points.
- Block(`list`): Render leftover list items on top of grouped items.

## \[[0.32.3-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.32.3-test.0)] - 2025-06-12

### Fixed

- Block(`form`): List input not outputting the data in right format.

## \[[0.32.2](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2)] - 2025-06-11

### Added

- App: Add new action **csv.parse** to parse csv files on the front-end.
- Server: Allow notifying specific roles in `to` field of the **notify** action.
- Utils: Add new remappers `array.contains` and `string.contains`.

### Fixed

- E2e: Fixed package not being set to public.
- Server: App member patch should not over write existing properties.

## \[[0.32.2-test.9](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.9)] - 2025-05-30

### Changed

- E2e: Publicize e2e package.

## \[[0.32.2-test.8](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.8)] - 2025-05-23

### Fixed

- Block(`feed`): No longer throws an error when you haven't defined a `latitude` and `longtitude`
  even though you didn't define a `marker`.

## \[[0.32.2-test.7](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.7)] - 2025-05-21

### Fixed

- App: Translate app name on the title bar of the reset password page.
- Server: Fix app name not being translated in the app emails.

## \[[0.32.2-test.6](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.6)] - 2025-05-14

### Fixed

- Block(`form`): Emit form change on initial render as well.

## \[[0.32.2-test.5](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.5)] - 2025-05-14

### Fixed

- Block(`form`): Fix emitting form changes.

## \[[0.32.2-test.4](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.4)] - 2025-05-08

### Added

- Node-utils: Support for custom delimiters when importing resources from CSV files.

## \[[0.32.2-test.3](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.3)] - 2025-05-07

### Changed

- Block(`form`): Support remappers in `minLength` and `maxLength` requirements.
- Studio: Preview button no longer gets disabled when there are unsaved changes.

### Fixed

- Block(`form`): Add default value for fieldsReady.
- Block(`form`): Properly handle the remapped show property of fieldset fields.
- Block(`form`): Properly reset options in enum fields based on form state.
- E2e: Wait until training chapters are loaded to prevent test flakiness.
- Server: Use the default language of the app for app and group invites.

## \[[0.32.2-test.2](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.2)] - 2025-04-28

### Changed

- Node-utils: Support null values for binary strings in resources.

### Fixed

- Block(`form`): Don't remove thumbnails when removing an image from the file input.
- Block(`form`): Start the markdown editor as interactive.
- Block(`form`): Start videos muted in file inputs, handle first frame capture only once.
- Block(`form`): Wait for file input fields to load before allowing the form to be submitted.
- Block(`list`): Refetch image on value change.

## \[[0.32.2-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.1)] - 2025-04-28

### Added

- Block(`form`): Option to hide the submit button.
- E2e: Custom matchers to assert training node status.
- E2e: End-to-end tests for trainings.
- Studio: Add cron security definition documentation with example code.

### Removed

- Studio: Remove note on unsupported service secrets for cron jobs.

### Fixed

- Server: Assign app member in `ResourceVersions` failing.
- Server: Permission check for `resource.history.get` action.

## \[[0.32.2-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.32.2-test.0)] - 2025-04-15

## \[[0.32.1](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1)] - 2025-04-11

### Added

- Block(`detail-viewer`): Add an option to **hide** a field.
- Block(`form`): Add support for `datalist` in string fields.
- Utils: Add `maths` remapper.

### Changed

- Block(`table`): Change sorting to emit an event instead of sorting the data in memory.

### Fixed

- Cli: App extract messages command failing if **app** is not defined in the messages file.

## \[[0.32.1-test.17](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.17)] - 2025-04-10

### Added

- Block(`form`): Add requirements and validation to `MarkdownInput` field.
- App: `onLoad` action support for flow pages.

### Changed

- Block(`form`): Make the `MarkdownInput` field take up the whole width of the form.

### Fixed

- Block(`form`): Fix `MarkdownInput` styling.
- Block(`table`): Do not allow clicking on headers if **name** property is not defined for the
  field.
- Server: App member verification or properties patch leading to properties being overwritten.
- Utils: Publish app failing when `condition` action is defined without either `then` or `else`.

## \[[0.32.1-test.16](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.16)] - 2025-04-07

### Changed

- Block(`pdf-viewer`): Allow string values for width and height.

### Fixed

- Block(`form`): Fix thumbnail logic.
- Block(`list`): Fix spacing.

## \[[0.32.1-test.15](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.15)] - 2025-04-03

## \[[0.32.1-test.14](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.14)] - 2025-04-02

### Added

- Utils: Add `object.compare` remapper.
- Utils: Add `object.explode` remapper.
- Utils: Add `prevItem` and `nextItem` to the `array` remapper.

## \[[0.32.1-test.13](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.13)] - 2025-03-28

### Added

- Block(`form`): Support showing and removing selected options in the selection field.

### Changed

- Block(`form`): Show remove button in selection field regardless of `minItems`.

### Fixed

- Block(`form`): Hide long submission message on form error.
- App: Handle `notify` action in dynamic tabs.
- Server: Send notifications to AppMemberId instead of UserId.

## \[[0.32.1-test.12](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.12)] - 2025-03-26

### Added

- Block(`table`): Allow an option to be disabled in the dropdown fields.

### Changed

- Block(`filter`): Better style highlighted fields.
- App: Improve the process of changing locale preference for an app member.

### Fixed

- Server: Assets count endpoint returning wrong number in demo apps.
- Server: Reseeding demo apps fail in some cases.
- Studio: Move the description of how to use `id` from `resource.update` to `resource.patch` since
  these were swapped around.

## \[[0.32.1-test.11](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.11)] - 2025-03-20

## \[[0.32.1-test.10](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.10)] - 2025-03-20

### Added

- Server: Add support for custom app webhooks.
- Studio: Docs for `resource.update.positions` action.

## \[[0.32.1-test.9](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.9)] - 2025-03-10

### Fixed

- Cli: Dev server failing assets requests.

## \[[0.32.1-test.8](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.8)] - 2025-03-04

### Added

- Utils: Add `slice` remapper to support slicing arrays and strings.

### Removed

- Utils: Remove `string.slice` remapper.

### Fixed

- Block(`table`): Fix not being able to return to the initial state of the data.
- Studio: Import app feature making a request to the wrong endpoint.
- Studio: Import translations succeeding but throwing an error at the same time.

## \[[0.32.1-test.7](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.7)] - 2025-02-26

## \[[0.32.1-test.6](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.6)] - 2025-02-26

### Added

- Block(`list`): Support aspect ratios for images.
- Utils: Add `filter.from` and `order.from` OData remappers.

### Fixed

- App: Don't format dynamic tabs' names.

## \[[0.32.1-test.5](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.5)] - 2025-02-21

### Added

- App: Add `resource.delete.bulk` and `resource.delete.all` actions.

### Changed

- App: Use email address as the fallback if the name is not set for `displayAppMemberName`.

## \[[0.32.1-test.4](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.4)] - 2025-02-18

## \[[0.32.1-test.3](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.3)] - 2025-02-18

## \[[0.32.1-test.2](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.2)] - 2025-02-17

## \[[0.32.1-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.1)] - 2025-02-17

## \[[0.32.1-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.0)] - 2025-02-14

## \[[0.32.0](https://gitlab.com/appsemble/appsemble/-/releases/0.32.0)] - 2025-02-13

### Changed

- Server: Use S3 compatible storage for app assets.

## \[[0.31.1-test.6](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.6)] - 2025-02-13

## \[[0.31.1-test.5](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.5)] - 2025-02-12

### Added

- Utils: New remapper `length` to fetch the length of the input array or string.

## \[[0.31.1-test.4](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.4)] - 2025-02-12

### Added

- App: Display name of the logged in app member in the title bar.
- App: Option to add profile picture from the camera in mobile devices.

### Fixed

- Block(`filter`): Render only one label for boolean fields.
- Cli: Fix `block build` command.
- Server: Wrong app member picture url.
- Studio: Fix "Unsaved changes" popup appearing in the editor even after the app has been saved.

## \[[0.31.1-test.3](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.3)] - 2025-02-06

### Added

- Block(`form`): Add filter option to enum field.

### Fixed

- Block(`filter`): Escape single quote and back-slash characters.
- Studio: Remapper links in docs generated from a schema.

## \[[0.31.1-test.2](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.2)] - 2025-02-03

## \[[0.31.1-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.1)] - 2025-01-31

## \[[0.31.1-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.0)] - 2025-01-27

## \[[0.31.0](https://gitlab.com/appsemble/appsemble/-/releases/0.31.0)] - 2025-01-27

## \[[0.30.14-rc.0](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-rc.0)] - 2025-01-24

### Added

- App: Allow setting resource id explicitly in `resource.get` and `resource.patch` actions.
- Utils: Add AND and OR remappers.

### Fixed

- App: Switching groups should not navigate to Home page.
- Server: Resource patch endpoint returning error for non-logged in users.

## \[[0.30.14-test.7](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.7)] - 2025-01-14

### Added

- App: Add a PWA installation button and modal prompt to apps.

### Changed

- Server: Soft delete assets and resources.

## \[[0.30.14-test.6](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.6)] - 2025-01-02

### Added

- Block(`table`): Add new field `name` to enable sorting fields.
- App: Allow expiring data in `localStorage` using storage actions.

### Changed

- Block(`detail-viewer`): Default date render behavior.
- Block(`list`): Default date render behavior.
- Block(`table`): Default date render behavior.
- Block(`wordcloud`): Default date render behavior.

### Fixed

- Block(`form`): Properly denote optional fieldset and selection fields.
- App: Properly clear page data when the page changes.
- Studio: App member and group invites default role.

## \[[0.30.14-test.5](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.5)] - 2024-12-10

### Fixed

- Server: Fix notifications subject.

## \[[0.30.14-test.4](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.4)] - 2024-12-09

### Added

- Server: Support ca in `client-certificate` service secrets.

### Fixed

- App: Allow selecting no group in group dropdown, translate app roles.
- Server: Fix flaky update app collection tests.

## \[[0.30.14-test.3](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.3)] - 2024-12-09

### Changed

- App: Move group selection to a separate dropdown in the navbar.

### Fixed

- Studio: Add empty `scope` when creating secrets without scope.

## \[[0.30.14-test.2](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.2)] - 2024-12-03

### Added

- Server: Log proxy OAuth2 token errors.

## \[[0.30.14-test.1](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.1)] - 2024-12-02

## \[[0.30.14-test.0](https://gitlab.com/appsemble/appsemble/-/releases/0.30.14-test.0)] - 2024-12-02

### Added

- App: Automatically subscribe to all resource actions notifications.
- Scripts: Add support for `test` and `rc` pre-releases.
- Server: Log proxied responses in verbose mode.

### Fixed

- Server: Associate app subscriptions to app members instead of users.

## \[[0.30.13](https://gitlab.com/appsemble/appsemble/-/releases/0.30.13)] - 2024-11-21

### Fixed

- App: Fix app member patch form and use the right URL.
- Server: Properly connect app members to app OAuth2 authorizations.
- Studio: Remapper docs links on index remapper page.

## \[[0.30.12](https://gitlab.com/appsemble/appsemble/-/releases/0.30.12)] - 2024-11-19

### Added

- Block(`form`): Add `prohibited` requirement.
- Server: Add `scope` to `client-credentials` service secrets.
- Studio: Add `scope` to `client-credentials` service secrets.
- Utils: Add `scope` to `client-credentials` service secrets.

### Fixed

- Block(`form`): Refactor types and validation.
- Studio: Add missing translation `GetAppResourceHistory`.

## \[[0.30.11](https://gitlab.com/appsemble/appsemble/-/releases/0.30.11)] - 2024-11-13

### Added

- Service-worker: Cache `HEAD` requests by matching them against cached `GET` requests.
- Service-worker: Cache app image assets.

### Changed

- Block(`list`): Don't use the data passed to the block if there is a data event listener present.

### Fixed

- Block(`form`): Fetch image headers in the selection input, only when the item is visible.
- Block(`list`): Fetch image headers in the list, only when the item is visible.
- Server: Don't load asset data of the compressed image when fetching asset headers.

## \[[0.30.10](https://gitlab.com/appsemble/appsemble/-/releases/0.30.10)] - 2024-11-12

### Changed

- Webpack-core: Enable mermaid for local diagram renders.

### Fixed

- Server: Properly apply the EXIF meta tag to images when compressing them.
- Studio: Fix mermaid diagram renders.

## \[[0.30.9](https://gitlab.com/appsemble/appsemble/-/releases/0.30.9)] - 2024-11-12

### Added

- App: App support for `content-type` header in request action.

## \[[0.30.8](https://gitlab.com/appsemble/appsemble/-/releases/0.30.8)] - 2024-11-11

### Added

- Preact-components: Lazy load images in the `ImageComponent`.
- Studio: Add options for resending and deleting app and group invites.

### Fixed

- Block(`form`): Fix page params being added to data even when `onLoad` action is not defined.
- App: Fix passing empty roles array to `/api/apps/{appId}/members`.
- Server: Clear assets cache every hour.
- Server: Fix querying app members by roles.
- Studio: Fix app, page apps causing errors.

## \[[0.30.7](https://gitlab.com/appsemble/appsemble/-/releases/0.30.7)] - 2024-11-05

### Fixed

- Server: Fetch only snapshot ID when querying `AppSnapshot` for creating settings.
- Studio: Fix redirect in organization invite flow.

## \[[0.30.6](https://gitlab.com/appsemble/appsemble/-/releases/0.30.6)] - 2024-11-04

## \[[0.30.5](https://gitlab.com/appsemble/appsemble/-/releases/0.30.5)] - 2024-11-04

### Removed

- Utils: Remove redundant property `method` from resource actions.

## \[[0.30.4](https://gitlab.com/appsemble/appsemble/-/releases/0.30.4)] - 2024-11-04

### Added

- Block(`form`): Add `onSelect` option to enum fields to fire an action when the value changes.
- App: Add all demo app members to newly created group in demo apps.
- App: Add demo app members created by demo login to existing groups in demo apps.
- App: Add new action `resource.history.get` to fetch the history of a resource.
- Server: Add caching to improve app asset query imporvements.
- Server: Add indexes to tables to improve query performance.

### Changed

- Cli: Require a role for inviting a user to a group through the cli.

### Removed

- App: Remove option to join groups in demo apps.

### Fixed

- Block(`form`): Display enum fields as hidden when `show` is `false` so they can still listen to
  events.
- App: Fix group selection from profile dropdown.
- Studio: `App Definition` menu section not being visible in the side menu.
- Utils: Fix delete assets endpoint security.

## \[[0.30.3](https://gitlab.com/appsemble/appsemble/-/releases/0.30.3)] - 2024-10-23

### Added

- Block(`form`): Add an option for enum fields with values remapped from other form fields.
- Block(`table`): Add a new field `caption` to add captions to tables.
- Utils: Support negative index in `prop` remapper for array inputs.

### Fixed

- App: Disable login if no roles are defined in the security definition.

## \[[0.30.2](https://gitlab.com/appsemble/appsemble/-/releases/0.30.2)] - 2024-10-16

### Added

- App: Add support for `badgeCount` property on a page that shows a counter in the side menu or
  bottom navigation.

## \[[0.30.1](https://gitlab.com/appsemble/appsemble/-/releases/0.30.1)] - 2024-10-08

## \[[0.30.0](https://gitlab.com/appsemble/appsemble/-/releases/0.30.0)] - 2024-10-08

### Added

- Block(`form`): Add `onLoad` action to load fields without using the `data-loader` block.
- App: Add `app.member.current.patch` action.
- App: Add `app.member.invite` action.
- App: Add `app.member.properties.patch` action.
- App: Add `app.member.role.update` action.
- App: Add `group.member.delete` action.
- App: Add `group.member.role.update` action.
- App: Add `sub`, `email_verified`, `zoneinfo` and `role` properties to `app.member` remapper.
- App: Resources and assets can now be scoped to a group (previously team). The roles of group
  members within the group determine who within the group has access to them.
- Server: Add permissions concept.
- Server: Add predefined app roles that can be inherited.
- Server: Apps will now be migrated whenever a breaking change is made to the app definition. A new
  app snapshot is made. (todo: add ability to approve of the snapshot to be published).
- Studio: Add `email` attribute field to SAML secret. The default value used is
  `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`.
- Studio: Add the ability to invite emails to apps with a certain app role, making them app members.
- Studio: Add the ability to invite emails to groups with a certain app role, making them group
  members.
- Utils: New endpoint `/api/app-invites/{token}/respond`.
- Utils: New endpoint `/api/app-invites/{token}`.
- Utils: New endpoint `/api/app-members/{appMemberId}/properties`.
- Utils: New endpoint `/api/app-members/{appMemberId}/role`.
- Utils: New endpoint `/api/app-members/{appMemberId}`.
- Utils: New endpoint `/api/apps/{appId}/auth/email/login`.
- Utils: New endpoint `/api/apps/{appId}/auth/email/register`.
- Utils: New endpoint `/api/apps/{appId}/demo-groups`.
- Utils: New endpoint `/api/apps/{appId}/demo-members`.
- Utils: New endpoint `/api/apps/{appId}/groups`.
- Utils: New endpoint `/api/apps/{appId}/invites`.
- Utils: New endpoint `/api/apps/{appId}/members/current/groups`.
- Utils: New endpoint `/api/apps/{appId}/members/current/link`.
- Utils: New endpoint `/api/apps/{appId}/resources`.
- Utils: New endpoint `/api/group-invites/{token}/respond`.
- Utils: New endpoint `/api/group-invites/{token}`.
- Utils: New endpoint `/api/group-members/{groupMemberId}/role`.
- Utils: New endpoint `/api/group-members/{groupMemberId}`.
- Utils: New endpoint `/api/groups/{groupId}/invites`.
- Utils: New endpoint `/api/groups/{groupId}/members`.
- Utils: New endpoint `/api/groups/{groupId}`.
- Utils: New endpoint `/api/training-blocks/{trainingBlockId}`.

### Changed

- App: **Breaking(migrated)** - Remove `appMember` remapper. Use `app.member` instead.
- App: **Breaking(migrated)** - Rename `team.invite` action to `group.member.invite`.
- App: **Breaking(migrated)** - Rename `team.list` action to `group.query`.
- App: **Breaking(migrated)** - Rename `team.members` action to `group.member.query`.
- App: **Breaking(migrated)** - Rename `user.login` action to `app.member.login`.
- App: **Breaking(migrated)** - Rename `user.logout` action to `app.member.logout`.
- App: **Breaking(migrated)** - Rename `user.query` action to `app.member.query`.
- App: **Breaking(migrated)** - Rename `user.register` action to `app.member.register`.
- App: **Breaking(migrated)** - Rename `user.remove` action to `app.member.delete`.
- App: **Breaking(migrated)** - Rename `user` remapper to `app.member`.
- App: **Breaking(migrated)** - Rename `users` property to `members` in app definitions.
- Server: **Breaking(migrated)** - Don't use roles on resource actions in the app definition, use
  permissions instead.
- Server: **Breaking(migrated)** - Remove special role `$author` in resource roles, use `:own`
  permissions instead.
- Server: **Breaking(migrated)** - Remove special role `$none`, use `$guest` instead, which is meant
  for unauthenticated users.
- Server: **Breaking(migrated)** - Remove special roles `$team:member`, `$team:manager`, use roles
  and group selection instead.
- Server: App member accounts are now standalone accounts not requiring a platform user to be
  connected. This results in all tokens being invalid, requiring the user to logout and log back in
  again.
- Server: Rename Teams to Groups.
- Studio: Move layout settings from general tab to style tab.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}/apps/{appId}/pinned` to
  `/api/app-collections/{appCollectionId}/apps/{appId}/pinned`.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}/apps/{appId}` to
  `/api/app-collections/{appCollectionId}/apps/{appId}`.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}/apps` to
  `/api/app-collections/{appCollectionId}/apps`.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}/expert/profileImage` to
  `/api/app-collections/{appCollectionId}/expert/profile-image`.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}/headerImage` to
  `/api/app-collections/{appCollectionId}/header-image`.
- Utils: Rename endpoint `/api/appCollections/{appCollectionId}` to
  `/api/app-collections/{appCollectionId}`.
- Utils: Rename endpoint `/api/appCollections` to `/api/app-collections`.
- Utils: Rename endpoint `/api/apps/import/organization/{organizationId}` to
  `/api/organizations/{organizationId}/apps/import`.
- Utils: Rename endpoint `/api/apps/{appId}/maskableIcon` to `/api/apps/{appId}/maskable-icon`.
- Utils: Rename endpoint `/api/apps/{appId}/members/{memberId}/picture` to
  `/api/app-members/{appMemberId}/picture`.
- Utils: Rename endpoint `/api/apps/{appId}/resources/{resourceType}/{resourceId}/history` to
  `/api/apps/{appId}/resources/{resourceType}/{resourceId}/versions`.
- Utils: Rename endpoint `/api/apps/{appId}/saml/{appSamlSecretId}` to
  `/api/apps/{appId}/secrets/saml/{appSamlSecretId}`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/ResourceTypes/{resourceTypeId}` to
  `/api/apps/{appId}/scim/resource-types/{resourceTypeId}`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/ResourceTypes` to
  `/api/apps/{appId}/scim/resource-types`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/Schemas/{schemaId}` to
  `/api/apps/{appId}/scim/schemas/{schemaId}`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/Schemas` to `/api/apps/{appId}/scim/schemas`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/Users/{userId}` to
  `/api/apps/{appId}/scim/users/{userId}`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/Users` to `/api/apps/{appId}/scim/users`.
- Utils: Rename endpoint `/api/apps/{appId}/scim/serviceProviderConfig` to
  `/api/apps/{appId}/scim/service-provider-config`.
- Utils: Rename endpoint `/api/connect/userinfo` to `/api/apps/{appId}/members/current`.
- Utils: Rename endpoint `/api/email/resend` to `/api/auth/email/resend-verification`.
- Utils: Rename endpoint `/api/email/reset/request` to `/api/auth/email/request-password-reset`.
- Utils: Rename endpoint `/api/email/reset` to `/api/auth/email/reset-password`.
- Utils: Rename endpoint `/api/email/verify` to `/api/auth/email/verify`.
- Utils: Rename endpoint `/api/email` to `/api/auth/email/register`.
- Utils: Rename endpoint `/api/invites/{token}` to `/api/organization-invites/{token}`.
- Utils: Rename endpoint `/api/login` to `/api/auth/email/login`.
- Utils: Rename endpoint `/api/oauth2/client-credentials/{clientId}` to
  `/api/users/current/auth/oauth2/client-credentials/{clientId}`.
- Utils: Rename endpoint `/api/oauth2/client-credentials` to
  `/api/users/current/auth/oauth2/client-credentials`.
- Utils: Rename endpoint `/api/oauth2/connect/pending` to `/api/auth/oauth2/authorizations/connect`.
- Utils: Rename endpoint `/api/oauth2/connect/register` to
  `/api/auth/oauth2/authorizations/register`.
- Utils: Rename endpoint `/api/oauth2/connected` to `/api/users/current/auth/oauth2/authorizations`.
- Utils: Rename endpoint `/api/oauth2/consent/agree` to
  `/api/users/current/auth/oauth2/apps/{appId}/consent/agree`.
- Utils: Rename endpoint `/api/oauth2/consent/verify` to
  `/api/users/current/auth/oauth2/apps/{appId}/consent/verify`.
- Utils: Rename endpoint `/api/organizations/{organizationId}/appCollections` to
  `/api/organizations/{organizationId}/app-collections`.
- Utils: Rename endpoint `/api/organizations/{organizationId}/join` to
  `/api/organization-invites/{token}/respond`.
- Utils: Rename endpoint `/api/refresh` to `/api/auth/refresh-token`.
- Utils: Rename endpoint `/api/subscribed` to `/api/users/subscribed`.
- Utils: Rename endpoint `/api/templates` to `/api/app-templates`.
- Utils: Rename endpoint `/api/trainings/{trainingId}/enroll/users` to
  `/api/trainings/{trainingId}/users`.
- Utils: Rename endpoint `/api/trainings/{trainingId}/enroll` to
  `/api/trainings/{trainingId}/users/current`.
- Utils: Rename endpoint `/api/unsubscribe` to `/api/users/current/unsubscribe`.
- Utils: Rename endpoint `/api/user/apps/accounts` to `/api/users/current/apps/accounts`.
- Utils: Rename endpoint `/api/user/apps/{appId}/account/resend` to
  `/api/apps/{appId}/auth/email/resend-verification`.
- Utils: Rename endpoint `/api/user/apps/{appId}/account/reset/request` to
  `/api/apps/{appId}/auth/email/request-password-reset`.
- Utils: Rename endpoint `/api/user/apps/{appId}/account/reset` to
  `/api/apps/{appId}/auth/email/reset-password`.
- Utils: Rename endpoint `/api/user/apps/{appId}/account/verify` to
  `/api/apps/{appId}/auth/email/verify`.
- Utils: Rename endpoint `/api/user/apps/{appId}/account` to
  `/api/users/current/apps/{appId}/account`.
- Utils: Rename endpoint `/api/user/apps` to `/api/users/current/apps`.
- Utils: Rename endpoint `/api/user/email` to `/api/users/current/emails`.
- Utils: Rename endpoint `/api/user/organizations` to `/api/users/current/organizations`.
- Utils: Rename endpoint `/api/user` to `/api/users/current`.

### Removed

- App: **Breaking(_not_ migrated)** - Remove `team.join` action.
- App: **Breaking(_not_ migrated)** - Remove `user.create` action.
- App: **Breaking(_not_ migrated)** - Remove `user.update` action. Use `app.member.current.patch`,
  `app.member.role.update` or `app.member.properties.patch` instead.
- App: **Breaking(_not_ migrated)** - Remove the `profile` property on the `app.member` remapper
  (previously `user`).
- App: **Breaking(migrated)** - Remove the `method` property in resource actions.
- App: **Breaking(migrated)** - Remove the `roles` property from resource definitions.
- Utils: Remove endpoint `/api/apps/{appId}/seed-assets`. `/api/apps/{appId}/assets` with query
  parameter `seed` should be used instead.
- Utils: Remove endpoint `/api/apps/{appId}/seed-resources/{resourceType}`.
  `/api/apps/{appId}/resources/{resourceType}` with query parameter `seed` should be used instead.
- Utils: Remove endpoint `/api/apps/{appId}/teams/{teamId}/invite`.
- Utils: Remove endpoint `/api/apps/{appId}/teams/{teamId}/members`.
- Utils: Remove endpoint `/api/apps/{appId}/teams/{teamId}`.
- Utils: Remove endpoint `/api/apps/{appId}/teams`.
- Utils: Remove endpoint `/api/organizations/{organizationId}/invite`.
- Utils: Remove endpoint `/api/training/blocks/{trainingBlockId}`.

### Fixed

- App: Apps now consistently handle account linking between multiple login methods.

## \[[0.29.11](https://gitlab.com/appsemble/appsemble/-/releases/0.29.11)] - 2024-09-02

### Fixed

- Block(`detail-viewer`): Check if there is a video before trying to fetch its thumbnail.
- Block(`list`): Check if the header has a value before converting it to a string.

## \[[0.29.10](https://gitlab.com/appsemble/appsemble/-/releases/0.29.10)] - 2024-08-28

### Added

- App: Add support for nested items in side menu.
- Studio: Make share app feature fancier and use `navigator.share` whenever possible.

## \[[0.29.9](https://gitlab.com/appsemble/appsemble/-/releases/0.29.9)] - 2024-08-22

### Added

- Block(`detail-viewer`): Add support for video asset thumbnails.
- Block(`form`): Add support for automatic thumbnail generation on video inputs.
- Block(`list`): Add support for displaying a thumbnail image if a video asset is passed to the
  image property.
- Node-utils: Add support for thumbnail assets in `processResourceBody`.
- Server: Add a controller for asset by id `HEAD` requests.
- Server: Validate imported messages on server side.
- Utils: Add an API path for asset by id `HEAD` requests.

### Changed

- Block(`list`): Change the request for assets in the header to `HEAD`.
- Studio: Only export changed translations.

### Fixed

- Block(`detail-viewer`): Don't pass poster if there is no thumbnail link.
- Server: Use correct permission for asset delete permission verification.
- Server: Verify permissions for creating assets.

## \[[0.29.8](https://gitlab.com/appsemble/appsemble/-/releases/0.29.8)] - 2024-08-08

### Added

- Block(`form`): Use the `accept` requirement of input fields to show an icon in the upload button.
- Block(`list`): Show the filename and filetype icon in the header of list items, with a header
  value remapping to an asset id.
- App: Unregister service worker in app debug page.
- Server: Add `Access-Control-Expose-Headers: 'Content-Disposition'` header to `getAssetById`
  endpoint.
- Utils: Add assets content type and content disposition utils.
- Utils: Add functions for mime type operations and icons.

### Changed

- Block(`form`): Show the upload button to the right in repeated file inputs.
- Block(`form`): Use the mime type of files in the file input to show a placeholder.
- App: Make debug page path case insensitive.

### Fixed

- Block(`form`): Don't show the message for long submission if there are form errors.
- Server: Allow patching resources with assets by name.

## \[[0.29.7](https://gitlab.com/appsemble/appsemble/-/releases/0.29.7)] - 2024-07-24

### Added

- App: Add debug page.
- Server: Add app snapshot id to app settings.

## \[[0.29.6](https://gitlab.com/appsemble/appsemble/-/releases/0.29.6)] - 2024-07-19

### Added

- Block(`form`): Add warning on long submission.
- Block(`pdf-viewer`): Add new block `pdf-viewer`.
- Studio: Add tab to apps to view companion container logs.

### Fixed

- Block(`form`): Fix searching by words containing capital letters.

## \[[0.29.5](https://gitlab.com/appsemble/appsemble/-/releases/0.29.5)] - 2024-07-15

### Added

- Block(`form`): Add search to selection fields.

### Changed

- Block(`form`): Allow trying to submit while there are field errors.
- Block(`form`): Don't show field error links until the user has tried to submit.
- Server: The server would error when receiving `multipart/form-data` from a proxied request action.

### Fixed

- Block(`detail-viewer`): Fix the height of displayed non-square images.
- Block(`form`): Acknowledge `readOnly` in fieldset fields.
- Block(`form`): Disable fieldset and file fields while submitting the form.
- Block(`table`): Fix miss-aligned button icon when label is empty.
- React-components: Fix behaviour where side menu would not close when clicking a menu item.

## \[[0.29.4](https://gitlab.com/appsemble/appsemble/-/releases/0.29.4)] - 2024-06-27

### Added

- Studio: Added the resource tab to the GUI.

### Fixed

- Studio: Do not use app id from params in app resources page.
- Studio: Switching to the GUI-editor is now fixed.

## \[[0.29.3](https://gitlab.com/appsemble/appsemble/-/releases/0.29.3)] - 2024-06-26

### Added

- Block(`form`): Add links above the submit button that scroll to and focus the form errors.

## \[[0.29.2](https://gitlab.com/appsemble/appsemble/-/releases/0.29.2)] - 2024-06-19

## \[[0.29.1](https://gitlab.com/appsemble/appsemble/-/releases/0.29.1)] - 2024-06-12

### Fixed

- Server: Updating an app without updating the shared- or core styles directly would remove the app
  styles.
- Studio: When the core and shared styling is exactly the same it wouldn't load when switching to
  the other editor style tab.

## \[[0.29.0](https://gitlab.com/appsemble/appsemble/-/releases/0.29.0)] - 2024-06-05

### Changed

- Server: Migration 0.29.0 has a significant chance to fail due too a large amount of new
  constraints. The migration however will now be rolled back in case of a failure and log the
  appriopriate actions to take to clean the database.

### Removed

- Server: Removed migration versions `0.9.0` - `0.24.1`.

### Fixed

- Server: Loading empty SCIM secrets resulted in an error on the secrets page not allowing to
  generate a new SCIM secret.
- Server: SCIM errors were unhandled causing internal server errors since the error handling
  middleware was removed in version 0.22.0.

## \[[0.28.13](https://gitlab.com/appsemble/appsemble/-/releases/0.28.13)] - 2024-06-05

### Fixed

- Block(`detail-viewer`): Fix the styling and the logic of displaying the video thumbnail.

## \[[0.28.12](https://gitlab.com/appsemble/appsemble/-/releases/0.28.12)] - 2024-06-05

### Added

- App: Add `hide` property to blocks to enable conditional rendering.
- Utils: Add the `array.flatten` remapper.

### Changed

- Block(`form`): Change the selection input to also work with unique strings for the ids of the
  items.
- Preact-components: Change the `ImageComponent` to accept an id.
- Utils: Change the `string.format` remapper to accept remappers, so it can receive a message id
  dynamically.

### Fixed

- Block(`detail-viewer`): Display the thumbnail if there is no video value.
- Block(`form`): Accept asset ids as valid file entry values.
- Block(`form`): Make the selection field full width in forms.
- Block(`list`): Add some padding to the end of the list to show the dropdown when needed.
- React-components: Fix behavior of side menu to no longer immediately hide upon opening code and
  GUI editors.
- React-components: Fix initial state value parameter of the hook to now be passed along to
  `enabled` state variable.
- Studio: Fix bug where right options and blocks buttons permanently lose their text after right bar
  is closed.

## \[[0.28.11](https://gitlab.com/appsemble/appsemble/-/releases/0.28.11)] - 2024-05-27

## \[[0.28.10](https://gitlab.com/appsemble/appsemble/-/releases/0.28.10)] - 2024-05-27

### Added

- Block(`list`): Add `collapsible` and `startCollapsed` properties for collapsing the list into a
  compact view.
- Block(`list`): Add a `groupBy` property to split the list into multiple smaller lists.
- Block(`list`): Add a `title` property for a title that shows above the list.
- App: Allow sub-page name to be dynamic using Remappers.

### Changed

- Server: All emails now use translation files instead of templates.

### Fixed

- Block(`form`): Close the selection modal when the `maxItems` requirement is reached.
- Node-utils: Deleting seed resources now deletes referencing resources before referenced resources.

## \[[0.28.9](https://gitlab.com/appsemble/appsemble/-/releases/0.28.9)] - 2024-05-14

### Added

- Block(`list`): Add a `hideOnNoData` property to hide the block if there is no data.
- Cli: Get app variables endpoint for dev server.

### Fixed

- Block(`form`): Allow selected value to be of type `Blob`.
- Block(`form`): Invalidate `tags` and `selection` fields if they are not required, but have
  `minItems` specified.
- Server: Allow to remove core and shared styles from an app.

## \[[0.28.8](https://gitlab.com/appsemble/appsemble/-/releases/0.28.8)] - 2024-05-10

### Changed

- Block(`form`): Add the option to specify accept in the `mime-type/*` format for file fields.

### Fixed

- Block(`form`): Improve UX on file upload.
- Node-utils: Updating resources used to fail if they were created with assets referenced by name.

## \[[0.28.7](https://gitlab.com/appsemble/appsemble/-/releases/0.28.7)] - 2024-05-06

### Fixed

- Cli: Missing options in `team update` command, `context` and `app`.
- Cli: Throw an error if `remote` is neither found in the specified context nor passed as an
  argument.
- Cli: Wrong option used in `team create` command to make argument dependent on one-another. Options
  app and context are now optional unless either is specified.
- Preact-components: Make the date picker calendar display statically below the input field.
- React-components: Add a footer to the dialog from the `dialog` action.
- Server: The `setAppPath` function should try at least 9 times before generating hex values.
- Studio: Disable autofill for app secrets.

## \[[0.28.6](https://gitlab.com/appsemble/appsemble/-/releases/0.28.6)] - 2024-05-02

### Added

- Block(`form`): Add a `selection` input field, that shows a list of available options.

### Fixed

- Server: The `processReferenceHooks` function used to fail if there is no resource passed.

## \[[0.28.5](https://gitlab.com/appsemble/appsemble/-/releases/0.28.5)] - 2024-04-30

### Changed

- Block(`form`): Make the `title` parameter accept remappers.

### Fixed

- Block(`form`): Fix video and image previews.
- Server: The `processHooks` function used to fail if there is no passed resource.
- Server: User properties, referencing resources, could not be updated.

## \[[0.28.4](https://gitlab.com/appsemble/appsemble/-/releases/0.28.4)] - 2024-04-29

### Added

- Block(`form`): Add a `fullWidth` parameter to specify if the form should take up all available
  width.
- Block(`form`): Add a `grid` parameter to specify if the form fields should be displayed in a grid.
- Block(`form`): Add a `title` parameter to set the title of the form.
- Block(`form`): Add styling to `fieldset` fields to improve visibility.
- Block(`form`): Add the `tags` input field, which allows adding multiple values to an array.
- App: Add support for pages to be viewed by roles.
- Utils: Add the `number.parse` remapper that converts strings to numbers.

### Changed

- Block(`form`): Change the default of the `dense` parameter to `true`.

### Fixed

- Block(`form`): Add a preview for video files.
- Block(`form`): Make file input fields preview larger.
- Block(`form`): Make file input fields span the whole row in grid layouts.
- Studio: Do not use app id from params in app resources page.

## \[[0.28.3](https://gitlab.com/appsemble/appsemble/-/releases/0.28.3)] - 2024-04-19

### Added

- Utils: Add `item` option to the `array` remapper.

### Fixed

- Server: The OAuth2 login flow would fail to authenticate a user to the app if the user was not
  logged in to the Studio.
- Utils: Fix issues with querying private apps by path or with paths that are over 30 characters.

## \[[0.28.2](https://gitlab.com/appsemble/appsemble/-/releases/0.28.2)] - 2024-04-17

## \[[0.28.1](https://gitlab.com/appsemble/appsemble/-/releases/0.28.1)] - 2024-04-17

## \[[0.28.0](https://gitlab.com/appsemble/appsemble/-/releases/0.28.0)] - 2024-04-16

### Added

- Studio: Add edit and delete buttons on an organization’s app collections page.
- Studio: Add option to view seed resources on the resource details page.

### Changed

- Server: Change the type of the `data` column in the `Resource` table to optimize performance and
  support sorting by nested fields.
- Utils: Add support for remappers in the prop remapper.

### Fixed

- Block(`list`): The block would throw an error when there is no data instead of displaying the
  `No data` message.
- Cli: `team update` command should use `patch` request.
- Utils: The `date.format` remapper would not accept strings.

## \[[0.27.12](https://gitlab.com/appsemble/appsemble/-/releases/0.27.12)] - 2024-04-10

### Added

- App: Add support for app variables.
- Cli: Add support for app variables and secrets from the app directory.
- Server: Add `AppVariable` table to store app variables.
- Studio: Add an app `Variables` page to the studio.
- Utils: Add app variable endpoints.
- Utils: Add the `variable` remapper.

## \[[0.27.11](https://gitlab.com/appsemble/appsemble/-/releases/0.27.11)] - 2024-04-08

### Added

- Cli: Support uploading `maskable-icon.png` from app variant directory with `app publish` and
  `app update`.

### Changed

- Server: Change SSO authorizations to cascade delete for OAuth2 and SAML.

### Fixed

- Cli: Uploading `icon.png` from app variant directory with `app publish` and `app update`.
- Server: Allow user info url to be empty when calling endpoint `updateAppOAuth2Secret`.
- Server: Creating an OAuth2 app secret would break the ability to update again without a page
  refresh.
- Studio: The app assets tab would show an error after deleting the last asset.
- Studio: The app resources tab would show an error after deleting the last resource.

## \[[0.27.10](https://gitlab.com/appsemble/appsemble/-/releases/0.27.10)] - 2024-04-03

### Added

- Cli: Read README files from app variant directories.
- Cli: Read app long descriptions per language from README files.
- Server: Add new table `AppReadme` to store app long descriptions.
- Utils: Add `readmeUrl` to App.

### Changed

- Server: Collections endpoint returns localized results.

### Removed

- Server: Remove column `longDescription` from `App` model.
- Utils: Remove `longDescription` from `App`.

### Fixed

- Block(`form`): Use field name as fallback value for label if label isn’t specified.
- Cli: The `app patch` command would fail when passing only arguments with their values set to
  false.
- Cli: The `app patch` command would lock the app before patching other values first.
- Preact-components: Use required property from props in dual slider component.
- Server: Randonly generated app path length should be less than 30 characters.
- Server: Subdomains of the main Appsemble host are assumed to have a valid SSL certificate if the
  `--forceProtocolHttps` flag is set. This assumes that the main Appsemble host has a valid wildcard
  SSL certificate.
- Studio: Localization for collections page app card.

## \[[0.27.9](https://gitlab.com/appsemble/appsemble/-/releases/0.27.9)] - 2024-03-21

### Added

- Cli: Add app patch command to update the settings of an app.
- Cli: Support `variant` argument for `app publish` command.
- Cli: Support `variant` argument for `app update` command.
- Cli: Support assets option in appsembleRC file to publish assets from assets folder.
- Cli: Support resources option in appsembleRC file to publish resources from resources folder.
- Cli: Support shared app variants using the `variant: name` in an `.appsemblerc` context.

### Changed

- Cli: Fix uploading screenshots with `app update`.

### Fixed

- Cli: Fix reading supported languages for screenshots.
- Cli: Fix reading supported languages from the app directory instead of the main project.
- Cli: The `app publish` command would error when no context is defined.
- Cli: The `app update` command would error when no context is defined.

## \[[0.27.8](https://gitlab.com/appsemble/appsemble/-/releases/0.27.8)] - 2024-03-20

### Added

- Cli: Add support for screenshots by language.
- Server: Add support for screenshots by language.

### Removed

- Cli: Remove `seed` from JSON schema.

### Fixed

- Cli: Update JSON schema to include `collections`, `googleAnalyticsId`, and `assetsClonable`.

## \[[0.27.7](https://gitlab.com/appsemble/appsemble/-/releases/0.27.7)] - 2024-03-19

## \[[0.27.6](https://gitlab.com/appsemble/appsemble/-/releases/0.27.6)] - 2024-03-19

## \[[0.27.5](https://gitlab.com/appsemble/appsemble/-/releases/0.27.5)] - 2024-03-18

### Fixed

- Server: Fixed a bug where demo resources permissions depend on the user that created them.

## \[[0.27.4](https://gitlab.com/appsemble/appsemble/-/releases/0.27.4)] - 2024-03-15

### Added

- Server: Allow service secrets to be applied without security definition.

### Fixed

- Server: Do not allow deleting assets for an app from another app.
- Studio: Search in documentation would navigate to incorrect page.

## \[[0.27.3](https://gitlab.com/appsemble/appsemble/-/releases/0.27.3)] - 2024-03-13

### Fixed

- Node-utils: Fixed updating ephemeral resources.

## \[[0.27.2](https://gitlab.com/appsemble/appsemble/-/releases/0.27.2)] - 2024-03-13

## \[[0.27.1](https://gitlab.com/appsemble/appsemble/-/releases/0.27.1)] - 2024-03-12

## \[[0.27.0](https://gitlab.com/appsemble/appsemble/-/releases/0.27.0)] - 2024-03-12

### Added

- App: Translate role descriptions in demo app login.
- Cli: Add app to collections, listed in .appsemblerc.
- Cli: Added `--resources`, `--assets` and `--assets-clonable` flags to `appsemble app update`
  command.
- Cli: Added an option in the `appsemble asset publish` command whether the asset should be used as
  seed.
- Cli: Added an option in the `appsemble resource publish` command whether the resource should be
  used as seed.
- Cli: Apply app variant on app publish.
- Cli: Support publishing resources and assets with the `appsemble app update` command.
- Node-utils: Add a script for applying app variants.
- Node-utils: Add patch scripts for styles, messages and app-definition.
- Server: Added an endpoint for deleting seed assets from an app.
- Server: Added an endpoint for seeding assets.
- Server: Added an endpoint for seeding resources.
- Studio: Add docs for local development and setup.
- Types: Added the `assetsClonable` option to the `.appsemblerc` file.
- Types: Support listing collections in the `.appsemblerc` file.
- Utils: Allow adding apps to collections from the CLI.

### Removed

- Server: Removed cleanup logic for seed resources and assets.
- Server: Removed the seed column from the App model.
- Types: Removed the seed field in the App interface.
- Utils: Removed the `$ephemeral` field from the `ResourceDefinition`.

### Fixed

- Cli: Set the default value of the `--assets-clonable` tag to false in the `appsemble app publish`
  and `appsemble app update` commands.

## \[[0.26.0](https://gitlab.com/appsemble/appsemble/-/releases/0.26.0)] - 2024-03-11

### Added

- App: Added a help section for each select field in the demo login component.
- App: Private and unlisted apps now include a `<meta name="robots" content="noindex">` tag to
  prevent search engines from indexing them.
- Cli: Add an option to include assets in the app export.
- Server: App export and import can now include app assets if present.
- Server: App export and import can now include the app README.md if present.
- Server: App export and import can now include the app icon if present.
- Studio: Add option to include assets in the app export and import.
- Studio: Playground to test remappers on JSON input data.

### Fixed

- App: The `robots.txt` file now respects the app visibility settings for the app. This means that
  if an app is not visible to a user, the `robots.txt` file will not allow search engines to index
  the app.
- Server: Allow using duplicate names in import app.
- Server: Change `frame-src csp` settings wildcard directive.
- Server: Fix resources saved as invalid JSON in the app export.
- Server: Fixed duplicate reseeded ephemeral resources.
- Webpack-config: Fix deprecation warning caused due to watch field.

## \[[0.25.2](https://gitlab.com/appsemble/appsemble/-/releases/0.25.2)] - 2024-02-27

### Changed

- App: Added an option to create an account from the demo login component.
- Server: Accept an `appRole` in the demo-login `tokenHandler` endpoint.
- Webpack-config: Enabled watch mode for blocks in development.

### Fixed

- Node-utils: Fixed the check for `koa-dev-middleware`.

## \[[0.25.1](https://gitlab.com/appsemble/appsemble/-/releases/0.25.1)] - 2024-02-26

### Added

- Cli: Allow setting `seed` in the `.appsemblerc` file of an app.

### Fixed

- Cli: In version `0.25.0` the `app update` command changed the `demoMode` value to the `seed` value
  instead of setting the seed value.
- Server: In version `0.25.0` demo apps that would previously seed were not being updated to allow
  them to seed again. The demo apps should be manually updated to seed again.

## \[[0.25.0](https://gitlab.com/appsemble/appsemble/-/releases/0.25.0)] - 2024-02-23

### Added

- Cli: More options to the create app command.
- Cli: Option to disable seeding demo apps in `publish app` command.
- Cli: Option to disable seeding demo apps in `update app` command.
- Server: A setting to disable seeding for demo apps.
- Studio: New documentation page explaining app concept and various app settings.

### Changed

- Studio: The app snapshot editor now uses a split view.

### Fixed

- App: Blocks were incorrectly filtered, which caused blocks of the same type to be filtered only by
  their name, excluding their version, resulting in their JavaScript not being loaded.
- React-components: Solve issue where sidebar backdrop covers the sidebar itself.
- Server: Disallow request action calling itself.
- Server: In demo mode ephemeral resources with assets would fail to create if not initially seeded.
- Studio: App collections page will no longer show an unusable dropdown next to the Edit button.
- Studio: Loading the studio at the style editor page no longer crashes the page.
- Studio: The app snapshot editor was only 5 pixels high making difficult to view.
- Studio: The resource details editor was only 5 pixels high making difficult to view.

## \[[0.24.13](https://gitlab.com/appsemble/appsemble/-/releases/0.24.13)] - 2024-02-12

### Added

- Server: Add an endpoint that fetches all demo app members without security.
- Studio: New action documentation section including code snippets.

### Changed

- App: Users can now directly select with which demo user to login, without logging in with
  Appsemble first.

### Fixed

- App: Fixed a bug in the app side menu when the user is still not logged in.

## \[[0.24.12](https://gitlab.com/appsemble/appsemble/-/releases/0.24.12)] - 2024-02-06

### Added

- Cli: Publish resources recursively in the `app publish` command based on resource references.
- Server: Reseed resources recursively in the `/app/{id}/reseed` endpoint based on resource
  references.
- Server: Reseed resources recursively in the `cleanupResourcesAndAssets` command based on resource
  references.

### Changed

- Node-utils: Patch resource schema in `processResourceBody` to allow resource references by index.
- Utils: Added validation for resource names against the reserved keywords `created`, `updated`,
  `author`, `editor`, `seed`, `ephemeral`, `clonable` and `expires`.

### Fixed

- App: App bar rendering title wrong.
- Studio: Unexpected error on the organization docs page.
- Utils: Remove additional history stack in the remapper context.

## \[[0.24.11](https://gitlab.com/appsemble/appsemble/-/releases/0.24.11)] - 2024-02-02

### Added

- Server: Default values are added to nested properties in app member properties when they are of
  type object.

### Changed

- App: If a `currentEmail` is not specified in the `user.update` action, it assumes the logged-in
  email.
- App: The `password` field is no longer required in the `user.update` action.
- Utils: Changed `user.properties` to accept integer and array properties without referencing
  resources.

### Fixed

- App: After the `user.update` action, updated user properties are now correctly assigned.
- App: After updating user properties from the studio, they are now correctly assigned.
- App: App controller handler functions now load as expected.
- Server: Invalid authentication state causing internal server error on blocks page.
- Studio: The dialog message shown in the studio app editor page shows message even after save.

## \[[0.24.10](https://gitlab.com/appsemble/appsemble/-/releases/0.24.10)] - 2024-01-31

### Added

- Studio: Add search bar for blocks.
- Studio: Watermark in app card and app details page.
- Utils: New Google Fonts.
- Utils: Support for binary data in `null.strip` remapper.

### Changed

- Studio: Make `import` button optionally visible on home page.

### Fixed

- Server: Deleting more child resources in cascade delete than allowed.
- Server: Updating more child resources in cascade delete than allowed.
- Utils: Ensure resource reference types are specified.

## \[[0.24.9](https://gitlab.com/appsemble/appsemble/-/releases/0.24.9)] - 2024-01-26

## \[[0.24.8](https://gitlab.com/appsemble/appsemble/-/releases/0.24.8)] - 2024-01-23

### Changed

- Server: Fetch resources separately to improve server performance.

### Fixed

- Server: Resolve error on apps page caused by expired tokens.
- Studio: Ensure the user is logged in before loading “My apps”.

## \[[0.24.7](https://gitlab.com/appsemble/appsemble/-/releases/0.24.7)] - 2024-01-23

### Changed

- Server: Fetch assets separately to improve server performance.

## \[[0.24.6](https://gitlab.com/appsemble/appsemble/-/releases/0.24.6)] - 2024-01-22

### Fixed

- Server: Ensure only the latest snapshot is retrieved on the server.
- Studio: Fix link to app-icon documentation being broken in the app icon settings.
- Studio: Resolve app members page error.
- Studio: Resolve error in app search bar.

## \[[0.24.5](https://gitlab.com/appsemble/appsemble/-/releases/0.24.5)] - 2024-01-19

## \[[0.24.4](https://gitlab.com/appsemble/appsemble/-/releases/0.24.4)] - 2024-01-18

## \[[0.24.3](https://gitlab.com/appsemble/appsemble/-/releases/0.24.3)] - 2024-01-18

## \[[0.24.2](https://gitlab.com/appsemble/appsemble/-/releases/0.24.2)] - 2024-01-18

## \[[0.24.1](https://gitlab.com/appsemble/appsemble/-/releases/0.24.1)] - 2024-01-18

### Added

- Cli: Add `clonable` to asset publish command.
- Node-utils: Add the option to expire resources based on period. Add clonable and ephemeral to
  resource parsing.
- Scripts: Add `user.properties` validation in docs.
- Server: Add `user.properties` parsing and validation to app member endpoints. Add reseed demo app
  endpoint. Add demo app logic for resources endpoints. Add demo app logic for assets endpoints. Add
  `AppMember` `BeforeCreate` and `BeforeUpdate` hooks for `user.properties` validation. Add
  `Resource` `BeforeDelete` hook for `user.properties` update. Add logic for demo apps to get the
  user who seeded the resource on action permission validation instead of the logged in one.
- Studio: Add reseed button for demo apps.
- Types: Add `UserProperties` interface. Add `$seed` and `$ephemeral` to resources.
- Utils: Add `clonable` to publish assets endpoint. Add `user.properties` to app definition. Add
  `user.properties` to user actions. Add demo app reseed endpoint.

### Changed

- Cli: Change cleanup resources script to clean up resources and assets based on the new ephemeral
  field.
- Utils: Change properties description in `user.register`, `user.create` and `user.update` actions.

### Fixed

- App: Fix `user.properties` in `UserProvider`. Fix `user.properties` in user actions.
- Studio: Fix `user.properties` modal form.

## \[[0.24.0](https://gitlab.com/appsemble/appsemble/-/releases/0.24.0)] - 2024-01-16

### Added

- Block(`form`): Add support for icon inside file entry.
- Block(`form`): Add support for icon to geocoordinates field.
- Block(`form`): Add support for icon to static field.
- Block(`form`): Add support for label to geocoordinates field.
- Block(`form`): Add support for tag to geocoordinates field.
- Block(`form`): Add support for “required‘ requirement to geocoordinates field.
- App: Remap `query` remapper on the client when `request` action requests are proxied.
- Preact-components: Add icon right option to render icon on the right.
- Preact-components: Add styling to dual slider when it has an icon.
- Preact-components: Add styling to slider when it has an icon.
- Preact-components: Add support for icon to dual slider field.
- Preact-components: Add support for icon to slider field.
- Studio: Add a button for mobile devices to open and show the app preview.
- Studio: Add option to pass down class name to the editor tab component\`s elements.
- Studio: Add option to set the dropdown content container to the right side.

### Changed

- Block(`form`): Change icon implementation, convert Font Awesome icon to SVG instead.
- Cli: Update definition to include changes.
- React-components: Add an extra parameter for a reference to be exempt from triggering the closing
  event.
- Server: Rename database model “Member” to “OrganizationMember”.
- Studio: Breadcrumbs now hide on smaller mobile devices.
- Studio: Change the style of tabs navigator to resize and apply styling based on screen size.
- Studio: Replace normal buttons with a collapsible navigation bar for mobile user interface.
- Types: Rename type “Member” to “OrganizationMember” in the code.

### Fixed

- Block(`form`): Fix default min and max value for range input field.
- Block(`form`): Fix list input field styling when icon is present.
- Block(`form`): Fix the file entry’s image source.
- React-components: Fix GUI path name matching condition.

## \[[0.23.9](https://gitlab.com/appsemble/appsemble/-/releases/0.23.9)] - 2023-12-14

## \[[0.23.8](https://gitlab.com/appsemble/appsemble/-/releases/0.23.8)] - 2023-12-14

## \[[0.23.7](https://gitlab.com/appsemble/appsemble/-/releases/0.23.7)] - 2023-12-04

### Added

- App: Add binary file support to the request action.

## \[[0.23.6](https://gitlab.com/appsemble/appsemble/-/releases/0.23.6)] - 2023-11-30

### Added

- Studio: Add a full screen button to code and GUI editor pages.
- Studio: Add support for multiple screen aspect ratios and resolutions.
- Studio: Add the ability to choose the device’s screen format.
- Studio: Keep full screen state reference.

### Changed

- Studio: Automatically hide the side menu on code and GUI editor pages - use burger menu to reveal
  it.
- Studio: Hide app preview when the screen width is too small.
- Studio: support multiple devices for app preview.

### Fixed

- React-components: Fix the position of the dropdown button icon.
- Studio: Fix CSS class selectors for indentation pseudo components.
- Studio: Resize Monaco editor and app preview.

## \[[0.23.5](https://gitlab.com/appsemble/appsemble/-/releases/0.23.5)] - 2023-11-24

## \[[0.23.4](https://gitlab.com/appsemble/appsemble/-/releases/0.23.4)] - 2023-11-24

### Added

- Block(`filter`): Add `fullscreen` optional parameter.
- Block(`filter`): Add boolean field support.
- Block(`filter`): Add icon optional parameter.
- Block(`filter`): Add list field support.
- Block(`filter`): Add range field support.
- Block(`form`): Add help text for all fields.
- Block(`form`): Add list input field.
- Block(`form`): Add range input field.
- Cli: Add app export command to export an app as a zip file.
- Cli: Add import app command to support importing an app from a zip file.

### Fixed

- App: Implement storage.append action in a way that prevents race conditions.

## \[[0.23.3](https://gitlab.com/appsemble/appsemble/-/releases/0.23.3)] - 2023-11-03

## \[[0.23.2](https://gitlab.com/appsemble/appsemble/-/releases/0.23.2)] - 2023-11-03

## \[[0.23.1](https://gitlab.com/appsemble/appsemble/-/releases/0.23.1)] - 2023-11-03

### Added

- Block(`detail-viewer`): Add support for icons in the `StringField`.
- Block(`list`): Added inline image support.
- Cli: Add delete command for apps.
- Server: Add `demoMode` flag to apps that lets users log in as any app role.
- Studio: Add documentation for export and import features.
- Tsconfig: Add new package `@appsemble/tsconfig`.

### Fixed

- Studio: Fix visibility of the export button.

## \[[0.23.0](https://gitlab.com/appsemble/appsemble/-/releases/0.23.0)] - 2023-10-26

### Added

- Block(`wordcloud`): Added `shrinkToFit` and `drawOutOfBound` options.
- Studio: Add export feature to apps.
- Studio: Add importing new apps from zip files.

### Changed

- Server: Rename the `appsemble` executable to `appsemble-server`.

## \[[0.22.10](https://gitlab.com/appsemble/appsemble/-/releases/0.22.10)] - 2023-09-22

### Fixed

- Server: Include $clonable field on resources where appropriate.
- Server: Update block versions before `0.20.10` not being able to sync on the server.
- Studio: Fix Clonable column on resources.

## \[[0.22.9](https://gitlab.com/appsemble/appsemble/-/releases/0.22.9)] - 2023-09-21

### Added

- Block(`image`): Allows alignment and rounded styling.
- Block(`image`): Allows file upload functionality.
- Block(`image`): Allows full screen functionality.
- Block(`list`): Allows button functionality.
- Block(`list`): Allows dropdown functionality.
- Block(`list`): Allows image customization.
- Block(`list`): Allows toggle button functionality.
- App: Set `static` as default block layout.

### Fixed

- Cli: Resolve missing file crash.
- Server: Fixed every new user getting `scimActive` set without them being a SCIM member.

## \[[0.22.8](https://gitlab.com/appsemble/appsemble/-/releases/0.22.8)] - 2023-09-18

### Added

- App: Add login property to `user.register` action to toggle login after register.

## \[[0.22.7](https://gitlab.com/appsemble/appsemble/-/releases/0.22.7)] - 2023-09-15

## \[[0.22.6](https://gitlab.com/appsemble/appsemble/-/releases/0.22.6)] - 2023-09-15

### Added

- Server: Add app collections.
- Studio: Add a page for the expert/curator of an app collection.
- Studio: Add a settings page for app collections.
- Studio: Add an editor for the profile picture of app collection experts.
- Studio: Add app collections page.
- Studio: Add functionality to remove apps from an app collection.
- Studio: Add “Add to collection” button to individual app pages.
- Studio: Implement pinned apps in app collections.

## \[[0.22.5](https://gitlab.com/appsemble/appsemble/-/releases/0.22.5)] - 2023-09-12

### Changed

- Studio: The elements list in the GUI editor now uses the Undo or Redo stack.

## \[[0.22.4](https://gitlab.com/appsemble/appsemble/-/releases/0.22.4)] - 2023-09-12

- CI: Fix release process for production. Any new block features from `0.22.0` till `0.22.3` are now
  available in block versions `0.22.4` and onward.

## \[[0.22.3](https://gitlab.com/appsemble/appsemble/-/releases/0.22.3)] - 2023-09-11

### Fixed

- Studio: Fix a workaround in the GUI editor where the `action-button` would get attached by default
  when creating a new sub-page.

## \[[0.22.2](https://gitlab.com/appsemble/appsemble/-/releases/0.22.2)] - 2023-09-11

### Added

- Block(`button-list`): Added variable to support flipping icon side.
- Cli: Add `appsemble organization upsert` command.
- Create-appsemble: Add command to scaffold Appsemble projects for GitLab repositories.
- Studio: List custom blocks in the GUI editor block store.

### Fixed

- Studio: Fix search missing from the docs.

## \[[0.22.1](https://gitlab.com/appsemble/appsemble/-/releases/0.22.1)] - 2023-08-30

### Fixed

- Server: Fix database migration for release version `0.22.0`.

## \[[0.22.0](https://gitlab.com/appsemble/appsemble/-/releases/0.22.0)] - 2023-08-30

### Added

- Block(`detail-viewer`): Add bullet point list support.
- Block(`detail-viewer`): Add image customization options.
- Block(`filter`): Add search bar example and screenshot.
- Block(`image`): Add data listen event.
- Block(`image`): Add support for assets API.
- App: Add `user.logout` action.
- App: Support binary response data in `request` action.
- Cli: Add `appsemble block create` command to create the boilerplate for a block. Previously this
  was done through `create-appsemble`, but has now been moved to the Appsemble CLI.
- Cli: Add `appsemble block delete` command.
- Cli: Add path option to `appsemble block create` command.
- Server: Add custom properties support for user remapper.
- Studio: Add option to delete organization in the organization settings page.
- Studio: Initial release of the GUI Editor.
- Utils: The `date.format` remapper now allows arguments to be passed along to set a custom output
  format.

### Changed

- Cli: Change `appsemble app create` command to create the boilerplate for an app directory.
  Previously this was used to create an app on the remote, but has been changed to
  `appsemble app publish`.
- Cli: Rename `appsemble app create` command to `appsemble app publish`.
- Cli: Rename `appsemble asset create` command to `appsemble asset publish`.
- Cli: Rename `appsemble resource create` command to `appsemble resource publish`.
- Webpack-config: Don’t override the TypeScript `module` compiler option.

### Removed

- Create-appsemble: Remove `appsemble block` command. This has been moved to the Appsemble CLI as
  the following command `appsemble block create`.

### Fixed

- App: Fix tab contents breaking when switching between tabs too fast.
- Server: Resolve `request` action cutting-off response body when the external server responds with
  compressed data.

## \[[0.21.3](https://gitlab.com/appsemble/appsemble/-/releases/0.21.3)] - 2023-08-14

### Added

- Server: Add email quota rate limiting.
- Studio: Add a notification for apps exceeding email quota.
- Studio: Add support for viewing app quotas.

### Fixed

- App: Use correct prefix path when using the (proxied) request-, email- or notify action within the
  match action.

## \[[0.21.2](https://gitlab.com/appsemble/appsemble/-/releases/0.21.2)] - 2023-08-04

### Fixed

- Block(`video`): Vimeo player now react to customized sizes.

## \[[0.21.1](https://gitlab.com/appsemble/appsemble/-/releases/0.21.1)] - 2023-07-31

### Fixed

- Cli: Add missing default arguments.
- Cli: Include missing Bulma dependency to resolve crash.

## \[[0.21.0](https://gitlab.com/appsemble/appsemble/-/releases/0.21.0)] - 2023-07-28

### Added

- Block(`barcode-scan`): Allow block to scan other type of codes.
- Block(`barcode-scan`): Allow user to set patch size of stream or image file.
- Block(`barcode-scan`): Allow user to set up resolution to make scanner get code more precise.
- Block(`barcode-scan`): New icon for the block.
- Block(`detail-viewer`): Allow to extract image from URL and asset.
- Block(`detail-viewer`): Allow to render videos.
- Block(`video`): Allows video from URL and asset.
- Block(`video`): Allows video from YouTube.
- Cli: Initial release of the development server introducing the new command `serve`.
- Server: Add SCIM support.

### Changed

- Block(`barcode-scan`): New description of block and its parameters.
- Block(`form`): Support inline fields within fieldsets.
- Block(`qr-scan`): Emits code as object instead of string.
- Studio: Moved remapper documentation into its own section.
- Utils: Separate remappers into sections.

### Removed

- Block(`detail-viewer`): Remove file base parameter.

### Fixed

- Block(`form`): Display buttons for fieldset when min/max length is specified.
- Block(`form`): Fix validation of fields which come after a fieldset.
- Studio: Fixed code highlighting not working in MDX files.

## \[[0.20.45](https://gitlab.com/appsemble/appsemble/-/releases/0.20.45)] - 2023-06-07

### Added

- Block(`barcode-scan`): Initial release.
- Block(`barcode-scan`): Supports scanning code from image file.
- Block(`form`): Support default value for date fields.
- Block(`image`): The Image block now has width and height (in pixel) properties.
- App: Added `team.members` action.
- Server: Add `resource.patch` action to server.
- Server: Added specific `getTeamMember` endpoint.

### Changed

- Utils: **Breaking** Change not remapper to, compute then invert `null` and `singular` values.

### Fixed

- Block(`filter`): Fix filtering for `date` and `date-range` fields.
- Block(`form`): Support not passing fields to block.
- Server: Implement `resource.create` action instead of reusing the `request` action.
- Server: Implement `resource.delete` action instead of reusing the `request` action.
- Server: Implement `resource.get` action instead of reusing the `request` action.
- Server: Implement `resource.update` action instead of reusing the `request` action.

## \[[0.20.44](https://gitlab.com/appsemble/appsemble/-/releases/0.20.44)] - 2023-05-12

## \[[0.20.43](https://gitlab.com/appsemble/appsemble/-/releases/0.20.43)] - 2023-05-11

### Added

- Block(`table`): Support custom size of image in table cell.
- Block(`table`): Support images in table cell.
- Server: Support authentication for the `request action` using app service secrets when proxied.
- Studio: Add service secrets to app secrets page.
- Utils: Add `log` remapper.
- Utils: Add `match` remapper.
- Utils: Add `not` remapper.

### Changed

- Block(`form`): The form block now uses actions to `autofill` form fields.

### Fixed

- Block(`form`): Resolve date fields and boolean field missing form values when remapping in
  `required` requirement.

## \[[0.20.42](https://gitlab.com/appsemble/appsemble/-/releases/0.20.42)] - 2023-04-04

## \[[0.20.41](https://gitlab.com/appsemble/appsemble/-/releases/0.20.41)] - 2023-03-24

### Added

- Block(`form`): Add alt format option for date and date-time field.
- Block(`form`): Support manual input in date and date-time fields.
- Block(`table`): Add `StringField` to provide users direct write access to table entries.

### Fixed

- Server: Set missing `userinfo` fields (`locale` and `zoneinfo`) in the `userinfo` API.
- Server: Implement `resource.query` action instead of reusing the `request` action.

## \[[0.20.40](https://gitlab.com/appsemble/appsemble/-/releases/0.20.40)] - 2023-03-06

### Added

- Block(`form`): Make block data accessible to `from` and `to` requirements.

### Fixed

- App: Resolve issue related to startup notifications being enabled by default for all apps.
- Server: Resolve issue where the app name and organization id are undefined in the URL subdomain
  when using the app remapper URL option.

## \[[0.20.39](https://gitlab.com/appsemble/appsemble/-/releases/0.20.39)] - 2023-02-28

### Added

- Block(`form`): Support disabled options in enum fields.
- App: Add `layout` option to set the position of a message on the screen.
- App: Add `match` action.
- App: Add support for deeply nested array remappers.
- App: Add translation path for the first subpage in the loop page.
- App: Add translation path for the last subpage in the loop page.
- Server: Add support for deeply nested array remappers.

### Changed

- Block(`form`): Child fields in repeated object fields now contain an index in their naming
  sequence, **breaking** styling in some instances when applied to child fields.
- Block(`form`): Object field is now usable within another object field.
- Block(`form`): Rename object field to fieldset. Apps using the object field that need to be
  updated to version 0.20.39 will **break**. To fix this, change the field type from `object` to
  `fieldset`.

### Fixed

- Block(`form`): Required remapper is now properly supported in nested fields.
- Block(`form`): Resolve validation issue causing object fields to be broken.
- App: Apply the same translation path for all subpages between the first and last subpage in the
  loop page.

## \[[0.20.38](https://gitlab.com/appsemble/appsemble/-/releases/0.20.38)] - 2023-02-07

### Added

- Block(`form`): Add `disableDefault` option to disable setting default values with page data.

## \[[0.20.37](https://gitlab.com/appsemble/appsemble/-/releases/0.20.37)] - 2023-02-02

### Fixed

- Block(`form`): Resolve issue regarding date fields breaking a page when navigating away and back
  to the form.

## \[[0.20.36](https://gitlab.com/appsemble/appsemble/-/releases/0.20.36)] - 2023-02-02

### Added

- Block(`form`): Support icons on `radio` field options.

## \[[0.20.35](https://gitlab.com/appsemble/appsemble/-/releases/0.20.35)] - 2023-02-01

### Added

- Block(`chart`): Add `font` to `labelOptions`.
- Block(`chart`): Add `maxWidth` to `labelOptions`.
- App: Add `resource.patch` action.
- App: Add `serial` option to each action.

## \[[0.20.34](https://gitlab.com/appsemble/appsemble/-/releases/0.20.34)] - 2023-01-30

### Fixed

- Server: Use correct value for the Kubernetes issuer when updating an ingress.

## \[[0.20.33](https://gitlab.com/appsemble/appsemble/-/releases/0.20.33)] - 2023-01-24

### Added

- App: Add `notifications` option `login`.
- App: Add `notify` action.
- Server: Add `notify` action.

### Fixed

- App: Allow storing falsy values using the `storage.update` action.

## \[[0.20.32](https://gitlab.com/appsemble/appsemble/-/releases/0.20.32)] - 2023-01-17

### Added

- Block(`form`): Add `disabled` property on individual fields.
- Server: Add history remapper support.

### Changed

- Block(`map`): Use another implementation to render markdown.

## \[[0.20.31](https://gitlab.com/appsemble/appsemble/-/releases/0.20.31)] - 2023-01-11

### Added

- Block(`chart`): Added `color` option to chart datasets.
- Block(`form`): Add the `disabled` parameter.
- Block(`form`): Make the `readOnly` field property a remapper.
- App: Add the `date.format` remapper.

### Fixed

- Server: Resolved an issue where resource notifications would not work.

## \[[0.20.30](https://gitlab.com/appsemble/appsemble/-/releases/0.20.30)] - 2022-12-20

### Added

- Block(`chart`): Added `onClick` action to chart block.

## \[[0.20.29](https://gitlab.com/appsemble/appsemble/-/releases/0.20.29)] - 2022-12-20

### Added

- App: Add page type `loop`.
- Utils: Added `step` remapper.

### Fixed

- Block(`form`): Resolved an issue where the `autofill` feature wouldn’t allow you to submit if a
  property was missing in the response and the input required.
- Block(`form`): Resolved an issue where the label of a number input would not accept remappers.

## \[[0.20.28](https://gitlab.com/appsemble/appsemble/-/releases/0.20.28)] - 2022-12-08

### Fixed

- App: Resolved an issue where loading in data into a table block using the `appStorage` option
  would not update the table block.

## \[[0.20.27](https://gitlab.com/appsemble/appsemble/-/releases/0.20.27)] - 2022-12-05

### Added

- Server: Add support for custom SSL certificates for apps.
- Studio: Add support for custom SSL certificates for apps.

## \[[0.20.26](https://gitlab.com/appsemble/appsemble/-/releases/0.20.26)] - 2022-12-02

### Added

- App: Add `appStorage` to storage actions.

## \[[0.20.25](https://gitlab.com/appsemble/appsemble/-/releases/0.20.25)] - 2022-12-01

### Changed

- Types: **Breaking:** Rename `hideFromMenu` to `hideNavTitle`.

### Fixed

- App: Add timezone to user registration.
- App: Fix values being treated as parameters in request action.

## \[[0.20.24](https://gitlab.com/appsemble/appsemble/-/releases/0.20.24)] - 2022-11-30

### Added

- Block(`form`): Add `skipInitialLoad` property to form block parameters.

## \[[0.20.23](https://gitlab.com/appsemble/appsemble/-/releases/0.20.23)] - 2022-11-28

## \[[0.20.22](https://gitlab.com/appsemble/appsemble/-/releases/0.20.22)] - 2022-11-24

### Added

- App: Add storage.append action.
- App: Add storage.delete action.
- App: Add storage.subtract action.
- App: Add storage.update action.

### Fixed

- Utils: Resolve `array.omit` not accepting an array of remappers.

## \[[0.20.21](https://gitlab.com/appsemble/appsemble/-/releases/0.20.21)] - 2022-11-24

### Added

- Block(`form`): Add `inline` property to form fields.
- Block(`form`): Allow the required requirement to be remapped for conditionally required form
  fields.
- App: Add Indonesian translations.
- App: Add `retainFlowData` prop to flow page.
- App: Added Russian translations.
- Studio: Add Indonesian translations.
- Studio: Added Russian translations.
- Types: Add `hideName` prop to pages.
- Utils: Add `from.history` remapper.

### Changed

- Types: `array.omit` remapper now supports an array of remappers as input.

### Fixed

- App: Resolve `link.back` action not navigating to the previous page if current page is translated.

## \[[0.20.20](https://gitlab.com/appsemble/appsemble/-/releases/0.20.20)] - 2022-11-09

### Fixed

- App: Resolve sub-page URLs on tabs pages not being translated.

## \[[0.20.19](https://gitlab.com/appsemble/appsemble/-/releases/0.20.19)] - 2022-11-08

### Added

- Utils: Add `array.append` remapper.
- Utils: Add `array.from` remapper.
- Utils: Add `array.omit` remapper.

### Changed

- Block(`form`): Rename `showIf` property to `show`.

### Fixed

- Block(`form`): Resolved an issue where the string field would not display icons.
- Block(`table`): Resolve an issue where buttons would not add the id to the resource route when
  using the link action in the table block.
- App: Resolve page parameters on tabs pages not working.

## \[[0.20.18](https://gitlab.com/appsemble/appsemble/-/releases/0.20.18)] - 2022-10-26

### Fixed

- Block(`form`): Fix bug where forms would not load without defining the auto-fill parameter.

## \[[0.20.17](https://gitlab.com/appsemble/appsemble/-/releases/0.20.17)] - 2022-10-24

### Added

- Block(`action-button`): Add the icon for the action button block.
- Block(`audio`): Add the icon for the audio block.
- Block(`chart`): Add the icon for the chart block.
- Block(`control-buttons`): Add the icon for the control buttons block.
- Block(`feed`): Add the icon for the feed block.
- Block(`filter`): Add the icon for the filter block.
- Block(`form`): Add form auto-fill.
- Block(`form`): Add the icon for the form block.
- Block(`html`): Add the icon for the HTML block.
- Block(`image`): Add the icon for the image block.
- Block(`list`): Add the icon for the list block.
- Block(`map`): Add the icon for the map block.
- Block(`markdown`): Add the icon for the markdown block.
- Block(`qr-scan`): Add the icon for the qr-scan block.
- Block(`table`): Add the icon for the table block.
- Block(`tiles`): Add the icon for the tiles block.
- Block(`timer`): Add the icon for the timer block.
- Block(`video`): Add the icon for the video block.
- Utils: Add assign.history remapper.
- Utils: Add history remapper.
- Utils: Add omit.history remapper.

### Fixed

- Studio: Resolved not being able to create apps in an organization with sufficient permissions when
  your first organization gave you insufficient permission to create apps.

## \[[0.20.16](https://gitlab.com/appsemble/appsemble/-/releases/0.20.16)] - 2022-10-13

### Added

- Block(`form`): Block(form): Add conditional field rendering.
- App: Add the `each` action.
- Server: Add the `each` action.

### Changed

- App: Upgrade from “react-router-dom” 5.0.0 to 6.0.0.
- React-components: Upgrade from “react-router-dom” 5.0.0 to 6.0.0.
- Server: Accepts the `examples` property for JSON schemata instead of `example`.
- Studio: Upgrade from “react-router-dom” 5.0.0 to 6.0.0.

### Fixed

- App: Fix user.register action.
- Server: Fix content security policy for OAuth2 client credentials login process.
- Studio: Fixed editor console errors persisting after fixing the error.
- Studio: Studio(blocks): Change name in block examples to type.

## \[[0.20.15](https://gitlab.com/appsemble/appsemble/-/releases/0.20.15)] - 2022-09-14

### Added

- Block(`qr-scan`): Add the `qr-scan` block.

## \[[0.20.14](https://gitlab.com/appsemble/appsemble/-/releases/0.20.14)] - 2022-09-12

### Changed

- Block(`tiles`): Unset default tile color.

## \[[0.20.13](https://gitlab.com/appsemble/appsemble/-/releases/0.20.13)] - 2022-08-09

### Fixed

- Server: Fix regression in message formatting in `email` actions in cronjobs.

## \[[0.20.12](https://gitlab.com/appsemble/appsemble/-/releases/0.20.12)] - 2022-08-02

### Added

- Server: Save user time zones for localization emails.

### Fixed

- Studio: Fix permission check for viewing resources and assets.

## \[[0.20.11](https://gitlab.com/appsemble/appsemble/-/releases/0.20.11)] - 2022-07-12

### Added

- Block(`audio`): Add `audio` block.
- Block(`form`): Add `dense` property.
- Server: If a user requests an app through an Appsemble domain, but the app has a custom domain,
  the user is redirected to the custom domain.

### Changed

- Cli: Automate the login flow.

### Removed

- Webpack-config: Remove support for the `paths` property in `tsconfig.json`.

## \[[0.20.10](https://gitlab.com/appsemble/appsemble/-/releases/0.20.10)] - 2022-06-21

### Added

- App: Add `remapAfter` and `remapBefore` to actions.
- App: Add support for custom SMTP settings for apps. These can be found in the app secrets page.
- Server: Support block examples.
- Studio: Show block examples.

### Changed

- Studio: Change Import from CSV button to also accept JSON files.

### Deprecated

- App: Deprecate `remap` on actions, `remapBefore` may be used instead. Existing apps that still use
  `remap` will continue to work.

## \[[0.20.9](https://gitlab.com/appsemble/appsemble/-/releases/0.20.9)] - 2022-06-15

### Added

- Block(`form`): Add `alwaysValidate` option to form requirements. This can be useful for fields
  that can also perform validation on fields that are filled in at a later time.
- Block(`form`): Add `confirm` option to `date` and `date-time` fields. Enabling this will display a
  confirm button once a date has been selected.
- Block(`form`): Add `dateFormat` property to `date` and `date-time` fields to customize the way
  these are shown to the user.
- Block(`image`): Add `image` block.

### Changed

- Studio: Sort custom messages section in app translations alphabetically.

## \[[0.20.8](https://gitlab.com/appsemble/appsemble/-/releases/0.20.8)] - 2022-06-12

### Added

- Block(`action-button`): Add `title` property.
- Block(`button-list`): Add `title` property.
- Block(`form`): Add `color` and `size` properties to `boolean` fields.
- Block(`form`): Add support for displaying boolean/checkbox fields as switches.
- Block(`table`): Add `disabled` property for button columns.
- Block(`table`): Add `title` property to button fields.
- App: Add `view` property to `resource.query` and `resource.get` actions.
- Server: Add support for resource views.
- Utils: Add `object.omit` remapper.
- Utils: Add `random.float` `random.integer` `random.string` remapper.

### Fixed

- Block(`form`): Fix bug where `icon` would be ignored for `date` and `date-time` fields.
- Block(`table`): Move `alignment` property specific to dropdown fields to the `dropdown` field
  property. This was added to `DropdownOption` instead of `DropdownField` by accident.
- App: Fix bug where register form was displayed twice.

## \[[0.20.7](https://gitlab.com/appsemble/appsemble/-/releases/0.20.7)] - 2022-05-25

### Added

- Block(`table`): Add alignment property to allow for setting the alignment of dropdown fields.
- App: Add `lt` and `gt` remappers for comparing if a value if greater than or less than another
  value.
- App: Add support for setting an `end` date for the `ics` remapper. This is mutually exclusive with
  the property `duration`.
- Server: Add support for `null` in OData queries. For example: `/$filter=date eq null`.

### Changed

- Block(`tiles`): Change default text color to be brighter.
- Block(`tiles`): Rename `asset` to `image`. Any value that matches a valid URL will be used as the
  source of the image, otherwise it will attempt to load an asset based on either an alias or a
  UUID.

### Fixed

- Block(`tiles`): Fix background color. This used to assume the color is a valid
  [Bulma color](https://bulma.io/documentation/helpers/color-helpers). Instead it will display
  either a hex value, a valid Bulma color, or default to `primary`.

## \[[0.20.6](https://gitlab.com/appsemble/appsemble/-/releases/0.20.6)] - 2022-05-13

### Added

- Block(`form`): Add `TimeRangeRequirement` for `date-time` fields to limit the time range.
- Block(`form`): Add new requirement for `date` and `date-time` fields to disable selecting dates
  that fall on specific weekdays.
- App: Add `download` action for downloading the result of an action.
- App: Add remapper `ics` for creating calendar events.
- Server: Email actions now support content based attachments.

### Fixed

- Server: Fix case sensitivity bug when using `password` grant type.

## \[[0.20.5](https://gitlab.com/appsemble/appsemble/-/releases/0.20.5)] - 2022-04-11

### Added

- Block(`chart`): Support custom colors for the y axis.
- Block(`chart`): Support custom step size for the y axis.
- Block(`table`): Add `alignment` property to field types.
- Block(`table`): Add support for button field types.

### Changed

- Cli: Expose all block parameter related types as definitions.

### Fixed

- App: Fix issue where teams were not correctly updated when joining a team.

## \[[0.20.4](https://gitlab.com/appsemble/appsemble/-/releases/0.20.4)] - 2022-04-01

### Added

- Block(`chart`): Add loading indicator if the chart has not received any data yet.

### Fixed

- App: Fix resolving of pages based on translated page names.

## \[[0.20.3](https://gitlab.com/appsemble/appsemble/-/releases/0.20.3)] - 2022-03-31

### Added

- App: Add `security.teams` property in app definition.
- App: Add `team.invite` action.
- App: Add page for accepting team invites.
- App: Add support for replacing existing login and register pages with custom pages by naming the
  pages `Login` or `Register`.
- Server: Add support for team invites.

### Changed

- Block(`chart`): Make `min` and `max` in `yAxis` property optional.
- Studio: Replace the JSON schema representation of block parameters and definitions with the one
  used to render out app resource schema.

### Fixed

- Cli: Fix issue where the description for `$any` actions and events were not extracted.
- Studio: Fix issue where block documentation would not render any types that used `anyOf` or
  `oneOf`.

## \[[0.20.2](https://gitlab.com/appsemble/appsemble/-/releases/0.20.2)] - 2022-03-01

### Changed

- Server: Add `visibility` property to blocks, this allows for blocks to be hidden from the block
  store.
- Server: Change public list of organizations to also include organizations with public blocks.

### Fixed

- Create-appsemble: Fix fatal error in `create-appsemble block` command.
- Server: Query all necessary fields for server side actions.

## \[[0.20.1](https://gitlab.com/appsemble/appsemble/-/releases/0.20.1)] - 2022-02-24

### Added

- Block(`chart`): Allow configuration of the vertical axis.

### Changed

- Studio: Update create app button to always be visible if the user is logged in, using the same
  flow used to verify email addresses and creating organizations as the flow used when cloning apps.

## \[[0.20.0](https://gitlab.com/appsemble/appsemble/-/releases/0.20.0)] - 2022-02-14

### Added

- Block(`chart`): Add chart block.

### Removed

- Appsemble: Remove support for Node.js 12.
- Cli: Remove support for Node.js 12.
- Create-appsemble: Remove support for Node.js 12.
- Webpack-config: Remove support for Node.js 12.

### Fixed

- Block(`list`): Fix issue where `label` was not correctly being remapped.
- Server: Fix issue where the `$editor` was being included in the resource validation when updating
  resources.

## \[[0.19.15](https://gitlab.com/appsemble/appsemble/-/releases/0.19.15)] - 2022-02-07

### Added

- Block(`form`): Add event listener for `fields`. This can be used to dynamically replace the
  fields.
- Block(`form`): Add support for `slider` display on numeric fields.
- App: Inject CSS for the Bulma slider extension.
- Sdk: Add support for generating new menu items using `utils.menu()`.
- Studio: Add color picker in app editor.

### Changed

- Block(`form`): Change `fields` to be optional but require at least 1 item.

## \[[0.19.14](https://gitlab.com/appsemble/appsemble/-/releases/0.19.14)] - 2022-01-27

### Added

- Server: Add support for resource history.

### Changed

- Server: Filter out organizations that don’t have any public apps.

## \[[0.19.13](https://gitlab.com/appsemble/appsemble/-/releases/0.19.13)] - 2022-01-24

### Added

- Block(`form`): Add `static` field type. This field type can be used to display text in between
  fields.
- Server: Add API endpoint to update multiple resources at once.
- Server: Keep track of who last edited a resource.
- Studio: Add support for resource editors.

## \[[0.19.12](https://gitlab.com/appsemble/appsemble/-/releases/0.19.12)] - 2022-01-19

### Added

- App: Add option to use the `link` action to link to the login page and settings page.
- App: Add support for specifying which storage mechanism to use for the `storage` actions.
  Supported values are `indexedDB`, `localStorage`, and `sessionStorage`.

## \[[0.19.11](https://gitlab.com/appsemble/appsemble/-/releases/0.19.11)] - 2022-01-04

### Added

- Block(`form`): Add `data-path` attribute to root node of the DOM output.
- Block(`markdown`): Add `data-path` attribute to root node of the DOM output.
- App: Add `from` field to `email` action. This can be used to customize the name when Appsemble
  sends emails.
- App: Add option to set a default email name when sending emails for an app.
- Appsemble: Add property `path` to `BootstrapParams`.
- Create-appsemble: Release `create-appsemble`.

### Fixed

- App: Fix language preference in app settings not always updating appropriately.
- Create-appsemble: Fix typing issues in `preact` and `mini-jsx` templates.

## \[[0.19.10](https://gitlab.com/appsemble/appsemble/-/releases/0.19.10)] - 2021-12-17

### Added

- Block(`markdown`): Add `alignment` property. This can be used to change the alignment of the text
  content.
- Block(`markdown`): Add `centered` property to parameters. This can be used to center the content
  without having to use the `html` block or include HTML tags in the messages.
- Cli: Add support for uploading CSV files.
- Studio: Add an export to CSV button for app members.

### Fixed

- Studio: Fix download CSV button.

## \[[0.19.9](https://gitlab.com/appsemble/appsemble/-/releases/0.19.9)] - 2021-12-06

### Added

- App: Add `analytics` action.
- App: Add support for arrays of strings or numbers for `prop` remapper.
- App: Add support for translated flow page steps.
- Server: Add support for creating resources from CSV data.
- Studio: Add support for translating flow page steps.

### Changed

- Cli: Update to `postcss` 8.

### Removed

- App: Remove support for accessing properties using dot notation in `prop` remapper.

## \[[0.19.8](https://gitlab.com/appsemble/appsemble/-/releases/0.19.8)] - 2021-11-24

### Added

- Cli: Add support for `sentry-dsn`, `sentry-environment`, and `google-analytics-id` when creating
  or updating apps.
- Server: Add additional validation for `link`, `flow`, `resource.`, and `user` actions.
- Studio: Add app setting `showAppDefinition`.

### Changed

- Cli: Change behavior of `--app-id` combined with `--app` for various commands. `app-id` now takes
  precedence over `context.environment.id`.
- Server: Change minimum amount of steps for flow pages to 2.
- Studio: Replace app setting `private` with `visibility`.

## \[[0.19.7](https://gitlab.com/appsemble/appsemble/-/releases/0.19.7)] - 2021-11-18

### Added

- App: Add support for `link` action validation.
- App: Track page views using Google Analytics if configured.
- App: Update the document title to the current page.
- Studio: App CSS is now validated in the editor.
- Studio: The app editor now shows inline validation errors.

### Changed

- Studio: Rename Roles page for apps in Studio to Users.

### Fixed

- Cli: Fix authentication headers not correctly being passed through for Team CLI commands.

## \[[0.19.6](https://gitlab.com/appsemble/appsemble/-/releases/0.19.6)] - 2021-11-09

### Changed

- Server: The Block styles API now use `application/json` instead of `multipart/form-data`.
- Server: The fields `yaml`, `coreStyle`, and `sharedStyle` are now accepted as strings instead of
  binary strings.
- Studio: The API no longer accepts the `definition` field for updating apps. Instead use the `yaml`
  field.

### Fixed

- App: Fix navigation bar close button reopening the side menu.
- App: Fix profile picture scaling in the navigation bar dropdown.

## \[[0.19.5](https://gitlab.com/appsemble/appsemble/-/releases/0.19.5)] - 2021-11-08

### Added

- Cli: Enable strict subcommand parsing.
- Cli: Pretty print app validation errors.
- Sdk: Use generics to configure the event listener data type.
- Server: Preserve formatting when cloning apps.

### Fixed

- React-components: The side menu is now closed if the user clicks anywhere outside the menu.

## \[[0.19.4](https://gitlab.com/appsemble/appsemble/-/releases/0.19.4)] - 2021-11-01

### Changed

- App: Rename `subPages` for `flow` and `tabs` pages to `steps` and `tabs` respectively.

## \[[0.19.3](https://gitlab.com/appsemble/appsemble/-/releases/0.19.3)] - 2021-10-22

### Added

- Block(`video`): Add `subtitles` property.

### Changed

- Webpack-config: Make `webpack` a regular dependency.

### Fixed

- App: Prevent profile picture from overflowing.

## \[[0.19.2](https://gitlab.com/appsemble/appsemble/-/releases/0.19.2)] - 2021-10-20

### Changed

- Cli: Turn `webpack` into a regular dependency.

### Fixed

- App: Fix service workers.
- Studio: Fix issue that caused a crash when viewing an organization.

## \[[0.19.1](https://gitlab.com/appsemble/appsemble/-/releases/0.19.1)] - 2021-10-18

### Added

- App: Add `user.register`, `user.login`, and `user.update` actions.
- App: Add account settings to app settings page if the user is logged in.
- App: Add password login method for apps. This allows users to register accounts for apps without
  having to go through the Appsemble Studio.
- Studio: The graphical JSON schema editor now supports the `multiline` property.
- Utils: Add the `app: locale` remapper.
- Utils: Add the `null.strip` remapper.

### Fixed

- Cli: Keep block message overrides when extracting app messages.

## \[[0.19.0](https://gitlab.com/appsemble/appsemble/-/releases/0.19.0)] - 2021-10-04

### Added

- Block(`control-buttons`): Add `control-buttons` block.
- App: Add support for custom fonts.

### Changed

- App: The theme font now takes an object containing `source` and `family` instead of just a font
  name.
- Server: Update the Docker base image to `node:16-bullseye-slim`.
- Utils: Invalid remapper calls now show more useful information.

## \[[0.18.31](https://gitlab.com/appsemble/appsemble/-/releases/0.18.31)] - 2021-09-23

### Added

- Block(`video`): Add `videoId` and `videoUrl` to `context` in the `onFinish` action.
- App: Add `array.unique` remapper.
- App: Allow apps to use any font from Google Fonts.

### Changed

- Block(`html`): Placeholders are now optional.

## \[[0.18.30](https://gitlab.com/appsemble/appsemble/-/releases/0.18.30)] - 2021-09-17

### Added

- Block(`html`): Add `data` event listener.
- Block(`markdown`): Add `data` event listener.
- App: Add `data` option to `page` remapper.
- App: Add `random.choice` remapper. It returns a random entry from an array of items, or the input
  if the input is not an array.
- App: Add `storage.read` and `storage.write` actions.
- Studio: Render Monaco editor diagnostics below the editor pane.

## \[[0.18.29](https://gitlab.com/appsemble/appsemble/-/releases/0.18.29)] - 2021-09-08

### Added

- Cli: Support translating values from `string.format` remappers.
- Studio: Support translating values from `string.format` remappers.

### Changed

- Server: Represent app members user app member information, not user information.

### Fixed

- Server: Return the correct role when getting a single app member.

## \[[0.18.28](https://gitlab.com/appsemble/appsemble/-/releases/0.18.28)] - 2021-09-04

### Added

- Block(`tiles`): Add `tiles` block.
- Cli: Add `--modify-context` flag for `app create` command. This will modify the context in
  `.appsemblerc` to include the ID of the newly created app.
- Cli: Add `asset create` command.
- Cli: Add support for `.appsemblerc.yaml` context usage for `resource` and `team` commands using
  `--app <path>` and `--context <environment>` flags.
- Sdk: The `IconName` type from `@fortawesome/fontawesome-common-types` is now re-exported by the
  SDK.
- Server: Add option to define annotations when creating a team.

## \[[0.18.27](https://gitlab.com/appsemble/appsemble/-/releases/0.18.27)] - 2021-08-16

### Added

- Cli: Add `team` subcommand to `app` command. The team subcommand can be used to create, update,
  and delete teams and team members.

### Changed

- Server: Replaced `PUT` with `PATCH` when updating a team.

### Fixed

- Studio: Fix crash in Safari.

## \[[0.18.26](https://gitlab.com/appsemble/appsemble/-/releases/0.18.26)] - 2021-08-13

### Fixed

- Block(`html`): Fix issue with data-context usage.
- Server: Fix migration for version 0.18.25.

## \[[0.18.25](https://gitlab.com/appsemble/appsemble/-/releases/0.18.25)] - 2021-08-13

### Added

- Block(`html`): Add `html` block.
- App: App screenshots are now available in the PWA manifest.
- Cli: Add `--resources` flag to `app create`.
- Cli: Add `block build` command.
- Cli: Add `resource create` command.
- Cli: Add `resource update` command.
- Server: Assets now support a name which can be used to reference them as an alternative to their
  ID.
- Utils: Add `page` remapper. This currently only supports the `url` property.
- Utils: Add `url` to `app` remapper.

### Changed

- Server: Uploading assets now supports `multipart/form-data` instead of raw data.

## \[[0.18.24](https://gitlab.com/appsemble/appsemble/-/releases/0.18.24)] - 2021-07-29

### Fixed

- Block(`button-list`): Fix `onClick` not being used as the default if an action isn’t specified.
- Block(`markdown`): Fix issue where certain data types would not display correctly.
- App: Support remappers in page dialog titles.
- Cli: Fix parsing error when verifying YAML messages.
- Studio: Fix a crash caused by the editor.

## \[[0.18.23](https://gitlab.com/appsemble/appsemble/-/releases/0.18.23)] - 2021-07-20

### Fixed

- Server: Make `remote` argument optional.

## \[[0.18.22](https://gitlab.com/appsemble/appsemble/-/releases/0.18.22)] - 2021-07-20

### Added

- App: Add Croatian translations.
- App: Add `share` action.
- Cli: Added `--dry-run` option to `appsemble app create`.
- Server: Add block synchronization with remote Appsemble instances.
- Server: Add option to do a dry run of the app creation endpoint. By adding `?dryRun=true` to the
  query string, apps can now be validated without having to create a new app or using an existing
  app.
- Studio: Add Croatian translations.

### Changed

- Cli: Replace [`typescript-json-schema`](https://github.com/YousefED/typescript-json-schema) with
  [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).
- Cli: The CLI now looks for `app-definition.yaml` instead of `app.yaml`.

## \[[0.18.21](https://gitlab.com/appsemble/appsemble/-/releases/0.18.21)] - 2021-07-09

### Added

- App: Append returned element from the `bootstrap` SDK function to the shadow root.
- Cli: Add support for including an icon when creating an organization.
- Server: Add support for including an icon when creating an organization.
- Server: The block APIs now return a list of languages supported by the block.
- Studio: Add support for including an icon when creating an organization.

### Removed

- Sdk: Remove `attach` function.

## \[[0.18.20](https://gitlab.com/appsemble/appsemble/-/releases/0.18.20)] - 2021-06-30

### Fixed

- App: Fix crash that happened on builtin pages.
- Server: Escape query parameters in returned icon URLs.

## \[[0.18.19](https://gitlab.com/appsemble/appsemble/-/releases/0.18.19)] - 2021-06-29

### Added

- Server: Add new option `--sentry-allowed-domains` to only serve Sentry on apps from specific
  domains.

### Changed

- App: Sync up bottom navigation with side navigation in terms of the available options based on the
  `layout` property.

### Removed

- Server: Remove block resources.

### Fixed

- App: Fix usage of `navigation` property in pages.
- Server: Fix serving maskable app icons.
- Studio: Use app icons provided by the API.
- Studio: Use block icons provided by the API.

## \[[0.18.18](https://gitlab.com/appsemble/appsemble/-/releases/0.18.18)] - 2021-06-25

### Added

- App: Add Russian translations.
- Appsemble: Add `progress` property to `flow` pages. This can be used to set the method used to
  display the progress of a flow page’s steps.
- Studio: Add Russian translations.

### Changed

- Appsemble: Change the background color of `corner-dots` in `flow` pages. More often than not these
  ended up being invisible due to the default background color.

## \[[0.18.17](https://gitlab.com/appsemble/appsemble/-/releases/0.18.17)] - 2021-06-15

### Added

- App: Add `navTitle` property to page.
- Studio: Add password strength indicator.

### Changed

- Cli: Change the default remote to `https://appsemble.app`.

### Fixed

- Cli: Fix the `--ignore-conflict` flag behavior.

### Security

- Server: Passwords must now be at least 8 characters.

## \[[0.18.16](https://gitlab.com/appsemble/appsemble/-/releases/0.18.16)] - 2021-06-10

### Added

- Block(`data-loader`): Add support for `context`. The data passed to the block (for example the
  current data in a flow page) is now available in the property `data` when using `context`
  remappers.
- Block(`video`): Add video block.
- App: Add `condition` action.
- App: Add action `flow.to`.
- Appsemble: Add `translate` remapper. This can be used instead of `message.format` for simpler
  messages that don’t use any message values.
- Cli: Add support setting an icon when creating an app.
- Cli: Add support setting an icon when updating an app.
- Cli: Set the process name to `appsemble`.
- Server: Add `condition` action.
- Server: Allow specifying `iconBackground` when creating an app.
- Server: Allow specifying `maskableIcon` when creating an app.
- Server: Set the process name to `appsemble`.

### Fixed

- App: Fix inclusion of `context` within remappers for `query` in `request` actions. This was
  causing `context` to not be available.

## \[[0.18.15](https://gitlab.com/appsemble/appsemble/-/releases/0.18.15)] - 2021-06-01

### Added

- Studio: Add core app message translations to the translations page.

### Changed

- Server: Block organization IDs that could be used to impersonate Appsemble.
- Server: Redirect to Appsemble Studio for app-like URLs.

## \[[0.18.14](https://gitlab.com/appsemble/appsemble/-/releases/0.18.14)] - 2021-05-26

### Fixed

- CI: Fix release process for production.

## \[[0.18.13](https://gitlab.com/appsemble/appsemble/-/releases/0.18.13)] - 2021-05-26

### Added

- Studio: Add page for viewing the format of a resource based on its definition.
- Studio: Add copy and download buttons on code blocks.

### Fixed

- App: Fix `hidden` menu navigation displaying a blank page.
- Studio: Fix editor tabs.
- Studio: Fix syntax highlighting for CSS in app editor.

## \[[0.18.12](https://gitlab.com/appsemble/appsemble/-/releases/0.18.12)] - 2021-05-21

### Fixed

- CI: Fix release process for production.

## \[[0.18.11](https://gitlab.com/appsemble/appsemble/-/releases/0.18.11)] - 2021-05-21

### Added

- Cli: Add support for parsing app messages from JSON.
- Server: Add roles “APIReader”, “APIUser”, and “Translator”.
- Studio: Add options for translating certain metadata of apps. These currently are: app name, app
  description, role names, and role descriptions. These localized names are used when displaying
  apps.

### Changed

- Server: Change structure of app messages for more consistent formatting for both input and output.
  This allows for a more consistent API as well as more specific translations.
- Studio: Change translations page to split off messages by categories.

## \[[0.18.10](https://gitlab.com/appsemble/appsemble/-/releases/0.18.10)] - 2021-05-05

### Changed

- App: Change font to “Open Sans”.
- Studio: Change font to “Open Sans”.

### Fixed

- App: Fix hidden menu items being displayed.

## \[[0.18.9](https://gitlab.com/appsemble/appsemble/-/releases/0.18.9)] - 2021-04-30

### Added

- Cli: Add support for organization email, website, and description.
- Studio: Add raw JSON editor for resources.

### Changed

- App: The same side menu is used now as in Appsemble Studio.
- App: The default theme has been updated.
- Cli: The `--verify` flag for `appsemble app extract-messages` now takes a list of languages to
  verify.
- Cli: `appsemble app extract-messages` now extracts messages for the default language.
- Studio: The default theme has been updated.

### Removed

- App: Remove support for OAuth2 password login.
- Cli: Remove support for the `@` prefix for organization IDs.
- Server: Remove support for OAuth2 password login.
- Studio: Remove the GUI app editor.

### Fixed

- Studio: Fix displaying of App ratings.

### Security

- Server: Organization members can only be viewed by organization members.
- Studio: Organization members can only be viewed by organization members.

## \[[0.18.8](https://gitlab.com/appsemble/appsemble/-/releases/0.18.8)] - 2021-04-16

### Added

- CLI: Add command `extract-messages` for extracting and validating app messages.

### Removed

- App: The runtime check for required actions has been removed.

### Fixed

- Block(`form`): Fix displaying of previous form state in checkbox fields when using `flow.back`.

## \[[0.18.7](https://gitlab.com/appsemble/appsemble/-/releases/0.18.7)] - 2021-04-12

### Added

- Studio: Add option to view larger images of App screenshots in Studio.

### Fixed

- App: Fix crash when using dialog actions.

## \[[0.18.6](https://gitlab.com/appsemble/appsemble/-/releases/0.18.6)] - 2021-04-09

### Added

- Studio: Add option to reorder array items in the resource editor.
- Studio: Add option to sort primitive types in the resource editor.
- Studio: Add options to hide properties from the resource table.

### Changed

- Sdk: Actions should be called directly instead of calling `dispatch()`.
- Studio: Display name of organizations instead of the ID whenever possible.

### Fixed

- Sdk: Return the correct URL when calling `href()` on link actions.
- Studio: Fix issue where array items were not inserted properly in the resource editor.

## \[[0.18.5](https://gitlab.com/appsemble/appsemble/-/releases/0.18.5)] - 2021-03-31

### Added

- Studio: Add support for collapsing objects and arrays in the resource editor.

### Changed

- Server: Add `$public` role for resource roles.
- Server: Make resources private by default.

## \[[0.18.4](https://gitlab.com/appsemble/appsemble/-/releases/0.18.4)] - 2021-03-24

### Fixed

- Server: Fix serving apps
- Server: Fix serving Appsemble Studio

## \[[0.18.3](https://gitlab.com/appsemble/appsemble/-/releases/0.18.3)] - 2021-03-24

### Fixed

- Studio: Fix crash issue on organizations page.
- Studio: Fix handling of null values in organization settings.

## \[[0.18.2](https://gitlab.com/appsemble/appsemble/-/releases/0.18.2)] - 2021-03-23

### Added

- Block(`data-loader`): Add Danish translations.
- Block(`data-loader`): Add French translations.
- Block(`data-loader`): Add German translations.
- Block(`data-notifier`): Add Danish translations.
- Block(`data-notifier`): Add French translations.
- Block(`data-notifier`): Add German translations.
- Block(`detail-viewer`): Add support for viewing large versions of images.
- Block(`feed`): Add Danish translations.
- Block(`feed`): Add French translations.
- Block(`feed`): Add German translations.
- Block(`feed`): Add support for viewing large versions of images.
- Block(`filter`): Add Danish translations.
- Block(`filter`): Add French translations.
- Block(`filter`): Add German translations.
- Block(`form`): Add Danish translations.
- Block(`form`): Add French translations.
- Block(`form`): Add German translations.
- Block(`form`): Add support for viewing large versions of images.
- Block(`form`): Localize calendar of `date` and `date-picker` fields.
- Block(`list`): Add Danish translations.
- Block(`list`): Add French translations.
- Block(`list`): Add German translations.
- Block(`map`): Add Danish translations.
- Block(`map`): Add French translations.
- Block(`map`): Add German translations.
- Block(`table`): Add Danish translations.
- Block(`table`): Add French translations.
- Block(`table`): Add German translations.
- App: Add class `appsemble-login` to make applying custom styling to the login page easier.
- Studio: Add option to override the Appsemble core messages. For example:
  `app.src.components.OpenIDLogin.loginWith` to override the messages for the login buttons.
- Studio: Add option to specify role when inviting members to an organization.
- Studio: Add organization details pages. Theses page can be used to view all different
  organizations that are using Appsemble.
- Studio: Add support for `email`, `description`, and `website` to organizations.
- Studio: Add support for hiding the default Appsemble login method.
- Studio: Add support for specific translations per block on each page.

### Changed

- Studio: Move organization settings to the organization details pages.

## \[[0.18.1](https://gitlab.com/appsemble/appsemble/-/releases/0.18.1)] - 2021-03-08

### Added

- Server: Add support for automatically backing up previous app definitions.
- Studio: Add support for viewing and restoring app snapshots.
- Studio: Add support for viewing app definitions.

## \[[0.18.0](https://gitlab.com/appsemble/appsemble/-/releases/0.18.0)] - 2021-03-01

### Added

- Block(`data-loader`): Add support for translating block messages.
- Block(`data-notifier`): Add support for translating block messages.
- Block(`feed`): Add support for translating block messages.
- Block(`filter`): Add support for translating block messages.
- Block(`form`): Add support for translating block messages.
- Block(`list`): Add support for translating block messages.
- Block(`map`): Add support for translating block messages.
- Block(`table`): Add support for translating block messages.
- App: Add `link.back` and `link.next` actions. These can be used to navigate between previously
  visited pages.
- Cli: Clear the block output directory before building.
- Server: Add the `Content-Disposition` header for app assets.
- Server: Implement Sentry for all commands, not just `start`.
- Studio: Add indicator for locked apps.
- Studio: Add option to delete app icons.
- Webpack-config: Add package `@appsemble/webpack-config`.

### Changed

- App: Hide menu by default if only one page is visible.

### Removed

- Block(`data-loader`): Remove label `loadErrorMessage`. This has been replaced by the message
  translation support.
- Block(`data-notifier`): Remove labels `buttonLabel`, `newMessage`, `updatedMessage`. These have
  been replaced by the message translation support.
- Block(`feed`): Remove labels `anonymousLabel`, `emptyLabel`, `replyErrorMessage`, `replyLabel`.
  These have been replaced by the message translation support.
- Block(`filter`): Remove labels `clearLabel`, `titleLabel`, `submitLabel`. These have been replaced
  by the message translation support.
- Block(`form`): Remove labels `fieldErrorLabel`, `formRequirementError`, `invalidLabel`,
  `optionalLabel`, `previousLabel`, `submitError`, `submitLabel`. These have been replaced by the
  message translation support.
- Block(`list`): Remove labels `error`, `noData`. These have been replaced by the message
  translation support.
- Block(`map`): Remove label `locationError`. It has been replaced by the message translation
  support.
- Block(`table`): Remove labels `emptyMessage`, `error`. These have been replaced by the message
  translation support.

## \[[0.17.6](https://gitlab.com/appsemble/appsemble/-/releases/0.17.6)] - 2021-02-10

### Added

- Cli: Add contexts in `.appsemblerc.yaml`.
- Server: Add `locked` property to apps.
- Studio: Add app locking option. This can be used to put apps in a read only state.
- Studio: Add option to edit the long description of an app in the app’s settings.

### Changed

- App: Prevent returning null when fetching undefined properties in `prop` remapper.
- Cli: Change `appsemble auth login` command to `appsemble login`.
- Cli: Change `appsemble auth remove` command to `appsemble logout`.
- Server: App assets are now hard deleted instead of soft deleted.
- Server: App resources are now hard deleted instead of soft deleted.

## \[[0.17.5](https://gitlab.com/appsemble/appsemble/-/releases/0.17.5)] - 2021-02-03

### Changed

- Server: App, block, and organization icons are now cached.
- Server: Email addresses are now treated as case insensitive.

## \[[0.17.4](https://gitlab.com/appsemble/appsemble/-/releases/0.17.4)] - 2021-02-02

### Fixed

- Server: Include translations

## \[[0.17.3](https://gitlab.com/appsemble/appsemble/-/releases/0.17.3)] - 2021-02-02

### Added

- App: Add support for maskable icons.
- CLI: Add support for maskable icons.
- Studio: Add French language selection.
- Studio: Add German language selection.
- Studio: Add tool for managing app icons.
- Studio: Display author in resources table.

### Changed

- App: App icons are now scaled, not cropped.
- Studio: Display maskable app icons.
- Studio: Include app styles when cloning apps.

### Fixed

- Block(`form`): Fix loading initial values for enum fields that have asynchronous options.

## \[[0.17.2](https://gitlab.com/appsemble/appsemble/-/releases/0.17.2)] - 2021-01-26

### Added

- Block(`map`): Add `center` and `follow` event listeners.
- Cli: Upload `readme.md` files as the long description for apps.
- Server: Add support for long descriptions for apps.
- Studio: Render long descriptions in the app details pages.

### Changed

- Studio: Add `ManageTeams` permission to `Manager` role in organizations. Organization managers now
  have full access to teams for apps.
- Studio: Add various design changes.

### Fixed

- App: Fix `resource.delete` and `resource.update` ID resolution.

### Security

- Server: Resource API calls made from Appsemble Studio or client credentials now use the
  organization security model instead of the app security model.

## \[[0.17.1](https://gitlab.com/appsemble/appsemble/-/releases/0.17.1)] - 2021-01-21

### Added

- App: Add a remapper for the body of request actions.
- App: The `team.join` action allows blocks to join a team.
- App: The `team.list` action allows blocks to access all teams in the app.
- Server: Add a remapper for the body of request actions.
- Server: Add endpoints for manually replacing, creating, and removing app screenshots.
- Studio: Add option to upload and delete screenshots.

### Changed

- Server: Remove the user filter from the teams API if it’s called from an app.

### Fixed

- Block(`form`): Fix selecting enum option values that aren’t strings.

### Security

- Server: Allow users to join a team from within an app.

## \[[0.17.0](https://gitlab.com/appsemble/appsemble/-/releases/0.17.0)] - 2021-01-14

### Added

- Block(`map`): Add `filterLatitudeName` and `filterLongitudeName` parameters.
- App: Add support for `$team:member` and `$team:manager` roles in `page.roles`.
- Server: Add option to filter resources by user ID by applying the appropriate OData filter. For
  example: `$filter=$author/id eq 11111111-a111-11a1-aa11-111a1a11aa1a"`.
- Server: Added possibility to upload and link assets with resources.
- Utils: Add the app remapper.

### Changed

- Block(`map`): Change parameters `longitude` and `latitude` to accept remappers instead of property
  paths.
- App: Adapted the updated resource API.

### Removed

- App: Remove `parameters` property from `link` actions. This functionality can be replaced by using
  `remap`.
- Appsemble: Remove the `base` property of `request` actions. This can be replicated using remappers
  in `onSuccess` and/or `onError`.
- Studio: Remove the alpha tag from the header.

## \[[0.16.2](https://gitlab.com/appsemble/appsemble/-/releases/0.16.2)] - 2021-01-06

### Fixed

- Block(`form`): Fix issue where submit button is incorrectly disabled.

## \[[0.16.1](https://gitlab.com/appsemble/appsemble/-/releases/0.16.1)] - 2021-01-05

### Fixed

- Block(`form`): Fix issue where form validation overwrites unresolved errors.

## \[[0.16.0](https://gitlab.com/appsemble/appsemble/-/releases/0.16.0)] - 2020-12-21

### Changed

- Block(`form`): Add `error` to context of `formRequirement` errors.
- Sdk: Changed asset IDs to string.
- Server: Add `size` property to `/api/apps/{id}/teams`.
- Server: Add support for fetching teams from app. This is automatically filtered to only include
  teams the user is a member of.
- Server: Changed asset IDs to string.

## \[[0.15.12](https://gitlab.com/appsemble/appsemble/-/releases/0.15.12)] - 2020-12-11

### Added

- Block(`form`): Add support for enum fields to receive options from events.
- App: Added support for sending feedback using the Sentry feedback API.
- App: Allow the user to send feedback when a crash is reported.
- Cli: Added support for custom block events.
- Studio: Added auto completion and validation in app editor.
- Studio: Added support for sending feedback using the Sentry feedback API.
- Studio: Allow the user to send feedback when a crash is reported.

## \[[0.15.11](https://gitlab.com/appsemble/appsemble/-/releases/0.15.11)] - 2020-12-08

### Added

- Server: Add support for the OData `$select` query parameter when querying resources.
- Studio: Add support for collapsing lists of apps.

## \[[0.15.10](https://gitlab.com/appsemble/appsemble/-/releases/0.15.10)] - 2020-12-02

### Added

- Block(`form`): Added support for dynamic enum options.
- Block(`form`): Added the new `change` event.
- App: Add `resource.count` action.
- App: Add support for `$team:member` and `$team:manager` in resource action roles.
- App: Added Danish language support to the core parts of apps.
- App: Added `waitFor` option for `event` action.
- Appsemble: Add support for fetching resources based on teams.
- Server: Add `/resources/{type}/$count` endpoint.
- Server: Add teams API.
- Studio: Add support for teams in apps.
- Studio: Added Danish language support.

### Changed

- Block(`form`): Invalid form requirements now block the user from submitting the form.
- Server: Change `/api/apps/{id}/members` to also display organization members based on the policy.

## \[[0.15.9](https://gitlab.com/appsemble/appsemble/-/releases/0.15.9)] - 2020-11-23

### Added

- Server: Add more verbose logging for running app cronjobs.

## \[[0.15.8](https://gitlab.com/appsemble/appsemble/-/releases/0.15.8)] - 2020-11-20

### Added

- App: Add `layout` property which can be used to determine where various layout elements should be.
- Server: Add support connecting for SAML2.0 identity providers to apps.
- Studio: Add support connecting for SAML2.0 identity providers to apps.

### Changed

- App: Move `navigation` to `layout`.

## \[[0.15.7](https://gitlab.com/appsemble/appsemble/-/releases/0.15.7)] - 2020-11-13

### Added

- Server: Add support for running cronjobs for apps.

### Fixed

- Block(`form`): Check for `undefined` in `enum` and `radio` fields.
- Preact-components: Fix error messages not showing up when they should.

## \[[0.15.6](https://gitlab.com/appsemble/appsemble/-/releases/0.15.6)] - 2020-11-04

### Fixed

- App: Fixed the OAuth2 login scope used to request an access token.

## \[[0.15.5](https://gitlab.com/appsemble/appsemble/-/releases/0.15.5)] - 2020-11-03

### Added

- Utils: Add `date.now` and `date.add` remappers.
- Utils: Add `object.assign` remapper.

### Security

- Server: Add action handler security definition, allowing actions to access a logged in user.
- Server: Fix the check for which OAuth2 scopes are granted when requesting an access token.

## \[[0.15.4](https://gitlab.com/appsemble/appsemble/-/releases/0.15.4)] - 2020-10-26

### Added

- Server: Add support for organization logos.

## \[[0.15.3](https://gitlab.com/appsemble/appsemble/-/releases/0.15.3)] - 2020-10-22

### Added

- App: Add `layout` property for blocks definitions.
- App: Add `position` property for floating blocks.
- Block(`form`): Add `date` as a field type. It is the same as `date-time` but with the time
  component disabled.
- Server: Add `anchors` property. This can be used to store YAML anchors.
- Studio: Implement internationalization. For now English and Dutch are supported.

## \[[0.15.2](https://gitlab.com/appsemble/appsemble/-/releases/0.15.2)] - 2020-10-14

### Fixed

- App: Fix events when called from a dialog action.
- Studio: Save agreed OAuth2 consent for app login.

## \[[0.15.1](https://gitlab.com/appsemble/appsemble/-/releases/0.15.1)] - 2020-10-05

### Added

- Block(`form`): Implemented `required` requirement for `date-time` fields.

### Fixed

- Block(`filter`): Fixed layout for highlighted `date-range` fields.
- Server: Added support for more numeric OData types.

## \[[0.15.0](https://gitlab.com/appsemble/appsemble/-/releases/0.15.0)] - 2020-10-02

### Added

- Block(`filter`): Made the search for string fields case insensitive.
- Block(`form`): Added support for length requirements for repeated object fields.
- Block(`table`): Add support for `dropdown` fields.

### Fixed

- Block(`form`): Fixed the accept property for file fields.

## \[[0.14.2](https://gitlab.com/appsemble/appsemble/-/releases/0.14.2)] - 2020-09-25

### Fixed

- Block(`form`): Fix styling of date time fields.

## \[[0.14.1](https://gitlab.com/appsemble/appsemble/-/releases/0.14.1)] - 2020-09-25

### Changed

- Block(`form`): Don’t mark pristine fields as errors.

### Fixed

- Block(`form`): Fix the error state if initial data was received.

## \[[0.14.0](https://gitlab.com/appsemble/appsemble/-/releases/0.14.0)] - 2020-09-24

### Added

- Block(`form`): Added option to add `required` requirement to fields of type `date-time`.
- Block(`form`): Added support for fields of type `object`.
- Block(`table`): Add `index` and `repeatedIndex` to context.
- App: Add `defaultPage` property to roles in the security definition.
- Utils: Add `array` remapper.
- Utils: Add `if` remapper.
- Utils: Add `root` remapper.
- Utils: Add option to define remappers as a single object instead of an array of remappers.
- Utils: Add option to directly use boolean and number values in remappers without having to use
  `static`.
- Utils: Add support for `equals` remapper.

## \[[0.13.15](https://gitlab.com/appsemble/appsemble/-/releases/0.13.15)] - 2020-09-18

### Added

- App: Add support for `cc` and `bcc` in email actions.
- Server: Add support for `cc` and `bcc` in email actions.
- Server: Added option to skip sending emails by leaving `to`, `cc`, and `bcc` empty.
- Utils: Implement `array.map` remapper.

### Fixed

- Block(`form`): Fix issue where the default state was not correctly initialized.
- Preact-components: Fix logic for when to display the optional label.

## \[[0.13.14](https://gitlab.com/appsemble/appsemble/-/releases/0.13.14)] - 2020-09-15

### Added

- Block(`detail-viewer`): Add support for groups of fields.
- App: Add Dutch translations.
- App: Add the `user` remapper.
- React-components: Add Dutch translations.

### Changed

- Block(`detail-viewer`): Rename `name` to `value`.
- Block(`table`): Rename `name` to `value`.

## \[[0.13.13](https://gitlab.com/appsemble/appsemble/-/releases/0.13.13)] - 2020-09-08

### Added

- Block(`data-loader`): Add `loadErrorMessage` parameter for translating load error messages.
- Block(`feed`): Add the following translatable messages to the block: `anonymousLabel`,
  `replyErrorMessage`, `replyLabel`, `emptyLabel`.
- Block(`form`): Add support for `AcceptRequirement` and `LengthRequirement` for `file` fields.
- Block(`form`): Add support for `tag` on fields. This sets the tag for a field’s label, overwriting
  the optional label.
- Block(`form`): Add support for the following translatable messages: `submitLabel`,
  `fieldErrorLabel`, `formRequirementError`, `invalidLabel`, `emptyFileLabel`, `optionalLabel`.
- Block(`list`): Add parameters for translating error messages and when no data is available.
- Block(`table`): Add `errorMessage` and `emptyMessage` parameters for translation purposes.
- App: Add support for translated app URLs. Translated page names can be entered in the translations
  editor.

### Changed

- Block(`form`): Add minimum value of `1` to `maxLength` and `minLength` in `LengthRequirement`.
- Block(`form`): Move `accept` to `AcceptRequirement`.
- Block(`table`): Update `name` to use remappers.

### Removed

- Preact: Remove support for messages using `intl-messageformat`. Use block parameters with
  remappers instead.

### Fixed

- Server: Don’t create ingress for apps that have an empty string domain field.

## \[[0.13.12](https://gitlab.com/appsemble/appsemble/-/releases/0.13.12)] - 2020-09-01

### Added

- Server: Add support for attaching assets to emails.

## \[[0.13.11](https://gitlab.com/appsemble/appsemble/-/releases/0.13.11)] - 2020-08-27

### Added

- Block(`form`): Add support for previous button. It is defined by the `previousLabel` parameter and
  `onPrevious` action.
- Cli: Add `appsemble organization create` command to create organizations.

### Changed

- Block(`form`): Add remapper support to `submitLabel`.
- App: Fall back to the message ID for untranslated app messages.

### Removed

- App: Remove organization styling.
- Cli: Remove `appsemble theme upload` command.
- Server: Remove organization styling.

### Fixed

- Block(`form`): Fix logic for determining form validity.

## \[[0.13.10](https://gitlab.com/appsemble/appsemble/-/releases/0.13.10)] - 2020-08-21

### Fixed

- Server: Fix migration for version 0.13.9.

## \[[0.13.9](https://gitlab.com/appsemble/appsemble/-/releases/0.13.9)] - 2020-08-21

### Added

- App: Add support for setting language preferences in the settings page of apps.
- Cli: Add support for uploading app screenshots.
- Server: Add support for uploading and serving app screenshots.
- Studio: Display app screenshots in the app detail view.

### Changed

- App: Add link to settings page to side menu.

### Fixed

- App: Fix various issues with page routing.

## \[[0.13.8](https://gitlab.com/appsemble/appsemble/-/releases/0.13.8)] - 2020-08-18

### Added

- Block(`filter`): Add support for remappers.
- Block(`form`): Add support for remappers.
- Block(`map`): Add support for remappers.
- Block(`markdown`): Add support for remappers.
- App: Add translatable app messages.
- App: Add `string.replace` remapper.
- Studio: Add translations page to studio for translating app messages.

## \[[0.13.7](https://gitlab.com/appsemble/appsemble/-/releases/0.13.7)] - 2020-07-31

### Added

- Block(`form`): Add support for remappers.
- Block(`map`): Allow customizing the message for location errors.
- Utils: Add `string.replace` remapper.

### Changed

- Block(`map`): Make the location error English by default.

### Fixed

- App: Fix prefix paths for `onSuccess` and `onError` actions.

## \[[0.13.6](https://gitlab.com/appsemble/appsemble/-/releases/0.13.6)] - 2020-07-27

### Added

- Block(`feed`): Add support for custom markers. Refer to the block documentation for more
  information.
- Block(`table`): Field label is now a remapper.
- Block(`table`): The message for the empty state can now be configured using a remapper.
- Block(`table`): The message for the error state can now be configured using a remapper.
- App: Add `email` action. This action can be used to send emails based on what’s entered as its
  `to`, `subject`, and `body` parameters.
- Server: Add support for handling `email` actions from apps.

### Changed

- Block(`feed`): Move `longitude` and `latitude` into the `marker` object.
- Block(`feed`): Replace remapping logic with remappers.

## \[[0.13.5](https://gitlab.com/appsemble/appsemble/-/releases/0.13.5)] - 2020-07-15

### Added

- App: Add `throw` action. This can be used when a block specifically wants data to be thrown
  instead of returned.
- App: Add `data-path` and `data-type` attributes to pages and blocks on pages.
- Block(`detail`): Add `appsemble-` type classes to the containers of fields to make it easier to
  style them. For example: `appsemble-file` for file type fields.
- App: Add support for login with third party OAuth2 providers.
- Block(`data-notifier`): Add new the `data-notifier` block. This has the same functionality as the
  filter block for refreshing new data, but for general use.
- Block(`detail-viewer`): Add `icons` property which can be used to customize the way the marker
  looks. It is identical to how works in `map`.
- Block(`form`): Add `appsemble-` type classes to the containers of fields to make it easier to
  style them. For example: `appsemble-file` for file type fields.
- Block(`form`): Add `requirements` parameter to base of form. This can be used to perform an action
  that mutates the form based on what is returned from the action.
- Block(`list`): Add `image` property.
- Block(`map`): Add `color` property to `icons`. This can be used to change the color of custom
  markers.
- Block(`map`): Add `defaultLocation` property. This property is used to set the location of the map
  when the user’s location cannot be found. It defaults to Greenwich Park.
- Server: Add login flow for user apps using third party OAuth2 providers.
- Studio: Add login flow for user apps using third party OAuth2 providers.
- Studio: Add option to mark specific resources to be included when cloning template apps.
- Studio: Add prompt when closing the editor with unsaved changes.

### Changed

- App: Make `noop` action return the data it received instead of returning nothing.
- Block(`filter`): This block has been rewritten, because it had too many issues. Support for data
  notifications has been removed. Use `data-notifier` instead.
- Block(`form`): Move several fields specific to validation to the `requirements` array. Refer to
  the block documentation for specific changes.

### Fixed

- Studio: Fix bug where user gets redirected to app details when trying to access secured routes.

## \[[0.13.4](https://gitlab.com/appsemble/appsemble/-/releases/0.13.4)] - 2020-06-29

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

## \[[0.13.3](https://gitlab.com/appsemble/appsemble/-/releases/0.13.3)] - 2020-06-11

### Added

- App: Add `onSuccess` and `onError` properties to actions. This allows for chaining actions
  together by defining additional actions that are dispatched depending on whether the parent action
  ran successfully or produced an error.
- App: Add `message` action. This action can be used to display messages to the user.

### Changed

- App: Redirect the user to a login page inside the app when logging in instead of linking to
  Appsemble Studio directly.
- Block(`button-list`): Change `label` property type from `string` to `Remapper`.

## \[[0.13.2](https://gitlab.com/appsemble/appsemble/-/releases/0.13.2)] - 2020-06-03

### Added

- CLI: Extract descriptions from TSDoc.
- CLI: Normalize the `--remote` argument.
- Server: Add event descriptions.
- Studio: Add event descriptions.

## \[[0.13.1](https://gitlab.com/appsemble/appsemble/-/releases/0.13.1)] - 2020-06-02

### Added

- Studio: Add support for login with GitHub.
- Studio: Add automated documentation rendering for blocks. This can be found at `/blocks`.

### Changed

- Server: Rename CLI arguments to be consistent with terminology used in OAuth2.
- Studio: Replace login button when not logged in with a dropdown. This allows access to
  documentation and other related links without having to log in beforehand.

### Fixed

- Studio: Fix login with OAuth2.

## \[[0.13.0](https://gitlab.com/appsemble/appsemble/-/releases/0.13.0)] - 2020-05-15

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

## \[[0.12.8](https://gitlab.com/appsemble/appsemble/-/releases/0.12.8)] - 2020-04-29

### Fixed

- Server: Fix connection to database with self-signed certificate.

## \[[0.12.7](https://gitlab.com/appsemble/appsemble/-/releases/0.12.7)] - 2020-04-29

### Fixed

- CI: Fix the release process for production.

## \[[0.12.6](https://gitlab.com/appsemble/appsemble/-/releases/0.12.6)] - 2020-04-29

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

## \[[0.12.5](https://gitlab.com/appsemble/appsemble/-/releases/0.12.5)] - 2020-04-16

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

## \[[0.12.4](https://gitlab.com/appsemble/appsemble/-/releases/0.12.4)] - 2020-04-06

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

## \[[0.12.3](https://gitlab.com/appsemble/appsemble/-/releases/0.12.3)] - 2020-03-27

### Fixed

- App: Fix loading blocks.

## \[[0.12.2](https://gitlab.com/appsemble/appsemble/-/releases/0.12.2)] - 2020-03-27

### Fixed

- App: Fix serving apps.
- Studio: Fix serving Appsemble studio.

## \[[0.12.1](https://gitlab.com/appsemble/appsemble/-/releases/0.12.1)] - 2020-03-26

### Added

- App: Add support for custom `action` format for parameters. This can be used to refer to other
  actions by name, including custom defined actions.
- App: Handle unsupported browsers.
- Block(`@appsemble/button-list`): Add new button list block.
- SDK: Add support for index signature actions.
- Server: Handle unsupported browsers.
- Server: Serve block assets from the app host URL instead of the studio host URL.

## \[[0.12.0](https://gitlab.com/appsemble/appsemble/-/releases/0.12.0)] - 2020-03-20

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

## \[[0.11.6](https://gitlab.com/appsemble/appsemble/-/releases/0.11.6)] - 2020-03-05

### Added

- App: Add support for block headers.

### Fixed

- Block(`@appsemble/form`): Fix issue where optional fields were marked as invalid.
- App: Fix leak of authorization header to third parties.

## \[[0.11.5](https://gitlab.com/appsemble/appsemble/-/releases/0.11.5)] - 2020-03-03

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

## \[[0.11.4](https://gitlab.com/appsemble/appsemble/-/releases/0.11.4)] - 2020-02-18

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

## \[[0.11.3](https://gitlab.com/appsemble/appsemble/-/releases/0.11.3)] - 2020-02-17

### Added

- Blocks(`@appsemble/data-loader`): Add `skipInitialLoad` parameter.
- Blocks(`@appsemble/map`): Make `move` emit event optional. When omitted, the map block won’t emit
  refresh events.

### Changed

- Server: Make the `AppId` column for `Asset` is required in the database.

### Fixed

- Server: Fix various issues when extracting app blocks.
- Studio: Fix various issues when extracting app blocks.

## \[[0.11.2](https://gitlab.com/appsemble/appsemble/-/releases/0.11.2)] - 2020-02-12

### Fixed

- Helm: Use the named service port for linking app domains.
- Server: Add resource references to JSON schema.
- Server: Fix serving an app based on a custom domain name.

## \[[0.11.1](https://gitlab.com/appsemble/appsemble/-/releases/0.11.1)] - 2020-02-12

### Fixed

- Server: Fix migration key for 0.10.0 migrations.

## \[[0.11.0](https://gitlab.com/appsemble/appsemble/-/releases/0.11.0)] - 2020-02-12

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

## \[[0.10.0](https://gitlab.com/appsemble/appsemble/-/releases/0.10.0)] - 2019-12-20

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

## \[[0.9.5](https://gitlab.com/appsemble/appsemble/-/releases/0.9.5)] - 2019-12-02

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

## \[[0.9.4](https://gitlab.com/appsemble/appsemble/-/releases/0.9.4)] - 2019-11-27

### Added

- Block(`@appsemble/filter`): Add support for check boxes.
- CLI: Add `app` subcommand for creating apps.
- Server: Add option to mark existing apps as templates.
- Studio: Add option to rate apps.
- Studio: Add app details page.
- Studio: Add rating indicators to index page. Apps are now sorted by rating.

### Removed

- Server: Remove file-based app templates.

## \[[0.9.3](https://gitlab.com/appsemble/appsemble/-/releases/0.9.3)] - 2019-11-18

### Added

- App: Add support for absolute URLs in `link` actions.
- App: Add support for push notifications. Users can subscribe to notifications in the app’s
  settings page. More strategies for receiving push notifications will be added in the future.
- App: Add settings page
- Server: Add support for broadcasting push notifications.

## \[[0.9.2](https://gitlab.com/appsemble/appsemble/-/releases/0.9.2)] - 2019-11-14

### Fixed

- Server: Add support connection to PostgreSQL databases over SSL.

## \[[0.9.1](https://gitlab.com/appsemble/appsemble/-/releases/0.9.1)] - 2019-11-14

### Fixed

- Server: Reduce log size when creating blocks.
- Server: Remove old migrations that depended on MySQL.

## \[[0.9.0](https://gitlab.com/appsemble/appsemble/-/releases/0.9.0)] - 2019-11-12

### Added

- Helm: Add support for self managed databases.
- Helm: Test ingress in the success hook.

### Changed

- Helm: Replace MySQL with PostgreSQL.
- Helm: Use Helm 3, dropping support for Helm 2.
- Server: Replace MySQL with PostgreSQL.

## \[[0.8.11](https://gitlab.com/appsemble/appsemble/-/releases/0.8.11)] - 2019-11-01

### Added

- Editor: Add App settings page
- Server: Add support for editing app settings. These settings include `path`, `icon`, `private`,
  and `domain`.
- Server: Add support for customizing the domain at which the app is served.

### Removed

- Editor: Remove icon
- Server: Remove support for `private` and `path` properties in App. These have been moved to
  `/api/apps/{appId}/settings`.

## \[[0.8.10](https://gitlab.com/appsemble/appsemble/-/releases/0.8.10)] - 2019-10-04

### Added

- App: Add `navigation` property to `page`.
- App: Add `hidden` and `left-menu` navigation types.
- Block(`@amsterdam/navigation`): Add navigation block.
- CLI: Add support for `@import` in organization style sheets.

### Fixed

- Block(`@appsemble/form`): Fix `maxLength` not being passed to string input fields.

## \[[0.8.9](https://gitlab.com/appsemble/appsemble/-/releases/0.8.9)] - 2019-10-02

### Fixed

- Editor: Don’t require a login to reset a forgotten password.
- Server: Fix issues related to OData filtering.

## \[[0.8.8](https://gitlab.com/appsemble/appsemble/-/releases/0.8.8)] - 2019-10-01

### Added

- Block(`@appsemble/form`): Add support for field icons.
- Editor: Add support for deleting apps.
- Server: Add support for deleting apps.

## \[[0.8.7](https://gitlab.com/appsemble/appsemble/-/releases/0.8.7)] - 2019-09-16

### Fixed

- Server: Add missing migration from 0.8.6.

## \[[0.8.6](https://gitlab.com/appsemble/appsemble/-/releases/0.8.6)] - 2019-09-16

### Added

- CLI: Convert TypeScript interfaces to JSON schema for block parameter validation.
- CLI: Upload a JSON schema to validate block parameters.
- Server: Blocks are now validated against a JSON schema.

## \[[0.8.5](https://gitlab.com/appsemble/appsemble/-/releases/0.8.5)] - 2019-09-01

### Added

- Server: Log the IP address from which requests are made.
- Server: Partial support for SSL on localhost.

### Changed

- Block(`@appsemble/form`): Form labels inputs are now aligned vertically.

### Fixed

- App: Fix some caching issues in the service worker.
- Block(`@appsemble/form`): Fix issue where `defaultValue` was considered invalid by default.
- Block(`@appsemble/form`): Fix issue where `defaultValue` was not used if value was falsy.

## \[[0.8.4](https://gitlab.com/appsemble/appsemble/-/releases/0.8.4)] - 2019-08-20

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

## \[[0.8.3](https://gitlab.com/appsemble/appsemble/-/releases/0.8.3)] - 2019-08-16

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

## \[[0.8.2](https://gitlab.com/appsemble/appsemble/-/releases/0.8.2)] - 2019-07-29

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

## \[[0.8.1](https://gitlab.com/appsemble/appsemble/-/releases/0.8.1)] - 2019-06-26

### Fixed

- App: Adjust the toolbar items size. They no longer exceed the main element padding.

## \[[0.8.0](https://gitlab.com/appsemble/appsemble/-/releases/0.8.0)] - 2019-06-25

### Added

- Block(`@appsemble/form`): Add support for hidden for hidden form field.
- Block(`@appsemble/form`): Add support for resolution limits for uploading images.
- Editor: Support basic organization management.
- Server: Support basic organization management.

### Fixed

- Editor: Fix issue where users were unable to verify their accounts when logged in.

## \[[0.7.0](https://gitlab.com/appsemble/appsemble/-/releases/0.7.0)] - 2019-06-14

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

## \[[0.6.0](https://gitlab.com/appsemble/appsemble/-/releases/0.6.0)] - 2019-05-20

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

## \[[0.5.0](https://gitlab.com/appsemble/appsemble/-/releases/0.5.0)] - 2019-04-11

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

## \[[0.4.2](https://gitlab.com/appsemble/appsemble/-/releases/0.4.2)] - 2019-02-26

### Added

- Server: Add option to disable user registration. This is only implemented server side. The
  registration form still exists in the editor.

## \[[0.4.1](https://gitlab.com/appsemble/appsemble/-/releases/0.4.1)] - 2019-02-20

### Removed

- Server: Remove the initialize sub command. It only served to initialize a default user in
  development. This can now be done easily from the editor.

### Fixed

- App: Fix the crash when a splash action is dispatched.

## \[[0.4.0](https://gitlab.com/appsemble/appsemble/-/releases/0.4.0)] - 2019-02-19

### Added

- Editor: Add link to external documentation.
- Extend documentation for creating blocks.
- Add LGPL.

### Changed

- Editor: Add significant changes to the GUI to make it more appealing.
- Editor: Host the editor on the root URL. Any other paths are available under sub paths of `/_`.

### Fixed

- App: Make sure the navigation menu button is always visible.

## \[[0.3.0](https://gitlab.com/appsemble/appsemble/-/releases/0.3.0)] - 2019-01-25

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

## \[[0.2.0](https://gitlab.com/appsemble/appsemble/-/releases/0.2.0)] - 2018-11-02

### Added

- Docker: Publish the `appsemble/appsemble` image on the public Docker Hub.
- Editor: Add support for uploading app icons.
- Frontend: Implement error reporting using Sentry.
- Frontend: Add logout button in the side menu.
- Server: Implement error reporting using Sentry.

### Changed

- Frontend: Show the page title instead of the app title.

## \[[0.1.0](https://gitlab.com/appsemble/appsemble/-/releases/0.1.0)] - 2018-10-19

This is the initial release of the Appsemble platform.
