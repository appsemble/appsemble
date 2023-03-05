# Data

## Introduction

There are a lot of points to get data from in Appsemble. There are a number of different remappers
to get this data from certain places in an app definition.

### Data remappers

#### [prop](/docs/reference/remapper#prop)

Gets the chosen property from an object.

```json
{
  "name": "John",
  "age": 52
}
```

```yaml
prop: name
```

Result:

```json
"John"
```

#### [root](/docs/reference/remapper#root)

Gets the input data as it was initially passed to the remapper function.

In the example below

```yaml
type: resource.query
resource: people
query:
  object.from:
    $filter: city eq 'Eindhoven'
onSuccess:
  remapBefore:
    object.from:
      name: Residents of Eindhoven
      people:
        root: null
```

Result:

```json
{
  "name": "Residents of Eindhoven",
  "people": [
    {
      "name": ...,
      "city": "Eindhoven"
    },
    ...
  ]
}
```

#### [history](/docs/reference/remapper#app)

> **Note:** This remapper is explained more in depth in [history](/docs/04-remapper/05-history.md)

Gives the data at the history entry at the specified history index. The history at specified index
is the data that is passed to that action.

```yaml
remapBefore:
  object.from:
    title: Most influential bands of all time
    content: ...
type: noop # history 0
onSuccess:
  type: resource.query # history 1
  resource: people
  onSuccess:
    type: noop # history 2
    onSuccess:
      remapBefore:
        history: 1
      type: log # history 3
```

Result:

```json
{
  "title": "Most influential bands of all time",
  "content": ...
}
```

#### [app](/docs/reference/remapper#app)

Gives actual information about the current app. Using this remapper, you will have access to the
following information:

- `id`: App ID
- `locale`: Current locale (user selected language) of the app
- `url`: Base URL of the app

Example:

```json
{
  "id": 11,
  "locale": "en",
  "url": "https://example-app.examplecompany.appsemble.app"
}
```

#### [page](/docs/reference/remapper#page)

Gives actual information about the current page. This remapper gives access to the following
information:

- `data`: Current page data (FlowPage)
- `url`: Full URL of the current page

Example:

```json
{
  "data": {
    "name": "Peter"
  },
  "url": "https://example-app.examplecompany.appsemble.app/en/example-page-a"
}
```

The page data only works in the context of a flow page. Let’s say you have a
[“FlowPage”](/docs/reference/app#-flow-page-definition) type with multiple subpages. Whenever you
navigate to the next page it adds the data from that page to the flow page’s data. The page remapper
allows you to access this cumulative data.

The following page definition shows a page definition for a flow page where the user has to fill in
some user information. For each subpage the result of `page: data` is shown.

```yaml
name: PageDataFlow
type: flow
steps:
  # page: data = {}
  - blocks:
      - type: form
        version: 0.20.39
        parameters:
          fields:
            - name: name
              type: string
        actions:
          onSubmit:
            type: flow.next
  # page: data = { name: "..." }
  - blocks:
      - type: form
        version: 0.20.39
        parameters:
          fields:
            - name: age
              type: string
        actions:
          onSubmit:
            type: flow.next
  # page: data = { name: "...", age: "..." }
  - blocks:
      - type: data-loader
        version: 0.20.39
        actions:
          onLoad:
            remapBefore:
              page: data
            type: log
```

The result of the final page’s log would then be:

```json
{
  "name": "...",
  "age": "..."
}
```

#### [user](/docs/reference/remapper#user)

> **Note:** For this remapper to work, the user that activated the remapper has to be logged in to
> the app

Provides some fields of user information taken from the OpenID user info. These fields are:

- `email`: User’s **primary** email address
- `email_verified`: Whether the user’s primary email address is verified or not (`boolean`)
- `locale`: The user’s set default language as
  [`BCP47`](https://en.wikipedia.org/wiki/IETF_language_tag) language tag (ex. `en`) (Broken)
- `name`: The user’s name
- `picture`: Full URL to the user’s profile picture web address
- `sub`: The user’s identifier

Example:

```json
{
  "email": "example@hotmail.nl",
  "email_verified": true,
  "locale": "en",
  "name": "Test User",
  "picture": "https://www.gravatar.com/avatar/f46b82357ce29bcd1099915946cda468?s=128&d=mp",
  "sub": "5c6270e2-ad31-414f-bcab-6752a2c4dcfd"
}
```

#### [context](/docs/reference/remapper#context)

Gets a property from custom context passed by blocks. This property is specific to each block. To
understand what the context of a certain block does, check the block’s description.

For this example, we will take the [`table`](/blocks/@appsemble/table/0.20.39) block. As of now,
this block provides two options for context: `index` and `repeatedIndex`. Whenever you click on an
item in the table, it gives the index of that table row in the associated action.

So with the following example:

```yaml
type: table
version: 0.20.39
events:
  listen:
    data: contextData
parameters:
  fields:
    - label: Name
      value: { prop: name }
      onClick: clickName
    - label: Age
      value: { prop: age }
actions:
  clickName:
    remapBefore:
      context: index
    type: log
```

Clicking on the first item would log `0`, the second item `1` and so on.

#### [translate](/docs/reference/remapper#translate)

> **Note:** This is explained much more in depth at [Translating](/docs/03-guide/translating)

This remapper allows you to easily add translations to your app. To make this remapper work, replace
any static text with `translate: {name}`. Then, in your app’s Translations page pick the language
you want to translate. You will see a list of names with input text below. Translations you manually
put in the app using the `translate` remapper are found under “Custom messages”.

After putting the translation in, any user that logs in with that language selected will see the
translated message.

Example:

```yaml
type: detail-viewer
version: 0.20.39
parameters:
  fields:
    - label: { translate: weatherTitle }
      value: { translate: weatherBody }
```

#### [step](/docs/reference/remapper#step)

<!-- TODO: (link to) Proper tutorial/documentation on the loop page -->

While in a loop page, this remapper allows you to get properties from the data at the current index.

```yaml
name: Survey
type: loop
actions:
  onLoad:
    type: resource.query
    resource: questions
foreach:
  blocks:
    - type: detail-viewer
      version: 0.20.39
      parameters:
        fields:
          - label: { step: title }
```

With this example, we load in an array of questions that have the `title` property. What the `step`
remapper does in this case is show the title of the current question in the loop.

The result of this is a flow page where each page shows the question’s title.
