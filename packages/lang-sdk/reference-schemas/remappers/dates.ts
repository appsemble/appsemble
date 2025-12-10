import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const dateRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'date.add': {
    type: 'string',
    description: `Adds a specified date value to the provided date.

The value to add should be specified according to the
[parse-duration](https://www.npmjs.com/package/parse-duration) API. If you want to add a day to a
date for example, the syntax would be \`date.add: 1d\`.

Full list of supported unit types:
- nanoseconds (ns)
- microseconds (μs)
- milliseconds (ms)
- seconds (s, sec)
- minutes (m, min)
- hours (h, hr)
- days (d)
- weeks (w, wk)
- months
- years (y, yr)

For example:

${schemaExample('date.add')}
`,
  },
  'date.format': {
    oneOf: [
      { enum: [null] },
      {
        type: 'string',
      },
    ],
    description: `Format a date according to the RFC3339 format.

Here is an example of a RFC3339 complicit date:
\`2002-10-02T15:00:00Z\`

In an app definition, it’s best to use this when you want to display a date in a specific format.
For example, if your app has a form with a Datepicker field the incoming data will be formatted
as a simple date format. If you want to format it to the RFC3339 format, you can use this remapper.

When you submit a form with a DateField, the internal output looks like the following. You can then format the date so that it uses the RFC3339 format.

${schemaExample('date.format')}

The remapper can also be used to format a date or timestamp using a custom format.

\`\`\`js
"2023-07-02T22:00:00.000Z"
\`\`\`

You can then format the date with any supported pattern, please refer to https://date-fns.org/docs/format for the supported patterns.

\`\`\`yaml
date.format: yyyy-MM-dd
\`\`\`

Result:
\`\`\`js
2023-07-03
\`\`\`
`,
  },
  'date.now': {
    enum: [null],
    description: `Returns the current date as a JavaScript Date object.

${schemaExample('date.now', { exclude: ['input'] })}
`,
  },
  'date.parse': {
    type: 'string',
    description: `Convert a string to a date using a given format.

For example:

${schemaExample('date.parse', { exclude: ['input'] })}

See [date-fns](https://date-fns.org/v2.29.3/docs/parse) for the supported formats.

Leaving the format empty will try to parse the date using the [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format.
For example:
\`\`\`yaml
date.parse:
- static: 2014-02-11T11:30:30 # The date string to parse
- date.parse: ''              # The given format to parse the date with
                      # => Tue Feb 11 2014 11:30:30
\`\`\`
`,
  },
  'date.startOf': {
    enum: ['year', 'quarter', 'month', 'week', 'weekSun'],
    description: `Takes a date and returns the start of the specified unit.

Supported units:
- \`year\`: First day of the year
- \`quarter\`: First day of the quarter
- \`month\`: First day of the month
- \`week\`: First day of the week (Monday)
- \`weekSun\`: First day of the week (Sunday)

${schemaExample('date.startOf')}
`,
  },
  'date.endOf': {
    enum: ['year', 'quarter', 'month', 'week', 'weekSun'],
    description: `Takes a date and returns the end of the specified unit.

Supported units:
- \`year\`: Last moment of the year
- \`quarter\`: Last moment of the quarter
- \`month\`: Last moment of the month
- \`week\`: Last moment of the week (ends Sunday if week starts Monday)
- \`weekSun\`: Last moment of the week (ends Saturday if week starts Sunday)

${schemaExample('date.endOf')}
`,
  },
  'date.set': {
    type: 'object',
    description: `Sets parts of a date. Only the given parts are changed.

${schemaExample('date.set')}`,
    properties: {
      year: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      month: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      day: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
  },
};
