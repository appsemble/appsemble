import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const ResourceUpdateGroupActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.update.group'],
        description: 'Move a resource from one group to another.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to move.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'The ID of the resource to move.',
      },
      groupId: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'The ID of the group to move the resource to.',
      },
    },
  },
  ['url', 'method'],
);
