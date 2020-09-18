# Remappers

Remapper functions are objects that define how a value should be transformed. This can be useful for
various purposes, such as retrieving properties from data structures, transforming data, and
formatting text. Remappers consist of an array of remapper objects. Each object has one key, which
represents the remapper function. The value represents parameters to customize the behavior of the
remapper.

For example, given the following remapper:

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

This data can be used for example to render a value in `detail-viewer`.

## String Remapper

If remapper is a string instead of an array of objects, this static string will always be returned
as the result.

## Remapper Functions

The following remapper functions are available:

### `object.from`

Create a new object given some predefined mapper keys.

#### Parameters

A key / value pair object keys and remappers.

### `array.map`

Map an array based on a given array of data and a list of remappers.

Always returns an array even if the input is invalid.

### Parameters

An array of remappers. These get applied to each array item.

### `static`

Insert a static value.

### Parameters

The value to use.

### `prop`

Get a property from an object.

#### Parameters

The name of the property to get.

### `string.case`

Convert an input to lower or upper case.

#### Parameters

Either `upper` or `lower`.

### `string.format`

Format a string using remapped input variables.

#### Parameters

| Name       | Description                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `template` | The template string to format. This may use the [ICU message format](http://userguide.icu-project.org/formatparse/messages) synax. |
| `values`   | A set of remappers to convert the input to usable values.                                                                          |

### `string.replace`

Replace parts of a string based on regex.

### Parameters

| Name                     | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `[key containing regex]` | The regex to match with. The value will be what this regex will replace its match with. |

### `date.parse`

Parse a string into a date using the given format.

#### Parameters

The format used to parse the date. The tokens that can be used can be found
[here](https://date-fns.org/v2.12.0/docs/parse).

If empty, the string will be parsed as an ISO date string.

### `user`

Get user information of the logged in user.

#### Parameters

The type of user information to get. The allowed values are: `email`, `email_verified`, `name`, and
`sub`,
