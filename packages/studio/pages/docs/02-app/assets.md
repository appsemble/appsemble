# Assets

Assets can be used to store binary data. Typically, this is used for images, videos, audio fragments
or documents. They can be used by app creators, content managers who use Appsemble Studio and end
users of the app.

## Table of Contents

- [Introduction](#introduction)
- [Resources](#resources)
- [Studio](#studio)
- [CLI](#cli)
- [Clonable assets](#clonable-assets)
- [SDK](#sdk)
- [Security](#security)

## Introduction

Assets consist of binary data, an auto-generated ID, and optionally a name. The asset can be
referenced in the API by its ID or name. The name must be unique within the app. Assets can’t be
changed. In order to change them, they need to be deleted and uploaded again.

Assets can typically be used for 2 use cases:

- To link binary data to a [resource](resources.md).
- To store static app assets that can be referenced in the app definition or custom CSS.

## Resources

When creating a resource, it’s possible to link binary assets to it. These assets are unnamed. For
more information, see the [resource assets](resources.md#assets) guide.

## Studio

Assets can be viewed, downloaded, uploaded and deleted from the _Details_ side menu of a single app
view, given that the user has the correct permissions. When uploading an asset, a name can be
entered through which the asset can be referenced in the API.

## CLI

Assets can be uploaded using the [Appsemble CLI](../09-packages/cli.md#assets).

```sh
appsemble asset publish --app-id "$MY_APP_ID" path/to/example.png
```

By default, the base name of the file will be used as the asset name. I.e. the asset created using
the command above, would be named _“example”_.

Assets can also be uploaded alongside an app.

Executing the `appsemble app publish` command with the `--assets` flag will publish the assets
currently in the assets directory of the app with their `seed` property set to `true`.

Executing the `appsemble app update` command with the `--assets` flag will replace existing `seed`
assets with the ones currently in the assets directory of the app.

`seed` assets and `ephemeral` assets behave the same way as
[seed resources and ephemeral resources](resources.md#seed-resources).

## Clonable assets

In template apps, which can be cloned into a new app, some assets should be transferable to the new
app. We can mark those assets with the clonable property. This can be achieved by using the
`--clonable` flag in the `appsemble asset publish` command or the `--assets-clonable` tag in the
`appsemble app publish` and `appsemble app update` commands.

## SDK

The Appsemble SDK allows block developers to resolve asset links using the `asset()` utility. Block
developers are encouraged to embrace this API. This way app developers can simply pass asset IDs or
URLs into block parameters or resources, without worrying about where binary data comes from.

```ts
bootstrap(({ utils }) => {
  // Logs for example https://appsemble.app/api/apps/1/assets/my-asset
  console.log(utils.asset('my-asset'));

  // Logs https://example.com/image.png
  console.log(utils.asset('https://example.com/image.png'));
});
```

## Security

Assets can be referenced from a public API endpoint. The IDs are generated using UUID version 4,
which is cryptographically secure, but the endpoints don’t require any further authentication. If
named, assets can be referenced by their name. It’s not recommended to use the asset API for
sensitive information.
