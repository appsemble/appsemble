# Sale history

To finish the app off we need a way to view the history of bicycle purchases made. Esentially, this
will be a display for the `saleHistory` resource.

One way to display this is by using the [feed block](/blocks/@appsemble/feed). This block displays
incoming data in a feed to cards, similar to a social media feed. We can use this to show the sale
history in a convenient feed of cards.

The code for this page isn't difficult, only requiring one data loader with one action and one
block.

First, we'll load the resource and emit the data for other blocks to use:

```yaml copy block-snippet
type: data-loader
version: 0.32.1
events:
  emit:
    data: saleHistoryData
actions:
  onLoad:
    type: resource.query
    resource: saleHistory
```

> **Note**: Add the `$resource:saleHistory:query` permission to the `employee`.

Then, we'll display the data in the feed block. For this we'll use the
[string.format](/docs/remappers/strings#string.format) remapper again to inform the user on what
bicycle has been sold.

```yaml copy block-snippet
type: feed
version: 0.32.1
events:
  listen:
    data: saleHistoryData
parameters: # Parameters that get used by each card
  title: A bicycle has been sold!
  description:
    string.format:
      template: We just sold a {bicycle}! # For example, this could become 'We just sold a BMX!'
      values:
        bicycle: { prop: bicycle }
```

Which looks like this:

![Feed of cards that show a history of what bicycles have been sold](assets/sale-history-feed.png 'Sale history feed')

## Final page definition

The final **Sale history** page looks like this:

<details>
<summary>Sale history page definition</summary>

```yaml copy page-snippet
name: Sale history
blocks:
  - type: data-loader
    version: 0.32.1
    events:
      emit:
        data: saleHistoryData
    actions:
      onLoad:
        type: resource.query
        resource: saleHistory
  - type: feed
    version: 0.32.1
    events:
      listen:
        data: saleHistoryData
    parameters:
      title: A bicycle has been sold!
      description:
        string.format:
          template: We just sold a {bicycle}!
          values:
            bicycle: { prop: bicycle }
```

</details>

## Next steps

This concludes the basic app training. The concepts covered in this app are core parts of any
Appsemble app. You can always come back to this if you're stuck on a concept, or check out/clone the
app from the app store [here](/apps/1/bicycle-store).

<!-- TODO: Link to officially published app -->
