# Remapper history

Whenever you're doing complex data transformation you might end up with a long chain of actions and
remappers. Meanwhile the data you need might be at an earlier part of the chain.

The app saves every step of this process in a **history**. This history can be accessed at any point
to access the data at a previous step.

To get a good understanding of how "history" works, read the **Introduction** part of the history
documentation:

- [History](/docs/remappers/history#introduction)

Here is an example on remapper history in action:

## Combining two datasets

Here we have a resource with users and a resource with answers that the users gave on a survey. We
need to combine the two datasets so it includes both the user's information and what answers they
gave.

```yaml copy block-snippet
type: data-loader
version: 0.31.1S
actions:
  onLoad:
    type: resource.get # Get the person's data through page parameters
    resource: person
    onSuccess:
      type: resource.query # Get all the answers stored in the database
      resource: answer
      remapAfter:
        - array.map: # Map through all the answers
            if:
              condition:
                equals: # Check if the object's "personId" is the same as the id of the person fetched at the start of the chain
                  - prop: personId
                  - [{ history: 1 }, { prop: id }] # Gets the id of the person fetched at the first action in the chian
              then:
                prop: response # Only return the "response" property's value
              else: null
        - null.strip: null # Get rid of any null values that got created due to them not passing the condition
      onSuccess:
        type: noop # This action doesn't do anything
        remapAfter:
          object.from: # Create a new object
            name: [{ history: 1 }, { prop: name }] # Add the "name" property to this object by taking it from the first action in the chain
            responses: { history: 2 } # Add the "responses" property by taking the entire value from the previous action's result
```

The result looks like this:

```json
{
  "name": "Joey",
  "responses": ["Happy", "Sad"]
}
```
