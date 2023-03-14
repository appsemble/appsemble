# History

## Introduction

The “history” concept is an important part of remapping advanced pieces of data within Appsemble.

Whenever you create an action, the data that is passed to that action is saved in the history stack.
This data can then be accessed again using the various `history` remappers.

The following example shows what a history stack would look like in an action. Every resulting data
from between two actions, including the first action, is assigned to that point in the history
stack:

![history stack](../../config/assets/remapper-tutorial/history-stack.jpg 'History stack visualisation')

Keep in mind that the value passed to the action can be influenced by changing the data beforehand
using `remapBefore` or `remapAfter`.

For example, if you have the following code:

```yaml
type: resource.query
resource: people
remapAfter:
  object.from:
    name: Disrupting
    type: data!
onSuccess:
  type: log
```

The result of the final log will be:

```json
{
  "name": "Disrupting",
  "type": "data!"
}
```

The reason for this is because remapAfter changed the resulting value of the `resource.query` action and instead  the object gets passed to the log action. The result of the resource query is
not relevant anymore.

![history data explained](../../config/assets/remapper-tutorial/history-data-assigning-explained.png 'History data explained')

Now, if you want to get the resulting (remapped) data back from the first action, you can count the
index of the action (in this case 1) that the data got passed along to and use it with the `history`
remapper to retrieve it from the stack.

```yaml
type: resource.query
resource: people
remapAfter:
  object.from:
    name: Disrupting
    type: data!
onSuccess:
  type: resource.query
          ...
                  remapBefore:
                    history: 1
                  type: log
```

Still returns the old object, no matter how many actions have appeared in between:

```json
{
  "name": "Disrupting",
  "type": "data!"
}
```

### History remappers

#### [from.history](/docs/reference/remapper#from.history)

Creates a new object based on the specified properties in the given history index. This can be very
useful when you want to combine two sources of data together. It’s also cleaner than separately
using `object.from` together with `history`.

In the following example you can see why this might be handy. Let’s say you get the details about a
concert from a source like an action or a block. You have this information, and then you want to get
some additional data like the attendees of the concert. With `from.history` you can combine the
older data like the name and date, and add the new `attendees` data. The result will be an object
with this combined data.

History index 1:

```json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "price": 120
}
```

Input:

```json
[ .. ]
```

```yaml
object.from:
  concertDetails:
    from.history:
      index: 1
      props:
        name: { prop: name }
        date: { prop: date }
        attendees: { root: null }
```

Result:

```json
{
  "concertDetails": {
    "attendees": [ .. ],
    "date": "07-07-2022",
    "name": "Rolling stones at Amsterdam Arena"
  }
}
```

#### [assign.history](/docs/reference/remapper#assign.history)

Assigns properties from the specified history stack index to an existing object.

Similarly to the `from.history` remapper, this allows you to get a property from a place in the
history and give it to a new object. The only difference here is that you are not creating an
entirely new object, but you are taking an existing object and assigning new values to it.

So, we can take the example from `from.history` and flip it.

History index 1:

```json
{
  "peopleAmount": 3000
}
```

Input:

```json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "price": 120
}
```

```yaml
object.from:
  concertDetails:
    assign.history:
      index: 1
      props:
        attendees: { prop: peopleAmount }
```

Result:

```json
{
  "concertDetails": {
    "name": "Rolling stones at Amsterdam Arena",
    "artist": "Rolling Stones",
    "location": "Amsterdam Arena",
    "date": "07-07-2022",
    "price": 120,
    "attendees": 3000
  }
}
```

#### [omit.history](/docs/reference/remapper#omit.history)

Assigns properties from the specified history stack index to the current value, and excludes the
given properties.

Similarly to the other history remappers, this gives you the data from a certain point in the
history stack and allows you to modify it before adding to the current value. This one, however,
allows you to take the complete specified history data and omit certain values.

This remapper can be extremely helpful for re-using data you got before in the history stack while
filtering certain properties.

For example, let’s say you have the information for a concert but don’t want normal users to see
sensitive data about it. Using `omit.history` you can take this concert data but exclude the
sensitive parts.

History index 1:

```json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "bandPasswords": [ .. ],
  "bankDetailsAttendees": [ .. ]
}
```

Input:

```json
[ .. ]
```

```yaml
object.from:
  concertDetails:
    omit.history:
      index: 1
      keys:
        - bandPasswords
        - bankDetailsAttendees
```

Result:

```json
{
  "concertDetails": {
    "name": "Rolling stones at Amsterdam Arena",
    "artist": "Rolling Stones",
    "location": "Amsterdam Arena",
    "date": "07-07-2022",
    "attendees": [ .. ]
  }
}
```
