# Theming

## Table of Contents

- [Introduction](#introduction)
- [Variables](#variables)
  - [Common variables](#common-variables)
  - [Semantics](#semantics)
  - [Block specific](#block-specific)
  - [Mobile only](#mobile-only)
- [Example](#example)
- [Bulma Extensions](#bulma-extensions)

## Introduction

The Bulma CSS framework uses a set of colors for different parts of its elements. Appsemble supports
customizing a subset of these variables by including a `theme` object at different points within the
app definition.

## Variables

Each variable can be assigned with a [hexadecimal value][hex] representing the desired color.

> **Note**: These variables can also be accessed in the app's CSS using kebab-case. For example:
> `background-color: var(--primary-color)`. An appropriately readable shade for the text of each
> color can be found by appending `-invert` to the variable name.

### Common variables

These change the styling for some of the most common elements of an app.

| Variable       | Purpose                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `primaryColor` | The color that is most commonly used in your app in order to create a distinct identity for your app |
| `linkColor`    | Color of links. This sets the (background) color for any element with the `<a>` tag                  |
| `font`         | Which font family to use in the app.                                                                 |

Any font family from [Google Fonts][google-fonts] may be used. Additionally any custom font can be
used by specifying the source to be `custom` and uploading the font file(s) as asset(s), then
applying it in the App’s CSS using the [`@font-face`][font-face] at-rule.

### Semantics

These are used to convey messages. For example, <span style="color:green">green</span> is positive
so this color can be used to convey success to the user.

| Variable       | Purpose                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| `successColor` | Color for success messages. Most commonly used for `message` popups of type `success` |
| `infoColor`    | Color for info messages. Most commonly used for `message` popups of type `info`       |
| `warningColor` | Color for warning messages. Most commonly used for `message` popups of type `warning` |
| `dangerColor`  | Color for danger messages. Most commonly used for `message` popups of type `danger`   |

### Block specific

These variables are only used in specific blocks.

| Variable    | Purpose                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `tileLayer` | The tile layer used on components that display a map (example: https://cartodb-basemaps-c.global.ssl.fastly.net/) |

### Mobile only

These themes are only seen on mobile versions of the app.

| Variable      | Purpose                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `splashColor` | The background color of the splash screen                                                                                       |
| `themeColor`  | The background color of the notification window at the top of the screen, and the splash screen if `splashColor` is not defined |

## Example

```yaml copy validate
name: Theme app
defaultPage: Red Page

theme:
  primaryColor: '#229954' # Green
  linkColor: '#D68910' # Orange
  successColor: '#76448A' # Purple

pages:
  - name: Red Page
    theme:
      primaryColor: '#FF0000' # Red
    blocks:
      - type: action-button
        version: 0.36.0
        parameters:
          icon: plus
        theme:
          primaryColor: '#0000FF' # Blue
```

The above example sets the app´s primary color to green, the color of its links to orange and the
color of ´success´ elements to purple. The page `Red Page` overwrites the primary color to be red
and one of its blocks overwrites the primary color to blue instead.

If a theme variable is not overwritten, it will simply use the theme of its parent.

> Note: The above example does not represent a full app. It is merely a representation of how app
> themes can be defined.

## Bulma Extensions

On top of the base Bulma framework, extensions have been added that also benefit from all the
variables Bulma uses. The list of extensions is as follows:

- [`Checkradio`](https://wikiki.github.io/form/checkradio/)

[hex]: https://htmlcolorcodes.com/
[google-fonts]: https://fonts.google.com
[font-face]: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face

## Related subjects

- [Styling](../app/styling.md)
- [Custom CSS](custom-css.md)
