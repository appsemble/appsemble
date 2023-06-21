import { type OpenAPIV3 } from 'openapi-types';

export const dateRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'date.add': {
    type: 'string',
    description: 'Add the specified value to a given date.',
  },
  'date.format': {
    enum: [null],
    description: 'Format a date according to rfc3339.',
  },
  'date.now': {
    enum: [null],
    description: 'Returns the current date.',
  },
  'date.parse': {
    type: 'string',
    description: `Convert a string to a date using a given format.

For example:
\`\`\`yaml
- static: 02/11/2014     # The date string to parse
- date.parse: MM/dd/yyyy # The given format to parse the date with
            # => Tue Feb 11 2014 00:00:00
\`\`\`

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
};
