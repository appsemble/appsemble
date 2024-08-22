# Security

## Table of Contents

- [Introduction](#introduction)
- [App Privacy](#app-privacy)
- [App accounts management](#app-accounts-management)
- [Security Definition](#security-definition)
  - [Groups](#groups)
- [Root app roles](#root-app-roles)
- [Page app roles](#page-app-roles)
- [Block roles](#block-roles)
- [Resource roles](#resource-roles)

## Introduction

While some apps may be intended for use by anyone, some apps may be intended for a fewer selection
of people. In order to facilitate this, apps can be secured in various ways in order to protect the
app or parts of the app from unauthorized users.

There are several properties that can be set in an app definition in order to secure an app for
different purposes.

## App Privacy

By going to the “Settings” page from within the Appsemble Studio, it is possible to set an app to be
marked as public, private, or unlisted by selecting an option from a dropdown.

- **Public**: The app is publicly listed in the Appsemble Studio app list page and can be accessed
  by anyone.
- **Private**: The app is not publicly listed in the Appsemble Studio app list page and can only be
  accessed by users who are in the same organization as the app.
- **Unlisted**: The app is not publicly listed in the Appsemble Studio app list page and can only be
  accessed by having a link to the app itself.

The privacy setting can be used in combination with the security definition to further restrict
access to the app.

Apps that aren’t marked as public will have a
[`noindex` meta tag](https://developers.google.com/search/docs/crawling-indexing/block-indexing), as
well as a `robots.txt` file, which both prevent search engines from indexing pages of the app.

## App accounts management

There are several methods available to secure access to apps. By going to the “Secrets” page from
within the Appsemble Studio you can determine which login methods would be available. By default
Appsemble Studio’s OAuth2 login option is enabled, allowing users to login using their Appsemble
Studio account. This method can be useful for apps where it’s expected that users already have
Appsemble accounts since the same account can be reused.

The second login option allows for app members to login using a password and email address. When
enabled, a login form appears on the login page from which an app member can login, register a new
account or reset their password. This method also allows usage of the
[`app.member.login` and `app.member.register` actions](../05-reference/action.mdx#app.member.login).

This login option can be customized by naming pages `Login` and `Register`. Doing so will display
these pages instead of the default app login and register pages.

The third login option allows for setting up your own login methods using [OAuth2](oauth2.md) or
[SAML2.0](saml.md) which are described in more detail in their own pages.

App members who have logged into your app can be viewed from the “App Members” page. From here the
roles of app members can be adjusted, as well as view and edit any custom properties associated with
the app member as set by the app.

## Security Definition

The security definition, as defined [here](../05-reference/app.mdx#security-definition), can be used
to define the roles that are used within the app as well as the app permissions each role has. The
security definition also determines how the default role is assigned. The security definition can
also specify permissions for unauthenticated users with the `guest` property.

The `policy` property can be set to `everyone` to give everyone the default role or `organization`
to only do this for users being in the same organization as the app.

> **Important**: When [OAuth2](oauth2.md) or [SAML2.0](saml.md) is used in the app, you must set the
> policy to `everyone`. This will specifically allow every configured authentication method on the
> secrets page to be used as login method. If you do not want other Appsemble user accounts to be
> able to log in, you must `disable` the `appsemble login` options (including the Appsemble OAuth2
> option) in the secrets page. If this option is enabled, any Appsemble user account is able to log
> in to the app and will receive the default role.

### Permissions

Each of the roles listed in the `roles` object as well as the `guest` object can have different app
permissions assigned to them. Specifying permissions for a role gives app members with that role
access to different operations within the app. Specifying permissions for `guest` gives access to
unauthenticated users to different operations within the app.

Here are all the available permissions, predefined in the system, that can be assigned to roles:

- `$member:invite`
- `$member:query`
- `$member:delete`
- `$member:role:update`
- `$member:properties:patch`


- `$group:query`
- `$group:create`
- `$group:update`
- `$group:delete`


- `$group:member:invite`
- `$group:member:query`
- `$group:member:delete`
- `$group:member:role:update`


- `$resource:all:create`
- `$resource:all:query`
- `$resource:all:get`
- `$resource:all:update`
- `$resource:all:patch`
- `$resource:all:delete`


- `$resource:all:own:query`
- `$resource:all:own:get`
- `$resource:all:own:update`
- `$resource:all:own:patch`
- `$resource:all:own:delete`

Apart from the predefined permissions, each app can have custom permissions, based on the resources
defined in it and their views as follows:

- `$resource:<resource-name>:create`
- `$resource:<resource-name>:query`
- `$resource:<resource-name>:get`
- `$resource:<resource-name>:update`
- `$resource:<resource-name>:patch`
- `$resource:<resource-name>:delete`


- `$resource:<resource-name>:own:query`
- `$resource:<resource-name>:own:get`
- `$resource:<resource-name>:own:update`
- `$resource:<resource-name>:own:patch`
- `$resource:<resource-name>:own:delete`


- `$resource:<resource-name>:query:<view-name>`
- `$resource:<resource-name>:get:<view-name>`


- `$resource:all:query:<view-name>`
- `$resource:all:get:<view-name>`

#### Resource Permissions

Resource permissions can be scoped to a certain resource or be defined for all resources in the app.

They can also be defined for resources that the app member has created themselves with the `:own`
suffix as shown in the list of permissions above. There are neither
`$resource:<resource-name>:own:create`, nor `$resource:all:own:create` permissions because owning a
resource does not matter for its creation. `:own` permissions cannot be defined on the `guest`, nor
can they be inherited by the `guest` from another role because guests do not have an account and
ownership cannot be tracked for them.

There are also resource view permissions for the `get` and `query` resource actions, that scope the
permissions down to a certain view, defined on a resource. There are no `:own` permissions with
views because whoever created the resource can see all of its data.

#### Permissions Examples

- `$member:invite` - allows the role to invite new members to the app.


- `$resource:<resource-name>:own:update` - allows the role to perform the `update` resource action
on `<resource-name>` resources that they have created themselves.


- `$resource:all:own:update` - allows the role to perform the `update` resource action on all
resources within the app that they have created themselves. This supersedes
`$resource:<resource-name>:own:update` permissions.


- `$resource:<resource-name>:update` - allows the role to perform the `update` resource action on
`<resource-name>` resources. This supersedes `$resource:<resource-name>:own:update` permissions.


- `$resource:all:update` - allows the role to perform the `update` resource action on all resources
within the app. This supersedes `$resource:<resource-name>:own:update`, `$resource:all:own:update`
and `$resource:<resource-name>:update` permissions.


- `$resource:<resource-name>:get:<view-name>` - allows the role to perform the `get` resource action
on `<resource-name>` resources with the `<view-name>` view.


- `$resource:all:get:<view-name>` - allows the role to get all resources within the app with the
`<view-name>` view. This supersedes `$resource:<resource-name>:get:<view-name>` permissions.


- `$resource:all:get` - allows the role to perform the `get` resource action on all resources in the
app without a specific view. This supersedes `$resource:<resource-name>:get`,
`$resource:<resource-name>:get:<view-name>` and `$resource:all:get:<view-name>` permissions.

### Roles

Roles within an app define app member access to certain parts of the app.

Roles can inherit from other roles, either predefined ones or custom ones defined in the app.
Inheriting a role gives a role all the permissions of the inherited role. It also gives it access to
parts of the app to which the inherited role has access to.

For example: If the “Admin” role inherits the “Reader” role and a page requires the “Reader” role,
app members with the “Admin” role will be able to access the page.

#### Predefined App Roles

For convenience, there are some roles predefined in the system, each having a set of predefined
permissions assigned to them, from which the guest property and custom roles defined in the app can
inherit from. Here are all predefined app roles, along with their permissions:

- `Member`


- `MembersManager`
  - `$member:invite`
  - `$member:query`
  - `$member:delete`
  - `$member:role:update`
  - `$member:properties:patch`


- `GroupMembersManager`
  - `$group:member:invite`
  - `$group:member:query`
  - `$group:member:delete`
  - `$group:member:role:update`


- `GroupsManager`
  - `$group:member:invite`
  - `$group:member:query`
  - `$group:member:delete`
  - `$group:member:role:update`
  - `$group:query`
  - `$group:create`
  - `$group:update`
  - `$group:delete`


- `ResourcesManager`
  - `$resource:all:create`
  - `$resource:all:query`
  - `$resource:all:get`
  - `$resource:all:update`
  - `$resource:all:patch`
  - `$resource:all:delete`


- `Owner`
  - `$member:invite`
  - `$member:query`
  - `$member:delete`
  - `$member:role:update`
  - `$member:properties:patch`
  - `$group:member:invite`
  - `$group:member:query`
  - `$group:member:delete`
  - `$group:member:role:update`
  - `$group:query`
  - `$group:create`
  - `$group:update`
  - `$group:delete`
  - `$resource:all:create`
  - `$resource:all:query`
  - `$resource:all:get`
  - `$resource:all:update`
  - `$resource:all:patch`
  - `$resource:all:delete`

Predefined roles cannot be overwritten in the app definition, they can only be inherited from.

The security definition below is used in the examples on this page.

```yaml copy validate security-snippet
security:
  default:
    role: Reader
    policy: everyone
  roles:
    Reader:
      description: Anyone viewing the app.
    Admin:
      description: Administrators of the app.
      inherits:
        - Reader
```

### Restricting Pages

By specifying the [`roles`](../05-reference/app.mdx#base-page-definition-roles) property for a page,
visiting the page requires the app member to have at least one of the roles specified in this list.

If `$guest` is in the list of roles of the page, unauthenticated users may also view the page.

If `$guest` is not in the list of roles of the page and a visiting user is not logged in and tries
to view the page, they will instead be prompted to log in.

If they are logged in but they don’t have sufficient roles, they will instead be automatically
redirected to the first page that they are allowed to view. If no pages can be found, the user will
be logged out of the app and be notified of this.

Pages that are not accessible to an authenticated user based on their role will automatically be
hidden from the app’s menu.

```yaml validate page-snippet
- name: Example Page Unique 1
  blocks:
    - type: action-button
      version: 0.29.11
      parameters:
        icon: home
```

> In the above example, viewing this page requires either no roles or the `roles` property specified
> on the root of the app definition

```yaml validate page-snippet
- name: Example Page Unique 2
  roles: []
  blocks:
    - type: action-button
      version: 0.29.11
      parameters:
        icon: home
```

> By specifying an empty list, no roles are required to view this page. If the root of the app
> definition requires any roles, the user still needs to authenticate themselves.

```yaml validate pages-snippet
pages:
  - name: Example Page Unique 3
    roles:
      - Admin
    blocks:
      - type: action-button
        version: 0.29.11
        parameters:
          icon: home
  - name: Example Page 4
    roles:
      - Reader
    blocks:
      - type: action-button
        version: 0.29.11
        parameters:
          icon: arrow-left
```

> By specifying the `roles` property for each page, the root `roles` property of the app will be
> overridden by the `roles` property for the page. In the above example only users with the “Admin”
> role will be able to visit “Example Page”. Anyone else will be redirected automatically to
> “Example Page 2”.

## Block roles

By specifying the `roles` property for a block, it is possible to hide the block for users with
insufficient roles. Users who don’t have any of the roles specified in the `roles` property of a
block will not be able to view or interact with the block at all.

This can be especially useful for extending the functionality of a page for a specific set of users
such as a button to create a new app for the administrators of a blog.

```yaml validate page-snippet
- name: Example Page Unique 4
  blocks:
    - type: action-button
      version: 0.29.11
      parameters:
        icon: home
    - type: table
      version: 0.29.11
      parameters:
        fields:
          - value: { prop: firstName }
            label: First Name
          - value: { prop: lastName }
            label: Surname
      roles:
        - Admin
```

> In the example above, only the “example” block will be shown to users who don’t have the “Admin”
> role. Users who do will see both blocks.

## Resource roles

As described in the [Appsemble resources](resources.md) page, it is possible to define and manage
various resources that can be used from within an app. By default the corresponding API endpoints
are _not_ secured. They are available for modification by anyone who knows the format of the
resource, as well as the specific endpoint being used. One exception to this is when the root of the
app definition has a `roles` property defined. In that case, every resource action requires one of
the roles as specified in this property, unless it is otherwise specified.

By specifying the `roles` property for a specific action of a resource, it is possible to secure
this action. For example, if your resource may be publicly viewed by anyone but not created anew by
non-administrators, this can be managed by defining the `roles` property.

```yaml validate resources-snippet
resources:
  blog:
    schema:
      type: object
      additionalProperties: false
      properties:
        title:
          type: string
        body:
          type: string
```

> In the above example, users with the “Reader” role will be able to view either all blog resources
> or a singular one through the “query” and “get” resource actions, but they will not be able to
> create, update or delete blog resources without having the “Admin” role.

On top of specifying app roles to determine which users have access to resources there are a couple
of special options that are always available regardless of the presence of roles. All of these
require the user to be logged in.

The following special options are currently supported:

- **$none**: Grants access specifically to users who aren’t logged in.
- **$public**: Grants access to everyone, even users who aren’t logged in.
- **$author**: Grants access if the user is the same as the one who created the resource.
- **$group:member**: Grants access if the user is in the same group as the user who created the
  resource. See the [Groups guide](groups.md) for details.
- **$group:manager**: Grants access if the user is in the same group as the user who created the
  resource and has the `manager` role within the group. See the [Groups guide](groups.md) for
  details.
