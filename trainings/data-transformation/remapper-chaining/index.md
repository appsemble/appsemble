# Remapper chaining

Often times you can't get your data transformed into what you need with a single remapper. For cases
like this you need to chain remappers together.

Here is an example on how to do this:

## Adding a new property to an array

In this case we get an array of students that just got their tests graded by the teacher. We receive
some unimportant data and their test score. If their score was higher than 60 they pass, otherwise
they fail.

```yaml copy
array.map: # Map through array. Remapper definition below is applied to each entry in the array
  object.assign: # Assigns a new property to the current object
    passed:
      if:
        condition:
          gt: # Check if the score is more than 60
            - { prop: score }
            - 60
        then: true # Assign "true" to the "passed" property if the condition succeeds
        else: false # Assign "false" to the "passed" property if the condition fails
```

The result looks like this:

```json
[
  {
    "name": "Jason",
    "score": 80,
    "passed": true
  },
  {
    "name": "Brian",
    "score": 20,
    "passed": false
  }
]
```
