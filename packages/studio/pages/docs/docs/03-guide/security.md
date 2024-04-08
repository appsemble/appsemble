# Security

## Table of Contents

- [Introduction](#introduction)
- [App Privacy](#app-privacy)
- [App account management](#app-account-management)
- [Security Definition](#security-definition)
  - [Teams](#teams)
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

## App account management

There are several methods available to secure access to apps. By going to the “Secrets” page from
within the Appsemble Studio you can determine which login methods would be available. By default
Appsemble Studio’s OAuth2 login option is enabled, allowing users to login using their Appsemble
Studio account. This method can be useful for apps where it’s expected that users already have
Appsemble accounts since the same account can be reused.

The second login option allows for users to login using a password and email address. When enabled,
a login form appears on the login page from which a user can login, register a new account or reset
their password. This method also allows usage of the
[`user.login` and `user.register` actions](/docs/reference/actions#user.login).

This login option can be customized by naming pages `Login` and `Register`. Doing so will display
these pages instead of the default app login and register pages.

The third login option allows for setting up your own login methods using [OAuth2](oauth2.md) or
[SAML2.0](saml.md) which are described in more detail in their own pages.

Users who have logged into your app can be viewed from the “Users” page. From here the roles of
users can be adjusted, as well as view and edit any custom properties associated with the user as
set by the app.

## Security Definition

The security definition, as defined [here](/docs/reference/app#security-definition), can be used to
define the roles that are used within the app. The security definition also determines how the
default role is assigned.

The `policy` property can be set to `everyone` to give everyone the default role, `organization` to
only do this for users being in the same organization as the app and `invite` which does not assign
roles by default at all.

> **Important**: When [OAuth2](oauth2.md) or [SAML2.0](saml.md) is used in the app, you must set the
> policy to `everyone`. This will specifically allow every configured authentication method on the
> secrets page to be used as login method. If you do not want other Appsemble user accounts to be
> able to log in, you must `disable` the `appsemble login` options (including the Appsemble OAuth2
> option) in the secrets page. If this option is enabled, any Appsemble user account is able to log
> in to the app and will receive the default role.

The roles listed in the `roles` object may be used to restrict specific parts of an app. This can be
done by adding a `roles` property containing a list of roles that may access the property of the app
it has been applied to. Depending on which property this is applied to, different behavior can be
observed.

> Note: Every role that inherits another role will be considered sufficient when the inherited role
> is listed as required.
>
> For example: If the “Admin” role inherits the “Reader” role and a page requires the “Reader” role,
> users with the “Admin” role will be able to access the page.

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

### Teams

In addition to roles, an app may also use teams for securing the app. This can be defined using the
`teams` property of the security definition.

```yaml copy validate security-snippet
security:
  default:
    role: Reader
    policy: everyone
  teams:
    join: invite
    create:
      - Reader
    invite:
      - $team:member
  roles:
    Reader:
      description: Anyone viewing the app.
    Admin:
      description: Administrators of the app.
      inherits:
        - Reader
```

For more details, see the [teams guide](teams.md) and the
[teams reference documentation](https://appsemble.app/docs/reference/app#teams-definition)

## Root app roles

By specifying the [`roles`](/docs/reference/app#app-definition-roles) property to the root of the
app definition, each user must at least have one of these roles in order to view the app.
Consequently, each page and block will use this property as its default implementation unless it is
overridden by specifying another `roles` list at that level.

```yaml validate
name: Example App
defaultPage: Example Page

security:
  default:
    role: Reader
    policy: everyone
  roles:
    Reader:
      description: Anyone viewing the app.

roles:
  - Reader

pages:
  - name: Example Page
    blocks:
      - type: action-button
        version: 0.27.11
        parameters:
          icon: home
```

> The example above signifies that everyone using the app must be logged-in in order to receive the
> `Reader` role. This will result in each page that doesn’t have its own `roles` property defined
> showing a login page if the user is not currently authenticated.

## Page app roles

By specifying the [`roles`](/docs/reference/app#base-page-definition-roles) property for a page,
visiting the page requires the user to have at least one of the roles specified in this list.

If a visiting user is not logged in and tries to view the page, they will instead be prompted to log
in.

If they are logged in but they don’t have sufficient roles, they will instead be automatically
redirected to the first page that they are allowed to view. If no pages can be found, the user will
be logged out of the app and be notified of this.

Pages that are not accessible to an authenticated user based on their role will automatically be
hidden from the app’s menu.

```yaml validate page-snippet
- name: Example Page
  blocks:
    - type: action-button
      version: 0.27.11
      parameters:
        icon: home
```

> In the above example, viewing this page requires either no roles or the `roles` property specified
> on the root of the app definition

```yaml validate page-snippet
- name: Example Page
  roles: []
  blocks:
    - type: action-button
      version: 0.27.11
      parameters:
        icon: home
```

> By specifying an empty list, no roles are required to view this page. If the root of the app
> definition requires any roles, the user still needs to authenticate themselves.

```yaml validate pages-snippet
pages:
  - name: Example Page
    roles:
      - Admin
    blocks:
      - type: action-button
        version: 0.27.11
        parameters:
          icon: home
  - name: Example Page 2
    roles:
      - Reader
    blocks:
      - type: action-button
        version: 0.27.11
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
- name: Example Page
  blocks:
    - type: action-button
      version: 0.27.11
      parameters:
        icon: home
    - type: table
      version: 0.27.11
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
    query:
      roles:
        - Reader
    get:
      roles:
        - Reader
    create:
      roles:
        - Admin
    update:
      roles:
        - Admin
    delete:
      roles:
        - Admin
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
- **$team:member**: Grants access if the user is in the same team as the user who created the
  resource. See the [Teams guide](teams.md) for details.
- **$team:manager**: Grants access if the user is in the same team as the user who created the
  resource and has the `manager` role within the team. See the [Teams guide](teams.md) for details.
