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
