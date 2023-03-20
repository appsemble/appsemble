# String manipulation

## Introduction

With remappers you can manipulate strings in a number of ways. This can be very helpful when you
want to display information in a certain way. For example, if you want to display a whole list of
users in uppercase you can simply use the `string.case` remapper.

### String remappers

#### [string.case](/docs/reference/remapper#string.case)

Convert a string to upper- or lower case.

```yaml
string.case: upper
```

Result:

```json
"PATRICK"
```

#### [string.format](/docs/reference/remapper#string.format)

Format a string using remapped input variables. Useful for replacing static text with generated
values.

```yaml
string.format:
  template: 'You have won €{lotteryAmount} in the lottery!!'
  values:
    lotteryAmount: { prop: lotteryPrize }
```

Result:

```json
"You have won €5000 in the lottery!!"
```

> **Tip:** Considering this is can be inserted anywhere a remapper is accepted, you can also use
> this to more accurately choose specific URL’s.

#### [string.replace](/docs/reference/remapper#string.replace)

Uses RegEx to find a value in a string and replace it with a given value.

```yaml
# Input: Eindhoven is the best city in the Netherlands
string.replace:
  (best*)\w+: cleanest
```

Result:

```json
"Eindhoven is the cleanest city in the Netherlands"
```
