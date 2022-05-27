# Studio

Apps can be created and modified using the [Appsemble studio](/).

After logging in a list of apps you can manage will appear, providing direct links to the app itself
as well as the corresponding app detail pages.

From this screen new apps can be created by clicking on _“Create new app”_ card.

By clicking on the create app card, a form is presented in which the following attributes can be
filled in:

**App Name**: This is the name of the app. It determines the URL at which the app will be made
available as well as the name that shows up when installing it.

**Organization**: Each app belongs to an organization. This is used to determine the which rights
users have for certain apps such as the ability to modify them. If the user is in multiple
organizations, the organization can be selected using a dropdown menu.

**App Template**: The template determines what the initial app looks like. This can range from a
very simple app that does not do very much to a more complex app that is provided with
authentication, uploading files, etc. For this tutorial, select _“Empty app”_.

After filling in these fields and clicking the _“Create App”_ button, Appsemble redirects to the
editor page corresponding to the newly created app.

## App editor

The app editor is an environment where apps can be modified, previewed, and updated. On the
left-hand side it displays the definitions that make up an app and the right-hand side displays a
preview of what the app will look like based on these definitions.

Apps are defined using a data serialization language called `YAML`. To learn more about how YAML
works, please refer to [this page](https://learnxinyminutes.com/docs/yaml).

The _“App”_ tab contains the app definition in YAML. Changes can be made to the app definition by
editing them in this tab and pressing the _“Preview”_ button. Doing so will replace the app
definition in the right-hand panel with the new one, serving as a preview of the changes that have
been made. Note that some functionality such as the [resource API](resources.md) when defining new
resources might not be available unless the new app definition has been uploaded to the server.

The other tabs that are available such as the _“Core”_ and _“Shared”_ tabs refer to the theming API.
For more information about this, please refer to [this page](theming.md).

Provided the app definition and styles are valid, the _“Publish”_ button will upload all this data
to the server, updating the app.

## Further reading

- [Create a basic app](basic-app.md)
