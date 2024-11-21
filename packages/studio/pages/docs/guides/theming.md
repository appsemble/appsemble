# Theming

The Bulma CSS framework uses a set of colors for different parts of its elements. Appsemble supports
customizing a subset of these variables by including a `theme` object at different points within the
app definition.

The supported variables are:

- `themeColor`
- `splashColor`
- `primaryColor`
- `linkColor`
- `successColor`
- `infoColor`
- `warningColor`
- `dangerColor`
- `font`
- `tileLayer`

The `themeColor` and `splashColor` variables are not visible at all times. These define the colors
that appear when starting up the app after installing it on a mobile device.

Each variable can be assigned with a [hexadecimal value][hex] representing the desired color.

The `font` property can be used to specify which font family to use. Any font family from [Google
Fonts][google-fonts] may be used. Additionally any custom font can be used by specifying the source
to be `custom` and uploading the font file(s) as asset(s), then applying it in the App’s CSS using
the [`@font-face`][font-face] at-rule.

The tile layer used on components that display a map (such as `map` and `form`) can be customized
using the `tileLayer` property by specifying a URL template.

> **Note**: These variables can also be accessed in the app's CSS using kebab-case. For example:
> `background-color: var(--primary-color)`. An appropriately readable shade for the text of each
> color can be found by appending `-invert` to the variable name.

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
        version: 0.30.12
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
