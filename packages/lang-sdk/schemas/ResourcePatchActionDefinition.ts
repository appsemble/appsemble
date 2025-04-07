import { RequestActionDefinition } from './RequestActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourcePatchActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.patch'],
        description: 'Patch a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to patch.',
      },
      id: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
  },
  ['url', 'method'],
);
