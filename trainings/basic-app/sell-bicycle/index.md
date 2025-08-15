# Sell bicycle

In the previous module we made it possible to add new bicycles to the inventory. Now that there are
bikes to sell, we can start selling them.

Just like before, we'll set up the basics of the page first:

```yaml copy
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
page will use the [list block](/blocks/@appsemble/list) to display data.

First we'll set up the data loader to load the inventory, send its data out, and listen to refresh
events.

```yaml copy validate blocks-snippet
blocks:
  - type: data-loader
    version: 0.34.8
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

> **Note**: The manager role already has the `resource.query` permission, but the employee doesn't.
> Since `manager` inherits permissions from `employee`, we can actually move the
> `$resource:bicycles:query` permission to the `employee` instead.

Now that we have a way to dispatch the data, we need a way to display it. We'll use the
[list block](/blocks/@appsemble/list) as it's able to condense lots of information into a clear
list.

This works different from the table. There are lots of different parameters to fill in instead of
having one `fields` property. There is still a `fields` property available, but this is used for the
fields in an individual card.

The list block displays a series of cards below each other. We'll want to show the following
information:

- Image of the bicycle
- Name of the bicycle
- How much stock of the bicycle is left

```yaml copy validate block-snippet
type: list
version: 0.34.8
events:
  listen:
    data: bicycleInventory # Listen for the bicycle inventory data
parameters:
  title: Rent out bicycles # Title of the list, appears at the top
  item: # Properties of an individual item
    header: # Header of a card
      title: { prop: type }
    content:
      image: # Image displayed in the left of a card
        file: { prop: image }
      fields: # A series of fields in a card
        - label: Bicycles left
          value: { prop: stock } # We want to display how much stock of an individual bike is left
```

To make the app more accessible, we can add an alernate text to the image. An alternate text is used
to describe the image when it can't be loaded or if the user uses a screen reader.

We can use the [string.format](/docs/remappers/strings#string.format) remapper to dynamically add an
alternate text based on what bicycle is shown.

```yaml copy
content:
  image:
    file: { prop: image }
    alt: # An alternate text gets displayed if the image can't be loaded or if the user uses a screen reader
      string.format: # Returns a string that dynamically adds values to text
        template: '{type} image'
        values:
          type: { prop: type } # The {type} gets replaced with the value of the property 'type'
```

## Selling a bicycle

Now, we need to add the ability to sell the bicycle. The list itself can be used as the entry point
to sell a specific bicycle. By putting a button on the card, we can use the `onClick` action to call
a new action using the values of that card.

Let's first add the button to the card. We'll also make sure that the button cannot be pressed if
there are no bicycles left.

```yaml copy
type: list
version: 0.34.8
...
parameters:
  ...
  footer:
    button: # Button that gets displayed in the right of a card
      label: Sell
      onClick: sellBicycle # The action to call when the button is clicked
      disabled: # Disables the button if the remapper returns true
        lt: # Returns true if the first value is less than the second value
          - { prop: stock }
          - 1
```

When the button is clicked, the `sellBicycle` action gets called.

We'll use the same mechanism as on the Inventory page, where the button opens a dialog with a form:

```yaml copy
actions:
  sellBicycle:
    type: dialog
    blocks:
      - type: form
        version: 0.34.8
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
            # Do something
```

Just like on the Inventory page, we'll need a bunch of actions chained together to do what we need.
What's new on this page however, is that we also need to add a completely new property: `saleDate`
which holds the day of today. On top of that, we need to change an existing resource to update its
stock.

Before we send the `resource.create` request, we want to change the body to include this new
property.

Since we're in the `onSubmit` action of a card's button, we get the data of that card in the action.
We can use this to create a new object with the card's data and add a new property to it:

```yaml copy
onSubmit:
  type: resource.create
  resource: saleHistory
  body: # Define the request body of the action before it is sent
    object.from: # Create a new object
      bicycle: { prop: type } # While not included in the form directly, this value was passed along with the initial button click action
      saleDate: { date.now: null } # Add a new property with the date of today
      buyerPhoneNumber: { prop: phoneNumber }
      notes: { prop: notes }
```

> **Note**: This is a new resource we need permission for. Go ahead and add the
> `$resource:saleHistory:create` permission to the `employee`.

The first part of selling the bicycle is done: a new entry in the `saleHistory` has been made. Now,
we need to adjust the stock of the bicycle to subtract the bike we just sold.

For this we'll use the [resource.patch](/docs/actions/resources#resourcepatch) action. A `patch`
operation applies a partial modification to a resource. In our case this means that we want to
modify the `stock` property of a specific `bicycle` resource entry. To do this, we'll need to do the
following:

- Target the specific resource entry we need to modify
- Subtract 1 from the resource's stock

You might remember that at the start of the chain in the initial `onClick` action we also got all
the data of the card that was clicked. That data can still be accessed using the
[history](/docs/remappers/history) remapper.

Since the `onClick` action was the first action, this data is accessible at history index `0`:

```yaml copy
[{ history: 0 }, { prop: id }] # Returns the ID from the card which button was clicked
```

Knowing this, we can solve the first part of this problem:

```yaml copy
onSuccess:
  type: resource.patch # Update a single property of a specific resource
  resource: bicycles
  id: [{ history: 0 }, { prop: id }] # Target the resource entry that has the ID of the card we clicked
```

> **Note**: Add the `$resource:bicycles:patch` permission to the `employee`.

Next we can tell the API what the new stock value should be by taking the initial stock and
subtracting 1 from it using the [maths](/docs/remappers/other#maths) remapper.

This remapper works by defining two values and what operation to perform. In our case, that means we
need to define:

- Stock of the resource
- 1
- Subtract operation

In code, that looks like this:

```yaml copy
maths:
  a: [{ history: 0 }, { prop: stock }] # Stock was also available in the initial action call
  b: 1
  operation: subtract
```

Finally, we can combine all of this into one action:

```yaml copy
onSuccess:
  type: resource.patch # Update a single property of a specific resource
  resource: bicycles
  id: [{ history: 0 }, { prop: id }] # Target the resource entry that has the ID of the card we clicked
  body:
    object.from: # Create an object with the new value of the stock
      stock:
        maths: # Subtract 1 from the stock of the bicycle
          a: [{ history: 0 }, { prop: stock }]
          b: 1
          operation: subtract
```

To close this complex logic off, let's add some simple actions chained through `onSuccess` just like
we did on the Inventory page:

```yaml copy
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

## Final page definition

The final **Sell bicycle** page looks like this:

<details>
<summary>Sell bicycle page definition</summary>

```yaml copy page-snippet
name: Sell bicycle
roles:
  - manager
  - employee
blocks:
  - type: data-loader
    version: 0.34.8
    events:
      emit:
        data: bicycleInventory
      listen:
        refresh: refreshStock
    actions:
      onLoad:
        type: resource.query
        resource: bicycles
  - type: list
    version: 0.34.8
    events:
      listen:
        data: bicycleInventory
    parameters:
      title: Rent out bicycles
      item:
        header:
          title: { prop: type }
        content:
          image:
            file: { prop: image }
            alt:
              string.format:
                template: '{type} image'
                values:
                  type: { prop: type }
          fields:
            - label: Bicycles left
              value: { prop: stock }
        footer:
          button:
            label: Sell
            icon: dollar-sign
            onClick: sellBicycle
            disabled:
              lt: [{ prop: stock }, 1]
    actions:
      sellBicycle:
        type: dialog
        blocks:
          - type: form
            version: 0.34.8
            parameters:
              fields:
                - name: phoneNumber
                  type: number
                  label: Buyer's phone number
                  placeholder: '1234567890'
                  requirements:
                    - required: true
                      errorMessage: A phone number is required to sell a bicycle!
                - name: notes
                  type: string
                  label: Notes
                  multiline: true
            actions:
              onSubmit:
                type: resource.create
                resource: saleHistory
                body:
                  object.from:
                    bicycle: { prop: type }
                    saleDate: { date.now: null }
                    buyerPhoneNumber: { prop: phoneNumber }
                    notes: { prop: notes }
                onSuccess:
                  type: resource.patch
                  resource: bicycles
                  id: [{ history: 0 }, { prop: id }]
                  body:
                    object.from:
                      stock:
                        maths:
                          a: [{ history: 0 }, { prop: stock }]
                          b: 1
                          operation: subtract
                  onSuccess:
                    type: event
                    event: refreshStock
                    onSuccess:
                      type: message
                      color: success
                      body: Successfully sold bicycle!
                      onSuccess:
                        type: dialog.ok
```

</details>

## Next steps

Most of the functionality is done. All that's left is a log of the sale history.
