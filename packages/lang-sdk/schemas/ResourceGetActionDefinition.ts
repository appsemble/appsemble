import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceGetActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.get'],
        description: 'Get a single resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to get.',
      },
      view: {
        type: 'string',
        description: 'The view to use for the resource.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
  },
  ['url', 'method'],
);
