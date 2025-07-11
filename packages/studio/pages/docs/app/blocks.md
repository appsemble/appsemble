# Blocks

## Table of Contents

- [Introduction](#introduction)
- [Version](#version)
- [Styling](#styling)
- [Indentation](#indentation-and-dashes)
- [Creating your own blocks](#creating-your-own-blocks)

## Introduction

You could argue that blocks are the most important element of an app. Blocks enable you to shape the
app. A block can be a button, a text field, a dropdown menu, a form, etc. Next to the app store
there is also a [block store](/blocks) where you can access the different blocks:

![Block Store Menu](assets/block-store-menu.png 'Block Store Menu')

This overview contains all the blocks you can use. You can easily select a block to get the example
code and an in depth explanation of how that specific block works.

The following code is an example of an Action Button. When you press the button in this example the
app will lead to the Home page because the type of this button is Link and it’s linked to Home. This
only works when you have a page defined with the name Home.

```yaml copy validate block-snippet
- type: action-button
  version: 0.33.8
  parameters:
    icon: home
  actions:
    onClick:
      type: link
      to: Home
```

The following example is a complete working app that consists of 2 pages: Home and Other Page. On
the home page there is a button (arrow to the right) that leads you to the Other Page and on the
other page there is a home Button.

```yaml copy validate
name: Tutorial action button app
description: testing tutorial code of an action button
defaultPage: Home

pages:
  - name: Home
    blocks:
      - type: action-button
        version: 0.33.8
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: link
            to: Other Page

  - name: Other Page
    blocks:
      - type: action-button
        version: 0.33.8
        parameters:
          icon: home
        actions:
          onClick:
            type: link
            to: Home
```

## Version

Blocks get uploaded as a version of the block. Each version is different from the last, so make sure
that for each block you put in your app you choose the version that fits your needs best.

Official Appsemble blocks get updated automatically with each version. Since improvements are
constantly being made to the framework, we recommend that you always choose the latest version for
Appsemble blocks.

## Styling

Blocks come with their own styling to make them look the way the developer wanted. If you want to
change how the block looks in your app, you can add [custom css](../guides/custom-css.md) to add to
or override the existing styling.

## Indentation and dashes

All elements that belong to the same group and/or are the same type, have the same level of
indentation. The different pages are on the same level, The action-button blocks are on the same
level, and the parameters, attributes and other configuration items of the blocks are on the same
level. This is necessary for Appsemble so that it can correctly parse the code.

The different pages and the different blocks start with a dash (-). This is done to tell Appsemble
that this element is potentially part of a longer list of different elements (array). It also makes
the code more readable.

This is all a part of the YAML syntax. There are more rules like this, so it's a good idea to look
through the [YAML syntax guide](../guides/yaml-syntax.mdx) in order to know the most common ones.

## Creating your own blocks

If none of the blocks in the block store quite suit your needs you can try to create your own. For
more information, you can check out the
[Developing Blocks guide](../development/developing-blocks.md)
