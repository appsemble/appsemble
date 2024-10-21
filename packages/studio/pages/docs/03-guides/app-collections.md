# App collections

Organizations can put apps into collections. Any user in an organization with the
`CreateAppCollections` or `UpdateAppCollections` permission can add any app of an organization
they're a part of into an app collection.

An example of what an app collection looks like can be found [here](https://openapps.nl)

## Custom domain

You can add a custom domain to your app collection in its settings. This gives you a clean link to
your app collection without Appsemble related terms.

For more information on custom domains, check out [DNS](./dns.md).

## Automatically add apps to collections

Appsemble supports defining which collections an app should be added to when published. A
`collections` entry can be added to any context in the `.appsemblerc file`. This entry must be an
array of collection ids. When publishing an app with a context, which has collections specified, the
app will be automatically added to those collections after publishing.
