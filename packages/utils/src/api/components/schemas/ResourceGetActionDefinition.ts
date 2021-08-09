import { RequestActionDefinition } from './RequestActionDefinition';
import { extendJSONSchema } from './utils';

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
    },
  },
  ['url'],
);
