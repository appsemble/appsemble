import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const unsortedRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> =
  {
    ics: {
      type: 'object',
      description: `Create a calendar event. This event can be downloaded as an \`.ics\` file and
uploaded to your agenda using the [download](../reference/action#download) action.

For example, the following input:
\`\`\`yaml
ics:
coordinates
  object.from:
    latitude: 38.897700545442646
    longitude: -77.03655660152435
description: "Sprint planning meeting"
duration: 1d
end: 2023-07-19
location: The Oval Office.
start: 2023-07-18
title: Important Meeting
url: https://google.nl
\`\`\`

Creates the following ICS-formatted object:
\`\`\`
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:http://remappers.appsemble.localhost:9999
METHOD:PUBLISH
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:b8TsbczhfpIxPM-3lNHQz
SUMMARY:Important Meeting
DTSTAMP:20230703T102029Z
DTSTART:20230717T220000Z
DTEND:20230718T220000Z
DESCRIPTION:Sprint planning meeting
URL:https://google.nl
GEO:38.897700545442646;-77.03655123710632
LOCATION:The Oval Office.
END:VEVENT
END:VCALENDAR
\`\`\`
`,
      additionalProperties: false,
      required: ['start', 'title'],
      properties: {
        start: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The start of the icalendar event.',
        },
        end: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The end of the icalendar event.',
        },
        duration: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The duration of the event.',
          example: '1w 3d 10h 30m',
        },
        title: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The title of the event.',
        },
        description: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional description of the event.',
        },
        url: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional link to attach to the event.',
        },
        location: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional location description to attach to the event.',
        },
        coordinates: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: `An optional geolocation description to attach to the event.

  This must be an object with the properties \`lat\` or \`latitude\`, and \`lon\`, \`lng\` or \`longitude\`.`,
        },
      },
    },
    'null.strip': {
      description: `Strip all null, undefined, and empty array values from an object or array.
For example, with the following input value:
\`\`\`json
[0, 4, null, null, "Peter", 0.4234, null]
\`\`\`
\`\`\`yaml
null.strip: null
\`\`\`

The null values will be removed, leaving a dense array:
\`\`\`json
[0, 4, "Peter", 0.4234]
\`\`\`

Instead of giving it \`null\` as option, you can also provide a \`depth\` property to specify how
deep to recurse into the object or array to remove null values.

For example, with the following input:
\`\`\`json
{
  0: [0, null, "Peter"],
  1: {
    "array1": [4, null, 0.4234, null]
  }
}
\`\`\`

You can specify to which degree of depth you want the null values to be removed.
With this remapper definition:
\`\`\`yaml
null.strip:
  depth: 2
\`\`\`

It will only check two objects in for any null values. That means only the first array within the
object will be checked. The result looks like this:
\`\`\`json
{
  0: [0, "Peter"],
  1: {
    "array1": [4, null, 0.4234, null]
  }
}
\`\`\`
`,
      anyOf: [
        { enum: [null] },
        {
          type: 'object',
          required: ['depth'],
          additionalProperties: false,
          description: 'Options for the null.strip remapper.',
          properties: {
            depth: {
              type: 'integer',
              minimum: 1,
              description: 'How deep to recurse into objects and arrays to remove null values.',
            },
          },
        },
      ],
    },
    type: {
      enum: [null],
      description: `Returns the type of the input object

For example, with the following input value:
\`\`\`json
[0, 5, 7, 8]
\`\`\`
\`\`\`yaml
type: null
\`\`\`

The result will be:
\`\`\`json
"array"
\`\`\`
    `,
    },
    log: {
      enum: ['info', 'warn', 'error'],
      description: `Logs in the browser's console and returns the incoming data and the remapper function's context.

The context contains relevant info about the app, like the URL and locale, but also contains the
remapper’s history.

The options represent the level of logging that will show in the console.

- \`input\`: The input data going into this remapper,
- \`context\`:
  - \`root\`: The input data going into this remapper,
  - \`appId\`: ID of the application,
  - \`url\`: Absolute URL of the page where the remapper was fired,
  - \`appUrl\`: Base URL of the application,
  - \`pageData\`: Current page data of a FlowPage (See [page remapper](./data#page)),
  - \`userInfo\`: User's information if they are logged in (See [user remapper](./data#user)),
  - \`context\`: Internal context
  - \`history\`: Complete list of this remapper’s history (See [history remapper](./history))
  - \`locale\`: The user’s locale,
  - \`stepRef\`: In a loop page, gives the properties from the loop’s current data index (See [step remapper](./data#step))

For example:

\`\`\`json
{
  "input": {
    "name": "Peter",
    "age": 49,
    "birthday": "07-08-2023"
  },
  "context": {
    "root": {
      "name": "Peter",
      "age": 49,
      "birthday": "07-08-2023"
    },
    "appId": 49,
    "url": "http://remappers.appsemble.localhost:9999/en/other",
    "appUrl": "http://remappers.appsemble.localhost:9999",
    "pageData": {
      "triedAppsemble": false
    },
    "userInfo": {
      "email": "example@hotmail.com",
      "email_verified": true,
      "name": "Example User 1",
      "picture": "https://www.gravatar.com/avatar/f46b82357ce29bcd1099915946cda468?s=128&d=mp",
      "sub": "0000-0000-0000-0000",
      "locale": "en",
      "zoneinfo": "Europe/Amsterdam"
    },
    "context": {},
    "history": [
      [
        0,
        4,
        null,
        null,
        "Peter",
        0.4234,
        null
      ],
      {
        "name": "Peter",
        "age": 49
      },
      {
        "name": "Peter",
        "age": 49,
        "birthday": "07-08-2023"
      }
    ],
    "locale": "en",
    "stepRef": {
      "current": {
        "answerType": "multiple choice",
        "question": "How much do you enjoy working here?"
      }
    }
  }
}
\`\`\`
`,
    },
    'xml.parse': {
      description: `This can be used to parse an xml string into an object

For example:

${schemaExample('xml.parse', { result: 'pretty' })}`,
      $ref: '#/components/schemas/RemapperDefinition',
    },
  };
