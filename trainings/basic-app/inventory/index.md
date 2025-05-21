# Inventory

On the inventory page the manager should be able to add new bicycles to the inventory and manage the
stock of existing ones.

Let's first set up the essentials of the page like the name and roles. Since there's a page now, we
can set the `defaultPage` to go to that page.

```yaml copy
name: Bicycle Store
defaultPage: Inventory # The first page someone sees when they open the app

---
pages:
  - name: Inventory
    roles:
      - manager # Only app members with the 'manager' role can see and access this page
    blocks: ...
```

## Showing the inventory

On this page we want to display the current bicycle inventory. Since these are all stored in one
resource, it's easy to load and display the data.

The best way to fetch this data is by using the [data-loader](/en/blocks/@appsemble/data-loader)
block. This block calls an action once the page gets loaded or when a refresh event is called. The
data can then be emitted for other blocks to use. This makes it a great block for data
initialization.

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

There are lots of blocks to choose from in the [block store](/en/blocks) that are capable of
displaying data. You could even [make your own](/en/docs/development/developing-blocks). For this
training we're going with the [table block](/en/blocks/@appsemble/table).

The table block has a `fields` property that describe what columns there will be and what data
populates the rows. The block expects an **array** to be the input, which it will loop over to put
in the `value` property of a field.

```yaml copy validate block-snippet
type: table
version: 0.32.1
events:
  listen:
    data: bicycleStock # Listen for data emitted with this key, like the one from the data loader
parameters:
  caption: Bicycle inventory
  fields: # This array define what columns there will be and what data will populate it
    - label: Type
      value: { prop: type }
    - label: Amount in stock
      value: { prop: stock }
```

The resulting table looks like this:

![Bicycle inventory table with an entry for a BMX with a stock of 9](assets/bicycle-inventory-table.png 'Bicycle inventory table')

## Adding new bicycles

Aside from viewing the inventory, managers can also add new bicycles. For the app this means that
they need a convenient in-app method to add new entries to the `bicycle` resource.

A frequently used way to allow users to create new resource entries is by using a
[dialog](/en/docs/actions/miscellaneous#dialog). Dialogs are windows with their own blocks that
pop-up from the regular window, essentially giving you a small extra page to work with. This means
you don't clutter your app or page with extra information.

> **Note**: Dialogs are an [action](/en/docs/actions), meaning they can be created at any spot an
> action can be called.

We'll use the [action-button](/en/blocks/@appsemble/action-button) to initiate the dialog for
creating the bike.

> **Tip**: Incorporating the requirements of a resource into the form prevents difficult to read
> system errors from appearing.

```yaml copy validate-block
type: action-button
version: 0.32.1
parameters:
  icon: plus # The icon to show on the button
actions:
  onClick:
    type: dialog
    blocks: # Blocks shown in the dialog
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
        actions:
          onSubmit:
            type: resource.create
            resource: bicycles
            onSuccess:
              type: message # Displays a message at the bottom. User feedback is very important.
              body: Created a new bicycle!
              color: success
              onSuccess:
                type: event
                event: refreshBicycleInventory # Emit the refresh event, so the data loader re-runs the action
                onSuccess:
                  type: dialog.ok # Finally, close the dialog
```

> **Note**: Make sure to add the `$resource:bicycles:create` permission to the manager role

Finally, when you click on the action button you'll be greeted with this dialog:

![Form with input fields for a bicycle. Includes a 'type', 'stock' and 'image' input field.](assets/create-bicycle-dialog.png 'Create bicycle dialog')

Filling in the information and clicking "Submit" will then create a new entry in the `bicycle`
resource.

## Next steps

Now that we have a way to add bicycles by the manager, we can get the employees to sell them.
