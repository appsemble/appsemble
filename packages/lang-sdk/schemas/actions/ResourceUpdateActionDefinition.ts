import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceUpdateActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.update'],
        description: 'Update a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to update.',
      },
    },
  },
  ['url', 'method'],
);
