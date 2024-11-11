# Sharing resources

As an app developer you can build your app with the prospect of having other people copy it and
using it to build their own apps. You can also create a 'demo' version of your app that allows
people to use it without touching the base app. The resource API has a few properties you can use to
help make these experiences even better.

## Seed resources

All resources defined in the `resources` directory of an app will be considered `seed` resources.
Seed data is defined by the app developer and is intended to be present after changes to the app.

The `appsemble app publish` command will publish resources from the `resources` directory with their
`seed` property set to true when executed with the `--resources` flag.

The `appsemble app update` command will replace existing seed resources in the app with the ones
currently in the `resources` directory when executed with the `--resources` flag. Resources created
from within the app itself will be left untouched.

## Ephemeral resources

Ephemeral resources are temporary copies of `seed` resources, which are used in demo apps (apps with
`demoMode: true`). Users of demo apps can only interact with `ephemeral` resources.

In demo apps, the `appsemble app publish` and the `appsemble app update` commands will also create
`ephemeral` resources based on the app’s `seed` resources when executed with the `--resources` flag.

## Reseeding events

At the end of each day, an automated event called reseeding happens, which deletes all `ephemeral`
resources. In demo apps, new ephemeral resources are created based on the app’s `seed` resources.

In demo apps, this event can also be triggered manually from the studio.

## Clonable resources

In template apps, which can be cloned into a new app, some resources should be transferable to the
new app. We can mark those resources with the clonable property.

For example:

```yaml validate resources-snippet
resources:
  clonable-resource:
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
    clonable: true
```

In the above example, the resource can be transferred with the app when cloning it.
