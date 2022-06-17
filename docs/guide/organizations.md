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

| Permissions                                 | Member | AppEditor | Maintainer | Owner |
| ------------------------------------------- | :----: | :-------: | :--------: | :---: |
| Create new apps                             |        |     ✓     |     ✓      |   ✓   |
| Copy apps                                   |        |     ✓     |     ✓      |   ✓   |
| Delete apps                                 |        |     ✓     |     ✓      |   ✓   |
| Edit app's translations                     |        |     ✓     |     ✓      |   ✓   |
| Edit app's settings                         |        |           |     ✓      |   ✓   |
| Edit name of an organization                |        |           |            |   ✓   |
| Edit logo of an organization                |        |           |            |   ✓   |
| Invite new members into an organization     |        |           |            |   ✓   |
| Remove existing invites                     |        |           |            |   ✓   |
| Resending invites                           |        |           |            |   ✓   |
| Create and delete assets                    |        |     ✓     |     ✓      |   ✓   |
| Remove organization members                 |        |           |            |   ✓   |
| Create resources                            |        |     ✓     |     ✓      |   ✓   |
| Edit resources                              |        |     ✓     |     ✓      |   ✓   |
| Delete resources                            |        |     ✓     |     ✓      |   ✓   |
| Change roles of organization members        |        |           |            |   ✓   |
| Create and delete teams                     |        |           |            |   ✓   |
| Manage members on team                      |        |           |            |   ✓   |
| Publish blocks                              |        |           |     ✓      |   ✓   |
| Send manual push notifications              |        |     ✓     |     ✓      |   ✓   |
| Read assets                                 |   ✓    |     ✓     |     ✓      |   ✓   |
| Read resources                              |   ✓    |     ✓     |     ✓      |   ✓   |
| Edit resources                              |        |           |     ✓      |   ✓   |
| View private apps of an organization        |   ✓    |     ✓     |     ✓      |   ✓   |
| View the list of members in an organization |        |           |            |   ✓   |
