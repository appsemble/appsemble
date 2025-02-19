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
        description: `Delete all instances of a resource.
> **Warning!**
>
> Use this action with caution to avoid losing precious data!`,
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to delete.',
      },
    },
  },
  ['url', 'method'],
);
