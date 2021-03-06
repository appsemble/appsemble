import { OpenAPIV3 } from 'openapi-types';

import { partialNormalized, semver } from '../../../constants';

export const BlockDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A block that is displayed on a page.',
  required: ['type', 'version'],
  additionalProperties: true,
  properties: {
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    type: {
      type: 'string',
      pattern: `^(@${partialNormalized.source}/)?${partialNormalized.source}$`,
      description: `The type of the block.

A block type follows the format \`@organization/name\`. If the organization is _appsemble_, it may
be omitted.

Some examples:

- \`form\`
- \`@amsterdam/splash\`
`,
    },
    version: {
      type: 'string',
      pattern: semver.source,
      description: 'The block version to use.',
    },
    layout: {
      type: 'string',
      description: 'An override of the block’s default.',
      enum: ['float', 'grow', 'static'],
    },
    header: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'An optional header to render above the block.',
    },
    roles: {
      type: 'array',
      description: `The list of roles that are allowed to view this block.

If a user does not have the right role, the block is not rendered.
`,
      items: {
        type: 'string',
      },
    },
    position: {
      description: 'For floating blocks this propert defines where the block should float.',
      default: 'bottom right',
      enum: [
        'top left',
        'top',
        'top right',
        'left',
        'right',
        'bottom left',
        'bottom',
        'bottom right',
      ],
    },
    parameters: {
      type: 'object',
      description: `A free form mapping of named paramters.

The exact meaning of the parameters depends on the block type.
`,
    },
    actions: {
      type: 'object',
      description: 'A mapping of actions that can be fired by the block to action handlers.',
      additionalProperties: {
        $ref: '#/components/schemas/ActionDefinition',
      },
    },
    events: { $ref: '#/components/schemas/EventsDefinition' },
  },
};
