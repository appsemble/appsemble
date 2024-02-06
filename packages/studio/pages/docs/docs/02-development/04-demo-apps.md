# A guide to making demo apps

When it comes to Appsemble, we might want to use some existing apps to demonstrate the platform to
potential customers, without having to create a new app from scratch.

## Kinds

There are two kinds of demo apps:

- Generic app that needs to be customized for demoing to a specific client
- App made for a client that needs to be stripped of client-specific elements for demoing to a
  general audience

Determine which of the two kinds you need to make, and follow the instructions below.

## Ways to make your app “demoable”

### A `prepare-demo` script

Take
[this script](https://gitlab.com/appsemble/amersfoort/-/blob/main/packages/scripts/src/commands/prepare-demo.ts).

It defines two utility functions:

- `patchDefinition(name, patches)`
- `patchMessages(name, language, replacements)`

It then defines two more functions, one for patching each app in its repository. Finally, it exports
`const command`, `const description`, and `function handler()` to allow the script to be run from
the command line.

`patchDefinition` takes an app’s name and an array of patches that looks like this:

```ts
await patchDefinition('appName', [
  // Change a list of pre-defined resources
  [
    ['resources', 'places', 'schema', 'properties', 'location', 'enum'],
    ['Amersfoort', 'Utrecht', 'Amsterdam', 'Rotterdam', 'Den Haag'],
  ],
  // Change a block’s parameters
  [
    ['pages', 0, 'blocks', 0, 'parameters', 'content'],
    '# Welcome to a demo app\n\nHere we show you just how easy it is to make an app with appsemble.',
  ],
  // Change the description too
  [['description'], 'A generic app'],
]);
```

```yaml
# example app definition
name: appName
description: A specific app for the needs of X organization

resources:
  places:
    schema:
      type: object
      allowAdditionalProperties: false
      properties:
        location:
          type: string
          enum: # some places we want to keep hidden
            - Officestraat 1, 1234 AB
            - Buriedtreasurestraat 3, 1234 PJ
            - Victoriassecretstraat 5 1337 EE

pages:
  - name: Privacy policy
    blocks:
      - type: markdown
        version: *version
        parameters:
          content: |
            # Welcome to X organization’s app!

            Here we show you various things confidential to the company.
            For example:
             - the address of our office
             - the location of a buried treasure
             - what Victoria’s secret is
             - who asked
      - type: and so on
        version: ...
```

You can change just about anything, including default values for form fields, roles, and so on, but
try to keep changes to a minimum, and make sure your app still works after patching it.

`patchMessages` takes an app’s name, a language and an array of replacements that looks like this:

```ts
await patchMessages('specific-app', 'en', {
  app: {
    name: 'Generic app',
    description: 'A generic app',
  },
});
```

`i18n/en.json`:

```json
{
  "app": {
    "name": "Specific app",
    "description": "A specific app for the needs of X organization"
  }
}
```

In other words, it matches the format of files in the `i18n` directory of an app and overwrites the
values of the keys you specify.

To use this method of patching an app, copy this script (for now), and modify it to suit your needs.
Then, call the script in your repository’s CI pipeline
[like this](https://gitlab.com/appsemble/amersfoort/-/blob/main/.gitlab-ci.yml#L64).

Don’t forget to add a `demo` context to the app’s `.appsemblerc.yaml`, and to set the id for that
context to an existing app on the production server.

```yaml
# .appsemblerc.yaml
contexts:
  development:
    organization: appsemble
    visibility: public
    remote: http://localhost:9999
  production:
    id: 123456
    organization: xorganization
    visibility: private
    remote: https://appsemble.app
  # add this:
  demo:
    icon: demo.png # choose a different icon for demo apps if necessary
    iconBackground: '#ababef'
    id: 1234567
    maskableIcon: demo.png
    organization: appsemble
    remote: https://appsemble.app
    visibility: public
    demoMode: true
```

### Resources, clonable resources

You can include resource `.json` files in the `apps/<appname>/resources/` folder. You can upload
these to your app via the “Import from file” button in the studio, or by passing the `--resources`
flag to `appsemble app publish`. This folder is not automatically published by CI scripts, so you
can use it to store resources that are only used for demo purposes.

Resources in template apps can be marked as “clonable” - if the app is used as a _template app_ for
another app or cloned via the “Clone App” button, and the “Include example resources” (Create app
button) or “Copy any resources that are allowed to be cloned” (Clone app button) checkbox is
checked, then the resources marked as “clonable” will be copied to the new app.

If you want clonable resources, i.e. your demo app is intended to be cloned, don’t forget to make
sure your app has the `template` flag enabled in its `.appsemblerc.yaml` file:

```yaml
# .appsemblerc.yaml
# ...
demo:
  # ...
  template: true
```

You can then go to the “Resources” tab in the studio, select a resource, and check the “Clonable”
checkbox on records you want to mark as clonable. (You need the “AppEditor” permission in the app’s
organization)

```sh
# or via the CLI
appsemble app update --id 1234567 --template --context development apps/app
```

### “Demo mode” flag in `.appsemblerc.yaml`

You can add a `demoMode: true` flag to your app’s `.appsemblerc.yaml` file to enable demo mode for
your app.

```yaml
# .appsemblerc.yaml
contexts:
  # ...
  demo:
    # ...
    demoMode: true
```

You can also use the `--demo-mode` flag when running `appsemble app update` or
`appsemble app publish` to enable demo mode for a specific app.

Demo mode does the following:

- Overrides the default login screen with a screen that allows you to log in as any role defined by
  the app.
  - This creates a temporary user with the role you selected, and logs you in as that user.
- Adds a “Switch role” button in the profile dropdown menu that allows you to switch roles without
  logging out.
  - This re-uses the temporary user that was created when you logged in.
- Lets you switch between “Team Member” and “Team Manager” as well as join/leave teams on the fly,
  through the profile dropdown menu.
