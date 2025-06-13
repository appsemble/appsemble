# What is a resource

Resources are the Appsemble built in method to store data. After defining a data structure you can
access the resource to create, read, update or delete data entries.

## Defining a resource

A resource should be responsible for a single purpose as to keep working with it simple.

To get a good understand on the specifications of defining a resource, check out the documentation:

- [Defining resources](/docs/app/resources#defining-resources)

## Example resource definition

Let's verify your knowledge by creating a simple resource definition.

For this example we want to have a resource that allows us to store a person's details in a
resource. We know we'll need to store the following data:

- **Name**
- **Age**

This can be put into a single resource definition that only stores some of the user's basic
information. The name should be a string and age should be an integer since it can only be a whole
number. That leaves you with the following resource definition:

```yaml copy validate resources-snippet
resources:
  person: # Name of the resource
    schema: # The resource schema
      type: object
      additionalProperties: false
      required: # List of properties that cannot be null when creating the resource
        - name
        - age
      properties: # All the properties of the resource
        name:
          type: string
        age:
          type: integer
```

## Securing resources

Resources are private by default meaning nobody in an app can access them. In order to allow people
to use the app's resources you need to give them permission.

You can define what permissions each type of user gets in their
[security definition](/docs/app/security). For example, if you want a user to be able to **query**
the **person** resource, you'll need to give them the `$resource:person:query` permission.

In practice that looks like this:

```yaml copy validate security-snippet
security:
  guest: # The type of app member to give the permission to
    permissions:
      - $resource:person:query # The permission to give
```

You can read more about this in [Securing resources](/docs/app/resources#securing-resources).

## Conclusion

Those are the basics of what a resource is and how to define them. In the next trainings we'll look
at handling actual data using resources.
