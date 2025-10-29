The timer block emits events on a specified interval. This can be useful for example for refreshing
data.

### Example

```yaml
- type: data-loader
  version: 0.35.13
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
  version: 0.35.13
  parameters:
    interval: 60
  events:
    emit:
      interval: refreshNews
```
