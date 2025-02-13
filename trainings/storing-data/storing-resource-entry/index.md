# Storing a resource entry

While you can add entries to a resource in the app store, this can be done inside the app as well.
In most apps you want the user to be able to store data in the resource and then later retrieve it
again. Appsemble has some built in actions that allow you to directly interact with the resource to
achieve these crucial functionalities.

For this training we will be extending the previous `person` example resource definition.

## Security

All resource calls are private by default. This means that we first need to open up some permissions
before we can interact with the resource.

You can read about securing resources here:

- [Securing resources](/docs/app/resources#securing-resources)

In this training we want to **create** and **query** resources. Since our resource is called
`person`, the permissions we need to add are as follows:

- `$resource:person:create`
- `$resource:person:query`

For simplicity's sake, we won't add different user types and roles to this app. All users will be
**guests**. That means our security definition will look like this:

```yaml copy security-snippet
security:
  guest:
    permissions:
      - $resource:person:create
      - $resource:person:query
```

## Storing a resource entry

As defined in [Resource actions](/docs/app/resources#resource-actions), we can use the
`resource.create` action to create a new resource entry.

The create action takes the data currently in that [ActionDefinition](/docs/reference/action) and
uses it to create a resource entry. An easy way to allow users to create a resource with the right
types and properties is by using a [form block](/blocks/@appsemble/form).

The form block forces a data type for their fields and has the option to toggle whether a field is
required or not. This directly translates to the resource definition itself.

```yaml copy block-snippet
type: form
version: 0.30.14-test.7
parameters:
  fields:
    - type: string
      name: name
      requirements:
        - required: true
    - type: integer
      name: age
      requirements:
        - required: true
actions:
  onSubmit:
    # The data here is an object with the values of the submitted form.
    # This gets sent to the resource.create action
    type: resource.create
    resource: person
```

Now whenever the user fills in the form and clicks on **Submit**, a new resource entry is created.

In the next training we will look at how to retrieve this data again and display it in a block.
