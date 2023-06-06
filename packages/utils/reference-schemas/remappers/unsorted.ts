import { type OpenAPIV3 } from 'openapi-types';

export const unsortedRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> =
  {
    ics: {
      type: 'object',
      description: 'Create a calendar event',
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
      description: 'Strip all null, undefined, and empty array values from an object.',
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
    log: {
      enum: ['info', 'warn', 'error'],
      description: `Logs its input data (returns it) and its context.

The value to set is the log level.`,
    },
  };
