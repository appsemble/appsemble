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

The name of the page. This field is always required and must be unique, meaning that it is not
possible to have two pages with the same name. The name of the page is displayed at the top of each
page as well as in the side navigational menu.

## `scope`

A list of `OAuth scopes` that are allowed to view this page. Adding `'*'` to the list of scopes
requires users to authenticate themselves in order to view the page.

## `type`

The type of the page. Type currently supports the following options:

- page (default)
- flow

Setting this value to `flow` will result in the page displaying like a flow page, in which the page
is divided into _subpages_, allowing for users to be guided through several steps. Flow page actions
can be used to facilitate navigating through flow pages.

## `blocks`\*

The list of blocks that are displayed on the page. Each page requires at least one block. Blocks are
displayed in the order that they are defined in the list.

> Note: This field is not required if `type` is set to `flow`.

## `flowPages`\*

The list of _subpages_. When visiting the page, the first _subpage_ gets displayed by default.
Subpages are structured similarly to pages, albeit simplified. Each subpage consists the properties
`name` containing a unique name, and `blocks`, which are defined in the same way as
[blocks](#blocks).

> Note: This field is not required if `type` is not set `flow`.

## Actions

Page actions follow the same structure as the actions seen in `blocks`, with the exception that they
are only available when `type` is set to `flow`.

## `onFlowFinish`

This action gets triggered when `flow.finish` gets called, or when `flow.next` gets called on the
final subpage. This action has a special property in which the cumulative input data from each
previous subpage gets sent, instead of the individual block that triggered this action.

## `onFlowCancel`

This action gets triggered when `flow.cancel` gets called.
