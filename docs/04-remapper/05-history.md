# History

## Introduction

The “history” concept is an important part of remapping advanced pieces of data within Appsemble.

Whenever you create an action, the data that is passed to that action is saved in the history stack.
This data can then be accessed again using the various `history` remappers.

The following example shows what a history stack would look like in an action. Every resulting data
from between two actions, including the first action, is assigned to that point in the history
stack:

![history stack](../../config/assets/remapper-tutorial/history-stack.jpg 'History stack visualisation')

Keep in mind that only the last source of data in each section will be the applied to the next
action, and that index in the history stack.

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

The reason for this is because in the space between the beginning of the `resource.query` type and
the final `log` type the final value to be set was that object. The result of the resource query is
not relevant anymore.

![history data explained](../../config/assets/remapper-tutorial/history-data-assigning-explained.png 'History data explained')

Now, if you have done a lot of remapping but you want to get this older piece of you have remapped
before you can look back at the stack you created and determine at what index this data was formed.
Then, using the `history` remapper you can get this data back.

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

Should still return the old object, no matter how many actions have appeared in between:

```json
{
  "name": "Disrupting",
  "type": "data!"
}
```

### History remappers

#### [from.history](/docs/reference/remapper#from.history)

#### [assign.history](/docs/reference/remapper#assign.history)

#### [omit.history](/docs/reference/remapper#omit.history)
