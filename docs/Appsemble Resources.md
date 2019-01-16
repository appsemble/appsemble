# Appsemble Resources

Appsemble provides its own method of storing and retrieving data specific to apps. Data that is
created via an app is called a ´resource´.

## Defining Resources

Resources can be defined within an [app recipe](#) within the `definitions` property. Each object
within `definitions` is considered to be a Resource, named after the name it is given within
`definitions`.

The shape of a resource is defined using [JSON Schema](https://json-schema.org/). JSON Schemas make
it possible for submitted data to be validated on types and required properties automatically.

An example of a resource definition:

```yaml
person:
  type: object
  required:
    - firstName
    - lastName
    - email
  properties:
    firstName:
      title: First Name
      type: string
    lastName:
      title: Last Name
      type: string
    email:
      title: Email Address
      type: string
      format: email
    age:
      title: Notities
      type: integer
      placeholder: 0
      minimum: 18
    description:
      title: Description
      type: string
```

The above resource will be recognized as an object which can be referred to from blocks using
`$ref: /definitions/person`.  
It can be accessed in the API at `/apps/{appName}/person/{id?}`, supporting basic `CRUD` actions.

## Filtering Resources

When fetching resources at `/apps/{appName}/{resourceName}`, by default all resources are
obtained.  
The data that is retrieved can be further specified using a subset of the
[OData URL syntax](http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html).

The following OData syntaxes are supported:

### Boolean Operators

- [x] AND
- [x] OR
- [ ] NOT

### Comparison Operators

- [x] Equal (eq)
- [x] Not Equal (ne)
- [x] Greater Than (gt)
- [x] Greater Than or Equal (ge)
- [x] Less Than (lt)
- [x] Less Than or Equal (le)

### Functions

1. String Functions

- [x] substringof
- [ ] endswith
- [x] startswith
- [x] tolower
- [x] toupper
- [x] trim
- [ ] concat
- [ ] substring
- [ ] replace
- [ ] indexof

2. Date Functions

- [x] day
- [x] hour
- [x] minute
- [x] month
- [x] second
- [x] year

### Others

- [x] Complex query with precedence
- [x] top
- [x] select
- [x] filter
- [x] skip
- [ ] expand

## Assets

Some resources may also include files such as images or documents.  
To support this, Appsemble provides the Asset API. The asset API accepts file uploads and returns
the corresponding ID which can be referenced to within a resource.

The Asset API can be found at `/assets/{id?}`.
