import { type OpenAPIV3 } from 'openapi-types';

export const randomRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'random.choice': {
    enum: [null],
    description:
      'Pick and return a random entry from an array. If the input is not an array, the input is returned as-is.',
  },
  'random.integer': {
    type: 'array',
    maxItems: 2,
    minItems: 2,
    items: {
      type: 'integer',
    },
    description: 'Pick and return a random integer between the provided lowest and highest values.',
  },
  'random.float': {
    type: 'array',
    maxItems: 2,
    minItems: 2,
    items: {
      type: 'number',
    },
    description: 'Pick and return a random number between the provided lowest and highest values.',
  },
  'random.string': {
    type: 'object',
    required: ['choice', 'length'],
    additionalProperties: false,
    properties: {
      choice: { type: 'string', minLength: 1 },
      length: { type: 'integer', minimum: 1 },
    },
    description:
      'Pick and return a random string from a given length using characters from a given input string.',
  },
};
