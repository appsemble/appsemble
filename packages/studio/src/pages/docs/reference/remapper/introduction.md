Remapper functions are objects that define how a value should be transformed. This can be useful for
various purposes, such as retrieving properties from data structures, transforming data, and
formatting text. Remappers consist of either an array of remapper objects or a single remapper
object. Each object has one key, which represents the remapper function. The value represents
parameters to customize the behavior of the remapper.

For example, given the following list of remappers:

```yaml
- prop: firstName
- string.case: upper
```

And given the following data:

```json
{
  "firstName": "Patrick",
  "lastName": "Start"
}
```

This will result in the following data:

```json
"PATRICK"
```

This data can be used for example to render a value in
[`detail-viewer`](/blocks/@appsemble/detail-viewer).

If remapper is a string, boolean, or number instead of an object or array of objects, this static
value will always be returned as the result.
