# Storage

Appsemble provides different types of storage options, both server and client side.

## Table of Contents

- [Storage Types](#storage-types)
- [Server Storage](#server-storage)
- [Client Storage](#client-storage)
  - [Browser Storage](#browser-storage)
  - [App Storage](#app-storage)

## Storage Types

Most often you want to use server storage over client storage to store your application data.
However, sometimes you may come across a situation where you just want to share data between
different parts of the app. This is where client storage comes into play.

- [Server storage](#server-storage): Allows you to share data between users.
- [Client storage](#client-storage): Allows you to store data in the browser or application. Often
  used for more private temporary storage.

> Note: All client storage types can be cleared by clearing your browser cache.

## Server Storage

Storing data on the server enables the option to share data between multiple clients.

Below are some materials on server based storage.

- **[Resources](/docs/guide/resources)**: Allows you to persist structured data with the resource
  [actions](/docs/reference/action).
- **[Assets](/docs/guide/assets)**: Allows for (public) file and media storage.

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
cleared whenever the user refreshes the page. This means that App Storage is mainly useful when you
want to briefly store data on the client side. A common use case for App Storage is to use it within
a flow page with [retain-flow-data](/docs/reference/app#-flow-page-definition-retain-flow-data) set
to `false`.

There is also another form of app storage called `Page Storage` which automatically loads data into
blocks when switching pages. Data can only be persisted to Page Storage by switching pages in a flow
with flow actions. This is how flow pages keep track of the data filled into a form when switching
to the next step.

> Note: Both `App Storage` and `Page Storage` are affected by the `retainFlowData` prop.
