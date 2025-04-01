import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const dataRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  array: {
    enum: ['index', 'length', 'item', 'prevItem', 'nextItem'],
    description: `Get the current array.map’s index, length, the current item, previous item or next item.

Returns nothing when not in the context of \`array.map’s\`.

For example:

${schemaExample('array', { result: 'pretty' })}
`,
  },
  app: {
    enum: ['id', 'locale', 'url'],
    description: `Gives information about the current app. Using this remapper you can get access to the
following information:

- \`id\`: App ID
- \`locale\`: Current locale (user selected language) of the app
- \`url\`: Base URL of the app

Example:

${schemaExample('app.url', { result: 'pretty', exclude: ['input'] })}
`,
  },
  context: {
    type: 'string',
    description: `Gets a property from custom context passed by blocks. This property is specific to each block. To
understand what the context of a certain block does, check the block’s description.

For this example, we will take the [\`table\`](/blocks/@appsemble/table/0.20.39) block. As of now,
this block provides two options for context: \`index\` and \`repeatedIndex\`. Whenever you click on an
item in the table, it gives the index of that table row in the associated action.

So with the following example:

\`\`\`yaml
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
\`\`\`

Clicking on the first item would log \`0\`, the second item \`1\` and so on.
`,
  },
  history: {
    type: 'integer',
    description: `> **Note:** This remapper is explained more in depth in the [History](/docs/remappers/history) page

Gives the data at the history entry at the specified history index. The history at specified index
is the data that is passed to that action.

\`\`\`yaml
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
\`\`\`

Result:

\`\`\`json
{
  "title": "Most influential bands of all time",
  "content": ...
}
\`\`\`
    `,
  },
  'tab.name': {
    enum: [null],
    description: `

Returns the name of the current tab in a \`tabs\` page.

\`\`\`yaml
name: Example Page A
type: tabs
  tabs:
    - name: Tab2
      blocks:
        - type: action-button
          version: "0.27.12"
          parameters:
            icon: chevron-right
          actions:
            onClick:
              type: log
              remapBefore:
                { tab.name: null }
\`\`\`
    `,
  },
  step: {
    type: 'string',
    description: `

While in a loop page, this remapper allows you to get properties from the data at the current index.

\`\`\`yaml
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
\`\`\`

With this example, we load an array of questions that have the \`title\` property. What the \`step\`
remapper does in this case is show the title of the current question in the loop.

The result of this is a flow page where each page shows the question’s title.

`,
  },
  page: {
    enum: ['data', 'url'],
    description: `Gives actual information about the current page. This remapper gives access to the following
information:

- \`data\`: Current page data (FlowPage)
- \`url\`: Full URL of the current page

Example:

\`\`\`json
{
  "data": {
    "name": "Peter"
  },
  "url": "https://example-app.examplecompany.appsemble.app/en/example-page-a"
}
\`\`\`

The page data only works in the context of a flow page. Let’s say you have a
[“FlowPage”](/docs/reference/app#-flow-page-definition) type with multiple subpages. Whenever you
navigate to the next page it adds the data from that page to the flow page’s data. The page remapper
allows you to access this cumulative data.

The following page definition shows a page definition for a flow page where the user has to fill in
some user information. For each subpage the result of \`page: data\` is shown.


\`\`\`yaml
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
  # page: data = { name: "Peter" }
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
  # page: data = { name: "Peter", age: "47" }
  - blocks:
      - type: data-loader
        version: 0.20.39
        actions:
          onLoad:
            remapBefore:
              page: data
            type: log
\`\`\`

The result of the final page’s log would then be:

\`\`\`json
{
  "name": "Peter",
  "age": "47"
}
\`\`\`

`,
  },
  prop: {
    anyOf: [
      { type: 'string' },
      { type: 'integer' },
      { type: 'array', minItems: 1, items: { anyOf: [{ type: 'string' }, { type: 'integer' }] } },
      {
        type: 'array',
        minItems: 1,
        items: { $ref: '#/components/schemas/ObjectRemapperDefinition' },
      },
      { $ref: '#/components/schemas/ObjectRemapperDefinition' },
    ],
    description: `Gets the chosen property from an object.

${schemaExample('prop')}
`,
  },
  len: {
    enum: [null],
    description: `
Returns the length of an input array or an input string, unlike { array: length } remapper this remapper does not require
an array to be in the context. This can be very useful when working with nested arrays.
${schemaExample('len')}
`,
  },
  root: {
    enum: [null],
    description: `Gets the input data as it was initially passed to the remapper function.

\`\`\`yaml
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
\`\`\`

Result:

\`\`\`json
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
\`\`\`
    `,
  },
  static: {
    description: `Create a static value

${schemaExample('static', { exclude: ['input'] })}
`,
  },
  translate: {
    type: 'string',
    description: `> **Note:** This is explained much more in depth at [Translating](/docs/guides/translating)

This remapper allows you to easily add translations to your app. To make this remapper work, replace
any static text with \`translate: {name}\`. Then, in your app’s Translations page pick the language
you want to translate. You will see a list of names with input text below. Translations you manually
put in the app using the \`translate\` remapper are found under “Custom messages”.

After putting the translation in, any user that logs in with that language selected will see the
translated message.

Example:

\`\`\`yaml
type: detail-viewer
version: 0.20.39
parameters:
  fields:
    - label: { translate: weatherTitle }
      value: { translate: weatherBody }
\`\`\`

`,
  },
  'app.member': {
    enum: [
      'sub',
      'name',
      'email',
      'email_verified',
      'picture',
      'locale',
      'zoneinfo',
      'role',
      'properties',
    ],
    description: `
> **Note:** For this remapper to work, the app member that activated the remapper has to be logged in to
> the app

Provides some fields of app member information taken from the OpenID user info. These fields are:

- \`sub\`: The app member’s identifier
- \`name\`: The app member’s name
- \`email\`: The app member’s **primary** email address
- \`email_verified\`: Whether the app member’s primary email address is verified or not (\`boolean\`)
- \`picture\`: Full URL to the app member’s profile picture web address
- \`locale\`: The app member’s default language [\`BCP47\`](https://en.wikipedia.org/wiki/IETF_language_tag)
  language tag (ex. \`en\`) (Broken)
- \`zoneinfo\`: The app member’s timezone
- \`role\`: The role of the app member in the app
- \`properties\`: Custom properties defined on the app member

Example:

\`\`\`json
{
  "email": "example@hotmail.nl",
  "email_verified": true,
  "locale": "en",
  "name": "Test User",
  "picture": "https://www.gravatar.com/avatar/f46b82357ce29bcd1099915946cda468?s=128&d=mp",
  "sub": "5c6270e2-ad31-414f-bcab-6752a2c4dcfd",
  "properties": {}
}
\`\`\`
    `,
  },
  container: {
    type: 'string',
    description: `
> **Note:** For this remapper to work, the application needs to define a companion container.

This remapper provides a short way to access a companion container for the purpose of making http requests.
When using the 'request' action, the url can be provided by using the 'container' remapper, and providing a string.
The string should contain the name of the companion container, followed by the API endpoint path.

Example:
\`\`\`yaml
    type: request
    url: { container: my-container/api/endpoint }
    proxy: true
    method: get
\`\`\`
    `,
  },
  slice: {
    description: `Extract characters from a string, or items from an array
accepts either an array of two numbers (indexes of starting point and ending point)
or a number (index of the starting point).
startIndex is inclusive whereas the endIndex is not.
${schemaExample('slice')}`,
    oneOf: [
      {
        type: 'array',
        items: {
          type: 'number',
        },
      },
      { type: 'number' },
    ],
  },
};
