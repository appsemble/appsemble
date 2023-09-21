# ![](config/assets/logo.svg) Changelog

All notable changes to this project will be documented in this file.

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
