# App

The app definition is where it all starts for each Appsemble app. On its own an app does not do
much, but by defining pages and using blocks, apps can be given form.

At the base level, each app has several properties that can be used to define an app.

## Properties

## `name`\*

The name of the app. This name shows up in several places, including the app index, the side menu,
as well as the app title when users install the app. This name does not necessarily have to be
unique.

## `description`

The description of the app. This description has a maximum character limit of 80 and is displayed in
the app index.

## `layout`

Properties related to the layout of the app.

### `layout.navigation`

Set a navigation type for the app. This defaults to `left-menu` for a left side menu. Set to
`bottom` to use a navigation pane at the bottom of the screen instead of the default side menu. Set
to `hidden` to display no navigational menus at all.

## `layout.login`

Set the location of the login button. This defaults to `navbar` which adds a login button and
dropdown to the navigation bar. This can be set to `navigation` to instead display it in the
navigation menu, or `hidden` to hide it entirely.

## `layout.settings`

Set the location of the settings button. This defaults to `navbar` and is only visible there if the
login button is also visible in the navigation bar. This can be set to `navigation` to display it in
the navigation menu, or `hidden` to hide it entirely.

## `notifications`

Set the notification strategy for the app. If specified, push notifications can be sent to
subscribed users via the `Notifications` tab. The available strategies are `opt-in` and `startup`.
Setting this to `opt-in` allows for users to opt into receiving push notifications by pressing the
subscribe button in the App settings page. Setting this to `startup` will cause Appsemble to
immediately request for the permission upon opening the app.

> Note that setting `notifications` to `startup` is not recommended, due to its invasive nature.

## `pages`\*

The list of pages. Each app must have at least one page. More information about the properties of a
page can be found [here](page.md).

## `defaultPage`\*

The default page of the app. The value must be equal to the name of one of the pages.

## `resources`

The resources that are associated with this app. More information about resources and how they can
be used can be found [here](../guide/resources.md).

## `security`

A security definition that defines the roles that are available within the app. This allows for more
fine-grain control over which users have access to specific pages or blocks.

- **default**: An object containing the default behavior to use.
- **default.role**: The name of the default role to use. This must match with one of the roles
  defined within the security definition.
- **default.policy**: The policy to use for assigning the default role. Allowed values are:
  `everyone` to assign the default role to every user regardless of whether they were invited or
  not, `organization` to assign the default role to every user within the app’s organization, and
  `invite` for an invite-only policy.
- **roles**: An object containing keys representing the roles that can be used within the app.
- **roles[key].description**: The description of a role.
- **roles[key].inherits**: The name of the role to inherit from. Note that this role must exist and
  can not inherit itself via this field or the `inherits` field of the referenced role.
- **roles[key].defaultPage**: The default page to redirect users with this role to.
- **login** (_**deprecated**_): By default, users can login to apps using OAuth2. In order to
  support legacy apps, this can be set to `password` to enable a less secure login mechanism.

## `roles`

The list of roles that are allowed to view the app. This list is used as the default roles for the
`roles` property on pages and blocks, which can be overridden by defining them for a specific page
or block. Note that these roles must be defined in `security.roles`.
