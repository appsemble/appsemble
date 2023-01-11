# Notifications

Notifications can be used to keep in touch with the users of your app by sending them when certain
events happen, such as creating a new blog post. Appsemble can automate this process by integrating
sending out notifications related to changes being made to [resources](resources.md).

This page serves to explain the concepts used to send out these notifications.

## Subscribing

In order to enable notifications, you must set the
[`notifications`](/docs/reference/app#app-definition-notifications) property to either `opt-in`
(recommended) or `startup`. Doing so allows app creators to access the “Notifications” page, from
which notifications can be manually pushed to all users who are currently subscribed.

By setting the `notifications` property, users are able to set their notification preferences in the
app settings page. After they give permission by flipping the “subscribe” switch, they are ready to
start receiving push notifications.

## Resource notifications

As previously mentioned, it’s possible to automate sending out resources when certain events such as
resources being created or updated happen.

This can be done by using resource hooks. Resource hooks are special events that are triggered when
certain changes happen, like creating a new resource. One such hook is the `notifications` hook.

Within a notification hook it’s possible to define how notifications are sent. It’s possible to
automatically send notifications for users with specific roles, the author of a resource, as well as
allowing users to subscribe to resources of a specific type and individual resources.

```yaml copy
notifications: opt-in # Enable notifications in the app

security:
  default:
    role: Reader
    policy: everyone
  roles:
    Admin:
      description: Administrator who can register new people.
      inherits:
        - Reader
    Reader:
      description: Any authenticated user.

resources:
  person:
    schema:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
    create:
      hooks:
        notification:
          to:
            - Admin # Notify users with the Admin role when a `person` resource is created.
          subscribe: both # Users are able to both subscribe to individual resources as well as all `person` resources being created.

pages: # …
```

In the example above we define a notification hook that is triggered when a `person` resources is
created. When this happens, it sends a notification to all users with the `Admin` role, as well as
anyone who is subscribed to receive notifications for this event. Users can enable this from the
app’s setting page.

The `both` value in the property `subscribe` means that users are able to subscribe to individual
resources as well as resources of the same type. It is possible to restrict this by setting this
property to `single` to only allow users to subscribe to individual resources, and `all` to only
allow users to subscribe to the resource type.

This same principle can be applied to `update` and `delete` resource actions. In these actions it is
also possible to make use of the special value `$author` within the `to` property to send
notifications to the user who initially created the resource.

## Subscribing to individual resources

In order to allow users to subscribe to individual resources, assuming the `subscribers` property in
the corresponding hook is set to `single` or `both`, it is possible to allow users to subscribe to
an individual resource by making use of the action `resource.subscription.subscribe`.

The `resource.subscription.subscribe` action takes the values `resource` and optionally `action`.
`resource` refers to which resource the user should subscribe to, whereas `action` refers to which
event should trigger it. This can be either `update` or `delete`, defaulting to `update` if not
specified.

The same principles are applied to `resource.subscription.unsubscribe`, which unsubscribes from an
individual resource, and `resource.subscription.toggle`, which subscribes to an individual resource
if the user wasn’t subscribed before, and vice versa.

An example of what this could look like can be found in the code snippet below.

```yaml
pages:
  - name: Person List
    roles: []
    blocks:
      - type: data-loader
        version: 0.20.31
        actions:
          onLoad:
            type: resource.query
            resource: person
        events:
          emit:
            data: data
      - type: table
        version: 0.20.31
        parameters:
          fields:
            - name:
                - value: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Surname
        actions:
          onClick:
            type: resource.subscription.subscribe
            resource: person
            action: update
        events:
          listen:
            data: data
```

## Customizing the content of a notification

By default the content of the notifications Appsemble sends looks something like this:

```yaml
title: person
content: Updated person 123
```

This can be customized by defining an object called `data` with the properties `title` and `content`
in the notification hook object. The values can be either regular strings if they don’t have to be
dynamic, or a valid [remapper definition](/docs/reference/remapper).

For example:

```yaml
resources:
  person:
    schema:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
    create:
      hooks:
        notification:
          to:
            - Admin
          subscribe: both
          data:
            title: A new person has been added
            content:
              - string.format:
                  template: Their name is {first} {last}
                  values:
                    first:
                      - prop: firstName
                    last:
                      - prop: lastName
```

With the above example, when a new person is added the following notification will be sent:

```yaml
title: A new person has been added
content: Their name is John Doe
```
