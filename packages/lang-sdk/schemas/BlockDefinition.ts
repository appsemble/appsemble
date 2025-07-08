import { type OpenAPIV3 } from 'openapi-types';

import { partialNormalized, semver } from '../constants/index.js';

export const BlockDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A block that is displayed on a page.',
  required: ['type', 'version'],
  additionalProperties: false,
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
      description: `The version of the block to use.

Since blocks may change over time, a version must be specified in order to ensure that the block
will remain the same until it is manually updated.
`,
    },
    layout: {
      description: `An override of the block’s default layout.

\`float\` sets the block position to float on the page and does not collide with other blocks.
Layout float can be combined with the \`position\` property to place the block on the desired location.
\`grow\` adds space between blocks so the page is filled.
\`static\` on the contrary, does not add extra space between blocks.
`,
      enum: ['float', 'grow', 'static'],
    },
    hide: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'Whether to render the block or not',
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
      description: 'For floating blocks this property defines where the block should float.',
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
      description: `A free form mapping of named parameters.

The exact meaning of the parameters depends on the block type.
`,
      additionalProperties: true,
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
