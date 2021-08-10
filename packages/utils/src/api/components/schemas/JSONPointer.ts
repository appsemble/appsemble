import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

export const JSONPointer = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON pointer which may be used to reference a JSON schema.',
  additionalProperties: false,
  required: ['$ref'],
  properties: {
    $ref: {
      type: 'string',
      description: 'A JSON schema reference.',
      pattern: /^#\/definitions\//.source,
      example: '#/definitions/MyReusableSchema',
    },
    default: {
      description: 'The default value that will be used.',
    },
  },
});
