import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

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
      selectedGroupId: {
        $ref: '#/components/schemas/RemapperDefinition',
        description:
          'The ID of the group to scope the request to. Defaults to the currently selected group.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
      },
    },
  },
  ['url', 'method'],
);
