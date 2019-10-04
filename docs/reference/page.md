---
menu: Reference
name: Page
route: /reference/page
---

# Page

One of the most important components of an Appsemble app is its list of pages. Without pages, the
apps won’t have anything for the users to interact with.

Each page in the list of pages in an app has several properties that define what they are called,
how they should display and what its content looks like.

## Properties

## `name`\*

The name of the page. This field is always required and must be unique within the app, meaning that
it is not possible to have two pages with the same name. The name of the page is displayed at the
top of each page as well as in the side navigational menu.

## `icon`

An Font Awesome icon to render in the navigation menu to represent the page. All supported icons can
be found on the [Font Awesome website](https://fontawesome.com/icons?m=free).

## `scope`

A list of `OAuth scopes` that are allowed to view this page. Adding `'*'` to the list of scopes
requires users to authenticate themselves in order to view the page.

## `type`

The type of the page. Type currently supports the following options:

- page (default)
- flow
- tabs

Setting this value to `flow` will result in the page displaying like a flow page, in which the page
is divided into _subpages_, allowing for users to be guided through several steps. Flow page actions
can be used to facilitate navigating through flow pages.

Setting this value to `tabs` will result in the page displaying tabs at the top of the page. Each
tab corresponds to a _subpage_ which can be linked to directly using the [link action](action#link).

## `blocks`\*

The list of blocks that are displayed on the page. Each page requires at least one block. Blocks are
displayed in the order that they are defined in the list.

> Note: This field is not required if `type` is set to `flow`.

## `subPages`\*

The list of _subpages_. When visiting the page, the first _subpage_ gets displayed by default.
Subpages are structured similarly to pages, albeit simplified. Each subpage consists the properties
`name` containing a unique name, and `blocks`, which are defined in the same way as
[blocks](#blocks).

> Note: This field is not required if `type` is not set `flow`.

## `navigation`

The type of navigation displayed on the page. This overrides the navigation property of the app
itself. Defaults to `left-menu` if navigation or App navigation are not set.

Set to `bottom` to use a navigation pane at the bottom of the screen instead of the default side
menu. Set to `hidden` to display no navigational menus at all.

See also: [App](app#navigation)

## `hideFromMenu`

This determines whether the page should be added to the menu or not. By default all pages without
[parameters](#parameters) are added to navigational menus. Set to `true` to hide the page from
menus.

## `parameters`

Page parameters can be used for linking to a page that should display a single resource. This
defined as a list of strings representing the properties to pass through. More often than not
passing `id` through is sufficient, depending on the block.

## Actions

Page actions follow the same structure as the actions seen in `blocks`, with the exception that they
are only available when `type` is set to `flow`.

### `onFlowFinish`

This action gets triggered when `flow.finish` gets called, or when `flow.next` gets called on the
final subpage. This action has a special property in which the cumulative input data from each
previous subpage gets sent, instead of the individual block that triggered this action.

### `onFlowCancel`

This action gets triggered when `flow.cancel` gets called.
