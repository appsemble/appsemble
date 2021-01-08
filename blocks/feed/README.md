A block that displays a feed of cards.

This can be used for example to show a social media feed in an app.

**Note:** When using feed replies, make sure to include the following to the request action:

```yaml
type: resource.query
resource: MyReplyResource
query:
  object.from:
    $filter:
      prop: $filter
```
