# Filtering queries

Sometimes it's cleaner to filter queries when you are requesting them instead of doing it afterwards
using remappers and actions.

## Query object

Aside from including the query string parameters in the URL manually, it is also possible to define
a `query` object in a resource definition. This allows for the URL to be easier to read. Query
accepts some [odata filters](#filtering-resources-from-the-appsemble-api).

Note that if `query` is defined in the
[`resource` action](../reference/app.mdx#-resource-definition-query), the `query`
[remapper](../remappers/) as defined in the action will take precedence over the one defined as the
default for the resource’s method.

Below is an example of what the query object looks like when in use.

```yaml copy validate
name: Demo App
defaultPage: Example Page

security:
  guest:
    permissions:
      - '$resource:person:query'

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
      query:
        object.from: "$filter: lastName eq 'foo'" # Resolves to /resources/person?$filter=lastName eq 'foo'

pages:
  - name: Example Page
    blocks:
      - type: data-loader
        version: 0.33.9
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
        version: 0.33.9
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
