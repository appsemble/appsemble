# Styling

## Table of Contents

- [Introduction](#introduction)
- [Theming](#theming)
- [Custom CSS](#custom-css)
- [Further reading](#further-reading)

## Introduction

By default apps are styled using the [Bulma CSS framework](https://bulma.io/). This includes
elements like the default colors and text font. As an app developer, you can change these default
styling options or add your own custom CSS to make your app look just the way you'd like.

There are two ways to change how your app looks:

- [**Theming**](#theming): Setting colors of pre-defined variables
- [**Custom CSS**](#custom-css): Specific component styling

## Theming

**Apps** and **blocks** are styled using Bulma CSS. These can be overridden in your app by changing
the value of pre-defined variables.

The header of an app, for example, uses the `primaryColor` variable to determine what color its
background will be.

![Default app header](assets/app-header-default.png 'Default app header')

By changing this variable in your app, you can change the color of the header's background too.

```yaml copy
theme:
  primaryColor: '#fc0303' # Red
```

Becomes:

![Red app header](assets/app-header-red.png 'Red app header')

Note that this changes the color of every component that uses the `primaryColor` variable. For more
specific styling you should use [custom CSS](#custom-css)

A full list of possible variables and more information about Appsemble theming can be found
[here](../guides/theming.md)

## Custom CSS

Traditional CSS can be used to style your app. Appsemble additionally offers some unique classes to
target specific parts of your app.

Styling is split into 3 categories:

- **Core**: Styling of any part of an Appsemble application not related to a block, such as the
  navigation bar, side menu, login view, message toasts, etc. The styling applied to the core
  modules do not get applied to blocks.
- **Block**: Styling of a specific block.
- **Shared**: Styling that gets applied to each individual block, as well as the Appsemble core.
  This is useful for applying styles to elements that can appear in both the core modules and blocks
  such as input fields. It can also be used to apply [CSS variables][css-variables].

**Core** and **Shared** styling are available as a tab in the app editor, while **Block** styling
can only be done locally. You can read more about this
[here](../guides/custom-css.md#using-the-cli).

An example of how this can be used is changing how the navbar looks:

In **Core** styling add the following line:

```css copy
.navbar-brand {
  border-style: outset;
}
```

This adds an outset-style border to the navbar:

![Outset app header](assets/app-header-outset.png 'Outset app header')

If you'd like to learn more about custom CSS in Appsemble, check out the
[docs](../guides/custom-css.md)

## Further reading

- [Theming](../guides/theming.md)
- [Custom CSS](../guides/custom-css.md)

[css-variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables
