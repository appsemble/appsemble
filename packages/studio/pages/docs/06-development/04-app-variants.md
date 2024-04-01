# A guide to making app variants

Sometimes when using Appsemble, it might be needed to create a copy of an existing app using
different branding or data. Appsemble provides a mechanism, called app variants, that allows users
to do this with minimal effort, without creating a new app from scratch.

App variants use the source code of the original app without modifying it. They create a copy of it
and apply changes to the copy to match the requirements. When the app variant is published, the copy
is deleted. This keeps a single instance of the source code of the app and ensures easier
maintainability.

## Table of Contents

- [Where are app variants defined?](#where-are-app-variants-defined)
- [What does an app variant directory contain?](#what-does-an-app-variant-directory-contain)
  - [The patches directory](#the-patches-directory)
    - [styles.json](#stylesjson)
    - [messages.json](#messagesjson)
    - [app-definition.json](#app-definitionjson)
  - [Config](#config)
  - [Icon](#icon)
  - [Screenshots](#screenshots)
  - [App README files](#app-readme-files)
  - [Resources](#resources)
  - [Assets](#assets)
- [How to apply an app variant?](#how-to-apply-an-app-variant)
- [Demo mode](#demo-mode)
- [Seeding data](#seeding-data)

## Where are app variants defined?

App variants lie within a subdirectory of the app directory called `variants`. Each app variant has
its own subdirectory inside the `variants` directory with a name matching one of the app’s contexts
(e.g. `demodam`).

## What does an app variant directory contain?

Each app variant directory can contain changes to various aspects of the app. Basically everything
in the original app can be modified to match the desired app.

All the files and directories listed bellow are optional. If they are not present inside the variant
directory (e.g. `demodam`), the files and directories of the original app will be used.

### The patches directory

The `patches` directory inside a variant directory can contain changes to styles, app messages and
the app-definition. Each batch of changes is defined in a JSON file with the corresponding name.

#### styles.json

This file contains changes to the app’s theme, defined in the app’s `theme` directory. The file is
divided into a record of key-value pairs like so:

```json
{
  "shared": {
    "index.css": [
      {
        "selector": ".navbar",
        "property": "background-color",
        "value": "#CBCE1C"
      }
    ]
  },
  "core": {
    "index.css": [
      {
        "selector": "th",
        "property": "font-weight",
        "value": "normal"
      }
    ]
  },
  "@appsemble": {
    "button-list": {
      "layout.css": [
        {
          "selector": ".button.is-black,\n.button.is-red",
          "property": "color",
          "value": "unset"
        }
      ]
    }
  }
}
```

#### messages.json

This file contains changes to the app’s texts (translations), defined in the app’s `i18n` directory.
The file is divided into a record of key-value pairs like so:

```json
{
  "nl": {
    "app": {
      "description": "Inspectie App kan voor elke vorm van inspectie worden gebruikt",
      "name": "Inspectie-App"
    }
  },
  "en": {
    "app": {
      "description": "Inspection app can be used for any kind of inspection",
      "name": "Inspection App"
    }
  }
}
```

#### app-definition.json

This file contains changes to the app’s definition, defined in the `app-definition.yaml` file. The
file contains an array of changes with their paths inside the `app-definition` like so:

```json
[
  [["name"], "Inspection App"],
  [["description"], "App for daily inspections"],
  [["theme", "primaryColor"], "#CBCE1C"],
  [["theme", "linkColor"], "#0B71A1"],
  [["theme", "font", "family"], "Source Sans 3"],
  [["theme", "font", "source"], "google"],
  [["anchors", 1], "http://pdf-generator-pdf-generator-api.demodam.svc.cluster.local/render"]
]
```

### [Config](../03-guide/config.md)

A `config` directory, containing JSON files for app variables and secrets can be put inside the
corresponding app variant directory (e.g. `demodam`). These variables and secrets will be used when
applying the app variant and will overwrite variables and secrets defined in the original app.

When using the `appsemble app publish` and the `appsemble app update` commands, app variables and
secrets will be published along with the app.

### Icon

An icon file can be put directly inside the corresponding app variant directory (e.g. `demodam`) to
be used specifically for that variant of the app. It will overwrite the icon of the original app.

The icon is automatically published along with the app when using the `appsemble app publish` and
`appsemble app update` commands.

### [Screenshots](../03-guide/screenshots.md)

A `screenshots` directory, containing screenshots for the app variant, can be put inside the
corresponding app variant directory (e.g. `demodam`). These screenshots will be used when applying
the app variant and will overwrite screenshots defined in the original app.

Screenshots are automatically published along with the app when using the `appsemble app publish`
and `appsemble app update` commands.

### [App README files](../03-guide/app-long-description.md)

`README.md` files in different languages can be put inside the corresponding app variant directory
(e.g. `demodam`). These files will be used when applying the app variant and will overwrite `README`
files defined in the original app.

`README` files are automatically processed and their contents are published along with the app when
using the `appsemble app publish` and `appsemble app update` commands.

### [Resources](../03-guide/resources.md)

A `resources` directory, containing resources for the app variant, can be put inside the
corresponding app variant directory (e.g. `demodam`). These resources will be used when applying the
app variant and will overwrite resources defined in the original app.

When using the `appsemble app publish` and the `appsemble app update` commands, resources can be
published along with the app using the `--resources` flag.

### [Assets](../03-guide/assets.md)

An `assets` directory, containing assets for the app variant, can be put inside the corresponding
app variant directory (e.g. `demodam`). These assets will be used when applying the app variant and
will overwrite assets defined in the original app.

When using the `appsemble app publish` and the `appsemble app update` commands, assets can be
published along with the app using the `--assets` flag.

## How to apply an app variant?

When a new variant of the original app is needed, create a new directory with the name of the
variant (e.g. `demodam`) inside the app’s `variants` directory. Then include the appropriate changes
in the directory, defined by using the mechanisms listed above.

The variant to use from the CLI can be selected using the `--variant` argument, or by passing a
`--context` that matches the variant name.

The variant name can be matched either through the name of the context passed on the command line or
the variant defined in the `.appsemblerc.yaml` file. The variant argument from the command line or
`.appsemblerc.yaml` file will take precedence over the context.

The following commands support this feature:

- `appsemble app publish --context <context>`
- `appsemble app update --context <context>`

If the `--modify-context` flag is used, the id of the app variant will be updated in the original
app’s variant context.

## Demo mode

Some app variants are used to demonstrate the app’s functionality. Appsemble supports demo mode for
apps, which provides the following mechanisms for easier demonstration:

- The app can have seed resources, if the app was published or updated with a resources and/or
  assets directory. See [Seeding data](#seeding-data).

- Overrides the default login screen with a screen that allows you to log in as any role defined by
  the app. Users can either choose a role to create a demo account with, or log in with an existing
  demo account.

- Adds a `Change role` button in the profile dropdown menu that allows you to easily switch
  accounts.

- Lets you switch between “Team Member” and “Team Manager” as well as join/leave teams on the fly,
  through the profile dropdown menu.

A `demoMode: true` flag can be added to any context inside the `.appsemblerc.yaml` file.

The `--demo-mode` flag can also be passed when running the `appsemble app publish` and the
`appsemble app update` commands to enable demo mode for a specific app.

## Seeding data

Sometimes it must be ensured that an app variant always has data, so it can easily be presented in a
demonstration. The seed functionality for apps creates a set of app resources and assets that are
kept in pristine state. Ephemeral copies of these assets and resources are created every day for
users to interact with. At the end of the day all ephemeral resources and assets are deleted and new
ones are created from the seed data. Additionally, the ephemeral copies can also be reset when
clicking the reseed button on the app’s home page in the studio.
