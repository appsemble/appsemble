import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const odataRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'filter.from': {
    additionalProperties: {
      $ref: '#/components/schemas/FilterParametersDefinition',
    },
    description: `

With this remapper you can generate an OData filter, ready to be passed to the \`$filter\` key in
resource queries.

The different comparator options are as follows:

- eq - Equal to
- ne - Not equal to
- lt - Less than
- gt - Greater than
- le - Less than or equal to
- ge - Greater than or equal to

The most common types of values are \`String\`, \`Number\`, \`Boolean\` and \`Date\`. If you need a more specific
type, please refer to [the OData spec](https://www.odata.org/documentation/odata-version-2-0/overview/).

As a base, the remapper looks like this:

${schemaExample('filter.from')}

Here is an example of how you can use the remapper in an app definition:

\`\`\`yaml
type: resource.query
  resource: myResource
  query:
    object.from:
      $filter:
        filter.from:
          name:
            type: String
            comparator: ne
            value: { prop: exclude }
          age:
            type: Int64
            comparator: lt
            value: 10
          birthday:
            type: Date
            comparator: ge
            value: '2000-01-01'
          job:
            type: String
            comparator: eq
            value: null
          employed:
            type: Boolean
            comparator: eq
            value: false
          special:
            type: String
            comparator: eq
            value: "Special character's test"
\`\`\`
`,
  },
  'order.from': {
    additionalProperties: {
      enum: ['asc', 'desc'],
    },
    description: `

With this remapper you can generate an OData order, ready to be passed to the \`$orderby\` key in
resource queries.

The different order options are as follows:

- asc - Ascending
- desc - Descending

${schemaExample('order.from', { exclude: ['input'] })}

Here is an example of how you can use the remapper in an app definition:

\`\`\`yaml
type: resource.query
  resource: myResource
  query:
    object.from:
      $orderby:
        order.from:
          name: asc
          age: desc
\`\`\`
`,
  },
};
