# Developing Blocks

## Initialize the Project

<!--
XXX: To be replaced with `yarn create appsemble` when the tooling is ready to be published to npm.
-->

To start developing blocks, first the Appsemble repository needs to be cloned and installed as per
the [Getting Started](../README.md#getting-started) instructions in the readme.

<!--
XXX: It should be possible to simply use a `dev` version to load unpublished blocks in test apps.
-->

Next, publish the existing blocks following the instructions from the [Blocks](../README.md#blocks)
section.

## Create your first block

A new block can be bootstrapped by running the following command.

```sh
yarn create-appsemble block
```

This will prompt some questions about the new block. For now, lets bootstrap a vanilla JavaScript
block using the block name `test` and organization name `org`.

The block will be created in the _blocks/_ directory. Its version will be `1.0.0`.

Now, the block needs to be built and registered before it can be used. It can be built using this
command.

```sh
yarn block test
```

Make sure the local Appsemble server is running, then run the following to publish the newly created
block.

```sh
yarn appsemble register blocks/test
```

## Testing the block

Open the Appsemble editor on http://localhost:9999/editor. Login, and create your first app. This
following example app will display your new block.

```yaml
name: Test App
theme: {}
defaultPage: Home

pages:
  - name: Home
    blocks:
      - type: '@org/test'
        version: 0.0.0
        actions:
          click:
            type: link
            to: Other Page
  - name: Other Page
    blocks:
      - type: '@org/test'
        version: 0.0.0
        actions:
          click:
            type: link
            to: Home
```

Enter this app definion, save it, and it should display the new block in the app preview. The app
contains two pages that link to each other by clicking the button created by the new test block. ✨

<!-- XXX: Render the JSDoc -->

For more details on what a block can do, see the technical documentation of the SDK.
