# Resources

Appsemble out of the box provides its own method of storing and retrieving data specific to apps. It
can also retrieve and store external data outside Appsemble. Data that is created via an app is
called a `resource`.

## Table of Contents

- [Defining resources](#defining-resources)
  - [type](#type)
- [Resource actions](#resource-actions)
  - [Example](#example)
- [Securing resources](#securing-resources)
- [Assets](#assets)

## Defining resources

Resources can be defined in the [app definition](../reference/app.mdx#app-definition) within the
`resources` property. Each object within `resources` is considered to be a Resource, named after the
name it was given within `resources`.

The shape of a resource is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of a resource definition:

```yaml copy validate resources-snippet
resources:
  person:
    schema:
      type: object
      additionalProperties: false # Custom properties are disallowed to ensure the shape of each person resource is fixed.
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        age:
          type: integer
        description:
          type: string
```

The above resource will be recognized as an object which can be referred to from blocks using
`$ref: /resources/person` or by using `resource` actions. It can be accessed in the API at
`/api/apps/{appId}/resources/person/{id?}`, supporting basic `CRUD` (create, read, update and
delete) actions.

> Note: By default all resource actions are private. In order to allow access to them, refer to
> [Securing resources](#securing-resources).

### Type

The following types can be used to define the type of a property:

| Type name | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| array     | An array is a series of values                                                                |
| boolean   | A Boolean is a variable that can have one of two possible values, true or false               |
| integer   | An integer is a number which is not a fraction; a whole number (..., -2, -1, 0, 1, 2, 3, ...) |
| null      | Null represents a variable with no value                                                      |
| number    | Number can contain a fractional part (2.56, 1.24, 7E-10) and also integers                    |
| string    | A string is any sequence of characters (letters, numerals, symbols, punctuation marks, etc.)  |

## Resource actions

In order to make the usage of resources more convenient, Appsemble supports the usage of
[resource actions](../actions/resources.mdx). Resource actions are actions that can fetch, modify,
create or delete resources. These are configured to use Appsemble APIs by default, but can be
overridden manually if needed.

The available resource actions are:

- [**resource.query**](../actions/resources.mdx#resourcequery): Fetch all resources.
- [**resource.count**](../actions/resources.mdx#resourcecount): Count all resources.
- [**resource.get**](../actions/resources.mdx#resourceget): Fetch a single resource.
- [**resource.create**](../actions/resources.mdx#resourcecreate): Create a new resource.
- [**resource.update**](../actions/resources.mdx#resourceupdate): Update an existing resource.
- [**resource.delete**](../actions/resources.mdx#resourcedelete): Delete an existing resource.
- [**resource.delete.all**](../actions/resources.mdx#resourcedeleteall): Delete all existing
  resources of a type.
- [**resource.delete.bulk**](../actions/resources.mdx#resourcedeletebulk): Delete several existing
  resources of a type.
- [**resource.subscription.subscribe**](../actions/resources.mdx#resourcesubscriptionsubscribe):
  Subscribe to an existing resource to receive push notifications. (See
  [notifications](../guides/notifications.md).)
- [**resource.subscription.unsubscribe**](../actions/resources.mdx#resourcesubscriptionunsubscribe):
  Unsubscribes from an existing resource notification subscription. (See
  [notifications](../guides/notifications.md).)
- [**resource.subscription.toggle**](../actions/resources.mdx#resourcesubscriptiontoggle): Toggle
  between subscribing and unsubscribing to an existing resource notifications. (See
  [notifications](../guides/notifications.md).)
- [**resource.subscription.status**](../actions/resources.mdx#resourcesubscriptionstatus): Fetch the
  status of a resource notifications subscription. (See
  [notifications](../guides/notifications.md).)

> **Note**: By default all resource calls are private.

### Example

Here is an example of how to get a resource using the `resource.query` action.

First, we define a resource to query. In this example, we have `answers`:

```yaml validate resources-snippet
resources:
  answers:
    schema:
      type: object
      additionalProperties: false
      properties:
        rating:
          title: Rating
          enum:
            - happy
            - neutral
            - sad
```

The `answers` resource has only one property, called "Rating". The values in this property are an
`enum`, meaning they can only be one of the values described in the definition (**happy**,
**neutral** or **sad**).

The resource is filled with data which we'd like to use in our app. You can get this data using the
`resource.query` action. This fetches all the entries in a resource. So, the following block will
return all entries from the `answers` resource:

```yaml validate block-snippet
- type: data-loader
  version: 0.35.8
  actions:
    onLoad:
      type: resource.query
      resource: answers
```

Returns:

```json
[
  {
    "$author": {
      "id": 12345,
      "name": "Joe"
    },
    "$created": "2022-10-27T08:32:34.181Z",
    "$updated": "2022-10-27T08:32:34.181Z",
    "id": 24039,
    "rating": "sad",
  },
  {
    "$author": {
      "id": 12345,
      "name": "Joe"
    },
    "$created": "2022-10-27T08:32:31.310Z",
    "$updated": "2022-10-27T08:32:31.310Z",
    "id": 24038,
    "rating": "neutral",
  },
  ...
]
```

The result of the query has a lot of extra data you might not need, like information about when it
was created or the author's name. You can transform this data further using
[remappers](../remappers/index.mdx) to make sure it only includes what you need.

Once the data is how you need it to be you can send it to other blocks using
[events](../guides/events.md).

## Securing resources

All resources and their corresponding actions are private by default. To allow access to resource
actions you need to add corresponding permissions to the app’s security definition.

You can define what resource permissions unauthenticated users have by using the `guest` property of
the security definition like so:

```yaml
security:
  guest:
    permissions:
      - '$resource:reservation:query:public'
      - '$resource:reservation:get:public'
```

You can also define what resource permissions different app member roles have by using the `roles`
property of the security definition like so:

```yaml
security:
  guest:
    permissions:
      - '$resource:reservation:query:public'
      - '$resource:reservation:get:public'
  roles:
    User:
      permissions:
        - '$resource:reservation:create'
        - '$resource:reservation:own:query'
        - '$resource:reservation:own:get'
        - '$resource:reservation:query:public'
        - '$resource:reservation:get:public'
  default:
    role: User
```

This makes it possible to, for example, restrict access to other user(s) resources by only allowing
users to interact with the resources they made themselves.

For more information about this, please refer to [this page](./security.md#resource-permissions)

## Assets

Some resources may need binary data such as images or documents. To support this, Appsemble provides
the [asset](./assets.md) API. The resource API works with the asset API to handle binary data. To
treat a field in a resource as a binary asset, specify it as `type: string` and `format: binary` in
the JSON schema.

```yaml validate resources-snippet
resources:
  picture:
    schema:
      type: object
      additionalProperties: false
      properties:
        picture:
          type: string
          format: binary
```

Now if the user uses resource actions to create or update a resource which has a picture, the
picture will be uploaded as a binary blob alongside the rest of the resource which is serialized as
JSON. The API will replace the asset with an auto-generated ID. This ID can be used to reference the
asset in a URL.

The same happens when a resource is managed using Appsemble Studio.

## Related subjects

- [Expiring resources](../guides/expiring-resources.md)
- [External resources](../guides/external-resources.md)
- [Filtering queries](../guides/filtering-queries.md)
- [Resource referencing](../guides/resource-referencing.md)
- [Resource views](../guides/resource-views.md)
- [Sharing resources](../guides/sharing-resources.md)
