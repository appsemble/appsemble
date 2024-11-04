import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceDeleteActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.delete'],
        description: 'Delete a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to delete.',
      },
    },
  },
  ['url', 'method'],
);
