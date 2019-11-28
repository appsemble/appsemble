---
menu: Reference
name: App
route: /reference/app
---

# App

The app definition is where it all starts for each Appsemble app. On its own an app does not do
much, but by defining pages and using blocks, apps can be given form.

At the base level, each app has several properties that can be used to define an app.

## Properties

## `name`\*

The name of the app. This name shows up in several places, including the app index, the side menu,
as well as the app title when users install the app. This name does not necessarily have to be
unique.

## `path`

A unique identifier used to form the _URL_ of the app. This path must be unique. By default the path
is based on the name, for example: `My First App` → `my-first-app`.

## `private`

If set to `true`, the app will not be displayed in the app index unless the user is in the same
organization as the app.

## `description`

The description of the app. This description has a maximum character limit of 80 and is displayed in
the app index.

## `navigation`

Set a navigation type for the app. This defaults to `left-menu` for a left side menu. Set to
`bottom` to use a navigation pane at the bottom of the screen instead of the default side menu. Set
to `hidden` to display no navigational menus at all.

## `notifications`

Set the notification strategy for the app. If specified, push notifications can be sent to
subscribed users via the `Notifications` tab. The available strategies are `opt-in` and `startup`.
Setting this to `opt-in` allows for users to opt into receiving push notifications by pressing the
subscribe button in the App settings page. Setting this to `startup` will cause Appsemble to
immediately request for the permission upon opening the app.

> Note that setting `notifications` to `startup` is not recommended, due to its invasive nature.

## `pages`\*

The list of pages. Each app must have at least one page. More information about the properties of a
page can be found [here](page).

## `defaultPage`\*

The default page of the app. The value must be equal to the name of one of the pages.

## `resources`

The resources that are associated with this app. More information about resources and how they can
be used can be found [here](../appsemble-resources).

## `authentication`

A list of login methods for the app. Currently only the `OAuth` protocol is supported. This is
defined in an object containing the following properties:

**method**: The authentication method used. This value can be one of the following:

- `email`

**url**: The URL used to authenticate against.

**refreshURL**: The URL used to refresh the access token. If this is not set, `url` is used instead.

**clientId**: The client ID used when making the authentication request.

**scope**: The scopes to request when authenticating. Multiple scopes can be requested by separating
the scopes with spaces.
