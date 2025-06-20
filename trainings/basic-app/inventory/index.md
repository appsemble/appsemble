# Inventory

On the inventory page the manager should be able to add new bicycles to the inventory so they can be
sold later.

Let's first set up the essentials of the page like the name and roles.

```yaml copy
pages:
  - name: Inventory
    roles:
      - manager # Only app members with the 'manager' role can see and access this page
    blocks: ...
```

Since there is a page now, we can also set the `defaultPage`.

```yaml copy
name: Bicycle Store
defaultPage: Inventory # The first page someone sees when they open the app

---
pages:
  - name: Inventory
    ...
```

## Displaying the inventory

On this page we want to display the current bicycle inventory. Since these are all stored in one
resource, it's easy to load and display the data.

The best way to fetch this data is by using the [data-loader](/blocks/@appsemble/data-loader) block.
This block calls an action once the page gets loaded or when a refresh event is called. The data can
then be emitted for other blocks to use. This makes it a great block for data initialization.

```yaml copy validate blocks-snippet
blocks:
  - type: data-loader
    version: 0.32.1
    events:
      emit:
        data: bicycleStock # Emit the data at the end of the onLoad action for other blocks to use
      listen:
        refresh: refreshBicycleInventory # Re-runs the onLoad action once this event is called
    actions:
      onLoad: # This action runs once the page is loaded, or when the refresh event is called
        type: resource.query
        resource: bicycles
```

> **Note**: Make sure to add the `$resource:bicycles:query` permission to the manager role

Now that there's a solid way to load the needed data we can look at displaying the data.

There are lots of blocks to choose from in the [block store](/blocks) that are capable of displaying
data, or you could [make your own](/docs/development/developing-blocks). A common block used to
display data in a structured manner is the [table block](/blocks/@appsemble/table), so that is what
we will be using for this page.

The table block expects the data given to be an **array**. The `fields` property is then used to
tell the block _how_ each entry of the array will populate the table.

```yaml copy validate block-snippet
type: table
version: 0.32.1
events:
  listen:
    data: bicycleStock # Listen for data emitted with this key, like the one from the data loader
parameters:
  caption: Bicycle inventory
  fields:
    - label: Type # Defines a column with the label "Type"
      value: { prop: type } # The column will be populated with the value of the property "type"
    - label: Amount in stock # Defines a column with the label "Amount in stock"
      value: { prop: stock } # The column will be populated with the value of the property "stock"
```

The resulting table looks like this:

![Bicycle inventory table with two columns: "Type" and "Amount in stock". The table has 3 rows.](assets/bicycle-inventory-table.png 'Bicycle inventory table')

## Adding new bicycles

Aside from viewing the inventory, managers can also add new bicycles. For the app this means that
they need a convenient in-app method to add new entries to the `bicycle` resource.

A frequently used way to allow users to create new resource entries is by using a
[dialog](/docs/actions/miscellaneous#dialog). Dialogs are windows with their own blocks that pop-up
from the regular window, essentially giving you a small extra page to work with. This means you
don't clutter your app or page with extra information.

> **Note**: Dialogs are an [action](/docs/actions), meaning they can be created at any spot an
> action can be called.

We'll use the [action-button](/blocks/@appsemble/action-button) to call the dialog.

First, we need to initiate the dialog:

```yaml copy
type: action-button
version: 0.32.1
parameters:
  icon: plus # The icon to show on the button
actions:
  onClick: # What action gets called when the 'onClick' event is raised
    type: dialog
    blocks: # Blocks shown in the dialog
    ...
```

Here we tell the block to use the `dialog` action whenever the `onClick` event is raised.

Next, we need to define what blocks get shown in the dialog window. As this is going to be used to
create new bicycles, the form should include the properties of the bicycle resource as its fields.

```yaml copy
type: dialog
blocks:
  - type: form
    version: 0.32.1
    parameters:
      fields:
        - type: string
          name: type
          requirements:
            - required: true # 'type' is required in the resource, so we'll require this in the form too
            - maxLength: 50 # Max length in the resource is 50, so we'll require this in the form too
        - type: integer
          placeholder: '10'
          name: stock
          requirements:
            - required: true # 'stock' is required in the resource, so we'll require this in the form too
        - type: file
          name: image
          requirements:
            - required: true # 'image' is required in the resource, so we'll require this in the form too
```

> **Tip**: Incorporating the requirements of the resource into the form prevents difficult to read
> system errors from appearing when you try to submit it.

Finally we need to define what happens when the user submits the form. Once all the details are
filled in, we want the form to create a new entry in the bicycle resource.

When the user clicks on "Submit", we need a bunch of things to happen:

- The bicycle resource needs to be created
- The refresh event of the data loader needs to be called so the table will reload
- A message needs to appear telling the user they created a bicycle
- The dialog needs to be closed

For this to work we need to chain `onSuccess` actions on each other. The **onSuccess** action gets
called once its action succeeds, so if we put each action we need in the **onSuccess** of the
previous one we'll end up with a chain of actions:

```yaml copy
type: form
---
actions:
  onSubmit:
    type: resource.create # Create a new entry in the resource
    resource: bicycles
    onSuccess:
      type: event
      event: refreshBicycleInventory # Emit the refresh event, so the data loader re-runs the action
      onSuccess:
        type: message # Displays a message at the bottom. User feedback is very important
        body: Created a new bicycle!
        color: success # Semantics are important for user feedback
        onSuccess:
          type: dialog.ok # Finally, close the dialog
```

> **Note**: Make sure to add the `$resource:bicycles:create` permission to the manager role

This also means that whenever one action fails, the next ones won't get called. In this case that is
a good thing, as you don't want a 'success' message to appear when the action failed.

Finally, when you click on the action button you'll be greeted with this dialog:

![Form with input fields for a bicycle. Includes a 'type', 'stock' and 'image' input field.](assets/create-bicycle-dialog.png 'Create bicycle dialog')

Filling in the information and clicking "Submit" will then create a new entry in the `bicycle`
resource.

The block in its entirety looks like this:

<!-- XXX: Looks like this doesn't get put in a dropdown on the webiste. Let's keep it in for when we do implement it, and for people using straight markdown to view it -->
<details>
<summary>Action button block definition</summary>

```yaml copy block-definition
type: action-button
version: 0.32.1
parameters:
  icon: plus
actions:
  onClick:
    type: dialog
    blocks:
      - type: form
        version: 0.32.1
        parameters:
          fields:
            - type: string
              name: type
              requirements:
                - required: true
                - maxLength: 50
            - type: integer
              placeholder: '10'
              name: stock
              requirements:
                - required: true
            - type: file
              name: image
              icon: bicycle
              requirements:
                - required: true
        actions:
          onSubmit:
            type: resource.create
            resource: bicycles
            onSuccess:
              type: event
              event: refreshBicycleInventory
              onSuccess:
                type: message
                body: Created a new bicycle!
                color: success
                onSuccess:
                  type: dialog.ok
```

</details>

## Final page definition

The final Inventory page looks like this:

<details>
<summary>Inventory page definition</summary>

```yaml copy page-snippet
name: Inventory
roles:
  - manager
blocks:
  - type: data-loader
    version: 0.32.1
    events:
      emit:
        data: bicycleStock
      listen:
        refresh: refreshBicycleInventory
    actions:
      onLoad:
        type: resource.query
        resource: bicycles
  - type: table
    version: 0.32.1
    events:
      listen:
        data: bicycleStock
    parameters:
      caption: Bicycle inventory
      fields:
        - label: Type
          value: { prop: type }
        - label: Amount in stock
          value: { prop: stock }
  - type: action-button
    version: 0.32.1
    parameters:
      icon: plus
    actions:
      onClick:
        type: dialog
        blocks:
          - type: form
            version: 0.32.1
            parameters:
              fields:
                - type: string
                  name: type
                  requirements:
                    - required: true
                    - maxLength: 50
                - type: integer
                  placeholder: '10'
                  name: stock
                  requirements:
                    - required: true
                - type: file
                  name: image
                  icon: bicycle
                  requirements:
                    - required: true
            actions:
              onSubmit:
                type: resource.create
                resource: bicycles
                onSuccess:
                  type: event
                  event: refreshBicycleInventory
                  onSuccess:
                    type: message
                    body: Created a new bicycle!
                    color: success
                    onSuccess:
                      type: dialog.ok
```

</details>

## Next steps

Now that we have a way to add bicycles by the manager, we can get the employees to sell them.
