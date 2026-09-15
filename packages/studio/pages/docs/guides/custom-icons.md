# Custom Icons

Anywhere an app definition accepts a [Font Awesome icon](https://fontawesome.com/icons?m=free) name,
it can also reference an icon from the app’s own `icons` registry. This allows apps to use their own
artwork for navigation, buttons and login providers without changing any block.

## Table of Contents

- [Registering icons](#registering-icons)
- [Referencing icons](#referencing-icons)
- [Where icons can be used](#where-icons-can-be-used)
- [Appearance](#appearance)
- [Errors](#errors)
- [Templates and portability](#templates-and-portability)
- [Version requirements](#version-requirements)

## Registering icons

An icon is an app-level [asset](../app/assets.md). SVG is recommended, because it scales to any
size, but any image format the browser can display works. The asset must have a name matching
`^[a-z0-9]+(?:-[a-z0-9]+)*$`, which is the format the CLI and Studio upload flows produce. Upload
the asset first, for example with the CLI:

```sh copy
appsemble asset publish --app apps/my-app --name dossier-icon --clonable assets/dossier.svg
```

Then declare the icon in the `icons` property of the app definition. Every key is a semantic name
for the icon, and its `asset` is the name of the uploaded asset.

```yaml copy filename="app-definition.yaml"
icons:
  dossier:
    asset: dossier-icon
  archive:
    asset: archive-icon
```

Keys use the same format as asset names and are case-sensitive. Several keys may point at the same
asset, but a key can’t alias another key, and `asset` must be an asset name, never a URL or an asset
ID.

Because the icons are needed before an app member logs in, for example on the login page, icon
assets are public.

## Referencing icons

Reference a registered icon by prefixing its key with `icon:`. Bare names still mean Font Awesome
icons, so `dossier` and `icon:dossier` are two different icons.

```yaml copy filename="app-definition.yaml"
icons:
  dossier:
    asset: dossier-icon

pages:
  - name: Home
    icon: home
    blocks:
      - type: button-list
        version: 0.38.2-test.0
        parameters:
          buttons:
            - label: { translate: dossiers }
              icon: 'icon:dossier'
              onClick: openDossiers
        actions:
          openDossiers:
            type: link
            to: Dossiers
  - name: Dossiers
    icon: 'icon:dossier'
```

Quote the value in YAML, since a bare `icon:dossier` would otherwise be read as a mapping.

Referencing a key which isn’t in the registry is a validation error. The app definition is rejected
when it is published or saved in Studio, so a typo never ends up in a running app. The same check
runs when the registry itself changes: a key that is still used by a page, a block or a stored
OAuth2 or SAML login option can’t be removed until every reference is updated. Pointing an existing
key at another asset is always allowed and doesn’t require touching the references.

## Where icons can be used

The `icon:` form is accepted wherever the app definition documents an icon:

- The `icon` of a [page](../app/page.md).
- The icon of [OAuth2](oauth2.md) and [SAML](saml.md) login options.
- Block parameters which take an icon, such as the buttons of `button-list`, the fields of `stats`
  and `tiles`, the `action-button` and `control-buttons` icons, and the button and dropdown icons of
  `cards`, `feed`, `list`, `form`, `filter`, `table`, `footer` and `detail-viewer`. The block
  reference documents each parameter which accepts an icon reference.

Marker icons of the `map` and `detail-viewer` blocks are drawn on the map from a Font Awesome glyph
or an `asset` of their own, so they keep their existing configuration and don’t use the registry.

## Appearance

A custom icon takes the same space as the Font Awesome icon it replaces: the image is centered in
the regular icon box and scales with the surrounding font size, so the same icon can be used in
navigation, on a button and in a large tile.

Custom icons keep the colors of their artwork. Theme colors such as the color of a button only
affect Font Awesome icons. Pick artwork which is legible on light and dark surfaces, and on active,
hovered and disabled controls.

SVG icons are loaded as images, so scripts and references to external files inside them are ignored
by the browser. Use self-contained SVG files; sprite files containing multiple symbols need to be
split into separate assets.

## Errors

If an icon can’t be loaded, for example because the asset has been deleted, the icon box stays empty
so the layout of the page doesn’t shift. Uploading the asset again fixes it after a refresh. Custom
icons are decorative for assistive technology, so the surrounding control, such as a button label or
a page name, provides the accessible name.

## Templates and portability

The `icons` registry is part of the app definition, so it is copied along when an app is created
from a template. The icon assets are only copied when they were uploaded as
[clonable assets](../app/assets.md#clonable-assets). Upload icon assets for a template with
`--clonable`, or use `--assets-clonable` when publishing the app, so apps created from it start with
working icons. The new app can swap the artwork by uploading its own asset and pointing the key at
it, without changing any references.

Exporting and importing an app doesn’t preserve asset names yet, so after an import the icon assets
need to be uploaded again with the names used in the registry.

## Version requirements

Custom icons require Appsemble 0.38.2-test.0 or newer. Blocks published before that version render
Font Awesome icons only, so make sure the blocks in the app use a version which supports icon
references. Existing Font Awesome icons keep working in every version, no changes to the app
definition or the blocks are needed.
