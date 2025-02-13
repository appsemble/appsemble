# Actions

Actions are behaviors that run custom logic. Some actions are pre-defined in blocks that run based
on certain triggers (like the `onLoad` action in the [data-loader](/blocks/@appsemble/data-loader)
block), while others can be run inside of another action (these are defined
[here](/docs/reference/action)).

Actions can do lots of things like fetching a resource, redirecting the user or accessing browser
storage.

Any action creates an `ActionDefinition`. Available properties of an ActionDefinition are `type`
(describes the action of this definition), `onSuccess` (creates a new action definition when the
action succeeds) and `onError` (creates a new action definition when the action fails).

## Entry points

An action can only be called from within an `ActionDefinition`. This means that actions can only
start from within a block action.

A good example of this is the [data-loader](/blocks/@appsemble/data-loader) block. This block as an
action that gets called whenever the block is loaded (called `onLoad`). Now we have an entry point
to define an action.

Since this action gets called once the block loads in, which is usually whenever the page loads in,
we can use this to load the resources required for this page.

```yaml copy
type: data-loader
version: 0.30.14-test.7
actions:
  onLoad: # This action gets called when the block loads in
    type: resource.query # This action loads the specified resource
    resource: report
```

## Action chaining

A key feature of actions is chaining them together in order to combine results. This can be done
using the `onSuccess` and `onError` actions. Since these create a new ActionDefinition based on the
result of the previous action, you can chain behaviors to achieve your desired result.

With this we can try getting a resource and define custom behavior for what happens when the request
succeeds or fails:

- When the request fails we want to notify the user that the app could not find the specific person.
- When the request succeeds we want to send the data of the request to another block to display it

```yaml copy validate-block
type: data-loader
version: 0.30.14-test.7
actions:
  onLoad:
    type: resource.get # Gets the resource with this page's "id" parameter
    resource: people
    onSuccess: # This action gets called when the previous action succeeds
      type: event
      event: personInfo
    onError: # This action gets called when the previous action fails
      type: message
      message: Failed to find person!
      color: danger
```

Since the event and message actions are also a part of an ActionDefinition, we can chain these
further if we want.

In this example we check if the user we fetch is an administrator using the
[condition](/docs/actions/miscellaneous#condition) action. If so, they see a message and then go to
the admin page. That's 4 actions being chained together to form one piece of logic.

```yaml copy validate-block
type: data-loader
version: 0.30.14-test.7
actions:
  onLoad:
    type: resource.get
    resource: people
      onSuccess:
      type: condition
      if:
        equals:
          - prop: role
          - "Admin"
      then:
        type: message
        body: Logging in as admin...
        onSuccess:
          type: link
          to: Admin page
```

## More documentation

There are two pieces of documentation to look for when you need help with actions: **documentation**
and **reference**.

The regular documentation aims to explain each action, and the general concept of actions, in detail
and includes examples. You can find this here:

- [Action documentation](/docs/actions)

The reference documentation is a big list of all possible actions, their parameters and a small
description. You can find this here:

- [Action reference](/docs/reference/action)
