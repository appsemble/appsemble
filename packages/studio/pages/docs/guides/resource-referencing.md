# Resource referencing

Sometimes in an app it’s required for resources to depend on each other. This can be defined in the
resource definition by adding references to other resources in the `references` object. Appsemble
handles references between resources internally and performs validation as an extension to the
[JSON Schema](https://json-schema.org/) standard. This behavior is designed to mimic foreign keys in
relational databases.

We specify resource references by mapping one of the resource’s properties to the name of another
resource. Let’s look at the following example from the [Triggers app](/apps/1129/triggers):

```yaml copy validate resources-snippet
resources:
  owner:
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
      required:
        - name

  housePet:
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

## Triggers

A trigger is an object with a type and an optional cascading strategy. Currently, Appsemble only
supports `delete` triggers, which are used to perform a `delete` operation on the child resource.

## Cascading strategies

In the example above, all pet resources have triggers of type `delete`. However, they have different
cascading strategies specified:

### No cascading strategy

The `housePet` resource has no cascading strategy specified. This is the default behavior, and it
means that if an instance of `housePet` exists with its `ownerId` property equal to `1`, the
instance of `owner` with its `id` property equal to `1` cannot be deleted. An error with status 400
will be returned in the delete request’s response.

### Cascade update

The `farmPet` resource has a cascading update strategy specified. This means that if an instance of
`owner` with property `id` equal to `1` is deleted, all instances of `farmPet` with `ownerId`
property equal to `1` will get their `ownerId` property set to `null`.

### Cascade delete

The `wildPet` resource has a cascading delete strategy specified. This means that if an instance of
`owner` with property `id` equal to `1` is deleted, all instances of `wildPet` with `ownerId`
property equal to `1` will also be deleted.

Appsemble currently supports only the three cascading strategies listed above.

> Note: the id must be present in the root of a resource and the resource must be an object.
