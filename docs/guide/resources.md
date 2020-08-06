# Resources

Appsemble out of the box provides its own method of storing and retrieving data specific to apps. It
can also retrieve en store an external data source outside Appsemble. Data that is created via an
app is called a ´resource´.

## Defining resources

Resources can be defined within an [app recipe](../reference/app.md) within the `resources`
property. Each object within `resources` is considered to be a Resource, named after the name it is
given within `resources`.

The shape of a resource is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of a resource definition:

```yaml
person:
  schema:
    type: object
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
`/api/apps/{appId}/resources/person/{id?}`, supporting basic `CRUD` (create, read, update, and
delete) actions.

## Resource actions

In order to make the usage of resources more convenient, Appsemble supports the usage of
`resource actions`. Resource actions are actions that can fetch, modify, create or delete resources.
These are configured to use Appsemble APIs by default, but can be overridden manually if need be.

The resource actions available are:

- **resource.query**: Fetch all resources.
- **resource.get**: Fetch a single resource.
- **resource.create**: Create a new resource.
- **resource.update**: Update an existing resource.
- **resource.delete**: Delete an existing resource.
- **resource.subscription.subscribe**: Subscribe to an existing resource to receive push
  notifications. (See [notifications](notifications.md).)
- **resource.subscription.unsubscribe**: Unsubscribes from an existing resource subscription. (See
  [notifications](notifications.md).)
- **resource.subscription.toggle**: Toggle between subscribing and unsubscribing to an existing
  resource. (See [notifications](notifications.md).)
- **resource.subscription.status**: Fetch the status of a resource subscription. (See
  [notifications](notifications.md).)

## External resources

An app may use external resources instead of ones stored in the Appsemble API. In this case a
slightly more advanced configuration is necessary.

A resource requires an identified. In the Appsemble API, and many external APIs, this property is
called `id`. For some APIs this may be different. Which field should be used to identify resources
can be defined in the `id` property of a resource definition.

The URL on which a resource can be found, can be defined on the `url` property. By default,
resources can be created and queried from a base URL, and a single resource can be retrieved,
updated, or deleted from the URL post fixed with the ID. Each action is usually performed using a
standardized HTTP method, but external APIs may differ.

The following example demonstrates a more complex resource definition for an external API.

```yaml
person:
  schema: ... # see schema above
  id: myId # the name of the field to use when calling get, update and delete
  url: https://example.com/api/person # the default URL to use for resource actions
  query:
    # HTTP method to use. GET is default
    method: GET
    # url: defaults to the base URL

    # Query parameters are the ones after the question mark in the URL. These can optionally be
    # defined in a readable manner.
    query:
      $limit: '50'
  get:
    # HTTP method to use. GET is default
    method: GET
    # This would default to https://example.com/api/person/{myId}, but for the sake of this example,
    # the nickname property is used.
    url: https://example.com/api/person/{nickname}
  create:
    # HTTP method to use. POST is default
    method: POST
  update:
    method: PUT # HTTP method to use. PUT is default
```

## Query object

Aside from including the query string parameters in the URL manually, it is also possible to define
a `query` object in a resource definition. This allows for the URL to be easier to read, as well as
working in tandem with the `query` object as defined in (`resource` actions)[].

Below is an example of what the query object looks like when in use.

```yaml
person:
  query:
    query:
      $filter: lastName eq 'foo' # Resolves to /resources/person?$filter=lastName eq 'foo'

pages:
  - name: Example Page
    blocks:
      - type: data-loader
        version: 0.13.7
        actions:
          onLoad:
            type: resource.query
            resource: person
            query:
              id: 1 # Combined with the base filter, resolves to /resources/person?$filter=lastName eq 'foo'&id=1
        events:
          emit:
            data: people
```

## Filtering resources from the Appsemble API

When fetching resources at `/api/apps/{appId}/resources/{resourceName}`, by default all resources
are obtained. The data that is retrieved can be further specified using a subset of the
[OData URL syntax](http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html).

The following OData syntax is supported:

### Boolean operators

- [x] `AND`
- [x] `OR`
- [ ] `NOT`

### Comparison operators

- [x] Equal (`eq`)
- [x] Not Equal (`ne`)
- [x] Greater Than (`gt`)
- [x] Greater Than or Equal (`ge`)
- [x] Less Than (`lt`)
- [x] Less Than or Equal (`le`)

### Functions

1. String Functions

- [x] `substringof`
- [ ] `endswith`
- [x] `startswith`
- [x] `tolower`
- [x] `toupper`
- [x] `trim`
- [ ] `concat`
- [ ] `substring`
- [ ] `replace`
- [ ] `indexof`

2. Date Functions

- [x] `day`
- [x] `hour`
- [x] `minute`
- [x] `month`
- [x] `second`
- [x] `year`

### Others

- [x] Complex query with precedence
- [x] `top`
- [x] `select`
- [x] `filter`
- [x] `skip`
- [ ] `expand`

## Assets

Some resources may also include files such as images or documents. To support this, Appsemble
provides the Asset API. The asset API accepts file uploads and returns the corresponding ID which
can be referenced to within a resource.

The Asset API can be found at `/assets/{id?}`.
