# App store

The app store is a webpage where all apps you can access are shown. The page is divided into two
categories:

**My Apps** > All apps from organizations you're in\
**All Apps** > All apps that are publicly available

Each app shows an icon, a title, which organization made it and what rating it has. Apps are
automatically sorted based on how their rating is, but you can change how this is sorted if you'd
like.

By clicking on any of these apps you're taken to their frontpage. Depending on the app's
[privacy setting](../app/security#app-privacy) and your role in the organization, you'll see a
different screen.

You can also create a new app on this page by clicking the [Create new App](/apps#create) button, or
you can import an app by clicking the arrow and then the [Import From File](/apps#import) button.

## App page

By default, you will only see the name, description, organization, screenshots, ratings and the
buttons to view or share the app. Different tabs and buttons are added depending on your
organization role and certain options the app owner can toggle.

### Show app definition

If the app has the option to show the app definition, an extra tab appears in the side menu that
shows the entire app definition. A button also shows up on the index page that allows you to
[clone the app](#cloning-an-app) for your own use.

### Organization roles

Depending on your role in the app's organization you will see different pages and buttons in the
left side menu.

**<u>CAN</u> see the "App definition" page**:

- **Member (for all roles)**: Shows button to clone an app and the option to export the app
- **AppTranslator**: Shows the Translation page and allows you to edit them.
- **AppContentsExplorer**: Shows the Assets page in a readonly view.
- **AppContentsManager**: Shows the Assets page, and allows you to manage assets.
- **AppManager & Owner & Maintainer**: Shows all possible pages, and gives all possible permissions.
  Also allows you to add screenshots to the front page.

**<u>CAN NOT</u> see the "App definition" page**:

- **AppMemberManager**: Shows the App members page, and allows you to manage app members.
- **AppGroupManager**: Shows the Groups page, and allows you to manage groups.
- **AppGroupMembersManager**: Shows the group page. Doesn't allow you to create a group, but you can
  manage group members.

## Cloning an app

You can clone any app that permits it by going to their store page and clicking the "Clone App"
button. This creates a copy of the app including translations, resources, styling and optionally
also variables and secrets. Once created, you have your very own copy of the app and can do whatever
you want with it.

Alternatively, you can also choose an app template to start with directly in the
[app creation screen](/apps#create).
