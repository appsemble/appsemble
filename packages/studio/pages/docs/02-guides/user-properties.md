# User Properties

Appsemble provides a method of storing user specific data on user accounts in so-called user
properties, which are stored as a JSON object.

## Table of Contents

- [Defining user properties](#defining-user-properties)

## Defining user properties

Sometimes it is good to define a concrete structure for the user properties JSON object to ensure
consistency. This can be done in the [app definition](/docs/reference/app#app-definition) within
`users.properties`.

The shape of a property is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of user properties definition:

```yaml copy validate
name: Internal Comms Platform
defaultPage: Updates

users:
  properties:
    dateOfBirth:
      schema:
        type: string
    job:
      schema:
        enum:
          - Chef
          - Barista
          - Bartender
        default: Chef
    lastCompletedTask:
      schema:
        type: integer
      reference:
        resource: tasks
    readUpdates:
      schema:
        type: array
        items:
          type: integer
      reference:
        resource: updates

resources:
  updates:
    roles:
      - $public
    schema:
      type: object
      additionalProperties: false
      required:
        - description
        - memberType
      properties:
        authorImage:
          type: string
        description:
          type: string
        memberType:
          type: string
  tasks:
    roles:
      - $public
    schema:
      type: object
      additionalProperties: false
      required:
        - title
      properties:
        title:
          type: string
        authorImage:
          type: string
        linkTo:
          type: string

pages:
  - name: Updates
    blocks:
      - type: html
        version: 0.29.5
        parameters:
          placeholders:
            headerContent: Grand Restaurant
          content: |
            <h1 data-content="headerContent" class="landing-page" />
```

As you can see in the app definition above, each user property has a schema, which defines its type.
This means that each of the properties can only accept values based on this type.

Each property can also define an optional resource reference. If a resource reference is specified,
the user property references the specified resource by its id. This means that a `task` id can be
assigned to the `lastCompletedTask` property only if a `task` resource exists with this id.
Similarly, an `update` id can only be appended to the `readUpdates` array only if an `update`
resource exists with this id. In addition, deleting a resource referenced by a user property, will
trigger an update in all users’ properties to reflect the deletion. It will remove ids from arrays
and set integer properties to 0.
