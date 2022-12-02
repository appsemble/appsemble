# Storage

Appsemble provides different types of storage options, both server and client side.

## Storage Types

- [Server storage](#server-storage)
- [Client storage](#client-storage)

## Server Storage

Storing data on the server enables the option to share data between multiple clients.

Below are some materials on server based storage.

- [Resources](/docs/guide/resources)
- [Assets](/docs/guide/assets)

## Client Storage

All client storage types can be accessed through the storage [actions](/docs/reference/action).
Storage actions allow you to share data between blocks. There are 2 main Client Storage options,
`Browser` and `App` Storage.

### Browser Storage

Most browsers support storing data directly in the browser. Storing data directly in the browser is
often used for user preferences.

There are 3 main browser storage options:

- **[indexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)**: Allows you to
  persist significant amounts of data in the browser.
- **[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)**: Allows you
  to persist smaller amounts of data in the browser.
- **[sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)**: Stores
  data just like `localStorage` except it clears the data whenever the browser tab is closed.

To see what is stored in the browser, open up the browser developer tools by pressing `F12` and head
over to the storage section.

### App Storage

App Storage can be used to store data directly in the app (in memory). The App Storage will be
cleared whenever the user refreshes their page. This means that App Storage is mainly useful when
you want to briefly store data on the client. A common use case for App Storage is to use it within
a flow page with [retain-flow-data](/docs/reference/app#-flow-page-definition-retain-flow-data) set
to `false`.

There is also an `Internal Storage` which loads any data automatically stored within. Data can only
be persisted to Internal Storage by switching pages in a flow with flow actions.

> Note: Both the `App Storage` and the `Internal Storage` are effected by the `retainFlowData` prop.
