import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceDeleteAllActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.delete.all'],
        description: 'Delete all instances of a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to delete.',
      },
    },
  },
  ['url', 'method'],
);
