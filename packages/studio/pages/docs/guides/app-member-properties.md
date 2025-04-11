# App Member Properties

Appsemble provides a method of storing user specific data on app member accounts in so-called member
properties, which are stored as a JSON object.

## Table of Contents

- [Defining app member properties](#defining-app-member-properties)

## Defining app member properties

Sometimes it is good to define a concrete structure for the JSON object of the app member
properties. This can be done in the [app definition](../reference/app.mdx#app-definition) within
`member.properties`.

The shape of a property is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of app member properties definition:

```yaml copy validate
name: Internal Comms Platform
defaultPage: Updates

members:
  properties:
    dateOfBirth:
      schema:
        type: string
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
        version: 0.32.1
        parameters:
          placeholders:
            headerContent: Grand Restaurant
          content: |
            <h1 data-content="headerContent" class="landing-page" />
```

As you can see in the app definition above, each app member property has a schema, which defines its
type. This means that each of the properties can only accept values based on this type.

Each property can also define an optional resource reference. If a resource reference is specified,
the app member property references the specified resource by its id. This means that a `task` id can
be assigned to the `lastCompletedTask` property only if a `task` resource exists with this id.
Similarly, an `update` id can only be appended to the `readUpdates` array only if an `update`
resource exists with this id. In addition, deleting a resource referenced by an app member property,
will trigger an update in all app members’ properties to reflect the deletion. It will remove ids
from arrays and set integer properties to 0.
