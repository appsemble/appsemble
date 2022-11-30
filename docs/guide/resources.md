# Resources

Appsemble out of the box provides its own method of storing and retrieving data specific to apps. It
can also retrieve en store an external data source outside Appsemble. Data that is created via an
app is called a ´resource´.

## Defining resources

Resources can be defined within an [app definition](/docs/reference/app#app-definition) within the
`resources` property. Each object within `resources` is considered to be a Resource, named after the
name it is given within `resources`.

The shape of a resource is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of a resource definition:

```yaml copy
resources:
  person:
    roles: [$public] # This makes all person resource actions public by default.
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
`/api/apps/{appId}/resources/person/{id?}`, supporting basic `CRUD` (create, read, update, and
delete) actions.

> Note: By default all resource actions are private. In order to access these, refer to
> [Securing resources](#securing-resources).

## Resource actions

In order to make the usage of resources more convenient, Appsemble supports the usage of
`resource actions`. Resource actions are actions that can fetch, modify, create or delete resources.
These are configured to use Appsemble APIs by default, but can be overridden manually if need be.

The resource actions available are:

- **resource.query**: Fetch all resources.
- **resource.count**: Count all resources.
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

> Note: By default all resource calls are private.

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

```yaml copy
person:
  schema: ... # see schema above
  id: myId # the name of the field to use when calling get, update and delete
  url: https://example.com/api/person # the default URL to use for resource actions
  query:
    # HTTP method to use. GET is default
    method: GET
    # url: defaults to the base URL

    # Query parameters are the ones after the question mark in the URL. These can optionally be
    # defined in a readable manner using remappers.
    query:
      object.from:
        $limit: 50
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
a `query` object in a resource definition. This allows for the URL to be easier to read. Note that
if `query` is defined in the [`resource` action](/docs/reference/app#-resource-definition-query),
the `query` [remapper](/docs/reference/remapper) as defined in the action will take precedence over
the one defined as the default for the resource’s method.

Below is an example of what the query object looks like when in use.

```yaml copy
person:
  query:
    roles: [$public] # This makes all person resource actions public by default.
    query:
      object.from:
        $filter: lastName eq 'foo' # Resolves to /resources/person?$filter=lastName eq 'foo'

pages:
  - name: Example Page
    blocks:
      - type: data-loader
        version: 0.20.24
        actions:
          onLoad:
            type: resource.query
            resource: person
            query:
              object.from:
                id: 1 # Resolves to /resources/person?id=1
        events:
          emit:
            data: people
```

## Views

When using roles for resources to secure the access to a resource it is usually to protect sensitive
data that you don’t want to expose to everyone, such as names or email addresses. Sometimes it is
still desirable to know about parts of a resource despite of this sensitive data. For this purpose
resource _views_ can be used.

Views are alternate ways to display resources, using separate sets of roles. The output of these API
calls can then be modified using [remappers](/docs/reference/remapper).

Let’s use an example of a resource that tracks reservations for a restaurant. Our resource contains
the name of the person who placed the reservation, as well as the table that has been reserved. Only
the creator of the resource is allowed to view their resource, otherwise personal information might
get leaked.

When making reservations however, it is still helpful to know which tables are already reserved. To
accomplish this, views can be used. A view has a set of roles, as well as a
[remapper](/docs/reference/remapper) that’s used to transform the output.

In this case only the resource ID, table name, and the creation date should be included. The
`object.from` remapper is suitable for this:

```yaml
resources:
  reservation:
    query:
      roles:
        - $author
    create:
      roles:
        - User
    schema:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
        table:
          type: string
    views:
      public:
        roles:
          - $public
        remap:
          object.from:
            id:
              prop: id
            table:
              prop: table
            $created:
              prop: $created
```

When calling the API endpoint for resources the query parameter `view` can be used to specify which
view should be used: `/api/apps/1/resources/reservation?view=public`. Alternatively, the `resource`
actions also support specifying views like so:

```yaml
type: resource.query
resource: reservation
view: public
```

When making a request using this view, the response will no longer include the `name` property.

```json
{
  "id": 1,
  "$created": "2022-06-02T09:00:00.000Z",
  "table": "5A"
}
```

## Expiring resources

There are some use cases where resources should be removed automatically after a set period of time.
This can be done by setting the `expires` property. This property contains a string describing how
long it takes for a resource to be considered expired.

For example:

```yaml
person:
  schema: ... # see schema above
  expires: 1d 12h # resource will expire in 36 hours
```

In the above example, a resource will be removed 36 hours after it was created, unless this was
otherwise specified.

The syntax used for `expires` supports the following units, which can be combined:

```
seconds (s, sec)
minutes (m, min)
hours (h, hr)
days (d)
weeks (w, wk)
months
years (y, yr)

Examples:
1h20m - 1 hour and 20 minutes
2 hr 20 min - 2 hours and 20 minutes
1y 22w 40min - 1 year, 22 weeks, and 40 minutes
```

The exact time at which the resource will expire will be listed under the `$expires` property when
fetching or updating a resource. The exact date and time of when the resource will be expired can
also be manually set by including the `$expires` property with a valid ISO 8601 date/time value.

> Note: When adding `expires` to a resource, this will not be retroactively applied to existing
> resources. These resources can be updated to have an expiration date set by updating the resource
> and including the `$expires` property.

## Filtering resources from the Appsemble API

When fetching resources at `/api/apps/{appId}/resources/{resourceName}`, by default all resources
are obtained. The data that is retrieved can be further specified using a subset of the
[OData URL syntax](http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html).

The following OData filter syntax is supported:

### Logical Operators

- [x] [`Equals`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Equals)
- [x] [`Not equals`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_NotEquals)
- [x] [`Greater than`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_GreaterThan)
- [x] [`Greater than or equal`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_GreaterThanorEqual)
- [x] [`Less than`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_LessThan)
- [x] [`Les than or equal`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_LessThanorEqual)
- [x] [`And`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_And)
- [x] [`Or`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Or)
- [x] [`Not`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Not)
      (Does not work as expected)
- [ ] [`Has`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Has)
- [ ] [`In`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_In)

### Arithmetic Operators

- [x] [`Addition`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Addition)
- [x] [`Subtraction`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Subtraction)
- [ ] [`Negation`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Negation)
- [x] [`Multiplication`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Multiplication)
- [x] [`Division`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Division)
      (Only `div`, not `divby`)
- [x] [`Modulo`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Modulo)

### Functions

#### String and Collection Functions

These functions have only been implemented for strings, not for collections.

- [x] [`concat`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_concat)
- [x] [`contains`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_contains)
- [x] [`endswith`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_endswith)
- [x] [`indexof`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_indexof)
- [x] [`length`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length)
- [x] [`startswith`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_startswith)
- [x] [`substring`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_substring)

#### Collection Functions

- [ ] [`hassubset`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_hassubset)
- [ ] [`hassubsequence`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_hassubsequence)

#### String Functions

- [ ] [`matchesPattern`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_matchesPattern)
- [x] [`tolower`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_tolower)
- [x] [`toupper`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_toupper)
- [x] [`trim`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_trim)

#### Date and Time Functions

- [ ] [`date`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_date)
- [ ] [`day`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_day)
- [ ] [`fractionalseconds`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_fractionalseconds)
- [ ] [`hour`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_hour)
- [ ] [`maxdatetime`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_maxdatetime)
- [ ] [`mindatetime`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_mindatetime)
- [ ] [`minute`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_minute)
- [ ] [`month`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_month)
- [ ] [`now`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_now)
- [ ] [`second`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_second)
- [ ] [`time`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_time)
- [ ] [`totaloffsetminutes`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_totaloffsetminutes)
- [ ] [`totalseconds`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_totalseconds)
- [ ] [`year`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_year)

#### Arithmetic Functions

- [ ] [`ceiling`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_ceiling)
- [ ] [`floor`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_floor)
- [ ] [`round`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_round)

#### Type Functions

- [ ] [`cast`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_cast)
- [ ] [`isof`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_isof)

#### Geo Functions

- [ ] [`geo.distance`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_geodistance)
- [ ] [`geo.intersects`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_geointersects)
- [ ] [`geo.length`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_geolength)

#### Conditional Functions

- [ ] [`case`](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_case)

## Securing resources

By default all resources and their corresponding actions are private by default. This means that in
order to provide access to these actions, the `roles` property or an action’s `roles` property must
be defined specifying the roles that the user needs to have. This makes it possible to, for example,
restrict access to other user’s resources by only allowing users to interact with the resources they
made themselves.

For more information about this, please refer to [this page](./security.md)

## Assets

Some resources may need binary data such as images or documents. To support this, Appsemble provides
the [asset](./assets.md) API. The resource API works with the asset API to handle binary data. To
treat a field in a resource in as a binary asset, specify it as `type: string` and `format: binary`
in the JSON schema.

```yaml
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

Now if the user uses resource actions to create or update a resource which has a picture, The
picture will be uploaded as a binary blob alongside the rest of the resource which is serialized as
JSON. The API will replace the asset with an auto-generated ID. This ID can be used to reference the
asset in a URL.

The same happens when a resource is managed using Appsemble Studio.
