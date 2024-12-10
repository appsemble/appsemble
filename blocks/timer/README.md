The timer block emits events on a specified interval. This can be useful for example for refreshing
data.

### Example

```yaml
- type: data-loader
  version: 0.30.14-test.4
  actions:
    onLoad:
      type: resource.query
      resource: news
  events:
    listen:
      refresh: refreshNews
    emit:
      data: news
- type: timer
  version: 0.30.14-test.4
  parameters:
    interval: 60
  events:
    emit:
      interval: refreshNews
```
