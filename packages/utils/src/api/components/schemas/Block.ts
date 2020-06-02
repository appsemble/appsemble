import { partialNormalized } from '../../../constants';

export default {
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
    // XXX: Reimplement this and remove additionalProperties once remappers have defined types.
    // anyOf: [
    //   {
    //     header: {
    //       type: 'string',
    //       minLength: 1,
    //       maxLength: 200,
    //       description: 'An optional header to render above the block.',
    //     },
    //   },
    //   {
    //     header: {
    //       type: 'array',
    //       description: 'An optional header to render above the block.',
    //     },
    //   },
    // ],
    roles: {
      type: 'array',
      description: `The list of roles that are allowed to view this block.

      If a user does not have the right role, the block is not rendered.`,
      items: {
        type: 'string',
      },
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
    events: {
      type: 'object',
      description: 'An object describing the names of the events the block can listen and emit to.',
      properties: {
        listen: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { description: { type: 'string' } } },
        },
        emit: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { description: { type: 'string' } } },
        },
      },
    },
  },
};
