import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceUpdatePositionsActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.update.positions'],
        description: 'Update the position of a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to update.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
  },
  ['url', 'method'],
);
