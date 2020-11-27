# Organizations

An organization represents a collective name for groups of apps, blocks, and users. In order to
publish new blocks or to create and manage apps, the user needs to be in an organization.

## Creating an organization

Organizations can freely be made in the Appsemble studio by visiting the settings page and clicking
on “Organizations” in the menu. From here you can view a list of organizations that you are already
part of, as well as create new organizations. When creating a new organization, note that the
organization ID **must** be unique and cannot be changed after it has been created. This ID is used
to determine which blocks are used in an app as well as where the app should be hosted by default.

## Organization members

After creating an organization, members can be added via email. This email will contain a link that
the recipient can click on in order to accept or decline joining the organization.

Organization members can be assigned roles that affect which parts of the studio they have access
to. Each role has all the permission of the previous role in the list.

These roles are the following:

- `Member`: The default role for new members. Organization members are able to view private apps
  that belong to the organization.
- `AppEditor`: App editors are allowed to edit existing apps, manage an app’s resources, provide
  translations, as well as sending manual push notifications.
- `Maintainer`: Maintainers can publish new blocks, create new apps, change an app’s settings,
  create and delete apps, as well as inviting other users to the organization.
- `Owner`: Owners are allowed to manage members by assigning roles or removing them from the
  organization, and update the name and icon of the organization.

## Teams

Members within an organization can optionally be subdivided into teams. These are groups of members
that belong to each other. This allows for more fine control over who has access to specific
resources across apps. For example, it is possible to restrict access to resources in an app to only
a resource’s author as well as the managers of a team that the user is a member of.

Teams can be managed by clicking on the `Teams` tab on an organization’s settings page. From here a
list of teams is shown similar to how organizations are navigated. New teams can be created here as
well.

After creating a team, members can be added based on the list of the organization’s members. This
does not use an invite mechanism, users are added and removed from a team immediately.

Team members can be assigned the `Member` or `Manager` roles. These roles can be referred to within
an app definition to restrict access to specific resources. Please refer to
[this page](./security.md) for more information.
