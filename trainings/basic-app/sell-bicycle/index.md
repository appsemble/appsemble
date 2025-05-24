# Sell bicycle

In the previous module we made it possible to add new bicycles to the inventory. Now that there are
bikes, we can start selling them.

Just like before, we'll set up the basics of the page first:

```yaml
pages:
  ...
  - name: Sell bicycle
    roles: # Both managers and employees should be able to sell bicycles
      - manager
      - employee
    blocks: ...
```

## Showing the available bicycles

This process is very similar to the one of the inventory page. The main difference being that this
page will use the [list block](/en/blocks/@appsemble/list).

First, we'll set up the data loader to load the inventory, send it out and listen to refresh events.

```yaml copy validate blocks-snippet
blocks:
  - type: data-loader
    version: 0.32.1
    events:
      emit:
        data: bicycleInventory
      listen:
        refresh: refreshStock
    actions:
      onLoad:
        type: resource.query
        resource: bicycles
```

Now that we have a way to dispatch the data, we need a way to display it. We'll use the
[list block](/en/blocks/@appsemble/list) as it's able to condense lots of information into a
convenient list.

A list displays a series of cards below each other. We'll want to show the following information:

- Image of the bicycle
- Name of the bicycle
- How much stock of the bicycle is left

Additionally, we need a button that allows the employee or manager to sell the bicycle.

```yaml copy validate block-snippet
type: list
version: 0.32.1
events:
  listen:
    data: bicycleInventory # Listen for the bicycle inventory data
parameters:
  title: Rent out bicycles # Title of the list, appears at the top
  header: { prop: type } # Header of a card
  image: # Image displayed in the left of a card
    file: { prop: image }
    alt: # An alternate text gets displayed if the image can't be loaded, or if the user uses a screen reader
      string.format: # Returns a string that dynamically adds values to text
        template: '{type} image'
        values:
          type: { prop: type } # The {type} gets replaced with the value of the property 'type'
  fields: # A series of fields in a card
    - label: Bicycles left
      value: { prop: stock } # We want to display how much stock of an individual bike is left
  button: # Button that gets displayed in the right of a card
    label: Sell
    onClick: sellBicycle
    disabled:
      lt: [{ prop: stock }, 1] # Disables the sell button if there's no stock left
```

## Selling a bicycle

```yaml copy
actions:
  sellBicycle:
    type: dialog
    blocks:
      - type: form
        version: 0.32.1
        parameters:
          fields:
            - name: phoneNumber
              type: number
              label: Buyer's phone number
              placeholder: '1234567890'
              requirements:
                - required: true
                  errorMessage: A phone number is required to sell a bicycle! # This message gets shown if the user tries to submit without this field being filled in
            - name: notes
              type: string
              label: Notes
              multiline: true
        actions:
          onSubmit:
            type: resource.create
            resource: saleHistory
            body:
              object.from: # We'll create a new object using the properties from the form
                bicycle: { prop: type } # While not included in the form directly, this value was passed along with the initial button click action
                saleDate: { date.now: null } # Add a new property with the date of today
                buyerPhoneNumber: { prop: phoneNumber }
                notes: { prop: notes }
            onSuccess:
              type: resource.patch # On top of creating an entry in the sale history, we also need to change the stock of the bicycle
              resource: bicycles
              id: [{ history: 0 }, { prop: id }] # history: 0 was the point where the first action was called, which included the ID of that card's bicycle
              body:
                object.from: # As this is a patch operation, we need to create an object with the new value that will be in the stock
                  stock:
                    maths: # Subtract 1 from the stock of the bicycle
                      a: [{ history: 0 }, { prop: stock }]
                      b: 1
                      operation: subtract
              onSuccess:
                type: event
                event: refreshStock # Call the refresh event on the data loader
                onSuccess:
                  type: message
                  color: success
                  body: Successfully sold bicycle! # Give feedback to the user that the action worked successfully
                  onSuccess:
                    type: dialog.ok # Finally, close the dialog
```

## Next steps

Most of the functionality is done. All that's left is a log of the sale history.
