# Resources

Appsemble out of the box provides its own method of storing and retrieving data specific to apps. It
can also retrieve and store external data outside Appsemble. Data that is created via an app is
called a ´resource´.

## Table of Contents

- [Defining resources](#defining-resources)
- [type](#type)
- [Resource actions](#resource-actions)
- [External resources](#external-resources)
- [Query object](#query-object)
- [Resource references](#resource-references)
  - [Triggers](#triggers)
  - [Cascading strategies](#cascading-strategies)
    - [No cascading strategy](#no-cascading-strategy)
    - [Cascade update](#cascade-update)
    - [Cascade delete](#cascade-delete)
- [Views](#views)
- [Expiring resources](#expiring-resources)
- [Clonable resources](#clonable-resources)
- [Seed resources](#seed-resources)
- [Ephemeral resources](#ephemeral-resources)
  - [Reseeding events](#reseeding-events)
- [Filtering resources from the Appsemble API](#filtering-resources-from-the-appsemble-api)
  - [Logical Operators](#logical-operators)
  - [Arithmetic Operators](#arithmetic-operators)
  - [Functions](#functions)
    - [String and Collection Functions](#string-and-collection-functions)
    - [Collection Functions](#collection-functions)
    - [String Functions](#string-functions)
    - [Date and Time Functions](#date-and-time-functions)
    - [Arithmetic Functions](#arithmetic-functions)
    - [Type Functions](#type-functions)
    - [Geo Functions](#geo-functions)
    - [Conditional Functions](#conditional-functions)
- [Securing resources](#securing-resources)
- [Assets](#assets)

## Defining resources

Resources can be defined in the [app definition](../05-reference/app.mdx#app-definition) within the
`resources` property. Each object within `resources` is considered to be a Resource, named after the
name it was given within `resources`.

The shape of a resource is defined using [JSON Schema](https://json-schema.org/). This makes it
possible for submitted data to be validated on types and required properties automatically.

An example of a resource definition:

```yaml copy validate resources-snippet
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
`/api/apps/{appId}/resources/person/{id?}`, supporting basic `CRUD` (create, read, update and
delete) actions.

> Note: By default all resource actions are private. In order to access these, refer to
> [Securing resources](#securing-resources).

## type

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
`resource actions`. Resource actions are actions that can fetch, modify, create or delete resources.
These are configured to use Appsemble APIs by default, but can be overridden manually if needed.

The available resource actions are:

- **resource.query**: Fetch all resources.
- **resource.count**: Count all resources.
- **resource.get**: Fetch a single resource.
- **resource.create**: Create a new resource.
- **resource.update**: Update an existing resource.
- **resource.delete**: Delete an existing resource.
- **resource.subscription.subscribe**: Subscribe to an existing resource to receive push
  notifications. (See [notifications](notifications.md).)
- **resource.subscription.unsubscribe**: Unsubscribes from an existing resource notification
  subscription. (See [notifications](notifications.md).)
- **resource.subscription.toggle**: Toggle between subscribing and unsubscribing to an existing
  resource notifications. (See [notifications](notifications.md).)
- **resource.subscription.status**: Fetch the status of a resource notifications subscription. (See
  [notifications](notifications.md).)

> Note: By default all resource calls are private.

## External resources

An app may use external resources instead of ones stored in the Appsemble API. In this case a
slightly more advanced configuration is necessary.

A resource requires an identifier. In the Appsemble API, and many external APIs, this property is
called `id`. For some APIs this may be different. Which field should be used to identify resources
can be defined in the `id` property of a resource definition.

The URL on which a resource can be found can be defined on the `url` property. By default resources
can be created and queried from a base URL, and a single resource can be retrieved, updated or
deleted from the URL post fixed with the ID. Each action is usually performed using a standardized
HTTP method, but external APIs may differ.

The following example demonstrates a more complex resource definition for an external API.

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
    id: myId # the name of the field to use when calling get, update and delete
    url: https://example.com/api/person # the default URL to use for resource actions
    query:
      # HTTP method to use. GET is default
      method: GET
      # url: defaults to the base URL

      # Query parameters are the ones after the question mark in the URL. These can optionally be
      # defined in a readable manner using remappers.
      query:
        object.from: '$limit: 50'
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
if `query` is defined in the
[`resource` action](../05-reference/app.mdx#-resource-definition-query), the `query`
[remapper](../04-remappers/) as defined in the action will take precedence over the one defined as
the default for the resource’s method.

Below is an example of what the query object looks like when in use.

```yaml copy validate
name: Demo App
defaultPage: Example Page

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
    query:
      roles: [$public] # This makes all person resource actions public by default.
      query:
        object.from: "$filter: lastName eq 'foo'" # Resolves to /resources/person?$filter=lastName eq 'foo'

pages:
  - name: Example Page
    blocks:
      - type: data-loader
        version: 0.29.6
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
      - type: table
        version: 0.29.6
        events:
          listen:
            data: people
        parameters:
          fields:
            - value: { prop: firstName }
              label: First Name
            - value: { prop: lastName }
              label: Surname
```

## Resource references

Sometimes in an app it’s required for resources to depend on each other. This can be defined in the
resource definition by adding references to other resources in the `references` object. Appsemble
handles references between resources internally and performs validation as an extension to the
[JSON Schema](https://json-schema.org/) standard. This behavior is designed to mimic foreign keys in
relational databases.

We specify resource references by mapping one of the resource’s properties to the name of another
resource. Let’s look at the following example from the Triggers app:

```yaml copy validate resources-snippet
resources:
  owner:
    roles:
      - $public
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
      required:
        - name

  housePet:
    roles:
      - $public
    references:
      ownerId:
        resource: owner
        delete:
          triggers:
            # No cascading strategy specified
            # The owner cannot be deleted if there is a house pet that references them
            # The house pet cannot live without an owner
            - type: delete
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
        species:
          type: string
        ownerId:
          type: number
      required:
        - name
        - ownerId

  farmPet:
    roles:
      - $public
    references:
      ownerId:
        resource: owner
        delete:
          triggers:
            - type: delete
              # Cascading update strategy specified
              # The owner can be deleted even if there is a farm pet that references them
              # The ownerId property of the pet is set to null (The pet can stay in the farm without an owner)
              cascade: update
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
        species:
          type: string
        ownerId:
          type: number
      required:
        - name
        - ownerId

  wildPet:
    roles:
      - $public
    references:
      ownerId:
        resource: owner
        delete:
          triggers:
            - type: delete
              # Cascading delete strategy specified
              # The owner can be deleted even if there is a wild pet that references them
              # The pet is deleted (The pet escapes and there is no longer a record of it)
              cascade: delete
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
        species:
          type: string
        ownerId:
          type: number
      required:
        - name
        - ownerId
```

Here we specify that the resources `housePet`, `farmPet` and `wildPet` all reference the `owner`
resource.

When publishing resources along with the app definition using the `appsemble app publish` command
with the `--resources` tag, resources from the `resources` directory in the app directory will be
published as `seed` resources in the app. If you want a resource defined as a JSON object in that
directory to reference another resource in the directory, you can add a field to the JSON object,
pointing to the index of the referenced resource in its array, like so:

In `/resources/owner.json`:

```json
[
  {
    "name": "Steve"
  },
  {
    "name": "Carol"
  }
]
```

And in `/resources/housePet.json`:

```json
[
  {
    "name": "Sven",
    "species": "Dog",
    "$owner": 0
  },
  {
    "name": "Milka",
    "species": "Cow",
    "$owner": 1
  }
]
```

Appsemble will handle the references to the owners internally. The pet `Sven` will be assigned an
`ownerId` value equal to the id of the owner `Steve`. Similarly, the pet `Milka` will be assigned an
`ownerId` value equal to the id of the owner `Carol`. This reference also persists in demo apps
after reseeding the resources. Each new `ephemeral` instance of the pets `Sven` and `Milka` will
belong to the new `ephemeral` instances of the owners `Steve` and `Carol` respectively.

When referencing parent resources from child resources, we often want to define what happens to the
child when a specific resource action is executed on the parent. Here `parent` and `child` are terms
used purely for ease of explanation. We can use the same example from the Triggers app to
demonstrate this.

In this case, `owner` is the parent resource and the resources `housePet`, `farmPet` and `wildPet`
are its children. In the pet resources’ references, we have defined triggers for the `delete`
action. This means that these triggers will be executed when the `owner` resource is deleted.

### Triggers

A trigger is an object with a type and an optional cascading strategy. Currently, Appsemble only
supports `delete` triggers, which are used to perform a `delete` operation on the child resource.

### Cascading strategies

In the example above, all pet resources have triggers of type `delete`. However, they have different
cascading strategies specified:

#### No cascading strategy

The `housePet` resource has no cascading strategy specified. This is the default behavior, and it
means that if an instance of `housePet` exists with its `ownerId` property equal to `1`, the
instance of `owner` with its `id` property equal to `1` cannot be deleted. An error with status 400
will be returned in the delete request’s response.

#### Cascade update

The `farmPet` resource has a cascading update strategy specified. This means that if an instance of
`owner` with property `id` equal to `1` is deleted, all instances of `farmPet` with `ownerId`
property equal to `1` will get their `ownerId` property set to `null`.

#### Cascade delete

The `wildPet` resource has a cascading delete strategy specified. This means that if an instance of
`owner` with property `id` equal to `1` is deleted, all instances of `wildPet` with `ownerId`
property equal to `1` will also be deleted.

Appsemble currently supports only the three cascading strategies listed above.

> Note: the id must be present in the root of a resource and the resource must be an object.

## Views

When using roles for resources to secure the access to a resource it is usually done to protect
sensitive data that you don’t want to expose to everyone, such as names or email addresses.
Sometimes it is still desirable to know about parts of a resource despite of this sensitive data.
For this purpose resource _views_ can be used.

Views are alternate ways to display resources, using separate sets of roles. The output of these API
calls can then be modified using [remappers](../04-remappers/).

Let’s use an example of a resource that tracks reservations for a restaurant. Our resource contains
the name of the person who placed the reservation, as well as the table that has been reserved. Only
the creator of the resource is allowed to view their resource, otherwise personal information might
get leaked.

When making reservations, however, it is still helpful to know which tables are already reserved. To
accomplish this, views can be used. A view has a set of roles, as well as a
[remapper](../04-remappers/) that’s used to transform the output.

In this case only the resource ID, table name and the creation date should be included. The
`object.from` remapper is suitable for this:

```yaml validate resources-snippet
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
      additionalProperties: false
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

```yaml validate resources-snippet
resources:
  expiring-resource:
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
    expires: 1d 12h # resource will expire in 36 hours
```

In the above example, a resource will be removed 36 hours after it was created, unless this was
otherwise specified.

The syntax used for `expires` supports the following units which can be combined:

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

## Clonable resources

In template apps, which can be cloned into a new app, some resources should be transferable to the
new app. We can mark those resources with the clonable property.

For example:

```yaml validate resources-snippet
resources:
  clonable-resource:
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
    clonable: true
```

In the above example, the resource can be transferred with the app when cloning it.

## Seed resources

All resources defined in the `resources` directory of an app will be considered `seed` resources.
Seed data is defined by the app developer and is intended to be present after changes to the app.

The `appsemble app publish` command will publish resources from the `resources` directory with their
`seed` property set to true when executed with the `--resources` flag.

The `appsemble app update` command will replace existing seed resources in the app with the ones
currently in the `resources` directory when executed with the `--resources` flag. Resources created
from within the app itself will be left untouched.

## Ephemeral resources

Ephemeral resources are temporary copies of `seed` resources, which are used in demo apps (apps with
`demoMode: true`). Users of demo apps can only interact with `ephemeral` resources.

In demo apps, the `appsemble app publish` and the `appsemble app update` commands will also create
`ephemeral` resources based on the app’s `seed` resources when executed with the `--resources` flag.

### Reseeding events

At the end of each day, an automated event called reseeding happens, which deletes all `ephemeral`
resources. In demo apps, new ephemeral resources are created based on the app’s `seed` resources.

In demo apps, this event can also be triggered manually from the studio.

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

All resources and their corresponding actions are private by default. This means that in order to
provide access to these actions, the `roles` property or an action’s `roles` property must be
defined, specifying the roles that the user needs to have. This makes it possible to, for example,
restrict access to other user(s) resources by only allowing users to interact with the resources
they made themselves.

For more information about this, please refer to [this page](./security.md)

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
