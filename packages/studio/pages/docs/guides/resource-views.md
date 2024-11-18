# Resource views

When using resource permissions for resources to secure the access to a resource it is usually done
to protect sensitive data that you don’t want to expose to everyone, such as names or email
addresses. Sometimes it is still desirable to know about parts of a resource despite of this
sensitive data. For this purpose resource _views_ can be used.

Views are alternate ways to display resources, using separate sets of resource view permissions. The
output of these API calls can then be modified using [remappers](../remappers/).

Let’s use an example of a resource that tracks reservations for a restaurant. Our resource contains
the name of the person who placed the reservation, as well as the table that has been reserved. Only
the creator of the resource is allowed to view their resource, otherwise personal information might
get leaked.

When making reservations, however, it is still helpful to know which tables are already reserved. To
accomplish this, views can be used. A view has a [remapper](../remappers/) that’s used to transform
the output.

In this case only the resource ID, table name and the creation date should be included. The
`object.from` remapper is suitable for this:

```yaml validate resources-snippet
resources:
  reservation:
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
