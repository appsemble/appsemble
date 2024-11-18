# External resources

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
      # url: defaults to the base URL

      # Query parameters are the ones after the question mark in the URL. These can optionally be
      # defined in a readable manner using remappers.
      query:
        object.from: '$limit: 50'
    get:
      # This would default to https://example.com/api/person/{myId}, but for the sake of this example,
      # the nickname property is used.
      url: https://example.com/api/person/{nickname}
```
