# App collections

Appsemble supports collections of apps, that are organized with arbitrary criteria, and come from
any organization.

## Automatically add apps to collections

Appsemble supports defining which collections an app should be added to when published. A
`collections` entry can be added to any context in the `.appsemblerc` file. This entry must be an
array of collection ids. When publishing an app with a context, which has collections specified, the
app will be automatically added to those collections after publishing.
