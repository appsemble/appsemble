import { partialNormalized } from '@appsemble/utils';

export default {
  type: 'object',
  description: 'A block that is displayed on a page.',
  required: ['type', 'version'],
  properties: {
    theme: {
      $ref: '#/components/schemas/Theme',
    },
    type: {
      type: 'string',
      pattern: `^(@${partialNormalized.source}/)?${partialNormalized.source}$`,
      description: `The type of the block.

        A block type follows the format \`@organization/name\`. If the organization is _appsemble_,
        it may be omitted.

        Some examples:

        - \`form\`
        - \`@amsterdam/splash\`
      `,
    },
    version: {
      $ref: '#/components/schemas/BlockVersion/properties/version',
      description: 'The block version to use.',
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
        type: 'object',
      },
    },
  },
};
