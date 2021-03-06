# Remappers

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

This data can be used for example to render a value in `detail-viewer`.

## Primitive Remapper

If remapper is a string, boolean, or number instead of an array of objects, this static value will
always be returned as the result.

## Remapper Functions

The following remapper functions are available:

### `app`

Get an app related property.

#### Parameters

The parameter must be a string which describes the app data to get. The only supported value is
`id`, which returns the app id.

### `context`

Get a property from the context. Some blocks may provide contextual data that can be used. The
context is passed to each remapper and can be accessed using this remapper.

#### Parameters

The name of the property to get.

### `equals`

Compares an array of remappers against each other. Returns `true` if all remapped values are equal,
otherwise `false`.

#### Parameters

An array of remappers.

### `if`

Evaluates the value of the given `condition`. It returns the value of `then` if the value of
`condition` is [true](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), otherwise it
returns the value of `else`.

#### Parameters

| Name        | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `condition` | Remapper resulting in the value to check the truthiness of.         |
| `then`      | Remapper for the value that is returned if `condition` is true.     |
| `else`      | Remapper for the value that is returned if `condition` is not true. |

### `object.from`

Create a new object given some predefined mapper keys.

#### Parameters

A key / value pair object keys and remappers.

### `object.assign`

Assign properties to an existing object given some predefined mapper keys.

#### Parameters

A key / value pair object keys and remappers.

### `array.map`

Map an array based on a given array of data and a list of remappers.

Always returns an array even if the input is invalid.

### Parameters

An array of remappers. These get applied to each array item.

### `array`

Get the length or index in the current context of `array.map`. This returns nothing if not used
within an `array.map` remapper.

### Parameters

`index` for the current index, or `length` to get the length of the array.

### `static`

Insert a static value.

### Parameters

The value to use.

### `prop`

Get a property from an object.

#### Parameters

The name of the property to get.

### `root`

Get the input data as it was initially passed to the remap function.

### `string.case`

Convert an input to lower or upper case.

#### Parameters

Either `upper` or `lower`.

### `string.format`

Format a string using remapped input variables.

#### Parameters

| Name       | Description                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `template` | The template string to format. This may use the [ICU message format](http://userguide.icu-project.org/formatparse/messages) syntax. |
| `values`   | A set of remappers to convert the input to usable values.                                                                           |

### `string.replace`

Replace parts of a string based on regex.

### Parameters

| Name                     | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `[key containing regex]` | The regex to match with. The value will be what this regex will replace its match with. |

### `date.now`

Return the current date.

### `date.parse`

Parse a string into a date using the given format.

#### Parameters

The format used to parse the date. The tokens that can be used can be found
[here](https://date-fns.org/v2.12.0/docs/parse).

If empty, the string will be parsed as an ISO date string.

### `date.add`

Add a given duration string to the given date.

If the duration string or input is invalid, the original input is returned instead.

#### Parameters

The syntax used for the duration supports the following units, which can be combined:

```
seconds (s, sec)
minutes (m, min)
hours (h, hr)
days (d)
weeks (w, wk)
months
years (y, yr)

Examples:
1h20m - add 1 hour and 20 minutes
2 hr 20 min - add 2 hours and 20 minutes
1y 22w 40min - add 1 year, 22 weeks, and 40 minutes
-3d - subtract 3 days
```

### `translate`

Get a translated message for the given message ID.

#### Parameters

The input parameter is the message ID to get the translated message for.

### `user`

Get user information of the logged in user.

#### Parameters

The type of user information to get. The allowed values are: `email`, `email_verified`, `name`, and
`sub`,
