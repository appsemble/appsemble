# Security

While some apps may be intended for use by anyone, some apps may be intended for a select few
people. In order to facilitate this, apps can be secured in various ways in order to protect the app
or parts of the app from unauthorized users.

There are several properties that can be set in an app definition in order to secure an app for
different purposes.

## App Privacy

By going to the “Settings” page from within the Appsemble Studio, it is possible to set an app to be
marked as private by checking a checkbox. This results in the app no longer being publicly listed in
the Appsemble Studio app list page without being logged in to a user who is in the same organization
of the app.

This however does not affect anything if the user has a link to the app itself. Further security
definitions are required to restrict access to the app itself.

## Security Definition

The security definition, as defined [here](/docs/reference/app#security-definition), can be used to
define the roles that are used within the app. The security definition also determines how the
default role is assigned.

The `policy` property can be set to `everyone` to give everyone the default role, `organization` to
only do this for users being in the same organization as the app, and `invite` which does not assign
roles by default at all.

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

```yaml copy
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

### Root app roles

By specifying the [`roles`](/docs/reference/app#app-definition-roles) property to the root of the
app definition, each user must at least have one of these roles in order to view the app.
Consequently, each page and block will use this property as its default implementation unless it is
overridden by specifying another `roles` list at that level.

```yaml
name: Example app
# etc
security:
  # etc

roles:
  - Reader
```

> The example above signifies that everyone using the app must be logged in, in order to receive the
> `Reader` role. This will result in each page that doesn’t have its own `roles` property defined
> showing a login page if the user is not currently authenticated.

### Page app roles

By specifying the [`roles`](/docs/reference/app#base-page-definition-roles) property for a page,
visiting the page requires the user to have at least one of the roles specified in this list.

If a visiting user is not logged in and tries to view the page, they will instead be prompted to log
in.

If they are logged in but they don’t have sufficient roles, they will instead be automatically
redirected to the first page that they are allowed to view. If no pages can be found, the user will
be logged out of the app and be notified of this.

Pages that are not accessible to an authenticated user based on their role will automatically be
hidden from the app’s menu.

```yaml
pages:
  - name: Example Page
```

> In the above example, viewing this page requires either no roles or the `roles` property specified
> on the root of the app definition

```yaml
pages:
  - name: Example Page
    roles: []
```

> By specifying an empty list, no roles are required to view this page. If the root of the app
> definition requires any roles, the user still needs to authenticate themselves.

```yaml
pages:
  - name: Example Page
    roles:
      - Admin
  - name: Example Page 2
    roles:
      - Reader
```

> By specifying the `roles` property for each page, the root `roles` property of the app will be
> overridden by the `roles` property for the page. In the above example only users with the “Admin”
> role will be able to visit “Example Page”. Anyone else will be redirected automatically to
> “Example Page 2”.

### Block roles

By specifying the `roles` property for a block, it is possible to hide the block for users with
insufficient roles. Users who don’t have any of the roles specified to the `roles` property of a
block will not be able to view or interact with the block at all.

This can be especially useful for extending the functionality of a page for a specific set of users,
such as a button to create a new app for the administrators of a blog.

```yaml
pages:
  - name: Example Page
    blocks:
      - type: example
        version: 0.0.0
      - type: super-secret-block
        version: 0.0.0
        roles:
          - Admin
```

> In the example above, only the “example” block will be shown to users who don’t have the “Admin”
> role. Users who do will see both blocks.

### Resource roles

As described in the [Appsemble resources](resources.md) page, it is possible to define and manage
various resources that can be used from within an app. By default the corresponding API endpoints
are _not_ secured. They are able to be modified by anyone who knows the format of the resource as
well as the specific endpoint being used. One exception to this is when the root of the app
definition has a `roles` property defined. In that case, every resource action requires one of the
roles as specified in this property, unless it is otherwise specified.

By specifying the `roles` property for a specific action of a resource, it is possible to secure
this action. For example, if your resource may be publicly viewed by anyone but not created anew by
non-administrators, this can be managed by defining the `roles` property.

```yaml
resources:
  blog:
    schema:
      type: object
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
> create, update, or delete blog resources without having the “Admin” role.

On top of specifying app roles to determine which users have access to resources, there are a couple
of special options that are always available regardless of the presence of roles. All of these
require the user to be logged in.

The following special options are currently supported:

- **\$none**: Grants access specifically to users who aren’t logged in.
- **\$public**: Grants access to everyone, even users who aren’t logged in.
- **\$author**: Grants access if the user is the same as the one who created the resource.
- **\$team:member**: Grants access if the user is in the same team as the user who created the
  resource.
- **\$team:manager**: Grants access if the user is in the same team as the user who created the
  resource and has the `manager` role within the team.
