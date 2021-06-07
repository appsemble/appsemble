A block that fetches data and emits it using the events API.

This can be used to provide data to other blocks.

### Context fields

The [context](https://appsemble.app/docs/guide/remappers#context) of this block will contain: `data`
containing the data that was passed to the block when initially loaded. This is usually empty, but
can contain data in certain situations such as when using
[`flow` pages](https://appsemble.app/docs/reference/page.md#flow).
