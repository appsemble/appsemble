import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceHistoryGetActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.history.get'],
        description: 'Get the complete history of a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to get.',
      },
    },
  },
  ['url'],
);
