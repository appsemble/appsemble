import { type OpenAPIV3 } from 'openapi-types';

export const historyRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> =
  {
    'from.history': {
      type: 'object',
      required: ['index', 'props'],
      description: `Creates a new object based on the specified properties in the given history index. This can be very
useful when you want to combine two sources of data together. It’s also cleaner than separately
using \`object.from\` together with \`history\`.

In the following example, you can see why this might be handy. Let’s say you get the details about a
concert from a source like an action or a block. You have this information and then you want to get
some additional data like the attendees of the concert. With \`from.history\` you can combine the
older data like the name and date, and add the new \`attendees\` data. The result will be an object
with this combined data.

History index 1:

\`\`\`json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "price": 120
}
\`\`\`

Input:

\`\`\`json
[ .. ]
\`\`\`

\`\`\`yaml
object.from:
  concertDetails:
    from.history:
      index: 1
      props:
        name: { prop: name }
        date: { prop: date }
        attendees: { root: null }
\`\`\`

Result:

\`\`\`json
{
  "concertDetails": {
    "attendees": [ .. ],
    "date": "07-07-2022",
    "name": "Rolling stones at Amsterdam Arena"
  }
}
\`\`\`
`,
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        props: {
          description: 'Predefined mapper keys to choose what properties to apply.',
          additionalProperties: {
            $ref: '#/components/schemas/RemapperDefinition',
          },
        },
      },
    },
    'assign.history': {
      type: 'object',
      required: ['index', 'props'],
      description: `Assigns properties from the specified history stack index to an existing object.
Similarly to the \`from.history\` remapper, this allows you to get a property from a place in the
history and give it to a new object. The only difference here is that you are not creating an
entirely new object, but you are taking an existing object and assigning new values to it.

So, we can take the example from \`from.history\` and flip it.

History index 1:

\`\`\`json
{
  "peopleAmount": 3000
}
\`\`\`

Input:

\`\`\`json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "price": 120
}
\`\`\`

\`\`\`yaml
object.from:
  concertDetails:
    assign.history:
      index: 1
      props:
        attendees: { prop: peopleAmount }
\`\`\`

Result:

\`\`\`json
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
\`\`\`
`,
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        props: {
          description: 'Predefined mapper keys to choose what properties to assign.',
          additionalProperties: {
            $ref: '#/components/schemas/RemapperDefinition',
          },
        },
      },
    },
    'omit.history': {
      type: 'object',
      required: ['index', 'keys'],
      description: `Assigns properties from the specified history stack index to the current value and excludes the
given properties.

Similarly to the other history remappers, this gives you the data from a certain point in the
history stack and allows you to modify it before adding to the current value. This one, however,
allows you to take the complete specified history data and omit certain values.

This remapper can be extremely helpful for re-using data you got before in the history stack while
filtering certain properties.

For example, let’s say you have the information for a concert but don’t want normal users to see
sensitive data about it. Using \`omit.history\` you can take this concert data but exclude the
sensitive parts.

History index 1:

\`\`\`json
{
  "name": "Rolling stones at Amsterdam Arena",
  "artist": "Rolling Stones",
  "location": "Amsterdam Arena",
  "date": "07-07-2022",
  "bandPasswords": [ .. ],
  "bankDetailsAttendees": [ .. ]
}
\`\`\`

Input:

\`\`\`json
[ .. ]
\`\`\`

\`\`\`yaml
object.from:
  concertDetails:
    omit.history:
      index: 1
      keys:
        - bandPasswords
        - bankDetailsAttendees
\`\`\`

Result:

\`\`\`json
{
  "concertDetails": {
    "name": "Rolling stones at Amsterdam Arena",
    "artist": "Rolling Stones",
    "location": "Amsterdam Arena",
    "date": "07-07-2022",
    "attendees": [ .. ]
  }
}
\`\`\`
`,
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        keys: {
          description: `Exclude properties from the history stack item, based on the given object keys.

Nested properties can be excluded using arrays of keys.

For example:
\`\`\`yaml
omit.history:
  index: 0
  keys:
    - foo   # Excludes the property foo
    - - bar # Excludes the property baz inside of bar
      - baz
\`\`\`
`,
          type: 'array',
          items: {
            minItems: 1,
            anyOf: [
              { type: 'string' },
              {
                type: 'array',
                minItems: 2,
                items: {
                  type: 'string',
                },
              },
            ],
          },
        },
      },
    },
  };
