# Block store

The block store contains all blocks you can use in your app. This isn't limited to Appsemble blocks
however, anyone can [develop their own blocks](../development/developing-blocks.md) and upload them
to the server for people to use. If you see a block you might want to use in your app, you can click
`View details` on the block's card to go to its detail page. There you can find how it works in
order to correctly use it in your app.

## Block page

Blocks are uploaded as versions of the block. Whenever the author wants to change something about
the block they must upload a new version. This gives app developers full control of what version of
the block they want to use in their app. At the top of the page is a dropdown list with all versions
of that block. Once you select a version, the page will change to display all the details about that
block version.

Each block has the following required properties that determine what block and version you want to
use.

- **type**: The name of the block. When defined in an app definition this must be prepended by
  `@(author organization)`. This does not apply to Appsemble blocks.
- **version**: The block version. Each block has a list of possible versions you can choose from. On
  the block's page in the store these can be seen in the dropdown list a the top.

On top of that, they can also have any of the following additional properties to provide more
functionality:

- **parameters**: Free form parameters that accept input to determine the block's behavior. For
  example, a block might have the `icon` parameter that displays the icon provided to the parameter.
- **actions**: Blocks can trigger actions whenever something happens like a specific user action
  (For example, `onSubmit` when the user submits a form). Whatever
  [Action Definition](../actions/index.mdx) you define under that trigger is called whenever the
  action happens.
- **events**: Events are used to communicate between blocks. These are split under **listen events**
  and **emit events**

  - **listen event**: Listens to data from other blocks that emit to this event
  - **emit event**: Emits data to other blocks that are listening to this event

  Events are explained further [here](../guides/events.md)

## Further reading

For more information on how blocks work and how to use them in your app, you can check out the
[Block guide](../app/blocks.md).
